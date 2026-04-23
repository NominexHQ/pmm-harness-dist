SHELL := /bin/zsh

HARNESS_DIR := $(CURDIR)/pmm-harness
MARKETPLACE_FILE := $(CURDIR)/.claude-plugin/marketplace.json
CLAUDECODE_PLUGIN_FILE := $(HARNESS_DIR)/claudecode/pmm-plugin/.claude-plugin/plugin.json
VERSION_FLAG_GOALS := --major --minor --patch
REQUESTED_VERSION_FLAGS := $(filter $(VERSION_FLAG_GOALS),$(MAKECMDGOALS))

ifeq ($(words $(REQUESTED_VERSION_FLAGS)),0)
VERSION_BUMP := patch
else ifeq ($(words $(REQUESTED_VERSION_FLAGS)),1)
ifneq ($(filter --major,$(REQUESTED_VERSION_FLAGS)),)
VERSION_BUMP := major
else ifneq ($(filter --minor,$(REQUESTED_VERSION_FLAGS)),)
VERSION_BUMP := minor
else
VERSION_BUMP := patch
endif
else
$(error Specify only one of --major, --minor, or --patch. Example: make -- --minor)
endif

.DEFAULT_GOAL := build

.PHONY: help build build-harness bump-marketplace-version --major --minor --patch

help:
	@echo "Targets:"
	@echo "  make                Build OpenCode harness, sync plugin version, and bump marketplace patch version"
	@echo "  make -- --major     Build OpenCode harness, sync plugin version, and bump marketplace major version"
	@echo "  make -- --minor     Build OpenCode harness, sync plugin version, and bump marketplace minor version"
	@echo "  make -- --patch     Build OpenCode harness, sync plugin version, and bump marketplace patch version"
	@echo ""
	@echo "  Claude Code plugin (pmm-harness/claudecode/pmm-plugin/) is canonical — edit directly."
	@echo "  make help           Show this help text"

build: build-harness bump-marketplace-version
	@echo "Completed pmm-dist build with $(VERSION_BUMP) marketplace version bump."

build-harness:
	@$(MAKE) -C "$(HARNESS_DIR)" build-opencode

bump-marketplace-version:
	@python3 "$(CURDIR)/bump_version.py" "$(MARKETPLACE_FILE)" "$(CLAUDECODE_PLUGIN_FILE)" "$(VERSION_BUMP)"

--major: build
	@:

--minor: build
	@:

--patch: build
	@: