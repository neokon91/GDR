#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import yaml

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Dev" / "TemplateFactory" / "modules" / "plugin_matrix.yaml"
TARGET = ROOT / "Dev" / "plugin_matrix.json"


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def load_plugins(errors: list[str]) -> list[dict[str, Any]]:
    if not SOURCE.exists():
        fail(errors, f"{SOURCE.relative_to(ROOT)} mancante")
        return []
    source = yaml.safe_load(SOURCE.read_text(encoding="utf-8")) or {}
    if not isinstance(source, dict):
        fail(errors, f"{SOURCE.relative_to(ROOT)}: root YAML non valida")
        return []
    plugins = source.get("plugins")
    if not isinstance(plugins, list):
        fail(errors, f"{SOURCE.relative_to(ROOT)}: plugins deve essere una lista")
        return []
    seen: set[str] = set()
    for index, plugin in enumerate(plugins):
        if not isinstance(plugin, dict):
            fail(errors, f"{SOURCE.relative_to(ROOT)}: plugins[{index}] non e un oggetto")
            continue
        plugin_id = str(plugin.get("id") or "")
        if not plugin_id:
            fail(errors, f"{SOURCE.relative_to(ROOT)}: plugins[{index}] senza id")
            continue
        if plugin_id in seen:
            fail(errors, f"{SOURCE.relative_to(ROOT)}: plugin duplicato {plugin_id}")
        seen.add(plugin_id)
    return plugins


def json_text(plugins: list[dict[str, Any]]) -> str:
    return json.dumps(plugins, ensure_ascii=False, indent=2) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera Dev/plugin_matrix.json da YAML.")
    parser.add_argument("--check", action="store_true", help="Verifica senza scrivere.")
    args = parser.parse_args()

    errors: list[str] = []
    plugins = load_plugins(errors)

    if not errors:
        expected = json_text(plugins)
        if args.check:
            current = TARGET.read_text(encoding="utf-8") if TARGET.exists() else ""
            if current != expected:
                fail(errors, f"{TARGET.relative_to(ROOT)} non allineato a {SOURCE.relative_to(ROOT)}")
        else:
            TARGET.write_text(expected, encoding="utf-8")

    if errors:
        print("Plugin matrix non valida:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Plugin matrix OK: {len(plugins)} plugin generati da YAML.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
