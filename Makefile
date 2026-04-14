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
	@echo "  make                Build both harness targets, sync plugin version, and bump marketplace patch version"
	@echo "  make -- --major     Build both harness targets, sync plugin version, and bump marketplace major version"
	@echo "  make -- --minor     Build both harness targets, sync plugin version, and bump marketplace minor version"
	@echo "  make -- --patch     Build both harness targets, sync plugin version, and bump marketplace patch version"
	@echo "  make help           Show this help text"

build: build-harness bump-marketplace-version
	@echo "Completed pmm-dist build with $(VERSION_BUMP) marketplace version bump."

build-harness:
	@$(MAKE) -C "$(HARNESS_DIR)" build-opencode build-claudecode

bump-marketplace-version:
	@python3 - "$(MARKETPLACE_FILE)" "$(CLAUDECODE_PLUGIN_FILE)" "$(VERSION_BUMP)" <<'PY'
	import json
	import sys
	from pathlib import Path
	
	marketplace_path = Path(sys.argv[1])
	plugin_path = Path(sys.argv[2])
	bump = sys.argv[3]
	if not plugin_path.exists():
	    raise SystemExit(f"Claude plugin metadata not found at {plugin_path}")
	plugin_data = json.loads(plugin_path.read_text())
	plugin_version = plugin_data.get("version")
	plugin_name = plugin_data.get("name")
	if not plugin_version or not plugin_name:
	    raise SystemExit(f"Claude plugin metadata at {plugin_path} is missing name or version")
	data = json.loads(marketplace_path.read_text())
	raw_version = data.get("version", "")
	plugins = data.get("plugins", [])
	
	try:
	    major, minor, patch = map(int, raw_version.split("."))
	except ValueError as exc:
	    raise SystemExit(
	        f"Unsupported marketplace version '{raw_version}'. Expected MAJOR.MINOR.PATCH."
	    ) from exc
	
	if bump == "major":
	    major += 1
	    minor = 0
	    patch = 0
	elif bump == "minor":
	    minor += 1
	    patch = 0
	else:
	    patch += 1
	
	matched_plugin = None
	for plugin in plugins:
	    if plugin.get("name") == plugin_name:
	        plugin["version"] = plugin_version
	        matched_plugin = plugin
	        break
	if matched_plugin is None:
	    raise SystemExit(
	        f"Marketplace plugin entry '{plugin_name}' not found in {marketplace_path}"
	    )
	
	data["version"] = f"{major}.{minor}.{patch}"
	marketplace_path.write_text(json.dumps(data, indent=2) + "\n")
	print(
	    f"Updated {marketplace_path}: marketplace={data['version']} plugin {plugin_name}={plugin_version}"
	)
	PY

--major: build
	@:

--minor: build
	@:

--patch: build
	@: