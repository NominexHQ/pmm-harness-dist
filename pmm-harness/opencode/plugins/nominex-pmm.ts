import type { Plugin, ToolContext } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

// Use the zod instance provided by the host tool to avoid version mismatches
const { schema: z } = tool;

const MEMORY_INSTRUCTIONS_DIR = "memory/instructions";
const PLUGIN_INSTRUCTIONS_DIR = ".opencode/plugins/instructions";

const MEMORY_TEMPLATES_PATH_DEFAULT = ".opencode/plugins/instructions/memory-templates.md";

const DEFAULT_MEMORY_TEMPLATES_MARKDOWN = `## timeline.md
### Timeline
Chronological record of key events
Format: append

## progress.md
### Progress
Current state and milestones
Format: update-in-place

## last.md
### Last Session
Recent actions
Format: replace

## decisions.md
### Decisions
Committed decisions
Format: append

## lessons.md
### Lessons
Mistakes learned
Format: append
`;

console.log("[Nominex PMM] Plugin file is being loaded!");

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TemplateDefinition {
  name: string;
  header: string;
  description: string;
  format: 'append' | 'replace' | 'update-in-place';
  conventions: string[];
}

interface GitStatus {
  isGit: boolean;
  hasRemote: boolean;
  canCommit: boolean;
  worktreeClean: boolean;
}

interface QuestionsConfig {
  questions: Array<Record<string, unknown>>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRoot(context: ToolContext, fallbackProjectRoot?: string): string {
  // Always anchor PMM paths to a stable project root instead of tool/runtime worktree context.
  return fallbackProjectRoot || context.directory || process.cwd();
}

function resolveInstructionPath(root: string, name: string, extension: "md" | "json"): string | null {
  const memoryPath = join(root, MEMORY_INSTRUCTIONS_DIR, `${name}.${extension}`);
  if (existsSync(memoryPath)) {
    return memoryPath;
  }

  const pluginPath = join(root, PLUGIN_INSTRUCTIONS_DIR, `${name}.${extension}`);
  if (existsSync(pluginPath)) {
    return pluginPath;
  }

  return null;
}

/**
 * Loads an instruction template from the instructions directory.
 * Falls back to default if not found.
 */
function loadInstruction(root: string, name: string, defaultValue: string): string {
  const path = resolveInstructionPath(root, name, "md");
  if (path) {
    try {
      return readFileSync(path, "utf-8");
    } catch (e) {
      console.error(`[Nominex PMM] Failed to read instruction ${name}:`, e);
    }
  }
  return defaultValue;
}

/**
 * Loads a JSON config file from the instructions directory.
 * Falls back to default if not found or invalid.
 */
function loadQuestionsConfig(root: string, name: string, defaultValue: QuestionsConfig): QuestionsConfig {
  const path = resolveInstructionPath(root, name, "json");
  if (path) {
    try {
      const parsed = JSON.parse(readFileSync(path, "utf-8"));
      if (parsed && typeof parsed === "object" && Array.isArray((parsed as QuestionsConfig).questions)) {
        return parsed as QuestionsConfig;
      }
      console.error(`[Nominex PMM] Invalid questions config shape in ${name}.json`);
    } catch (e) {
      console.error(`[Nominex PMM] Failed to read questions config ${name}.json:`, e);
    }
  }
  return defaultValue;
}

function parseActiveFiles(configContent: string): string[] {
  const activeFiles: string[] = [];
  const lines = configContent.split('\n');
  let inActiveSection = false;
  
  for (const line of lines) {
    if (line.match(/^##\s+Active Files/i) || line.match(/^##\s+Tier 1/i)) {
      inActiveSection = true;
      continue;
    }
    if (line.startsWith('## ')) {
      inActiveSection = false;
    }
    
    if (inActiveSection) {
      // Matches: - file.md, - `file.md`, - file.md: active
      const match = line.match(/^\s*-\s*(`?)([\w\-.]+\.md)\1/);
      if (match) {
        activeFiles.push(match[2]);
      }
    }
  }
  
  // Fallback if section based parsing failed
  if (activeFiles.length === 0) {
     const matches = Array.from(configContent.matchAll(/-\s*`?([\w\-.]+\.md)`?/g));
     for (const match of matches) {
       activeFiles.push(match[1]);
     }
  }
  
  return [...new Set(activeFiles)];
}

function parseTemplates(templatesContent: string): Record<string, TemplateDefinition> {
  const templates: Record<string, TemplateDefinition> = {};
  const fileSections = templatesContent.split(/^##\s+/m);
  for (const section of fileSections) {
    const lines = section.trim().split('\n');
    if (lines.length === 0) continue;
    const filename = lines[0].trim();
    if (!filename.endsWith('.md')) continue;
    let header = '';
    let description = '';
    let format: 'append' | 'replace' | 'update-in-place' = 'append';
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^#{1,6}\s+/)) {
        header = line.replace(/^#{1,6}\s+/, "").trim();
      } else if (!description && line.trim() && !line.startsWith('#')) {
        description = line.trim();
      } else if (line.toLowerCase().includes('append')) {
        format = 'append';
      } else if (line.toLowerCase().includes('replace')) {
        format = 'replace';
      } else if (line.toLowerCase().includes('update')) {
        format = 'update-in-place';
      }
    }
    templates[filename] = {
      name: filename,
      header: header || filename.replace('.md', ''),
      description: description || 'Memory file',
      format: format,
      conventions: []
    };
  }
  return templates;
}

function getDefaultTemplates(): Record<string, TemplateDefinition> {
  return {
    'timeline.md': {
      name: 'timeline.md',
      header: 'Timeline',
      description: 'Chronological record of key events',
      format: 'append',
      conventions: []
    },
    'progress.md': {
      name: 'progress.md',
      header: 'Progress',
      description: 'Current state and milestones',
      format: 'update-in-place',
      conventions: []
    },
    'last.md': {
      name: 'last.md',
      header: 'Last Session',
      description: 'Recent actions',
      format: 'replace',
      conventions: []
    },
    'decisions.md': {
      name: 'decisions.md',
      header: 'Decisions',
      description: 'Committed decisions',
      format: 'append',
      conventions: []
    },
    'lessons.md': {
      name: 'lessons.md',
      header: 'Lessons',
      description: 'Mistakes learned',
      format: 'append',
      conventions: []
    }
  };
}

function validateGit(worktree: string): GitStatus {
  try {
    execSync('git rev-parse --git-dir', { cwd: worktree, stdio: 'pipe' });
    const isGit = true;
    let hasRemote = false;
    try {
      const remotes = execSync('git remote', { cwd: worktree, stdio: 'pipe' }).toString().trim();
      hasRemote = remotes.length > 0;
    } catch {}
    let worktreeClean = false;
    try {
      const status = execSync('git status --porcelain', { cwd: worktree, stdio: 'pipe' }).toString().trim();
      worktreeClean = status.length === 0;
    } catch {}
    return {
      isGit,
      hasRemote,
      canCommit: isGit,
      worktreeClean
    };
  } catch {
    return {
      isGit: false,
      hasRemote: false,
      canCommit: false,
      worktreeClean: true
    };
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_INIT_QUESTIONS: QuestionsConfig = {
  "questions": [
    {
      "header": "Storage",
      "question": "Configure PMM storage and commit behavior.",
      "options": [
        { "label": "Save: Every Milestone", "description": "Update memory at key events (Default)." },
        { "label": "Save: Every 5 Messages", "description": "Frequent automatic updates." },
        { "label": "Commit: Auto-commit", "description": "Commit changes to git after every save (Default)." },
        { "label": "Commit: Manual", "description": "You decide when to commit." }
      ],
      "multiple": true
    },
    {
      "header": "Core Memory",
      "question": "Which core memory files should be active?",
      "options": [
        { "label": "Essential", "description": "memory.md, decisions.md, progress.md, last.md, timeline.md (Recommended)." },
        { "label": "Full Suite", "description": "All 12 core files (Standard)." },
        { "label": "Custom", "description": "I will specify files later in config.md." }
      ]
    },
    {
      "header": "Project Knowledge",
      "question": "How should PMM treat project knowledge?",
      "options": [
        { "label": "Visibility: Private", "description": "No PII restrictions, full fidelity (Recommended)." },
        { "label": "Visibility: Public", "description": "Avoid personal details, use handles." },
        { "label": "Priority: PMM-first", "description": "PMM is the source of truth (Default)." },
        { "label": "Priority: Coexist", "description": "PMM and OpenCode auto-memory operate independently." }
      ],
      "multiple": true
    },
    {
      "header": "Agent Personalization",
      "question": "Configure the agents handling your memory.",
      "options": [
        { "label": "Model: Haiku", "description": "Fast and cheap for maintenance (Default). Note: Model selection is a Claude Code-only feature; OpenCode uses the host model for all operations." },
        { "label": "Context: Tiered", "description": "Load core files first, others on demand (Saves tokens, Recommended)." },
        { "label": "Context: Full", "description": "Load all active files at session start." }
      ],
      "multiple": true
    }
  ]
};

const DEFAULT_HYDRATE_QUESTIONS: QuestionsConfig = {
  "questions": [
    {
      "header": "Strategy",
      "question": "How should new knowledge be integrated?",
      "options": [
        { "label": "Append", "description": "Add new knowledge to the end of existing files." },
        { "label": "Merge", "description": "Incorporate new knowledge alongside existing entries." }
      ]
    },
    {
      "header": "Scope",
      "question": "Which source should be used?",
      "options": [
        { "label": "Current Context", "description": "Analyze only current messages." },
        { "label": "This Session", "description": "Analyze full transcript." }
      ]
    }
  ]
};

// ============================================================================
// PLUGIN EXPORT
// ============================================================================

export const NominexPMMPlugin: Plugin = async ({ client, worktree: pluginWorktree }) => {
  console.log("[Nominex PMM] Plugin function executed!");
  
  return {
    "experimental.chat.system.transform": async (input, output) => {
      const root = pluginWorktree || process.cwd();
      
      const systemInstructions = loadInstruction(root, "system", "");
      const initQuestions = loadQuestionsConfig(root, "init-questions", DEFAULT_INIT_QUESTIONS);
      const hydrateQuestions = loadQuestionsConfig(root, "hydrate-questions", DEFAULT_HYDRATE_QUESTIONS);
      const memoryTemplatesMarkdown = loadInstruction(root, "memory-templates", DEFAULT_MEMORY_TEMPLATES_MARKDOWN);
      const initInstructions = loadInstruction(root, "init", "");
      const hydrateInstructions = loadInstruction(root, "hydrate", "");
      const saveInstructions = loadInstruction(root, "save", "");
      const recallInstructions = loadInstruction(root, "recall", "");
      const systemTweaksInstructions = loadInstruction(root, "system-tweaks", "");

      const instructions = `
${systemInstructions}

[INIT_QUESTIONS]
\`\`\`json
${JSON.stringify(initQuestions, null, 2)}
\`\`\`

[HYDRATE_QUESTIONS]
\`\`\`json
${JSON.stringify(hydrateQuestions, null, 2)}
\`\`\`

[MEMORY_TEMPLATES_PATH_DEFAULT]
${MEMORY_TEMPLATES_PATH_DEFAULT}

[MEMORY_TEMPLATES_DEFAULT]
\`\`\`md
${memoryTemplatesMarkdown}
\`\`\`

[PMM_POST_INIT_INSTRUCTIONS]
${initInstructions}

[PMM_POST_HYDRATE_INSTRUCTIONS]
${hydrateInstructions}

[PMM_SAVE_WORKFLOW_INSTRUCTIONS]
${saveInstructions}

[PMM_RECALL_WORKFLOW_INSTRUCTIONS]
${recallInstructions}

[PMM_SYSTEM_TWEAKS_INSTRUCTIONS]
${systemTweaksInstructions}
`;
      output.system.push(instructions);
    },

    tool: {
      pmm_init: tool({
        description: "Checks if PMM is initialized.",
        args: {},
        execute: async (args, context: ToolContext) => {
          const root = getRoot(context, pluginWorktree);
          const memoryDir = join(root, "memory");
          return existsSync(memoryDir) ? "MANAGE" : "INSTALL";
        }
      }),
      
      pmm_hydrate: tool({
        description: "Initiates the interactive workflow for hydrating memory.",
        args: {},
        execute: async (args, context: ToolContext) => {
          return "PMM Hydrate workflow initiated. Use the 'question' tool to configure based on [HYDRATE_QUESTIONS].";
        }
      }),
      
      pmm_save: tool({
        description: "Saves content to PMM memory files. Routes to appropriate files based on content type and active memory configuration. Automatically git commits if configured.",
        args: {
          content: z.string().describe("What to record in memory."),
          context: z.string().optional().describe("Additional context for the save.")
        },
        execute: async (args, context: ToolContext) => {
          const root = getRoot(context, pluginWorktree);
          const memoryDir = join(root, "memory");
          const templatesPath = join(root, MEMORY_TEMPLATES_PATH_DEFAULT);
          
          if (!existsSync(memoryDir)) {
            return JSON.stringify({
              status: "ERROR",
              message: "PMM not initialized. Run pmm_init first."
            });
          }
          
          let activeFiles: string[] = [];
          const configPath = join(memoryDir, "config.md");
          if (existsSync(configPath)) {
            try {
              activeFiles = parseActiveFiles(readFileSync(configPath, "utf-8"));
            } catch (e) {}
          }
          
          let templates = {};
          if (existsSync(templatesPath)) {
            try {
              templates = parseTemplates(readFileSync(templatesPath, "utf-8"));
            } catch (e) {
              templates = getDefaultTemplates();
            }
          } else {
            templates = getDefaultTemplates();
          }
          
          const gitStatus = validateGit(root);
          
          return JSON.stringify({
            status: "INSTRUCTION_READY",
            instruction: {
              type: 'SAVE_TO_MEMORY',
              userContent: args.content,
              userContext: args.context || null,
              activeFiles,
              templates,
              gitStatus
            }
          });
        }
      }),

      pmm_recall: tool({
        description: "Recalls context for a topic from across all memory files.",
        args: {
          topic: z.string().describe("The topic to recall memory for.")
        },
        execute: async (args, context: ToolContext) => {
          const root = getRoot(context, pluginWorktree);
          const memoryDir = join(root, "memory");
          
          if (!existsSync(memoryDir)) {
            return JSON.stringify({
              status: "ERROR",
              message: "PMM not initialized. Run pmm_init first."
            });
          }
          
          let activeFiles: string[] = [];
          const configPath = join(memoryDir, "config.md");
          if (existsSync(configPath)) {
            try {
              activeFiles = parseActiveFiles(readFileSync(configPath, "utf-8"));
            } catch (e) {}
          }

          return JSON.stringify({
            status: "INSTRUCTION_READY",
            instruction: {
              type: 'RECALL',
              topic: args.topic,
              activeFiles
            }
          });
        }
      }),
      
      pmm_debug: tool({
        description: "Returns debug information about the PMM environment.",
        args: {},
        execute: async (args, context: ToolContext) => {
          const root = getRoot(context, pluginWorktree);
          const memoryDir = join(root, "memory");
          return JSON.stringify({
            directory: context.directory,
            worktree: context.worktree,
            pluginWorktree,
            cwd: process.cwd(),
            root,
            memoryDir,
            memoryExists: existsSync(memoryDir),
            memoryContents: existsSync(memoryDir) ? readdirSync(memoryDir) : []
          }, null, 2);
        }
      })
    }
  };
};
