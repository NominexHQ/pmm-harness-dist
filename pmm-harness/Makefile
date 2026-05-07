SHELL := /bin/zsh

PROJECT_ROOT := $(abspath ../..)
SRC_OPENCODE := $(PROJECT_ROOT)/.opencode
DST_OPENCODE := $(PROJECT_ROOT)/pmm-harness-dist/pmm-harness/opencode

# Shipping allowlist: only files required to distribute the OpenCode PMM plugin.
DIST_ROOT_FILES := package.json opencode.json
DIST_PLUGIN_FILES := plugins/nominex-pmm.ts
DIST_PLUGIN_DIRS := plugins/instructions

# Claude Code plugin (claudecode/pmm-plugin/) is canonical in this repo.
# No upstream clone — edit directly.

.PHONY: help \
	build-harness build-opencode build-claudecode build-opencode-bash clean-opencode show-opencode-files

help:
	@echo "Targets:"
	@echo "  make build-harness       Build both OpenCode and Claude harness artifacts"
	@echo "  make build-opencode      Copy shipping artifacts into pmm-harness-dist/pmm-harness/opencode"
	@echo "  make build-claudecode    Generate local Claude skill variants in pmm-plugin/local"
	@echo "  make build-opencode-bash Same as build-opencode, but forces /bin/bash as the shell"
	@echo "  make clean-opencode      Remove generated harness files from pmm-harness-dist/pmm-harness/opencode"
	@echo "  make show-opencode-files Show source files that are included in the OpenCode harness build"
	@echo ""
	@echo "  Claude Code plugin (claudecode/pmm-plugin/) is canonical — edit directly."

build-harness: build-opencode build-claudecode

build-claudecode:
	@$(MAKE) -C "$(CURDIR)/claudecode/pmm-plugin" local

clean-opencode:
	@mkdir -p "$(DST_OPENCODE)"
	@find "$(DST_OPENCODE)" -mindepth 1 -maxdepth 1 ! -name '.DS_Store' -exec rm -rf {} +

build-opencode: clean-opencode
	@mkdir -p "$(DST_OPENCODE)"
	@for file in $(DIST_ROOT_FILES); do \
		mkdir -p "$(DST_OPENCODE)/$$(dirname "$$file")"; \
		cp "$(SRC_OPENCODE)/$$file" "$(DST_OPENCODE)/$$file"; \
	done
	@for file in $(DIST_PLUGIN_FILES); do \
		mkdir -p "$(DST_OPENCODE)/$$(dirname "$$file")"; \
		cp "$(SRC_OPENCODE)/$$file" "$(DST_OPENCODE)/$$file"; \
	done
	@for dir in $(DIST_PLUGIN_DIRS); do \
		mkdir -p "$(DST_OPENCODE)/$$dir"; \
		cp -R "$(SRC_OPENCODE)/$$dir"/. "$(DST_OPENCODE)/$$dir/"; \
	done
	@find "$(DST_OPENCODE)" -name '.DS_Store' -delete

build-opencode-bash:
	@$(MAKE) SHELL=/bin/bash build-opencode

show-opencode-files:
	@echo "Root files:"
	@for file in $(DIST_ROOT_FILES); do echo "  .opencode/$$file"; done
	@echo "Plugin files:"
	@for file in $(DIST_PLUGIN_FILES); do echo "  .opencode/$$file"; done
	@echo "Plugin directories:"
	@for dir in $(DIST_PLUGIN_DIRS); do echo "  .opencode/$$dir/**"; done
