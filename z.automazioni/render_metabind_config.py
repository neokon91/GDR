#!/usr/bin/env python3

from __future__ import annotations

import argparse
import difflib
import json
import sys
from pathlib import Path
from typing import Any

import yaml

sys.dont_write_bytecode = True

ROOT = Path.cwd()
SOURCE = ROOT / "Dev" / "TemplateFactory" / "modules" / "metabind_config.yaml"
TARGET = ROOT / ".obsidian" / "plugins" / "obsidian-meta-bind-plugin" / "data.json"


def load_source() -> dict[str, Any]:
    if not SOURCE.exists():
        raise FileNotFoundError(f"{SOURCE.relative_to(ROOT)} mancante")
    data = yaml.safe_load(SOURCE.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{SOURCE.relative_to(ROOT)}: root YAML non valida")
    config = data.get("config")
    if not isinstance(config, dict):
        raise ValueError(f"{SOURCE.relative_to(ROOT)}: config mancante")
    return config


def validate_config(config: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    inputs = config.get("inputFieldTemplates")
    buttons = config.get("buttonTemplates")
    if not isinstance(inputs, list) or not inputs:
        errors.append("metabind_config.yaml: inputFieldTemplates mancante o vuoto")
    if not isinstance(buttons, list) or not buttons:
        errors.append("metabind_config.yaml: buttonTemplates mancante o vuoto")

    input_names: set[str] = set()
    for index, item in enumerate(inputs or []):
        name = str((item or {}).get("name", "")).strip()
        declaration = str((item or {}).get("declaration", "")).strip()
        if not name:
            errors.append(f"metabind_config.yaml: inputFieldTemplates[{index}] senza name")
        if not declaration:
            errors.append(f"metabind_config.yaml: inputFieldTemplates[{index}] senza declaration")
        if name in input_names:
            errors.append(f"metabind_config.yaml: input duplicato {name}")
        input_names.add(name)

    button_ids: set[str] = set()
    for index, button in enumerate(buttons or []):
        button_id = str((button or {}).get("id", "")).strip()
        label = str((button or {}).get("label", "")).strip()
        actions = (button or {}).get("actions")
        if not button_id:
            errors.append(f"metabind_config.yaml: buttonTemplates[{index}] senza id")
        if not label:
            errors.append(f"metabind_config.yaml: buttonTemplates[{index}] senza label")
        if button_id in button_ids:
            errors.append(f"metabind_config.yaml: button duplicato {button_id}")
        button_ids.add(button_id)
        if not isinstance(actions, list) or not actions:
            errors.append(f"metabind_config.yaml: {button_id or index} senza actions")

    return errors


def render_json(config: dict[str, Any]) -> str:
    return json.dumps(config, ensure_ascii=False, indent=2) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera la configurazione Meta Bind da YAML.")
    parser.add_argument("--check", action="store_true", help="Verifica che data.json sia allineato al YAML")
    args = parser.parse_args()

    config = load_source()
    errors = validate_config(config)
    if errors:
        print("Meta Bind config non valida:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    rendered = render_json(config)
    if args.check:
        current = TARGET.read_text(encoding="utf-8") if TARGET.exists() else ""
        if current != rendered:
            print("Meta Bind config non allineata: eseguire npm run render:metabind-config", file=sys.stderr)
            diff = difflib.unified_diff(
                current.splitlines(),
                rendered.splitlines(),
                fromfile=str(TARGET.relative_to(ROOT)),
                tofile=str(SOURCE.relative_to(ROOT)),
                lineterm="",
            )
            for line in list(diff)[:120]:
                print(line, file=sys.stderr)
            return 1
        print("Meta Bind config OK: data.json generato da YAML.")
        return 0

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(rendered, encoding="utf-8")
    print(f"Meta Bind config generata: {TARGET.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
