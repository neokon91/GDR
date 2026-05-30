#!/usr/bin/env python3

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import yaml

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[3]
SOURCE = "Dev/Source/YAML/json/runtime_exports.yaml"


def normalize_specs(entries: Any) -> list[dict[str, str]]:
    if not isinstance(entries, list):
        return []
    specs: list[dict[str, str]] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        key = str(entry.get("key") or "").strip()
        path = str(entry.get("path") or "").replace("\\", "/").strip()
        if key and path:
            specs.append({"key": key, "path": path})
    return specs


def runtime_modules(source: dict[str, Any]) -> dict[str, list[dict[str, str]]]:
    groups: dict[str, list[dict[str, str]]] = {}
    modules = source.get("runtime_modules") if isinstance(source.get("runtime_modules"), dict) else {}
    for group_id, entries in modules.items():
        groups[str(group_id)] = normalize_specs(entries)
    return groups


def commonjs_runtime(source: dict[str, Any]) -> dict[str, list[dict[str, str]]]:
    runtime = source.get("commonjs_runtime") if isinstance(source.get("commonjs_runtime"), dict) else {}
    return {
        "entrypoints": normalize_specs(runtime.get("entrypoints")),
        "local_dependencies": normalize_specs(runtime.get("local_dependencies")),
        "data_dependencies": normalize_specs(runtime.get("data_dependencies")),
    }


def main() -> int:
    source_path = ROOT / SOURCE
    source = yaml.safe_load(source_path.read_text(encoding="utf-8")) or {}
    if not isinstance(source, dict):
        raise SystemExit(f"{SOURCE}: root YAML non valida")

    target = str(source.get("runtime_data") or "z.automazioni/data/runtime/runtime_exports.json").strip()
    payload = {
        "generated_by": "render_runtime_exports",
        "generated_from": SOURCE,
        "source": SOURCE,
        "purpose": "Registry runtime dei moduli caricati dal bridge DataviewJS e delle dipendenze CommonJS Templater.",
        "commonjs_runtime": commonjs_runtime(source),
        "runtime_modules": runtime_modules(source),
    }

    out_path = ROOT / target
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Runtime exports data renderizzato: {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
