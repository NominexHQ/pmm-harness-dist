SHELL := /bin/zsh

HARNESS_DIR := $(CURDIR)/pmm-harness
MARKETPLACE_FILE := $(CURDIR)/.claude-plugin/marketplace.json
CLAUDECODE_PLUGIN_FILE := $(HARNESS_DIR)/claudecode/pmm-plugin/.claude-plugin/plugin.json
VERSION_FLAG_GOALS := --major --minor --patch
REQUESTED_VERSION_FLAGS := $(filter $(VERSION_FLAG_GOALS),$(MAKECMDGOALS))

ifneq ($(words $(REQUESTED_VERSION_FLAGS)),0)
ifneq ($(words $(REQUESTED_VERSION_FLAGS)),1)
$(error Specify only one of --major, --minor, or --patch. Example: make -- --minor)
endif
endif

.DEFAULT_GOAL := build

.PHONY: help build build-harness release release-patch release-minor release-major bump-versions verify-versions bump-marketplace-version --major --minor --patch

help:
	@echo "Targets:"
	@echo "  make                Build OpenCode + Claude harness artifacts (no version bump)"
	@echo "  make release-patch  Build harness, bump Claude plugin patch version, and sync marketplace"
	@echo "  make release-minor  Build harness, bump Claude plugin minor version, and sync marketplace"
	@echo "  make release-major  Build harness, bump Claude plugin major version, and sync marketplace"
	@echo "  make -- --major     Alias for release-major"
	@echo "  make -- --minor     Alias for release-minor"
	@echo "  make -- --patch     Alias for release-patch"
	@echo ""
	@echo "  Claude Code plugin (pmm-harness/claudecode/pmm-plugin/) is canonical — edit directly."
	@echo "  make help           Show this help text"

build: build-harness
	@echo "Completed pmm-dist build (no version bump)."

build-harness:
	@$(MAKE) -C "$(HARNESS_DIR)" build-harness

release: release-patch

release-patch: VERSION_BUMP := patch
release-minor: VERSION_BUMP := minor
release-major: VERSION_BUMP := major

release-patch release-minor release-major: build-harness bump-versions verify-versions
	@echo "Completed pmm-dist release with $(VERSION_BUMP) plugin version bump and marketplace sync."

bump-versions:
	@python3 "$(CURDIR)/bump_version.py" "$(MARKETPLACE_FILE)" "$(CLAUDECODE_PLUGIN_FILE)" "$(VERSION_BUMP)"

verify-versions:
	@python3 -c 'import json,sys; mf="$(MARKETPLACE_FILE)"; pf="$(CLAUDECODE_PLUGIN_FILE)"; pv=json.load(open(pf))["version"]; entry=next((p for p in json.load(open(mf)).get("plugins",[]) if p.get("name")=="pmm"), None); sys.exit("Marketplace entry '\''pmm'\'' not found in {}".format(mf)) if entry is None else None; sys.exit("Version mismatch: plugin={} marketplace={}".format(pv, entry.get("version"))) if entry.get("version") != pv else None; print("Version sync verified: pmm={}".format(pv))'

bump-marketplace-version: bump-versions
	@:

--major: release-major
	@:

--minor: release-minor
	@:

--patch: release-patch
	@:
