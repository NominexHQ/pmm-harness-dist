import type { Plugin, ToolContext } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, isAbsolute, join } from "path";
import { execSync } from "child_process";

// Use the zod instance provided by the host tool to avoid version mismatches
const { schema: z } = tool;

const MEMORY_INSTRUCTIONS_DIR = "config/instructions";
const PLUGIN_INSTRUCTIONS_DIR = ".opencode/plugins/instructions";
const PMM_MEMORY_DIR_DEFAULT = "memory";

const MEMORY_TEMPLATES_PATH_DEFAULT = ".opencode/plugins/instructions/pmm-memory-templates.md";

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

interface SettingsSummary {
  saveCadence: string;
  commitBehaviour: string;
  slidingWindow: string;
  verbosity: string;
  maintainModel: string;
  readonlyModel: string;
  maintainStrategy: string;
  sessionStart: string;
  recallBeyondWindow: string;
  activeFiles: string[];
  deactivatedFiles: string[];
  loadStrategies: Record<string, string>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRoot(context: ToolContext, fallbackProjectRoot?: string): string {
  // Always anchor PMM paths to a stable project root instead of tool/runtime worktree context.
  // Some runtimes can pass '/' as plugin worktree; treat that as invalid and fall back.
  const candidates = [fallbackProjectRoot, context.directory, context.worktree, process.cwd()]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => value.trim())
    .filter((value) => value !== "/");

  return candidates[0] ?? process.cwd();
}

function safeRead(path: string): string {
  try { return existsSync(path) ? readFileSync(path, "utf-8") : ""; }
  catch { return ""; }
}

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function copyIfMissing(sourcePath: string, targetPath: string): void {
  if (!existsSync(sourcePath) || existsSync(targetPath)) {
    return;
  }
  ensureDir(dirname(targetPath));
  copyFileSync(sourcePath, targetPath);
}

function defaultMemoryFileContent(filename: string, templates: Record<string, TemplateDefinition>): string {
  const template = templates[filename];
  const header = template?.header || filename.replace(/\.md$/i, "").replace(/[-_]/g, " ");
  return `# ${header}\n\n`;
}

/**
 * Resolves the PMM memory directory for this project.
 * Discovery chain:
 *   1. PMM_MEMORY_DIR env var (absolute or relative to root)
 *   2. CLAUDE.md / AGENTS.md in cwd — look for `pmm_memory_dir: <path>` directive
 *   3. CLAUDE.md / AGENTS.md in root — same check at git root
 *   4. Default: "memory"
 * Each candidate is validated: the directory must contain config.md.
 */
function resolvePmmMemoryDir(root: string): string {
  // 1. Env var override — allows dispatcher to set per-agent memory dir
  const envDir = process.env.PMM_MEMORY_DIR;
  if (envDir) {
    const resolved = envDir.startsWith("/") ? envDir : join(root, envDir);
    if (existsSync(join(resolved, "config.md"))) return envDir;
  }
  // 2. Check CLAUDE.md in cwd (may differ from root when --dir is used)
  const cwd = process.cwd();
  if (cwd !== root) {
    for (const file of ["CLAUDE.md", "AGENTS.md"]) {
      const content = safeRead(join(cwd, file));
      if (content) {
        const match = content.match(/pmm[_-]memory[_-]dir:\s*`?([^\s`]+)`?/i);
        if (match) {
          const dir = match[1].replace(/^\.?\/?/, "").replace(/\/$/, "");
          const abs = join(cwd, dir);
          if (existsSync(join(abs, "config.md"))) return abs;
        }
      }
    }
  }
  // 3. Check CLAUDE.md / AGENTS.md at git root
  for (const file of ["CLAUDE.md", "AGENTS.md"]) {
    const content = safeRead(join(root, file));
    if (content) {
      const match = content.match(/pmm[_-]memory[_-]dir:\s*`?([^\s`]+)`?/i);
      if (match) {
        const dir = match[1].replace(/^\.?\/?/, "").replace(/\/$/, "");
        if (existsSync(join(root, dir, "config.md"))) return dir;
      }
    }
  }
  // 4. Default
  return PMM_MEMORY_DIR_DEFAULT;
}

function resolvePmmMemoryDirPath(root: string): string {
  const dir = resolvePmmMemoryDir(root);
  return isAbsolute(dir) ? dir : join(root, dir);
}

function resolveInstructionPath(root: string, names: string[], extension: "md" | "json"): string | null {
  for (const name of names) {
    const memoryPath = join(root, MEMORY_INSTRUCTIONS_DIR, `${name}.${extension}`);
    if (existsSync(memoryPath)) {
      return memoryPath;
    }

    const pluginPath = join(root, PLUGIN_INSTRUCTIONS_DIR, `${name}.${extension}`);
    if (existsSync(pluginPath)) {
      return pluginPath;
    }
  }

  return null;
}

function instructionNameCandidates(name: string): string[] {
  const trimmed = name.trim();
  if (trimmed.startsWith("pmm-")) {
    return [trimmed];
  }
  return [`pmm-${trimmed}`];
}

/**
 * Loads an instruction template from the instructions directory.
 * Falls back to default if not found.
 */
function loadInstruction(root: string, name: string, defaultValue: string): string {
  const path = resolveInstructionPath(root, instructionNameCandidates(name), "md");
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
  const path = resolveInstructionPath(root, instructionNameCandidates(name), "json");
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
      // Matches active entries only, e.g.:
      // - file.md: active
      // - `file.md`: active | tail:5
      const match = line.match(/^\s*-\s*`?([\w\-.]+\.md)`?\s*:\s*active\b/i);
      if (match) {
        activeFiles.push(match[1]);
      }
    }
  }
  
  // Fallback if section based parsing failed
  if (activeFiles.length === 0) {
     const matches = Array.from(configContent.matchAll(/-\s*`?([\w\-.]+\.md)`?\s*:\s*active\b/gi));
     for (const match of matches) {
       activeFiles.push(match[1]);
     }
  }
  
  return [...new Set(activeFiles)];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getConfigSection(configContent: string, sectionName: string): string {
  const match = configContent.match(
    new RegExp(`##\\s+${escapeRegExp(sectionName)}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, "i")
  );

  return match?.[1] ?? "";
}

function extractConfigValue(configContent: string, sectionName: string, key: string): string {
  const section = getConfigSection(configContent, sectionName);
  const match = section.match(new RegExp(`-\\s+${escapeRegExp(key)}:\\s*(.+)`, "i"));
  return match?.[1]?.trim() ?? "not-configured";
}

function formatSlidingWindowSummary(configContent: string): string {
  const timelineMax = extractConfigValue(configContent, "Sliding Window Size", "Timeline max");
  const summariesMax = extractConfigValue(configContent, "Sliding Window Size", "Summaries max");
  const combined = `${timelineMax}/${summariesMax}`;

  if (combined === "30/5") return "light (30/5)";
  if (combined === "50/10") return "moderate (50/10)";
  if (combined === "100/20") return "heavy (100/20)";
  if (combined.toLowerCase() === "unlimited/unlimited") return "unlimited";

  return combined;
}

function parseLoadStrategies(configContent: string): Record<string, string> {
  const strategies: Record<string, string> = {};
  const section = getConfigSection(configContent, "Active Files");

  for (const line of section.split("\n")) {
    const match = line.match(/^\s*-\s*([\w\-.]+\.md):\s*active(?:\s*\|\s*([^\n]+))?/i);
    if (match) {
      strategies[match[1]] = (match[2] ?? "full").trim();
    }
  }

  return strategies;
}

function parseSettingsSummary(configContent: string): SettingsSummary {
  const activeFiles = parseActiveFiles(configContent);
  const knownFiles = [
    "memory.md",
    "assets.md",
    "decisions.md",
    "processes.md",
    "preferences.md",
    "voices.md",
    "lessons.md",
    "timeline.md",
    "summaries.md",
    "progress.md",
    "progress-archive.md",
    "last.md",
    "graph.md",
    "vectors.md",
    "taxonomies.md",
    "standinginstructions.md",
    "threads-open.md",
    "threads-closed.md",
    "last-parallel.md",
    "timeline-parallel.md"
  ];

  return {
    saveCadence: extractConfigValue(configContent, "Save Cadence", "Mode"),
    commitBehaviour: extractConfigValue(configContent, "Commit Behaviour", "Mode"),
    slidingWindow: formatSlidingWindowSummary(configContent),
    verbosity: extractConfigValue(configContent, "Verbosity", "Mode"),
    maintainModel: extractConfigValue(configContent, "Maintain Agent Model", "Model"),
    readonlyModel: extractConfigValue(configContent, "Readonly Agent Model", "Model"),
    maintainStrategy: extractConfigValue(configContent, "Maintain Strategy", "Strategy"),
    sessionStart: extractConfigValue(configContent, "Session Start", "Mode"),
    recallBeyondWindow: extractConfigValue(configContent, "Recall Beyond Window", "Mode"),
    activeFiles,
    deactivatedFiles: knownFiles.filter((file) => !activeFiles.includes(file)),
    loadStrategies: parseLoadStrategies(configContent)
  };
}

function readLocalVersion(root: string): string {
  const opencodeVersionPath = join(root, ".opencode", "plugins", "pmm", "version.json");

  if (!existsSync(opencodeVersionPath)) {
    return "0.0.0";
  }

  try {
    const parsed = JSON.parse(readFileSync(opencodeVersionPath, "utf-8"));
    return typeof parsed?.version === "string" ? parsed.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function toRepoRelativePath(root: string, absolutePath: string): string {
  if (absolutePath.startsWith(`${root}/`)) {
    return absolutePath.slice(root.length + 1);
  }
  return absolutePath;
}

function getGitLastModified(root: string, relativePath: string): { relative: string; epoch: number } | null {
  try {
    const escaped = relativePath.replaceAll('"', '\\"');
    const output = execSync(`git log -1 --format=\"%ar|%at\" -- \"${escaped}\"`, { cwd: root, stdio: "pipe" })
      .toString()
      .trim();
    if (!output) return null;
    const [relative, epochRaw] = output.split("|");
    const epoch = Number.parseInt(epochRaw ?? "", 10);
    if (!Number.isFinite(epoch)) return null;
    return { relative: relative || "unknown", epoch };
  } catch {
    return null;
  }
}

function estimateTokens(chars: number): number {
  return Math.max(0, Math.ceil(chars / 4));
}

function buildStatusReport(root: string, memoryDir: string, activeFiles: string[]): string {
  const files = existsSync(memoryDir)
    ? readdirSync(memoryDir).filter((file) => file.endsWith(".md")).sort()
    : [];

  const now = Math.floor(Date.now() / 1000);
  const activeSet = new Set(activeFiles);
  let totalChars = 0;

  const rows = files.map((file) => {
    const absolutePath = join(memoryDir, file);
    const content = safeRead(absolutePath);
    const chars = content.length;
    const lines = content.length > 0 ? content.split("\n").length : 0;
    totalChars += chars;

    const gitMeta = getGitLastModified(root, toRepoRelativePath(root, absolutePath));
    const ageSeconds = gitMeta ? Math.max(0, now - gitMeta.epoch) : Number.POSITIVE_INFINITY;

    let block = "░";
    let bucket = "stale";
    if (ageSeconds <= 2 * 60 * 60) {
      block = "█";
      bucket = "this session";
    } else if (ageSeconds <= 24 * 60 * 60) {
      block = "▓";
      bucket = "recent";
    } else if (ageSeconds <= 5 * 24 * 60 * 60) {
      block = "▒";
      bucket = "4-5 days";
    }

    return {
      file,
      block,
      bucket,
      last: gitMeta?.relative ?? "never",
      lines,
      chars,
      tokens: estimateTokens(chars),
      active: activeSet.has(file)
    };
  }).sort((a, b) => b.chars - a.chars);

  const lastSave = getGitLastModified(root, toRepoRelativePath(root, memoryDir));

  const header = [
    "PMM Status",
    `Last memory save: ${lastSave?.relative ?? "no git history"}`,
    `Memory files: ${files.length} | Estimated read tokens: ${estimateTokens(totalChars)}`,
    "",
    "file | act | bucket | last | lines | tokens | active",
    "-----|-----|--------|------|-------|--------|-------"
  ];

  const body = rows.map((row) =>
    `${row.file} | ${row.block} | ${row.bucket} | ${row.last} | ${row.lines} | ${row.tokens} | ${row.active ? "yes" : "no"}`
  );

  return [...header, ...body].join("\n");
}

function buildDumpReport(root: string, memoryDir: string, activeFiles: string[], level: "status" | "summary" | "detailed"): string {
  const files = activeFiles.length > 0
    ? [...new Set(activeFiles)]
    : (existsSync(memoryDir) ? readdirSync(memoryDir).filter((file) => file.endsWith(".md")).sort() : []);

  const now = Math.floor(Date.now() / 1000);
  let totalChars = 0;

  const heatRows = files.map((file) => {
    const absolutePath = join(memoryDir, file);
    const content = safeRead(absolutePath);
    totalChars += content.length;

    const gitMeta = getGitLastModified(root, toRepoRelativePath(root, absolutePath));
    const ageSeconds = gitMeta ? Math.max(0, now - gitMeta.epoch) : Number.POSITIVE_INFINITY;

    let heat = "░░░░";
    if (ageSeconds < 5 * 60) heat = "████";
    else if (ageSeconds < 30 * 60) heat = "███░";
    else if (ageSeconds < 2 * 60 * 60) heat = "██░░";
    else if (ageSeconds < 24 * 60 * 60) heat = "█░░░";

    return `${heat}  ${file.padEnd(24, " ")} ${gitMeta?.relative ?? "never"}`;
  });

  const lines: string[] = [
    "PMM Dump",
    `Level: ${level}`,
    `Token estimate (read): ${estimateTokens(totalChars)}`,
    "",
    "Heatmap",
    ...heatRows
  ];

  if (level !== "status") {
    const timelinePath = join(memoryDir, "timeline.md");
    const timelineLines = safeRead(timelinePath)
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && (line.startsWith("-") || /^\d{4}-\d{2}-\d{2}/.test(line)));
    const recentTimeline = timelineLines.slice(-5);
    lines.push("", "Recent Timeline", ...(recentTimeline.length > 0 ? recentTimeline : ["(none)"]));
  }

  if (level === "detailed") {
    lines.push("", "Detailed Active Files", "file | last", "-----|-----");
    for (const file of files) {
      const absolutePath = join(memoryDir, file);
      const gitMeta = getGitLastModified(root, toRepoRelativePath(root, absolutePath));
      lines.push(`${file} | ${gitMeta?.relative ?? "never"}`);
    }
  }

  return lines.join("\n");
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

function getGitTopLevel(worktree: string): string | null {
  try {
    return execSync("git rev-parse --show-toplevel", { cwd: worktree, stdio: "pipe" })
      .toString()
      .trim();
  } catch {
    return null;
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
        { "label": "Model: Haiku", "description": "Fast and cheap for maintenance (Default). In OpenCode, model selection is metadata and the host model executes operations." },
        { "label": "Context: Tiered", "description": "Load core files first, others on demand (Saves tokens, Recommended)." },
        { "label": "Context: Full", "description": "Load all active files at session start." }
      ],
      "multiple": true
    }
  ]
};

const DEFAULT_INIT_PROFILE_QUESTION: QuestionsConfig = {
  "questions": [
    {
      "header": "Profile",
      "question": "Choose your PMM initialization profile.",
      "options": [
        { "label": "lite", "description": "Minimal setup, lower token burn." },
        { "label": "balanced", "description": "Recommended default profile." },
        { "label": "power", "description": "Full pre-set profile." },
        { "label": "power-user-wizard", "description": "Interactive full configuration flow." }
      ]
    }
  ]
};

const RUNTIME_INIT_PROFILE_GUARD = `
[PMM INIT RUNTIME GUARD]
- For pmm_init INSTALL mode, profile selection is mandatory before any full init questionnaire.
- If instruction.requestedProfile is one of lite|balanced|power, use it directly.
- If instruction.requestedProfile is null, ask [INIT_PROFILE_QUESTION] first and capture exactly one selection.
- Only run [INIT_QUESTIONS] when and only when the selected profile is power-user-wizard.
- For lite|balanced|power, skip [INIT_QUESTIONS] entirely and apply pmm-config-<profile>.md.
`;

const RUNTIME_REPORT_VERBATIM_GUARD = `
[PMM REPORT RUNTIME GUARD]
- If pmm_status or pmm_dump tool returns { status: "REPORT_READY", report: string }, output the report verbatim.
- Do not collapse REPORT_READY outputs into short summaries.
`;

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

const DEFAULT_SETTINGS_QUESTIONS: QuestionsConfig = {
  "questions": [
    {
      "header": "Save",
      "question": "Choose save cadence and commit behaviour. Keep the default path unless you need a different operational profile.",
      "options": [
        { "label": "Save: Every Milestone", "description": "Default and recommended. Update at decisions, milestones, and session breaks." },
        { "label": "Save: Every 5 Messages", "description": "More frequent updates with higher token cost." },
        { "label": "Save: On Request Only", "description": "Only save when explicitly asked." },
        { "label": "Commit: Auto-commit", "description": "Default and recommended. Commit every update batch automatically." },
        { "label": "Commit: Session End", "description": "Batch commits at session end." },
        { "label": "Commit: Manual", "description": "Do not commit automatically." }
      ],
      "multiple": true
    },
    {
      "header": "Models",
      "question": "Choose models and dispatch strategy for maintain and read-only PMM work.",
      "options": [
        { "label": "Maintain Model: Haiku", "description": "Default and recommended. Fast and cheap for mechanical edits." },
        { "label": "Maintain Model: Sonnet", "description": "Balanced option for more nuanced updates." },
        { "label": "Maintain Model: Opus", "description": "Most capable, highest cost." },
        { "label": "Readonly Model: Haiku", "description": "Default and recommended for query, recall, status, dump, and viz." },
        { "label": "Readonly Model: Sonnet", "description": "Better synthesis for read-heavy flows." },
        { "label": "Readonly Model: Opus", "description": "Highest cost for read-only tasks." },
        { "label": "Strategy: Single", "description": "Default and recommended. Lowest dispatch overhead." },
        { "label": "Strategy: Tiered", "description": "Higher parallelism for larger installs; more expensive." }
      ],
      "multiple": true
    },
    {
      "header": "Session",
      "question": "Configure startup loading, recall behavior, and timeline/summary window sizing.",
      "options": [
        { "label": "Session Start: Lazy", "description": "Default and recommended. Avoid extra startup dispatch when memory is already injected." },
        { "label": "Session Start: Eager", "description": "Always dispatch a startup read." },
        { "label": "Recall Beyond Window: Prompt", "description": "Default and recommended. Ask before searching git history." },
        { "label": "Recall Beyond Window: Auto", "description": "Silently search git history when needed." },
        { "label": "Window: Light (30/5)", "description": "Smaller session-start footprint." },
        { "label": "Window: Moderate (50/10)", "description": "Default and recommended balance." },
        { "label": "Window: Heavy (100/20)", "description": "Load more recent history on startup." },
        { "label": "Window: Unlimited", "description": "Load full windowed files on startup." }
      ],
      "multiple": true
    },
    {
      "header": "Display",
      "question": "Choose how visible PMM update reporting should be.",
      "options": [
        { "label": "Verbosity: Silent", "description": "Only minimal status feedback." },
        { "label": "Verbosity: Summary", "description": "Default and recommended. One-line confirmations." },
        { "label": "Verbosity: Verbose", "description": "Full detail for each operation." }
      ]
    },
    {
      "header": "Files",
      "question": "Select which PMM files stay active. Core files are usually the best default set.",
      "options": [
        { "label": "memory.md", "description": "Recommended core facts file." },
        { "label": "assets.md", "description": "Artifacts and assets." },
        { "label": "decisions.md", "description": "Recommended decision log." },
        { "label": "processes.md", "description": "Processes and workflows." },
        { "label": "preferences.md", "description": "Preferences and operating conventions." },
        { "label": "voices.md", "description": "Voice and messaging guidance." },
        { "label": "lessons.md", "description": "Recommended lessons learned file." },
        { "label": "timeline.md", "description": "Recommended chronology; usually best with a tail strategy." },
        { "label": "summaries.md", "description": "Rolling summary file." },
        { "label": "progress.md", "description": "Recommended current state and blockers." },
        { "label": "progress-archive.md", "description": "Archived progress history." },
        { "label": "last.md", "description": "Recommended handoff file." },
        { "label": "graph.md", "description": "Tier 2 relationship map." },
        { "label": "vectors.md", "description": "Tier 2 semantic map." },
        { "label": "taxonomies.md", "description": "Tier 2 classification map." },
        { "label": "standinginstructions.md", "description": "Recommended standing rules and guardrails." },
        { "label": "last-parallel.md", "description": "Parallel-session handoff file." },
        { "label": "timeline-parallel.md", "description": "Parallel-session chronology." }
      ],
      "multiple": true
    },
    {
      "header": "Load Strategy",
      "question": "Choose how load strategies should be handled for active Tier 1 files. Use manual mode only when you want per-file overrides.",
      "options": [
        { "label": "Keep Current Strategies", "description": "Default. Preserve existing config.md strategies." },
        { "label": "Use Recommended Strategies", "description": "Recommended. timeline=tail:5, decisions=tail:10, lessons=tail:5, others=full." },
        { "label": "Configure Manually", "description": "Follow up with per-file values such as full, tail:N, header, or skip." }
      ]
    }
  ]
};

// ============================================================================
// PLUGIN EXPORT
// ============================================================================

export const NominexPMMPlugin: Plugin = async ({ client, worktree: pluginWorktree }) => {
  
  return {
    "experimental.chat.system.transform": async (input, output) => {
      const root = pluginWorktree || process.cwd();
      
      const systemInstructions = loadInstruction(root, "pmm-system", "");
      const initProfileQuestion = loadQuestionsConfig(root, "pmm-init-profile-question", DEFAULT_INIT_PROFILE_QUESTION);
      const initQuestions = loadQuestionsConfig(root, "pmm-init-questions", DEFAULT_INIT_QUESTIONS);
      const hydrateQuestions = loadQuestionsConfig(root, "pmm-hydrate-questions", DEFAULT_HYDRATE_QUESTIONS);
      const settingsQuestions = loadQuestionsConfig(root, "pmm-settings-questions", DEFAULT_SETTINGS_QUESTIONS);
      const memoryTemplatesMarkdown = loadInstruction(root, "pmm-memory-templates", DEFAULT_MEMORY_TEMPLATES_MARKDOWN);
      const initInstructions = loadInstruction(root, "pmm-init", "");
      const hydrateInstructions = loadInstruction(root, "pmm-hydrate", "");
      const saveInstructions = loadInstruction(root, "pmm-save", "");
      const recallInstructions = loadInstruction(root, "pmm-recall", "");
      const queryInstructions = loadInstruction(root, "pmm-query", "");
      const statusInstructions = loadInstruction(root, "pmm-status", "");
      const dumpInstructions = loadInstruction(root, "pmm-dump", "");
      const settingsInstructions = loadInstruction(root, "pmm-settings", "");
      const updateInstructions = loadInstruction(root, "pmm-update", "");
      const vizInstructions = loadInstruction(root, "pmm-viz", "");
      const systemTweaksInstructions = loadInstruction(root, "pmm-system-tweaks", "");

      const instructions = `
${RUNTIME_INIT_PROFILE_GUARD}

${RUNTIME_REPORT_VERBATIM_GUARD}

${systemInstructions}

[INIT_PROFILE_QUESTION]
\`\`\`json
${JSON.stringify(initProfileQuestion, null, 2)}
\`\`\`

[INIT_QUESTIONS]
\`\`\`json
${JSON.stringify(initQuestions, null, 2)}
\`\`\`

[HYDRATE_QUESTIONS]
\`\`\`json
${JSON.stringify(hydrateQuestions, null, 2)}
\`\`\`

[SETTINGS_QUESTIONS]
\`\`\`json
${JSON.stringify(settingsQuestions, null, 2)}
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

[PMM_QUERY_WORKFLOW_INSTRUCTIONS]
${queryInstructions}

[PMM_STATUS_WORKFLOW_INSTRUCTIONS]
${statusInstructions}

[PMM_DUMP_WORKFLOW_INSTRUCTIONS]
${dumpInstructions}

[PMM_SETTINGS_WORKFLOW_INSTRUCTIONS]
${settingsInstructions}

[PMM_UPDATE_WORKFLOW_INSTRUCTIONS]
${updateInstructions}

[PMM_VIZ_WORKFLOW_INSTRUCTIONS]
${vizInstructions}

[PMM_SYSTEM_TWEAKS_INSTRUCTIONS]
${systemTweaksInstructions}
`;
      output.system.push(instructions);
    },

    tool: {
      pmm_init: tool({
        description: "Checks PMM initialization state and returns paths only (does not create files).",
        args: {
          profile: z.enum(["lite", "balanced", "power"]).optional().describe("Optional init profile template to apply during INSTALL mode.")
        },
        execute: async (args, context: ToolContext) => {
          const root = getRoot(context, pluginWorktree);
          const memoryDir = resolvePmmMemoryDirPath(root);
          const mode = existsSync(join(memoryDir, "config.md")) ? "MANAGE" : "INSTALL";

          if (mode === "INSTALL" && args.profile) {
            const profileTemplatePath = resolveInstructionPath(root, [`pmm-config-${args.profile}`], "md");

            if (!profileTemplatePath) {
              return JSON.stringify({
                status: "ERROR",
                message: `Missing profile template: pmm-config-${args.profile}.md`,
                mode,
                requestedProfile: args.profile,
                projectRoot: root,
                memoryDir
              });
            }

            const profileConfig = readFileSync(profileTemplatePath, "utf-8");
            const templatesMarkdown = loadInstruction(root, "pmm-memory-templates", DEFAULT_MEMORY_TEMPLATES_MARKDOWN);
            const templates = parseTemplates(templatesMarkdown);
            const activeFiles = parseActiveFiles(profileConfig);
            const requiredFiles = Array.from(new Set([...activeFiles, "threads-open.md", "threads-closed.md"]));

            ensureDir(memoryDir);
            ensureDir(join(root, "config", "instructions"));
            ensureDir(join(root, "pmm"));

            writeFileSync(join(memoryDir, "config.md"), profileConfig, "utf-8");

            const createdFiles: string[] = [];
            for (const file of requiredFiles) {
              const targetPath = join(memoryDir, file);
              if (!existsSync(targetPath)) {
                writeFileSync(targetPath, defaultMemoryFileContent(file, templates), "utf-8");
                createdFiles.push(targetPath);
              }
            }

            const defaultsDir = join(root, PLUGIN_INSTRUCTIONS_DIR);
            const overridesDir = join(root, MEMORY_INSTRUCTIONS_DIR);
            const seedFiles = [
              "pmm-system.md",
              "pmm-init.md",
              "pmm-hydrate.md",
              "pmm-save.md",
              "pmm-recall.md",
              "pmm-query.md",
              "pmm-status.md",
              "pmm-dump.md",
              "pmm-settings.md",
              "pmm-update.md",
              "pmm-viz.md",
              "pmm-system-tweaks.md",
              "pmm-init-questions.json",
              "pmm-hydrate-questions.json",
              "pmm-settings-questions.json",
              "pmm-template-agent.md",
              "pmm-template-claude.md"
            ];

            for (const file of seedFiles) {
              copyIfMissing(join(defaultsDir, file), join(overridesDir, file));
            }

            copyIfMissing(join(root, ".opencode", "plugins", "pmm", "pmm-viz-template.html"), join(root, "pmm", "pmm-viz-template.html"));
            copyIfMissing(join(root, ".opencode", "plugins", "pmm", "d3.v7.min.js"), join(root, "pmm", "d3.v7.min.js"));

            const claudeTemplate = loadInstruction(root, "pmm-template-claude", "");
            const agentsTemplate = loadInstruction(root, "pmm-template-agent", "");
            if (claudeTemplate && !existsSync(join(root, "CLAUDE.md"))) {
              writeFileSync(join(root, "CLAUDE.md"), claudeTemplate, "utf-8");
            }
            if (agentsTemplate && !existsSync(join(root, "AGENTS.md"))) {
              writeFileSync(join(root, "AGENTS.md"), agentsTemplate, "utf-8");
            }

            return JSON.stringify({
              status: "INITIALIZED",
              mode: "MANAGE",
              requestedProfile: args.profile,
              projectRoot: root,
              memoryDir,
              initializedFiles: [join(memoryDir, "config.md"), ...requiredFiles.map((file) => join(memoryDir, file))],
              newlyCreatedFiles: createdFiles,
              instructionsOverrideDir: join(root, MEMORY_INSTRUCTIONS_DIR),
              defaultInstructionsDir: join(root, PLUGIN_INSTRUCTIONS_DIR),
              assetsSourceDir: join(root, ".opencode", "plugins", "pmm"),
              assetsTargetDir: join(root, "pmm")
            });
          }

          return JSON.stringify({
            mode,
            requestedProfile: args.profile ?? null,
            projectRoot: root,
            memoryDir,
            instructionsOverrideDir: join(root, MEMORY_INSTRUCTIONS_DIR),
            defaultInstructionsDir: join(root, PLUGIN_INSTRUCTIONS_DIR),
            assetsSourceDir: join(root, ".opencode", "plugins", "pmm"),
            assetsTargetDir: join(root, "pmm")
          });
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
          const memoryDir = resolvePmmMemoryDirPath(root);
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
          const memoryDir = resolvePmmMemoryDirPath(root);
          
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
              memoryDir,
              activeFiles,
              activeFilePaths: activeFiles.map((file) => join(memoryDir, file))
            }
          });
        }
      }),

      pmm_query: tool({
        description: "Queries PMM memory for a question and returns structured query instructions for the active memory files.",
        args: {
          question: z.string().describe("Natural language query to run across PMM memory."),
          deep: z.boolean().optional().describe("Whether to expand retrieval to related concepts if supported."),
          dump: z.boolean().optional().describe("Whether to return structured verbatim results instead of prose synthesis.")
        },
        execute: async (args, context: ToolContext) => {
          const root = getRoot(context, pluginWorktree);
          const memoryDir = resolvePmmMemoryDirPath(root);

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
              type: "QUERY",
              question: args.question,
              deep: args.deep ?? false,
              dump: args.dump ?? false,
              memoryDir,
              activeFiles,
              activeFilePaths: activeFiles.map((file) => join(memoryDir, file))
            }
          });
        }
      }),

      pmm_status: tool({
        description: "Returns PMM health dashboard including initialization state, activity, and file health.",
        args: {},
        execute: async (args, context: ToolContext) => {
          const root = getRoot(context, pluginWorktree);
          const memoryDir = resolvePmmMemoryDirPath(root);

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

          const report = buildStatusReport(root, memoryDir, activeFiles);
          return JSON.stringify({
            status: "REPORT_READY",
            report,
            activeFiles
          });
        }
      }),

      pmm_dump: tool({
        description: "Returns ASCII visualization of PMM memory state.",
        args: {
          level: z.enum(["status", "summary", "detailed"]).optional().describe("Depth level of the dump.")
        },
        execute: async (args, context: ToolContext) => {
          const root = getRoot(context, pluginWorktree);
          const memoryDir = resolvePmmMemoryDirPath(root);

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

          const level = args.level || "status";
          const report = buildDumpReport(root, memoryDir, activeFiles, level);
          return JSON.stringify({
            status: "REPORT_READY",
            report,
            level,
            activeFiles
          });
        }
      }),

      pmm_settings: tool({
        description: "Reconfigures PMM settings via a Claude-style tabbed dialog and writes the updated config.",
        args: {},
        execute: async (args, context: ToolContext) => {
          const root = getRoot(context, pluginWorktree);
          const memoryDir = resolvePmmMemoryDirPath(root);

          if (!existsSync(memoryDir)) {
            return JSON.stringify({
              status: "ERROR",
              message: "PMM not initialized. Run pmm_init first."
            });
          }

          const configPath = join(memoryDir, "config.md");
          const configContent = existsSync(configPath) ? readFileSync(configPath, "utf-8") : "";

          return JSON.stringify({
            status: "INSTRUCTION_READY",
            instruction: {
              type: "SETTINGS",
              configPath,
              currentSettings: configContent ? parseSettingsSummary(configContent) : null,
              gitStatus: validateGit(root)
            }
          });
        }
      }),

      pmm_update: tool({
        description: "Checks for PMM system updates and optionally applies them. Defaults to 'check'. Call with action='apply' after user confirms.",
        args: {
          action: z.enum(["check", "apply"]).optional().describe("'check' (default) fetches and shows what would change. 'apply' applies the update — only call after user has confirmed from a prior check.")
        },
        execute: async (args, context: ToolContext) => {
          const projectRoot = getRoot(context, pluginWorktree);
          const gitRepoRoot = getGitTopLevel(projectRoot);
          const localOpencodeDir = join(projectRoot, ".opencode");
          const upstreamOpencodeDir = "pmm-harness/opencode";
          const configDir = join(projectRoot, "config");
          const memoryDir = resolvePmmMemoryDirPath(projectRoot);
          const localVersionPath = join(projectRoot, ".opencode", "plugins", "pmm", "version.json");

          return JSON.stringify({
            status: "INSTRUCTION_READY",
            instruction: {
              type: "UPDATE",
              action: args.action ?? "check",
              projectRoot,
              gitRepoRoot,
              localVersion: readLocalVersion(projectRoot),
              localVersionPath,
              localOpencodeDir,
              upstreamOpencodeDir,
              upstreamRepoUrl: "https://github.com/NominexHQ/pmm-harness-dist.git",
              configDir,
              memoryDir,
              memoryInitialized: existsSync(memoryDir),
              gitStatus: validateGit(projectRoot)
            }
          });
        }
      }),

      pmm_viz: tool({
        description: "Generates and opens an interactive D3.js memory graph visualization with optional scope filtering.",
        args: {
          scope: z.enum(["full", "graph", "clusters", "timeline"]).optional().describe("Visualization scope. Defaults to 'full'.")
        },
        execute: async (args, context: ToolContext) => {
          const root = getRoot(context, pluginWorktree);
          const memoryDir = resolvePmmMemoryDirPath(root);

          if (!existsSync(memoryDir)) {
            return JSON.stringify({
              status: "ERROR",
              message: "PMM not initialized. Run pmm_init first."
            });
          }

          const _now = new Date();
          const _pad = (n: number) => String(n).padStart(2, "0");
          const _ts = `${_now.getFullYear()}-${_pad(_now.getMonth()+1)}-${_pad(_now.getDate())}-${_pad(_now.getHours())}${_pad(_now.getMinutes())}${_pad(_now.getSeconds())}`;

          return JSON.stringify({
            status: "INSTRUCTION_READY",
            instruction: {
              type: "VIZ",
              scope: args.scope || "full",
              projectRoot: root,
              memoryDir,
              cachePath: join(root, "pmm", `viz-${_ts}.html`),
              templatePath: join(root, "pmm", "pmm-viz-template.html"),
              d3Path: join(root, "pmm", "d3.v7.min.js")
            }
          });
        }
      }),
      
      pmm_debug: tool({
        description: "Returns debug information about the PMM environment.",
        args: {},
        execute: async (args, context: ToolContext) => {
          const root = getRoot(context, pluginWorktree);
          const memoryDir = resolvePmmMemoryDirPath(root);
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
