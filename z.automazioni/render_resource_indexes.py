#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Dev" / "TemplateFactory" / "modules" / "resource_indexes.yaml"
JINJA = ROOT / "Dev" / "TemplateFactory" / "jinja"
TEMPLATE = "resource_index.md.j2"


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
    if data.get("id") != "resource_indexes":
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


def validate_index(record: dict[str, Any], index: int, errors: list[str]) -> dict[str, Any] | None:
    path = str(record.get("path") or "").replace("\\", "/").strip()
    title = str(record.get("title") or "").strip()
    if not path:
        fail(errors, f"{SOURCE.relative_to(ROOT)}: indexes[{index}] senza path")
    elif not path.startswith("Risorse/") or not path.endswith(".md"):
        fail(errors, f"{SOURCE.relative_to(ROOT)}: target indice risorsa non valido ({path})")
    if not title:
        fail(errors, f"{SOURCE.relative_to(ROOT)}: {path or index} senza title")

    table = record.get("table")
    list_view = record.get("list")
    if bool(table) == bool(list_view):
        fail(errors, f"{SOURCE.relative_to(ROOT)}: {path or index} deve avere table oppure list")
    if table and not isinstance(table, dict):
        fail(errors, f"{SOURCE.relative_to(ROOT)}: {path or index}.table non valida")
    if list_view and not isinstance(list_view, dict):
        fail(errors, f"{SOURCE.relative_to(ROOT)}: {path or index}.list non valida")

    for view_name, view in (("table", table), ("list", list_view)):
        if not isinstance(view, dict):
            continue
        for key in ("from", "where", "sort"):
            if not str(view.get(key) or "").strip():
                fail(errors, f"{SOURCE.relative_to(ROOT)}: {path}.{view_name}.{key} mancante")
        if view_name == "table":
            columns = view.get("columns")
            if not isinstance(columns, list) or not columns:
                fail(errors, f"{SOURCE.relative_to(ROOT)}: {path}.table.columns mancante")

    if errors:
        return None
    return {
        "path": path,
        "title": title,
        "frontmatter": "categoria" in record or "tipo" in record,
        "categoria": str(record.get("categoria") or "risorsa"),
        "tipo": str(record.get("tipo") or Path(path).stem.lower()),
        "guidance": str(record.get("guidance") or "").strip(),
        "body": str(record.get("body") or "").strip(),
        "table": table,
        "list": list_view,
    }


def render_all(errors: list[str]) -> dict[str, str]:
    source = load_source(errors)
    indexes = source.get("indexes")
    if not isinstance(indexes, list) or not indexes:
        fail(errors, f"{SOURCE.relative_to(ROOT)}: indexes deve essere lista non vuota")
        return {}

    env = build_env()
    template = env.get_template(TEMPLATE)
    rendered: dict[str, str] = {}

    for index, record in enumerate(indexes):
        if not isinstance(record, dict):
            fail(errors, f"{SOURCE.relative_to(ROOT)}: indexes[{index}] non valido")
            continue
        normalized = validate_index(record, index, errors)
        if not normalized:
            continue
        path = normalized["path"]
        if path in rendered:
            fail(errors, f"{SOURCE.relative_to(ROOT)}: target duplicato {path}")
            continue
        text = template.render(**normalized)
        rendered[path] = text if text.endswith("\n") else f"{text}\n"

    for path, text in rendered.items():
        if not text.startswith("# ") and not text.startswith("---\n"):
            fail(errors, f"{path}: render senza intestazione")
        if "```dataview" not in text:
            fail(errors, f"{path}: vista Dataview mancante")
    return rendered


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera indici risorse semplici da YAML/Jinja.")
    parser.add_argument("--check", action="store_true", help="Verifica senza scrivere.")
    args = parser.parse_args()

    errors: list[str] = []
    rendered = render_all(errors)
    if args.check:
        for path, expected in sorted(rendered.items()):
            target = ROOT / path
            current = target.read_text(encoding="utf-8") if target.exists() else ""
            if current != expected:
                fail(errors, f"{path}: indice non allineato; eseguire npm run sync:sources")

    if errors:
        print("Indici risorse non validi:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    if not args.check:
        for path, text in sorted(rendered.items()):
            target = ROOT / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding="utf-8")

    print(f"Resource indexes {'OK' if args.check else 'generati'}: {len(rendered)} file da YAML/Jinja.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
