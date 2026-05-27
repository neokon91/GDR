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
SOURCE = ROOT / "Dev" / "TemplateFactory" / "modules" / "obsidian_config.yaml"
DELEGATED_TARGETS = {
    ".obsidian/plugins/obsidian-meta-bind-plugin/data.json",
}
NATIVE_JSON_EXCEPTIONS = {
    ".obsidian/workspace.json",
}


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
    if not isinstance(data.get("configs"), list):
        fail(errors, f"{SOURCE.relative_to(ROOT)}: configs deve essere una lista")
        return {}
    return data


def json_text(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2) + "\n"


def declared_configs(source: dict[str, Any], errors: list[str]) -> dict[str, Any]:
    declared: dict[str, Any] = {}
    for index, item in enumerate(source.get("configs") or []):
        if not isinstance(item, dict):
            fail(errors, f"{SOURCE.relative_to(ROOT)}: configs[{index}] non e un oggetto")
            continue
        target = str(item.get("target") or "").replace("\\", "/")
        if not target:
            fail(errors, f"{SOURCE.relative_to(ROOT)}: configs[{index}] senza target")
            continue
        if not target.startswith(".obsidian/") or not target.endswith(".json"):
            fail(errors, f"{SOURCE.relative_to(ROOT)}: target non Obsidian JSON {target}")
            continue
        if target.endswith("/manifest.json") or target in NATIVE_JSON_EXCEPTIONS or target in DELEGATED_TARGETS:
            fail(errors, f"{SOURCE.relative_to(ROOT)}: target gestito altrove {target}")
            continue
        if target in declared:
            fail(errors, f"{SOURCE.relative_to(ROOT)}: target duplicato {target}")
            continue
        if "data" not in item:
            fail(errors, f"{SOURCE.relative_to(ROOT)}: {target} senza data")
            continue
        declared[target] = item["data"]
    return declared


def tracked_obsidian_json(errors: list[str]) -> set[str]:
    import subprocess

    result = subprocess.run(
        ["git", "ls-files", ".obsidian"],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode != 0:
        fail(errors, f"git ls-files .obsidian fallito: {result.stderr.strip()}")
        return set()
    tracked = set()
    for line in result.stdout.splitlines():
        path = line.strip().replace("\\", "/")
        if not path.endswith(".json"):
            continue
        if path.endswith("/manifest.json"):
            continue
        if path in NATIVE_JSON_EXCEPTIONS or path in DELEGATED_TARGETS:
            continue
        tracked.add(path)
    return tracked


def validate(source: dict[str, Any], errors: list[str], check_alignment: bool) -> dict[str, Any]:
    declared = declared_configs(source, errors)
    tracked = tracked_obsidian_json(errors)

    for target in sorted(tracked - set(declared)):
        fail(errors, f"{target}: JSON Obsidian tracciato senza sorgente YAML")
    for target in sorted(tracked & set(declared)):
        fail(errors, f"{target}: JSON Obsidian generato tracciato da Git")

    for target, data in sorted(declared.items()):
        path = ROOT / target
        if check_alignment and not path.exists():
            fail(errors, f"{target}: file JSON mancante")
            continue
        if not check_alignment:
            continue
        current = path.read_text(encoding="utf-8")
        expected = json_text(data)
        if current != expected:
            fail(errors, f"{target}: JSON non allineato a Dev/TemplateFactory/modules/obsidian_config.yaml")
    return declared


def render(declared: dict[str, Any]) -> None:
    for target, data in sorted(declared.items()):
        path = ROOT / target
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json_text(data), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera configurazione Obsidian da YAML.")
    parser.add_argument("--check", action="store_true", help="Verifica senza scrivere.")
    args = parser.parse_args()

    errors: list[str] = []
    source = load_source(errors)
    declared = validate(source, errors, check_alignment=args.check)

    if errors:
        print("Configurazione Obsidian non valida:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    if not args.check:
        render(declared)

    print(f"Obsidian config OK: {len(declared)} JSON generati da YAML.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
