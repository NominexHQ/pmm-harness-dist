SHELL := /bin/zsh

PROJECT_ROOT := $(abspath ../..)
SRC_OPENCODE := $(PROJECT_ROOT)/.opencode
DST_OPENCODE := $(PROJECT_ROOT)/pmm-dist/pmm-harness/opencode
DST_CLAUDECODE := $(PROJECT_ROOT)/pmm-dist/pmm-harness/claudecode
CLAUDECODE_PLUGIN_REPO := https://github.com/NominexHQ/pmm-plugin
CLAUDECODE_PLUGIN_DST := $(DST_CLAUDECODE)/pmm-plugin

# Shipping allowlist: only files required to distribute the OpenCode PMM plugin.
DIST_ROOT_FILES := package.json opencode.json
DIST_PLUGIN_FILES := plugins/nominex-pmm.ts
DIST_PLUGIN_DIRS := plugins/instructions

.PHONY: help \
	build-opencode build-opencode-bash clean-opencode show-opencode-files \
	build-claudecode build-claudecode-bash clean-claudecode

help:
	@echo "Targets:"
	@echo "  make build-opencode      Copy shipping artifacts into pmm-dist/pmm-harness/opencode"
	@echo "  make build-opencode-bash Same as build-opencode, but forces /bin/bash as the shell"
	@echo "  make build-claudecode    Clone canonical pmm-plugin into claudecode harness and strip .git"
	@echo "  make build-claudecode-bash Same as build-claudecode, but forces /bin/bash as the shell"
	@echo "  make clean-claudecode    Remove generated pmm-plugin snapshot from claudecode harness"
	@echo "  make clean-opencode      Remove generated harness files from pmm-dist/pmm-harness/opencode"
	@echo "  make show-opencode-files Show source files that are included in the OpenCode harness build"

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

clean-claudecode:
	@mkdir -p "$(DST_CLAUDECODE)"
	@rm -rf "$(CLAUDECODE_PLUGIN_DST)"

build-claudecode: clean-claudecode
	@mkdir -p "$(DST_CLAUDECODE)"
	@git clone --depth 1 "$(CLAUDECODE_PLUGIN_REPO)" "$(CLAUDECODE_PLUGIN_DST)"
	@rm -rf "$(CLAUDECODE_PLUGIN_DST)/.git"
	@find "$(CLAUDECODE_PLUGIN_DST)" -name '.DS_Store' -delete

build-claudecode-bash:
	@$(MAKE) SHELL=/bin/bash build-claudecode

show-opencode-files:
	@echo "Root files:"
	@for file in $(DIST_ROOT_FILES); do echo "  .opencode/$$file"; done
	@echo "Plugin files:"
	@for file in $(DIST_PLUGIN_FILES); do echo "  .opencode/$$file"; done
	@echo "Plugin directories:"
	@for dir in $(DIST_PLUGIN_DIRS); do echo "  .opencode/$$dir/**"; done
