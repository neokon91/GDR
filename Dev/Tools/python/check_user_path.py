#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

from template_factory_utils import ROOT, load_yaml

sys.dont_write_bytecode = True

USER_PATH_FILE = ROOT / "Dev" / "Source" / "YAML" / "quality" / "user_path.yaml"
WORKFLOWS_FILE = ROOT / "z.automazioni" / "data" / "workflows" / "quick_actions.json"
METABIND_FILE = ROOT / ".obsidian" / "plugins" / "obsidian-meta-bind-plugin" / "data.json"

VISIBLE_BUTTON_PATTERN = re.compile(r"`BUTTON\[([^\]\n]+)\]`")
NAKED_BUTTON_PATTERN = re.compile(r"(^|[^`])BUTTON\[([^\]\n]+)\](?!`)")


def rel_path(path: Path) -> str:
    return str(path.relative_to(ROOT))


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def read_text(path: Path) -> str | None:
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")


def required_array(errors: list[str], user_path: dict[str, Any], path_text: str) -> list[Any]:
    value: Any = user_path
    for key in path_text.split("."):
        value = value.get(key) if isinstance(value, dict) else None
    normalized = [item for item in value if item] if isinstance(value, list) else []
    if not normalized:
        errors.append(f"{rel_path(USER_PATH_FILE)}: {path_text} deve essere lista non vuota")
    return normalized


def required_text(errors: list[str], value: Any, path_text: str) -> str:
    text = str(value or "").strip()
    if not text:
        errors.append(f"{rel_path(USER_PATH_FILE)}: {path_text} vuoto o mancante")
    return text


def simple_call_pattern(workflow_id: str) -> re.Pattern[str]:
    escaped = re.escape(workflow_id)
    return re.compile(
        rf"renderWorkflowCommandDeck\(dv,\s*[\"']{escaped}[\"'],\s*\{{\s*mode:\s*[\"']simple[\"']\s*\}}\)"
    )


def workflow_block(text: str, workflow_id: str) -> str:
    start = f"<!-- workflow:quick_actions:start {workflow_id} -->"
    end = f"<!-- workflow:quick_actions:end {workflow_id} -->"
    start_index = text.find(start)
    end_index = text.find(end)
    if start_index == -1 or end_index == -1 or end_index < start_index:
        return ""
    return text[start_index : end_index + len(end)]


def button_declaration(button: str) -> str:
    return f"<!-- workflow:button {button} -->"


def validate_contract(errors: list[str], user_path: dict[str, Any], primary_path: list[Any]) -> None:
    if user_path.get("id") != "user_path":
        errors.append(f"{rel_path(USER_PATH_FILE)}: id non valido")

    seen_workflows: set[str] = set()
    seen_pages: set[str] = set()
    for index, raw_step in enumerate(primary_path):
        step = raw_step if isinstance(raw_step, dict) else {}
        workflow = required_text(errors, step.get("workflow"), f"primary_path[{index}].workflow")
        page = required_text(errors, step.get("page"), f"primary_path[{index}].page")
        required_text(errors, step.get("label"), f"primary_path[{index}].label")

        if workflow:
            if workflow in seen_workflows:
                errors.append(f"{rel_path(USER_PATH_FILE)}: workflow duplicato nel percorso utente ({workflow})")
            seen_workflows.add(workflow)
        if page:
            if page in seen_pages:
                errors.append(f"{rel_path(USER_PATH_FILE)}: pagina duplicata nel percorso utente ({page})")
            seen_pages.add(page)

        buttons = [
            str(button)
            for button in step.get("required_buttons", [])
            if button
        ] if isinstance(step.get("required_buttons"), list) else []
        if not buttons:
            errors.append(
                f"{rel_path(USER_PATH_FILE)}: primary_path.{workflow or index}.required_buttons vuoto o mancante"
            )


def main() -> int:
    errors: list[str] = []
    user_path = load_yaml(USER_PATH_FILE)
    workflows = (read_json(WORKFLOWS_FILE, {}) or {}).get("workflows", {})
    meta_bind = read_json(METABIND_FILE, {}) or {}
    button_ids = {
        str(button.get("id", ""))
        for button in meta_bind.get("buttonTemplates", [])
        if isinstance(button, dict)
    }
    primary_path = required_array(errors, user_path, "primary_path")
    forbidden_markers = [str(marker) for marker in required_array(errors, user_path, "policy.forbidden_user_block_markers")]
    release_config = [str(path) for path in required_array(errors, user_path, "required_release_config")]
    require_simple_mode = (user_path.get("policy") or {}).get("user_workflows_must_use_simple_mode") is not False

    validate_contract(errors, user_path, primary_path)

    for raw_step in primary_path:
        step = raw_step if isinstance(raw_step, dict) else {}
        workflow_id = str(step.get("workflow") or "")
        page = str(step.get("page") or "")
        label = str(step.get("label") or workflow_id)
        required_buttons = [
            str(button)
            for button in step.get("required_buttons", [])
            if button
        ] if isinstance(step.get("required_buttons"), list) else []
        text = read_text(ROOT / page)
        workflow = workflows.get(workflow_id) if isinstance(workflows, dict) else None

        if text is None:
            errors.append(f"{label}: pagina mancante ({page})")
            continue
        if workflow is None:
            errors.append(f"{label}: workflow mancante ({workflow_id})")
            continue
        if workflow.get("audience") != "user":
            errors.append(f"{label}: workflow non marcato audience=user")
        if require_simple_mode and step.get("require_simple_mode") is not False and not simple_call_pattern(workflow_id).search(text):
            errors.append(f"{label}: deck runtime non usa mode simple")

        block = workflow_block(text, workflow_id)
        if not block:
            errors.append(f"{label}: blocco quick_actions mancante")
            continue
        for marker in forbidden_markers:
            if marker in block:
                errors.append(f"{label}: blocco utente espone marker vietato ({marker})")
        visible_buttons = set(VISIBLE_BUTTON_PATTERN.findall(block))
        for match in NAKED_BUTTON_PATTERN.finditer(block):
            errors.append(f"{label}: BUTTON[{match.group(2)}] non usa inline code Meta Bind")
        for button in required_buttons:
            if button not in button_ids:
                errors.append(f"{label}: pulsante Meta Bind non configurato ({button})")
            if button not in visible_buttons:
                errors.append(f"{label}: pulsante Meta Bind visibile mancante (`BUTTON[{button}]`)")
            if button_declaration(button) not in block:
                errors.append(f"{label}: azione primaria non esposta ({button})")

    for config_path in release_config:
        if not (ROOT / config_path).exists():
            errors.append(f"Release utente: configurazione Obsidian mancante ({config_path})")

    if errors:
        print("Percorso utente nuovo non valido:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Percorso utente nuovo OK: {len(primary_path)} superfici primarie verificate da YAML.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
