#!/usr/bin/env python3

from __future__ import annotations

import argparse
import fnmatch
import json
import sys
from pathlib import Path
from typing import Any

import yaml

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "Dev" / "Source" / "YAML" / "json" / "obsidian_config.yaml"
SOURCE_PIPELINE = ROOT / "Dev" / "Source" / "YAML" / "pipeline" / "source_pipeline.yaml"
DELEGATED_TARGETS = {
    ".obsidian/plugins/obsidian-meta-bind-plugin/data.json",
}
NATIVE_JSON_EXCEPTIONS = {
    ".obsidian/workspace.json",
}
REFERENCE_KEYS = {"file", "path"}
REFERENCE_SUFFIXES = (".md", ".canvas", ".base")


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


def load_yaml_file(path: Path, errors: list[str]) -> dict[str, Any]:
    if not path.exists():
        fail(errors, f"{path.relative_to(ROOT)} mancante")
        return {}
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        fail(errors, f"{path.relative_to(ROOT)}: root YAML non valida")
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
        if target.endswith("/manifest.json"):
            fail(errors, f"{SOURCE.relative_to(ROOT)}: target manifest plugin vietato {target}")
            continue
        if target in NATIVE_JSON_EXCEPTIONS or target in DELEGATED_TARGETS:
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


def source_pipeline_output_patterns(errors: list[str]) -> list[str]:
    pipeline = load_yaml_file(SOURCE_PIPELINE, errors)
    steps = pipeline.get("steps") if isinstance(pipeline.get("steps"), dict) else {}
    patterns: list[str] = []

    for step in steps.values():
        if not isinstance(step, dict):
            continue
        for output in step.get("outputs") or []:
            text = str(output).replace("\\", "/").strip()
            if text and text != "memoria":
                patterns.append(text)

    return patterns


def reference_targets(value: Any, prefix: str = "data") -> list[tuple[str, str]]:
    targets: list[tuple[str, str]] = []

    if isinstance(value, dict):
        for key, item in value.items():
            child_prefix = f"{prefix}.{key}"
            if key in REFERENCE_KEYS and isinstance(item, str):
                target = item.replace("\\", "/").strip()
                if target.endswith(REFERENCE_SUFFIXES) and not target.startswith(("http://", "https://")):
                    targets.append((child_prefix, target))
            targets.extend(reference_targets(item, child_prefix))
    elif isinstance(value, list):
        for index, item in enumerate(value):
            targets.extend(reference_targets(item, f"{prefix}[{index}]"))

    return targets


def target_is_declared_or_existing(target: str, output_patterns: list[str]) -> bool:
    if (ROOT / target).exists():
        return True
    for pattern in output_patterns:
        variants = [pattern]
        if "**/" in pattern:
            variants.append(pattern.replace("**/", ""))
        if any(fnmatch.fnmatch(target, variant) for variant in variants):
            return True
    return False


def validate_reference_targets(source: dict[str, Any], errors: list[str]) -> None:
    output_patterns = source_pipeline_output_patterns(errors)

    for index, item in enumerate(source.get("configs") or []):
        if not isinstance(item, dict):
            continue
        target = str(item.get("target") or f"configs[{index}]")
        for location, reference in reference_targets(item.get("data"), f"configs[{index}].data"):
            if not target_is_declared_or_existing(reference, output_patterns):
                fail(
                    errors,
                    f"{SOURCE.relative_to(ROOT)}: {target} contiene riferimento a file non tracciato o non generato ({location}: {reference})",
                )


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
        if path in NATIVE_JSON_EXCEPTIONS or path in DELEGATED_TARGETS:
            continue
        tracked.add(path)
    return tracked


def validate(source: dict[str, Any], errors: list[str], check_alignment: bool) -> dict[str, Any]:
    declared = declared_configs(source, errors)
    tracked = tracked_obsidian_json(errors)
    validate_reference_targets(source, errors)

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
            fail(errors, f"{target}: JSON non allineato a Dev/Source/YAML/json/obsidian_config.yaml")
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
