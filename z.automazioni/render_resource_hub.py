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
SOURCE = ROOT / "Dev" / "TemplateFactory" / "modules" / "resource_hub.yaml"
JINJA = ROOT / "Dev" / "TemplateFactory" / "jinja"
TEMPLATE = "resource_hub.md.j2"


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
    if data.get("id") != "resource_hub":
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


def require_text(data: dict[str, Any], key: str, errors: list[str]) -> str:
    value = str(data.get(key) or "").strip()
    if not value:
        fail(errors, f"{SOURCE.relative_to(ROOT)}: {key} mancante")
    return value


def normalize_sections(source: dict[str, Any], errors: list[str]) -> list[dict[str, Any]]:
    sections = source.get("sections")
    if not isinstance(sections, list) or not sections:
        fail(errors, f"{SOURCE.relative_to(ROOT)}: sections deve essere lista non vuota")
        return []

    normalized: list[dict[str, Any]] = []
    for index, section in enumerate(sections):
        if not isinstance(section, dict):
            fail(errors, f"{SOURCE.relative_to(ROOT)}: sections[{index}] non valida")
            continue
        title = require_text(section, "title", errors)
        headers = section.get("headers")
        rows = section.get("rows")
        if not isinstance(headers, list) or len(headers) != 2 or not all(str(item).strip() for item in headers):
            fail(errors, f"{SOURCE.relative_to(ROOT)}: sections.{title or index}.headers deve avere due valori")
            headers = ["Pagina", "Uso"]
        if not isinstance(rows, list) or not rows:
            fail(errors, f"{SOURCE.relative_to(ROOT)}: sections.{title or index}.rows deve essere lista non vuota")
            rows = []
        normalized_rows = []
        for row_index, row in enumerate(rows):
            if not isinstance(row, dict):
                fail(errors, f"{SOURCE.relative_to(ROOT)}: sections.{title or index}.rows[{row_index}] non valida")
                continue
            link = require_text(row, "link", errors)
            text = require_text(row, "text", errors)
            if link and not link.startswith("[["):
                fail(errors, f"{SOURCE.relative_to(ROOT)}: link non wikilink in {title} ({link})")
            normalized_rows.append({"link": link, "text": text})
        normalized.append({"title": title, "headers": [str(headers[0]), str(headers[1])], "rows": normalized_rows})
    return normalized


def normalize_archives(source: dict[str, Any], errors: list[str]) -> list[dict[str, str]]:
    archives = source.get("archives")
    if not isinstance(archives, list) or not archives:
        fail(errors, f"{SOURCE.relative_to(ROOT)}: archives deve essere lista non vuota")
        return []

    normalized: list[dict[str, str]] = []
    for index, archive in enumerate(archives):
        if not isinstance(archive, dict):
            fail(errors, f"{SOURCE.relative_to(ROOT)}: archives[{index}] non valida")
            continue
        title = require_text(archive, "title", errors)
        source_folder = require_text(archive, "from", errors)
        where = require_text(archive, "where", errors)
        if source_folder and not source_folder.startswith("Risorse/"):
            fail(errors, f"{SOURCE.relative_to(ROOT)}: archive fuori Risorse ({source_folder})")
        normalized.append({"title": title, "from": source_folder, "where": where})
    return normalized


def render(errors: list[str]) -> tuple[str, str]:
    source = load_source(errors)
    target = str(source.get("target") or "").replace("\\", "/").strip()
    if target != "Risorse/Risorse.md":
        fail(errors, f"{SOURCE.relative_to(ROOT)}: target non valido ({target})")

    payload = {
        "title": require_text(source, "title", errors),
        "intro": require_text(source, "intro", errors),
        "sections": normalize_sections(source, errors),
        "archives": normalize_archives(source, errors),
    }
    text = build_env().get_template(TEMPLATE).render(**payload)
    if not text.endswith("\n"):
        text += "\n"

    for marker in ("# Risorse", "## Uso Quotidiano", "## Materiali Al Tavolo", "## Archivio Mappe"):
        if marker not in text:
            fail(errors, f"{target}: marker render mancante ({marker})")
    return target, text


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera il catalogo Risorse/Risorse.md da YAML/Jinja.")
    parser.add_argument("--check", action="store_true", help="Verifica senza scrivere.")
    args = parser.parse_args()

    errors: list[str] = []
    target, expected = render(errors)

    if args.check:
        path = ROOT / target
        current = path.read_text(encoding="utf-8") if path.exists() else ""
        if current != expected:
            fail(errors, f"{target}: hub risorse non allineato; eseguire npm run sync:sources")

    if errors:
        print("Hub risorse non valido:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    if not args.check:
        path = ROOT / target
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(expected, encoding="utf-8")

    print(f"Resource hub {'OK' if args.check else 'generato'}: {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
