import json
import sys
from pathlib import Path


def main():
    if len(sys.argv) < 4:
        print("Usage: bump_version.py <marketplace_file> <plugin_file> <bump_type>")
        sys.exit(1)

    marketplace_path = Path(sys.argv[1])
    plugin_path = Path(sys.argv[2])
    bump = sys.argv[3]

    if not plugin_path.exists():
        print(f"Claude plugin metadata not found at {plugin_path}")
        sys.exit(1)

    plugin_data = json.loads(plugin_path.read_text())
    plugin_version = plugin_data.get("version")
    plugin_name = plugin_data.get("name")

    if not plugin_version or not plugin_name:
        print(f"Claude plugin metadata at {plugin_path} is missing name or version")
        sys.exit(1)

    if not marketplace_path.exists():
        print(f"Marketplace file not found at {marketplace_path}")
        sys.exit(1)

    data = json.loads(marketplace_path.read_text())
    raw_version = data.get("version", "")
    plugins = data.get("plugins", [])

    try:
        major, minor, patch = map(int, raw_version.split("."))
    except ValueError:
        print(
            f"Unsupported marketplace version '{raw_version}'. Expected MAJOR.MINOR.PATCH."
        )
        sys.exit(1)

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
        print(
            f"Marketplace plugin entry '{plugin_name}' not found in {marketplace_path}"
        )
        sys.exit(1)

    data["version"] = f"{major}.{minor}.{patch}"
    marketplace_path.write_text(json.dumps(data, indent=2) + "\n")
    print(
        f"Updated {marketplace_path}: marketplace={data['version']} plugin {plugin_name}={plugin_version}"
    )


if __name__ == "__main__":
    main()
