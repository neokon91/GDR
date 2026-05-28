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
SOURCE = ROOT / "Dev" / "TemplateFactory" / "modules" / "hub_pages.yaml"
JINJA = ROOT / "Dev" / "TemplateFactory" / "jinja"
TEMPLATE = "resource_support_page.md.j2"
WORKFLOW_QUICK_ACTIONS_RE = re.compile(
    r"<!-- workflow:quick_actions:start [^>]+ -->[\s\S]*?<!-- workflow:quick_actions:end [^>]+ -->"
)


class IndentedDumper(yaml.SafeDumper):
    def increase_indent(self, flow: bool = False, indentless: bool = False) -> Any:
        return super().increase_indent(flow, False)


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
    if data.get("id") != "hub_pages":
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


def comparable_page(text: str) -> str:
    return WORKFLOW_QUICK_ACTIONS_RE.sub("<!-- workflow:quick_actions:block -->", text)


def frontmatter_text(frontmatter: Any, rel_path: str, errors: list[str]) -> str:
    if frontmatter in (None, ""):
        return ""
    if not isinstance(frontmatter, dict):
        fail(errors, f"{rel_path}: frontmatter deve essere mappa")
        return ""
    if not frontmatter:
        return ""
    return yaml.dump(frontmatter, Dumper=IndentedDumper, allow_unicode=True, sort_keys=False).strip() + "\n"


def normalize_page(record: dict[str, Any], index: int, errors: list[str]) -> dict[str, Any] | None:
    local_errors: list[str] = []
    path = str(record.get("path") or "").replace("\\", "/").strip()
    title = str(record.get("title") or "").strip()
    pre_title = str(record.get("pre_title") or "").strip()
    body = str(record.get("body") or "").strip()

    if not path:
        fail(local_errors, f"{SOURCE.relative_to(ROOT)}: pages[{index}] senza path")
    elif not path.startswith("Hub/") or "/" in path.removeprefix("Hub/") or not path.endswith(".md"):
        fail(local_errors, f"{SOURCE.relative_to(ROOT)}: target Hub non valido ({path})")
    if not title:
        fail(local_errors, f"{path or f'pages[{index}]'}: title mancante")
    if not body:
        fail(local_errors, f"{path or f'pages[{index}]'}: body mancante")
    if body.startswith("# "):
        fail(local_errors, f"{path}: body non deve duplicare H1")

    rendered_frontmatter = frontmatter_text(record.get("frontmatter"), path, local_errors)
    if local_errors:
        errors.extend(local_errors)
        return None

    return {
        "path": path,
        "title": title,
        "pre_title": pre_title,
        "body": body,
        "frontmatter_text": rendered_frontmatter,
    }


def render_all(errors: list[str]) -> dict[str, str]:
    source = load_source(errors)
    pages = source.get("pages")
    if not isinstance(pages, list) or not pages:
        fail(errors, f"{SOURCE.relative_to(ROOT)}: pages deve essere lista non vuota")
        return {}

    env = build_env()
    template = env.get_template(TEMPLATE)
    rendered: dict[str, str] = {}

    for index, record in enumerate(pages):
        if not isinstance(record, dict):
            fail(errors, f"{SOURCE.relative_to(ROOT)}: pages[{index}] non valida")
            continue
        normalized = normalize_page(record, index, errors)
        if not normalized:
            continue
        path = normalized["path"]
        title = normalized["title"]
        if path in rendered:
            fail(errors, f"{SOURCE.relative_to(ROOT)}: target duplicato {path}")
            continue
        text = template.render(**normalized)
        if not text.endswith("\n"):
            text = f"{text}\n"
        if not text.startswith("# ") and not text.startswith("---\n"):
            fail(errors, f"{path}: render senza intestazione")
        if f"# {title}" not in text:
            fail(errors, f"{path}: H1 non coerente con il contratto")
        for code in re.findall(r"```dataviewjs\n([\s\S]*?)```", text):
            if "z.engine/session_views.js" not in code:
                fail(errors, f"{path}: DataviewJS deve passare dal runtime z.engine/session_views.js")
            for forbidden in ("dv.pages(", "app.plugins", "app.workspace", "window.", "document.", "require("):
                if forbidden in code:
                    fail(errors, f"{path}: DataviewJS usa API fragile o vietata ({forbidden})")
        rendered[path] = text
    return rendered


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera le pagine Hub operative da YAML/Jinja.")
    parser.add_argument("--check", action="store_true", help="Verifica senza scrivere.")
    parser.add_argument("--json", action="store_true", help="Stampa mappa path -> Markdown renderizzato.")
    parser.add_argument("--list-targets", action="store_true", help="Stampa i target generati.")
    args = parser.parse_args()

    errors: list[str] = []
    rendered = render_all(errors)

    if args.list_targets:
        if errors:
            print("Pagine Hub non valide:", file=sys.stderr)
            for error in errors:
                print(f"- {error}", file=sys.stderr)
            return 1
        for path in sorted(rendered):
            print(path)
        return 0

    if args.check:
        for path, expected in sorted(rendered.items()):
            target = ROOT / path
            current = target.read_text(encoding="utf-8") if target.exists() else ""
            if comparable_page(current) != comparable_page(expected):
                fail(errors, f"{path}: pagina Hub non allineata; eseguire npm run sync:sources")

    if errors:
        print("Pagine Hub non valide:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(rendered, ensure_ascii=False, sort_keys=True))
        return 0

    if not args.check:
        for path, text in sorted(rendered.items()):
            target = ROOT / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding="utf-8")

    print(f"Hub pages {'OK' if args.check else 'generate'}: {len(rendered)} file da YAML/Jinja.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
