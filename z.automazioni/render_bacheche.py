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
SOURCE = ROOT / "Dev" / "TemplateFactory" / "modules" / "bacheche.yaml"
JINJA = ROOT / "Dev" / "TemplateFactory" / "jinja"
BOARD_TEMPLATE = "bacheca_kanban.md.j2"
README_TEMPLATE = "bacheche_readme.md.j2"


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def load_source(errors: list[str]) -> dict[str, Any]:
    if not SOURCE.exists():
        fail(errors, f"{SOURCE.relative_to(ROOT)} mancante")
        return {}
    data = yaml.safe_load(SOURCE.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        fail(errors, f"{SOURCE.relative_to(ROOT)}: root YAML non valida")
        return {}
    if data.get("id") != "bacheche":
        fail(errors, f"{SOURCE.relative_to(ROOT)}: id non valido")
    return data


def build_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(JINJA)),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def required_path(record: dict[str, Any], key: str, errors: list[str]) -> str:
    value = str(record.get(key) or "").replace("\\", "/").strip()
    if not value:
        fail(errors, f"{SOURCE.relative_to(ROOT)}: path mancante")
    elif not value.startswith("z.bacheche/") or not value.endswith(".md"):
        fail(errors, f"{SOURCE.relative_to(ROOT)}: target bacheca non valido ({value})")
    return value


def normalize_columns(board: dict[str, Any], path: str, errors: list[str]) -> list[dict[str, Any]]:
    columns = board.get("columns")
    if not isinstance(columns, list) or not columns:
        fail(errors, f"{SOURCE.relative_to(ROOT)}: {path} senza colonne")
        return []

    normalized: list[dict[str, Any]] = []
    for index, column in enumerate(columns):
        if not isinstance(column, dict):
            fail(errors, f"{SOURCE.relative_to(ROOT)}: {path}.columns[{index}] non valida")
            continue
        title = str(column.get("title") or "").strip()
        tasks = column.get("tasks")
        if not title:
            fail(errors, f"{SOURCE.relative_to(ROOT)}: {path}.columns[{index}] senza titolo")
        if not isinstance(tasks, list) or not tasks:
            fail(errors, f"{SOURCE.relative_to(ROOT)}: {path}.{title or index} senza task")
            tasks = []
        normalized.append({
            "title": title,
            "tasks": [str(task).strip() for task in tasks if str(task).strip()],
            "collapsed": bool(column.get("collapsed", False)),
        })
    return normalized


def render_boards(source: dict[str, Any], env: Environment, errors: list[str]) -> dict[str, str]:
    template = env.get_template(BOARD_TEMPLATE)
    rendered: dict[str, str] = {}
    boards = source.get("boards")
    if not isinstance(boards, list) or not boards:
        fail(errors, f"{SOURCE.relative_to(ROOT)}: boards deve essere lista non vuota")
        return rendered

    for index, board in enumerate(boards):
        if not isinstance(board, dict):
            fail(errors, f"{SOURCE.relative_to(ROOT)}: boards[{index}] non valida")
            continue
        path = required_path(board, "path", errors)
        if path in rendered:
            fail(errors, f"{SOURCE.relative_to(ROOT)}: target duplicato {path}")
            continue
        columns = normalize_columns(board, path, errors)
        settings_json = json.dumps({
            "kanban-plugin": "board",
            "list-collapse": [bool(column["collapsed"]) for column in columns],
        }, ensure_ascii=False, separators=(",", ":"))
        rendered[path] = template.render(columns=columns, settings_json=settings_json)
        if not rendered[path].endswith("\n"):
            rendered[path] += "\n"
    return rendered


def render_readme(source: dict[str, Any], env: Environment, rendered: dict[str, str], errors: list[str]) -> None:
    readme = source.get("readme")
    if not isinstance(readme, dict):
        fail(errors, f"{SOURCE.relative_to(ROOT)}: readme mancante")
        return
    path = required_path(readme, "path", errors)
    if path in rendered:
        fail(errors, f"{SOURCE.relative_to(ROOT)}: target duplicato {path}")
        return
    template = env.get_template(README_TEMPLATE)
    text = template.render(
        title=str(readme.get("title") or "z.bacheche"),
        intro=str(readme.get("intro") or "").strip(),
        boards=readme.get("boards") or [],
        guidelines=readme.get("guidelines") or [],
    )
    rendered[path] = text if text.endswith("\n") else f"{text}\n"


def validate_rendered(rendered: dict[str, str], errors: list[str]) -> None:
    for path, text in sorted(rendered.items()):
        if path.endswith("README.md"):
            if "| Board | Uso |" not in text:
                fail(errors, f"{path}: tabella README mancante")
            continue
        if "kanban-plugin: board" not in text:
            fail(errors, f"{path}: frontmatter Kanban mancante")
        if "%% kanban:settings" not in text:
            fail(errors, f"{path}: impostazioni Kanban mancanti")
        if "#task" not in text:
            fail(errors, f"{path}: bacheca senza task operativo")


def render_all(errors: list[str]) -> dict[str, str]:
    source = load_source(errors)
    env = build_env()
    rendered = render_boards(source, env, errors)
    render_readme(source, env, rendered, errors)
    validate_rendered(rendered, errors)
    return rendered


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera le bacheche operative da YAML/Jinja.")
    parser.add_argument("--check", action="store_true", help="Verifica senza scrivere.")
    args = parser.parse_args()

    errors: list[str] = []
    rendered = render_all(errors)

    if args.check:
        for path, expected in sorted(rendered.items()):
            target = ROOT / path
            current = target.read_text(encoding="utf-8") if target.exists() else ""
            if current != expected:
                fail(errors, f"{path}: bacheca non allineata; eseguire npm run sync:sources")

    if errors:
        print("Bacheche non valide:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    if not args.check:
        for path, text in sorted(rendered.items()):
            target = ROOT / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding="utf-8")

    print(f"Bacheche {'OK' if args.check else 'generate'}: {len(rendered)} file da YAML/Jinja.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
