#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from template_factory_utils import ROOT, load_yaml

sys.dont_write_bytecode = True

MODULE = ROOT / "Dev" / "Source" / "YAML" / "json" / "workflows.yaml"
OUT = ROOT / "z.automazioni" / "data" / "workflows" / "quick_actions.json"
GENERATED_BY = "generate_workflow_data"


def rel_path(path: Path) -> str:
    return str(path.relative_to(ROOT))


def stable_json(payload: dict[str, Any]) -> str:
    return f"{json.dumps(payload, ensure_ascii=False, indent=2)}\n"


def action_payload(action: dict[str, Any]) -> dict[str, str]:
    return {
        "button": str(action.get("button") or ""),
        "label": str(action.get("label") or ""),
        "use_when": str(action.get("use_when") or ""),
    }


def workflow_quick_actions(module: dict[str, Any]) -> dict[str, Any]:
    workflows = module.get("workflows") if isinstance(module.get("workflows"), dict) else {}
    entries: dict[str, Any] = {}

    for workflow_id, workflow_value in workflows.items():
        workflow = workflow_value if isinstance(workflow_value, dict) else {}
        actions = workflow.get("quick_actions") if isinstance(workflow.get("quick_actions"), list) else []
        action_groups = workflow.get("action_groups") if isinstance(workflow.get("action_groups"), dict) else {}
        if not actions and not action_groups:
            continue

        entries[str(workflow_id)] = {
            "audience": str(workflow.get("audience") or ""),
            "user_goal": workflow.get("user_goal") or "",
            "entry_points": [str(entry) for entry in workflow.get("entry_points", []) or []],
            "required_plugins": [str(plugin) for plugin in workflow.get("required_plugins", []) or []],
            "quick_actions": [
                action_payload(action if isinstance(action, dict) else {})
                for action in actions
            ],
            "action_groups": {
                str(group_id): {
                    "label": str(group.get("label") or group_id),
                    "purpose": str(group.get("purpose") or ""),
                    "actions": [
                        action_payload(action if isinstance(action, dict) else {})
                        for action in (group.get("actions", []) if isinstance(group, dict) else [])
                    ],
                }
                for group_id, group in action_groups.items()
                if isinstance(group, dict)
            },
        }

    return entries


def expected_payload() -> tuple[dict[str, Any], dict[str, Any]]:
    if not MODULE.exists():
        raise FileNotFoundError(f"Modulo workflow mancante: {rel_path(MODULE)}")
    module = load_yaml(MODULE)
    workflows = workflow_quick_actions(module)
    payload = {
        "generated_by": GENERATED_BY,
        "source": rel_path(MODULE),
        "purpose": "Azioni rapide operative derivate da workflows.yaml per runtime, check e documentazione.",
        "workflows": workflows,
    }
    return payload, workflows


def main() -> int:
    parser = argparse.ArgumentParser(description="Renderizza quick_actions.json da workflows.yaml.")
    parser.add_argument("--check", action="store_true", help="Verifica che quick_actions.json sia aggiornato.")
    args = parser.parse_args()

    try:
        payload, workflows = expected_payload()
    except FileNotFoundError as error:
        print(error, file=sys.stderr)
        return 1

    expected = stable_json(payload)
    if args.check:
        actual = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if actual != expected:
            print(f"Workflow data non aggiornato: eseguire npm run generate:workflow-data ({rel_path(OUT)})", file=sys.stderr)
            return 1
        print(f"Workflow data OK: {len(workflows)} flussi con azioni rapide.")
        return 0

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(expected, encoding="utf-8")
    print(f"Workflow data generato: {len(workflows)} flussi in {rel_path(OUT)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
