#!/usr/bin/env python3

from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from typing import Any

from template_factory_utils import ROOT, load_yaml

sys.dont_write_bytecode = True

CONTRACT = ROOT / "Dev" / "Source" / "YAML" / "quality" / "obsidian_plugin_bundle_contract.yaml"
OBSIDIAN_CONFIG = ROOT / "Dev" / "Source" / "YAML" / "json" / "obsidian_config.yaml"


def rel_path(path: Path) -> str:
    return str(path.relative_to(ROOT))


def as_string_list(value: Any) -> list[str]:
    return [str(item).strip() for item in value if str(item).strip()] if isinstance(value, list) else []


def declared_community_plugins(errors: list[str]) -> list[str]:
    source = load_yaml(OBSIDIAN_CONFIG)
    record = next(
        (
            item
            for item in source.get("configs", []) or []
            if isinstance(item, dict) and item.get("target") == ".obsidian/community-plugins.json"
        ),
        None,
    )
    if record is None:
        errors.append(f"{rel_path(OBSIDIAN_CONFIG)}: target .obsidian/community-plugins.json mancante")
        return []
    plugins = as_string_list(record.get("data"))
    if not plugins:
        errors.append(f"{rel_path(OBSIDIAN_CONFIG)}: community-plugins.json dichiarato senza plugin")
    return plugins


def git_tracked(prefix: str, errors: list[str]) -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "--", prefix],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode != 0:
        errors.append(f"git ls-files -- {prefix} fallito: {result.stderr.strip()}")
        return []
    return [
        line.strip()
        for line in result.stdout.splitlines()
        if line.strip() and (ROOT / line.strip()).exists()
    ]


def rel_file_name(path_text: str, root: str) -> str:
    tail = path_text[len(f"{root}/") :]
    return "/".join(tail.split("/")[1:])


def main() -> int:
    errors: list[str] = []
    contract = load_yaml(CONTRACT)
    if contract.get("id") != "obsidian_plugin_bundle_contract":
        errors.append(f"{rel_path(CONTRACT)}: id non valido")

    policy = contract.get("policy") if isinstance(contract.get("policy"), dict) else {}
    plugin_root = str(policy.get("plugin_root") or ".obsidian/plugins").rstrip("/")
    theme_root = str(policy.get("theme_root") or ".obsidian/themes").rstrip("/")
    snippet_root = str(policy.get("snippet_root") or ".obsidian/snippets").rstrip("/")
    allowed_plugin_tracked_files = set(as_string_list(policy.get("allowed_plugin_tracked_files")))
    required_snippets = set(as_string_list((contract.get("snippets") or {}).get("required")))
    allowed_snippet_files = set(as_string_list((contract.get("snippets") or {}).get("allowed_tracked_files")))

    matrix_path = ROOT / str(contract.get("plugin_matrix") or "Dev/Source/YAML/json/plugin_matrix.yaml")
    contracts_path = ROOT / str(contract.get("plugin_contracts") or "Dev/Source/YAML/canonical/plugin_contracts.yaml")
    matrix_plugins = load_yaml(matrix_path).get("plugins", []) or []
    plugin_contracts = load_yaml(contracts_path).get("plugins", []) or []
    matrix_ids = {
        str(plugin.get("id") or "").strip()
        for plugin in matrix_plugins
        if isinstance(plugin, dict) and str(plugin.get("id") or "").strip()
    }
    contract_ids = {
        str(plugin.get("id") or "").strip()
        for plugin in plugin_contracts
        if isinstance(plugin, dict) and str(plugin.get("id") or "").strip()
    }

    for plugin_id in matrix_ids:
        if plugin_id not in contract_ids:
            errors.append(f"{plugin_id}: plugin_matrix senza plugin_contracts")

    for tracked_path in git_tracked(plugin_root, errors):
        file_name = rel_file_name(tracked_path, plugin_root)
        if file_name in allowed_plugin_tracked_files:
            continue
        errors.append(
            f"{tracked_path}: bundle/config plugin tracciato ma il repository deve solo dichiarare "
            "plugin e generare configurazioni"
        )

    for tracked_path in git_tracked(theme_root, errors):
        errors.append(f"{tracked_path}: tema vendorizzato tracciato; usare tema installato localmente o snippet progetto")

    tracked_snippet_files = git_tracked(snippet_root, errors)
    for snippet in required_snippets:
        if not (ROOT / snippet_root / snippet).exists():
            errors.append(f"{snippet}: snippet richiesto mancante")
    for tracked_path in tracked_snippet_files:
        file_name = tracked_path[len(f"{snippet_root}/") :]
        if file_name not in allowed_snippet_files:
            errors.append(f"{tracked_path}: snippet tracciato non ammesso")

    community_plugins = declared_community_plugins(errors)
    enabled = {plugin_id.strip() for plugin_id in community_plugins if plugin_id.strip()}
    for plugin_id in enabled:
        if plugin_id not in matrix_ids:
            errors.append(f"{plugin_id}: obsidian_config abilita plugin fuori plugin_matrix")
    for plugin_id in matrix_ids:
        if plugin_id not in enabled:
            errors.append(f"{plugin_id}: plugin_matrix non dichiarato in obsidian_config community-plugins")

    if errors:
        print("Contratto plugin Obsidian non valido:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(
        "Plugin Obsidian OK: "
        f"{len(matrix_ids)} plugin dichiarati, bundle terzi non tracciati, {len(required_snippets)} snippet progetto."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
