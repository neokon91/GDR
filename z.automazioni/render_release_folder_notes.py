#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[1]
BOUNDARY = ROOT / "Dev" / "TemplateFactory" / "modules" / "release_boundary.yaml"
WORKFLOWS = ROOT / "z.automazioni" / "data" / "workflows" / "quick_actions.json"
JINJA = ROOT / "Dev" / "TemplateFactory" / "jinja"
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


def build_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(JINJA)),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def render_notes(errors: list[str]) -> dict[str, str]:
    boundary = load_yaml(BOUNDARY)
    workflows_data = load_json(WORKFLOWS)
    workflows = workflows_data.get("workflows", {})
    if not isinstance(workflows, dict):
        errors.append(f"{WORKFLOWS.relative_to(ROOT)}: workflows mancante o non valido")
        workflows = {}

    env = build_env()
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
            workflow_blocks=[str(item) for item in workflow_blocks],
            workflows=workflows,
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
