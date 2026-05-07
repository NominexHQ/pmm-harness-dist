SHELL := /bin/zsh

PROJECT_ROOT := $(abspath ../..)
CANONICAL_OPENCODE := $(CURDIR)/opencode
WORKSPACE_OPENCODE := $(PROJECT_ROOT)/.opencode

# Shipping allowlist: only files required to distribute the OpenCode PMM plugin.
DIST_ROOT_FILES := package.json opencode.json
DIST_PLUGIN_FILES := plugins/nominex-pmm.ts
DIST_PLUGIN_DIRS := plugins/instructions plugins/pmm

# Claude Code plugin (claudecode/pmm-plugin/) is canonical in this repo.
# No upstream clone — edit directly.

.PHONY: help \
	build-harness build-opencode build-claudecode build-opencode-bash clean-opencode show-opencode-files sync-opencode-to-workspace

help:
	@echo "Targets:"
	@echo "  make build-harness       Build Claude local variants; OpenCode is canonical in-place"
	@echo "  make build-opencode      No-op (OpenCode source is canonical at pmm-harness/opencode)"
	@echo "  make build-claudecode    Generate local Claude skill variants in pmm-plugin/local"
	@echo "  make build-opencode-bash Same as build-opencode, but forces /bin/bash as the shell"
	@echo "  make sync-opencode-to-workspace  Copy shipping OpenCode files into .opencode for local runtime testing"
	@echo "  make clean-opencode      No-op (OpenCode files are source-controlled in-place)"
	@echo "  make show-opencode-files Show canonical OpenCode shipping files"
	@echo ""
	@echo "  Claude Code plugin (claudecode/pmm-plugin/) is canonical — edit directly."
	@echo "  OpenCode harness (opencode/) is canonical — edit directly."

build-harness: build-opencode build-claudecode

build-claudecode:
	@$(MAKE) -C "$(CURDIR)/claudecode/pmm-plugin" local

clean-opencode:
	@echo "clean-opencode: no-op (canonical OpenCode files live in pmm-harness/opencode)."

build-opencode:
	@echo "build-opencode: no-op (OpenCode source is canonical at pmm-harness/opencode)."

sync-opencode-to-workspace:
	@mkdir -p "$(WORKSPACE_OPENCODE)"
	@for file in $(DIST_ROOT_FILES); do \
		mkdir -p "$(WORKSPACE_OPENCODE)/$$(dirname "$$file")"; \
		cp "$(CANONICAL_OPENCODE)/$$file" "$(WORKSPACE_OPENCODE)/$$file"; \
	done
	@for file in $(DIST_PLUGIN_FILES); do \
		mkdir -p "$(WORKSPACE_OPENCODE)/$$(dirname "$$file")"; \
		cp "$(CANONICAL_OPENCODE)/$$file" "$(WORKSPACE_OPENCODE)/$$file"; \
	done
	@for dir in $(DIST_PLUGIN_DIRS); do \
		mkdir -p "$(WORKSPACE_OPENCODE)/$$dir"; \
		cp -R "$(CANONICAL_OPENCODE)/$$dir"/. "$(WORKSPACE_OPENCODE)/$$dir/"; \
	done
	@find "$(WORKSPACE_OPENCODE)" -name '.DS_Store' -delete

build-opencode-bash:
	@$(MAKE) SHELL=/bin/bash build-opencode

show-opencode-files:
	@echo "Root files:"
	@for file in $(DIST_ROOT_FILES); do echo "  pmm-harness/opencode/$$file"; done
	@echo "Plugin files:"
	@for file in $(DIST_PLUGIN_FILES); do echo "  pmm-harness/opencode/$$file"; done
	@echo "Plugin directories:"
	@for dir in $(DIST_PLUGIN_DIRS); do echo "  pmm-harness/opencode/$$dir/**"; done
