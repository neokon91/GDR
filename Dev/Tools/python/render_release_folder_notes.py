#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[3]
BOUNDARY = ROOT / "Dev" / "Source" / "YAML" / "quality" / "release_boundary.yaml"
WORKFLOWS = ROOT / "z.automazioni" / "data" / "workflows" / "quick_actions.json"
METABIND = ROOT / ".obsidian" / "plugins" / "obsidian-meta-bind-plugin" / "data.json"
JINJA = ROOT / "Dev" / "Source" / "Jinja"
TEMPLATE = "release_folder_note.md.j2"


def load_yaml(path: Path) -> dict[str, Any]:
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path.relative_to(ROOT)}: root YAML non valida")
    return data


def load_json(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"{path.relative_to(ROOT)}: root JSON non valida")
    return data


def default_title(file: dict[str, Any]) -> str:
    path = Path(str(file.get("path", "")))
    return path.stem or "Indice"


def source_folder(rel_path: str) -> str:
    path = Path(rel_path)
    parent = path.parent.as_posix()
    return parent if parent != "." else path.stem


def empty_state(file: dict[str, Any], rel_path: str) -> str:
    if file.get("empty_state"):
        return str(file["empty_state"]).strip()
    folder = source_folder(rel_path)
    return (
        f"Se questa vista e vuota, non e un errore: crea una nota in `{folder}` "
        "solo quando serve a una scelta, una scena, una conseguenza o una preparazione concreta."
    )


def build_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(JINJA)),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def button_fallback(button_id: str, button_templates: dict[str, dict[str, Any]]) -> str:
    template = button_templates.get(str(button_id), {})
    actions = template.get("actions")
    action = actions[0] if isinstance(actions, list) and actions else {}
    if not isinstance(action, dict):
        return ""
    if action.get("type") == "open" and action.get("link"):
        return f"Fallback: apri {action['link']}."
    if action.get("type") == "templaterCreateNote" and action.get("templateFile"):
        folder = f" in {action['folderPath']}" if action.get("folderPath") else ""
        return f"Fallback: crea una nota da {action['templateFile']}{folder}."
    if action.get("type") == "runTemplaterFile" and action.get("templateFile"):
        return f"Fallback: esegui {action['templateFile']} da Templater."
    return ""


def render_notes(errors: list[str]) -> dict[str, str]:
    boundary = load_yaml(BOUNDARY)
    workflows_data = load_json(WORKFLOWS)
    metabind_data = load_json(METABIND)
    workflows = workflows_data.get("workflows", {})
    if not isinstance(workflows, dict):
        errors.append(f"{WORKFLOWS.relative_to(ROOT)}: workflows mancante o non valido")
        workflows = {}
    button_templates = {
        str(button.get("id", "")): button
        for button in metabind_data.get("buttonTemplates", [])
        if isinstance(button, dict) and str(button.get("id", "")).strip()
    }

    env = build_env()
    env.globals["button_fallback"] = button_fallback
    template = env.get_template(TEMPLATE)
    rendered: dict[str, str] = {}

    for index, file in enumerate(boundary.get("materialized_user_files", []) or []):
        if not isinstance(file, dict):
            errors.append(f"release_boundary.materialized_user_files[{index}]: record non valido")
            continue

        rel_path = str(file.get("path", "")).replace("\\", "/")
        if not rel_path:
            errors.append(f"release_boundary.materialized_user_files[{index}]: path mancante")
            continue
        if rel_path in rendered:
            errors.append(f"release_boundary.materialized_user_files: path duplicato {rel_path}")
            continue

        workflow_blocks = file.get("workflow_blocks", []) or []
        for workflow_id in workflow_blocks:
            if str(workflow_id) not in workflows:
                errors.append(f"{rel_path}: workflow materializzato mancante ({workflow_id})")

        text = template.render(
            file=file,
            path=rel_path,
            title=str(file.get("title") or default_title(file)),
            body=str(file.get("body", "")).strip(),
            source_folder=str(file.get("source_folder") or source_folder(rel_path)),
            empty_state=empty_state(file, rel_path),
            workflow_blocks=[str(item) for item in workflow_blocks],
            workflows=workflows,
            button_templates=button_templates,
        )
        if not text.endswith("\n"):
            text += "\n"
        rendered[rel_path] = text

    return rendered


def validate_rendered(rendered: dict[str, str], errors: list[str]) -> None:
    if not rendered:
        errors.append("release_boundary.materialized_user_files: nessuna nota materializzata")

    for rel_path, text in rendered.items():
        if not text.startswith("---\n"):
            errors.append(f"{rel_path}: frontmatter mancante")
        if "generated_by: release_clean" not in text:
            errors.append(f"{rel_path}: marker generated_by mancante")
        if "\n# " not in text:
            errors.append(f"{rel_path}: titolo H1 mancante")
        for marker in ("## Subito", "## Vista", "## Quando Non C'e Ancora Nulla"):
            if marker not in text:
                errors.append(f"{rel_path}: sezione release mancante ({marker})")
        if "```dataview" not in text:
            errors.append(f"{rel_path}: vista Dataview minima mancante")
        empty_match = re.search(r"## Quando Non C'e Ancora Nulla\n\n(.+?)(?:\n## |\n<!--|\Z)", text, re.S)
        if not empty_match or not empty_match.group(1).strip():
            errors.append(f"{rel_path}: stato vuoto operativo mancante")
        if "workflow:quick_actions:start" in text and "workflow:quick_actions:end" not in text:
            errors.append(f"{rel_path}: marker workflow incompleti")


def main() -> int:
    parser = argparse.ArgumentParser(description="Renderizza folder notes utente di release da YAML + Jinja.")
    parser.add_argument("--json", action="store_true", help="Stampa mappa path -> Markdown renderizzato.")
    parser.add_argument("--check", action="store_true", help="Valida render senza scrivere file.")
    args = parser.parse_args()

    errors: list[str] = []
    try:
        rendered = render_notes(errors)
        validate_rendered(rendered, errors)
    except Exception as exc:  # noqa: BLE001
        errors.append(str(exc))
        rendered = {}

    if errors:
        print("Release folder notes non valide:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(rendered, ensure_ascii=False, sort_keys=True))
    else:
        print(f"Release folder notes OK: {len(rendered)} note renderizzate da Jinja.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
