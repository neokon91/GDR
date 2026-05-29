#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import yaml

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[3]
SOURCE = "Dev/Source/YAML/json/runtime_plugin_profile.yaml"


def load_yaml(rel_path: str, errors: list[str]) -> dict[str, Any]:
    path = ROOT / rel_path
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except Exception as exc:  # noqa: BLE001
        errors.append(f"{rel_path}: YAML non leggibile ({exc})")
        return {}
    if not isinstance(data, dict):
        errors.append(f"{rel_path}: root YAML non valida")
        return {}
    return data


def require_id(source: dict[str, Any], expected: str, rel_path: str, errors: list[str]) -> None:
    if source.get("id") != expected:
        errors.append(f"{rel_path}: id atteso {expected}")


def as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def normalize_list(value: Any) -> list[str]:
    return [text for text in (str(item).strip() for item in as_list(value)) if text]


def add_plugin(target: dict[str, dict[str, str]], label: Any, data: dict[str, Any]) -> None:
    normalized_label = str(label or "").strip()
    plugin_id = str(data.get("id") or "").strip()
    if not normalized_label or not plugin_id:
        return
    target[normalized_label] = {
        "id": plugin_id,
        "label": normalized_label,
        "source": data.get("source") or "community",
        "function": str(data.get("function") or "").strip(),
        "symptom": str(data.get("symptom") or data.get("visible_failure") or data.get("function") or "").strip(),
        "manual_action": str(data.get("manual_action") or "").strip(),
    }


def json_text(data: dict[str, Any]) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2) + "\n"


def js_locale_key(value: str) -> tuple[str, tuple[int, ...]]:
    # Mirrors the simple labels used by Node's default localeCompare: compare
    # case-insensitively first, then keep lowercase before uppercase on ties.
    return (value.casefold(), tuple(0 if char.islower() else 1 if char.isupper() else 2 for char in value))


def build_profile(errors: list[str]) -> tuple[dict[str, Any], str]:
    profile_source = load_yaml(SOURCE, errors)
    require_id(profile_source, "runtime_plugin_profile", SOURCE, errors)

    source_paths = profile_source.get("sources") if isinstance(profile_source.get("sources"), dict) else {}
    plugin_matrix_path = str(source_paths.get("plugin_matrix") or "Dev/Source/YAML/json/plugin_matrix.yaml")
    plugin_contracts_path = str(source_paths.get("plugin_contracts") or "Dev/Source/YAML/canonical/plugin_contracts.yaml")
    workflows_path = str(source_paths.get("workflows") or "Dev/Source/YAML/json/workflows.yaml")
    output_path = str(profile_source.get("output") or "z.automazioni/data/runtime/plugin_profile.json")

    plugin_matrix = load_yaml(plugin_matrix_path, errors)
    plugin_contracts = load_yaml(plugin_contracts_path, errors)
    workflows = load_yaml(workflows_path, errors)
    require_id(plugin_matrix, "plugin_matrix", plugin_matrix_path, errors)
    require_id(plugin_contracts, "plugin_contracts", plugin_contracts_path, errors)
    require_id(workflows, "workflows", workflows_path, errors)

    matrix_by_id = {
        str(plugin.get("id") or "").strip(): plugin
        for plugin in as_list(plugin_matrix.get("plugins"))
        if isinstance(plugin, dict)
    }
    contract_by_id = {
        str(plugin.get("id") or "").strip(): plugin
        for plugin in as_list(plugin_contracts.get("plugins"))
        if isinstance(plugin, dict)
    }
    manual_actions = profile_source.get("manual_actions") if isinstance(profile_source.get("manual_actions"), dict) else {}
    defaults = profile_source.get("defaults") if isinstance(profile_source.get("defaults"), dict) else {}
    default_manual_action = str(defaults.get("manual_action") or "").strip()
    plugins_by_label: dict[str, dict[str, str]] = {}

    for plugin_id, matrix_plugin in matrix_by_id.items():
        if not plugin_id:
            continue
        contract_plugin = contract_by_id.get(plugin_id) or {}
        base = {
            "id": plugin_id,
            "source": "community",
            "function": matrix_plugin.get("function") or contract_plugin.get("local_scope") or "",
            "symptom": contract_plugin.get("visible_failure") or matrix_plugin.get("function") or "",
            "manual_action": (
                manual_actions.get(matrix_plugin.get("name"))
                or manual_actions.get(contract_plugin.get("name"))
                or manual_actions.get(plugin_id)
                or default_manual_action
            ),
        }
        add_plugin(plugins_by_label, matrix_plugin.get("name"), base)
        if contract_plugin.get("name") and contract_plugin.get("name") != matrix_plugin.get("name"):
            alternate = {**base, "manual_action": manual_actions.get(contract_plugin.get("name")) or base["manual_action"]}
            add_plugin(plugins_by_label, contract_plugin.get("name"), alternate)

    for core_plugin in as_list(profile_source.get("core_plugins")):
        if not isinstance(core_plugin, dict):
            continue
        label = str(core_plugin.get("label") or "").strip()
        add_plugin(
            plugins_by_label,
            label,
            {
                "id": core_plugin.get("id"),
                "source": core_plugin.get("source") or "core",
                "function": core_plugin.get("function"),
                "symptom": core_plugin.get("symptom"),
                "manual_action": manual_actions.get(label) or core_plugin.get("manual_action") or default_manual_action,
            },
        )

    for label, action in manual_actions.items():
        if label not in plugins_by_label:
            errors.append(f"{SOURCE}: manual_actions.{label} non corrisponde a nessun plugin runtime")
            continue
        plugins_by_label[label]["manual_action"] = str(action).strip()

    workflow_plugins: dict[str, list[str]] = {}
    workflow_items = workflows.get("workflows") if isinstance(workflows.get("workflows"), dict) else {}
    for workflow_id, workflow in workflow_items.items():
        workflow_data = workflow if isinstance(workflow, dict) else {}
        required_plugins = normalize_list(workflow_data.get("required_plugins"))
        if not required_plugins:
            continue
        workflow_plugins[str(workflow_id)] = required_plugins
        for label in required_plugins:
            if label not in plugins_by_label:
                errors.append(f"{workflows_path}: {workflow_id}.required_plugins contiene plugin non profilato ({label})")

    default_workflow_plugins = normalize_list(defaults.get("workflow_plugins"))
    for label in default_workflow_plugins:
        if label not in plugins_by_label:
            errors.append(f"{SOURCE}: defaults.workflow_plugins contiene plugin non profilato ({label})")

    profile = {
        "generated_from": {
            "runtime_plugin_profile": SOURCE,
            "plugin_matrix": plugin_matrix_path,
            "plugin_contracts": plugin_contracts_path,
            "workflows": workflows_path,
        },
        "default_workflow_plugins": default_workflow_plugins,
        "default_manual_action": default_manual_action,
        "plugins_by_label": {key: plugins_by_label[key] for key in sorted(plugins_by_label, key=js_locale_key)},
        "workflow_plugins": {key: workflow_plugins[key] for key in sorted(workflow_plugins, key=js_locale_key)},
    }
    return profile, output_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera il profilo runtime dei plugin da YAML.")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    errors: list[str] = []
    profile, output_path = build_profile(errors)
    if not errors:
        target = ROOT / output_path
        expected = json_text(profile)
        if args.check:
            current = target.read_text(encoding="utf-8") if target.exists() else ""
            if current != expected:
                errors.append(f"{output_path} non allineato a {SOURCE}")
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(expected, encoding="utf-8")

    if errors:
        print("Runtime plugin profile non valido:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(
        "Runtime plugin profile OK: "
        f"{len(profile.get('plugins_by_label') or {})} label plugin, "
        f"{len(profile.get('workflow_plugins') or {})} workflow."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
