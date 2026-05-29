#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from render_release_folder_notes import render_notes

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[3]
DATA_FILE = "z.automazioni/data/workflows/quick_actions.json"
META_BIND_CONFIG = ".obsidian/plugins/obsidian-meta-bind-plugin/data.json"


def load_json(rel_path: str, fallback: Any = None) -> Any:
    path = ROOT / rel_path
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return fallback


def read_text_rel(rel_path: str) -> str | None:
    path = ROOT / rel_path
    return path.read_text(encoding="utf-8") if path.exists() else None


def markers(workflow_id: str) -> dict[str, str]:
    return {
        "start": f"<!-- workflow:quick_actions:start {workflow_id} -->",
        "end": f"<!-- workflow:quick_actions:end {workflow_id} -->",
    }


def first_action(button_templates: dict[str, dict[str, Any]], button: str) -> dict[str, Any] | None:
    template = button_templates.get(button) or {}
    actions = template.get("actions")
    if isinstance(actions, list) and actions and isinstance(actions[0], dict):
        return actions[0]
    return None


def fallback_text(button_templates: dict[str, dict[str, Any]], button: str) -> str:
    action = first_action(button_templates, button)
    if not action:
        return ""
    if action.get("type") == "open" and action.get("link"):
        return f"Fallback: apri {action['link']}."
    if action.get("type") == "templaterCreateNote" and action.get("templateFile"):
        folder = f" in {action['folderPath']}" if action.get("folderPath") else ""
        return f"Fallback: crea una nota da {action['templateFile']}{folder}."
    if action.get("type") == "runTemplaterFile" and action.get("templateFile"):
        return f"Fallback: esegui {action['templateFile']} da Templater."
    return ""


def render_action(lines: list[str], action: dict[str, Any], button_templates: dict[str, dict[str, Any]]) -> None:
    label = str(action.get("label") or "").strip()
    use_when = str(action.get("use_when") or "").strip()
    button = str(action.get("button") or "").strip()
    fallback = fallback_text(button_templates, button)

    lines.append(">")
    lines.append(f"> **{label}**{f' - {use_when}' if use_when else ''}")
    if button:
        lines.append(f"> `BUTTON[{button}]`")
        lines.append(f"<!-- workflow:button {button} -->")
    if fallback:
        lines.append(f"> {fallback}")


def render_block(workflow_id: str, workflow: dict[str, Any], button_templates: dict[str, dict[str, Any]]) -> str:
    lines: list[str] = []
    plugins = workflow.get("required_plugins") if isinstance(workflow.get("required_plugins"), list) else []
    action_groups = workflow.get("action_groups") if isinstance(workflow.get("action_groups"), dict) else {}
    user_facing = workflow.get("audience") == "user"

    marker = markers(workflow_id)
    lines.append(marker["start"])
    lines.append("> [!regia] Azioni rapide")
    lines.append(f"> {workflow.get('user_goal')}")
    if plugins and not user_facing:
        lines.append(">")
        lines.append(f"> Plugin coinvolti: {', '.join(f'`{plugin}`' for plugin in plugins)}.")

    for action in workflow.get("quick_actions") or []:
        if isinstance(action, dict):
            render_action(lines, action, button_templates)

    for group in action_groups.values():
        if not isinstance(group, dict):
            continue
        lines.append(">")
        lines.append(f"> [!regia]- {group.get('label')}")
        if group.get("purpose"):
            lines.append(f"> {group['purpose']}")
        for action in group.get("actions") or []:
            if isinstance(action, dict):
                render_action(lines, action, button_templates)

    lines.append(marker["end"])
    return "\n".join(lines)


def replace_block(text: str, workflow_id: str, block: str) -> str | None:
    marker = markers(workflow_id)
    start = text.find(marker["start"])
    end = text.find(marker["end"])
    if start == -1 or end == -1 or end < start:
        return None
    return f"{text[:start]}{block}{text[end + len(marker['end']):]}"


def materialized_user_file_map(errors: list[str]) -> dict[str, str]:
    rendered = render_notes(errors)
    return {path.replace("\\", "/"): text for path, text in rendered.items()}


def main() -> int:
    parser = argparse.ArgumentParser(description="Renderizza i blocchi azioni rapide nelle pagine operative.")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    errors: list[str] = []
    data = load_json(DATA_FILE)
    meta_bind = load_json(META_BIND_CONFIG, {})
    if not isinstance(data, dict) or data.get("generated_by") != "generate_workflow_data":
        print("Render workflow quick actions non valido:", file=sys.stderr)
        print(f"- {DATA_FILE}: artefatto mancante o non generato da generate_workflow_data", file=sys.stderr)
        return 1
    if not isinstance(meta_bind, dict):
        meta_bind = {}

    button_templates = {
        str(button.get("id") or ""): button
        for button in meta_bind.get("buttonTemplates", [])
        if isinstance(button, dict)
    }
    virtual_files = materialized_user_file_map(errors)
    workflows = data.get("workflows") if isinstance(data.get("workflows"), dict) else {}

    for workflow_id, workflow in workflows.items():
        if not isinstance(workflow, dict):
            continue
        block = render_block(str(workflow_id), workflow, button_templates)

        for entry in workflow.get("entry_points") or []:
            rel_entry = str(entry)
            current = read_text_rel(rel_entry)
            virtual_file = virtual_files.get(rel_entry)
            if current is None:
                current = virtual_file
            if current is None:
                errors.append(f"{workflow_id}: pagina operativa mancante ({rel_entry})")
                continue

            next_text = replace_block(current, str(workflow_id), block)
            if next_text is None:
                errors.append(f"{workflow_id}: marker quick_actions mancanti o malformati in {rel_entry}")
                continue

            if args.check:
                if next_text != current:
                    errors.append(f"{rel_entry}: blocco quick_actions non aggiornato; eseguire npm run render:workflow-actions")
            elif virtual_file is None and next_text != current:
                (ROOT / rel_entry).write_text(next_text, encoding="utf-8")

    if errors:
        print("Render workflow quick actions non valido:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Workflow quick actions {'OK' if args.check else 'renderizzate'}: {len(workflows)} flussi.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
