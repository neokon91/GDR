#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Any

import yaml

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Dev" / "TemplateFactory" / "modules" / "templater_wrappers.yaml"
TARGET_DIR = ROOT / "z.automazioni" / "templater"
NAME_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def load_source(errors: list[str]) -> list[dict[str, str]]:
    if not SOURCE.exists():
        fail(errors, f"{SOURCE.relative_to(ROOT)} mancante")
        return []
    data = yaml.safe_load(SOURCE.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        fail(errors, f"{SOURCE.relative_to(ROOT)}: root YAML non valida")
        return []
    wrappers = data.get("wrappers")
    if not isinstance(wrappers, list):
        fail(errors, f"{SOURCE.relative_to(ROOT)}: wrappers deve essere una lista")
        return []

    result: list[dict[str, str]] = []
    seen: set[str] = set()
    for index, item in enumerate(wrappers):
        if not isinstance(item, dict):
            fail(errors, f"{SOURCE.relative_to(ROOT)}: wrappers[{index}] non e un oggetto")
            continue
        name = str(item.get("name") or "")
        module = str(item.get("module") or "")
        if not NAME_PATTERN.match(name):
            fail(errors, f"{SOURCE.relative_to(ROOT)}: nome wrapper non valido {name!r}")
            continue
        if name in seen:
            fail(errors, f"{SOURCE.relative_to(ROOT)}: wrapper duplicato {name}")
            continue
        seen.add(name)
        if module != f"../{name}":
            fail(errors, f"{SOURCE.relative_to(ROOT)}: {name} deve puntare a ../{name}")
            continue
        if not (ROOT / "z.automazioni" / f"{name}.js").exists():
            fail(errors, f"z.automazioni/{name}.js mancante per wrapper {name}")
            continue
        result.append({"name": name, "module": module})
    return result


def wrapper_text(wrapper: dict[str, str]) -> str:
    name = wrapper["name"]
    module = wrapper["module"]
    return (
        f'const impl = require("{module}");\n\n'
        f"module.exports = async function {name}(...args) {{\n"
        "    return impl(...args);\n"
        "};\n"
    )


def expected_files(wrappers: list[dict[str, str]]) -> dict[Path, str]:
    return {
        TARGET_DIR / f"{wrapper['name']}.js": wrapper_text(wrapper)
        for wrapper in wrappers
    }


def validate(wrappers: list[dict[str, str]], errors: list[str]) -> dict[Path, str]:
    expected = expected_files(wrappers)
    actual = set(TARGET_DIR.glob("*.js")) if TARGET_DIR.exists() else set()
    expected_paths = set(expected)

    for path in sorted(actual - expected_paths):
        fail(errors, f"{path.relative_to(ROOT)}: wrapper non dichiarato in YAML")
    for path, text in sorted(expected.items()):
        if not path.exists():
            fail(errors, f"{path.relative_to(ROOT)}: wrapper mancante")
            continue
        if path.read_text(encoding="utf-8") != text:
            fail(errors, f"{path.relative_to(ROOT)}: wrapper non allineato a YAML")
    return expected


def render(expected: dict[Path, str]) -> None:
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    for path in sorted(TARGET_DIR.glob("*.js")):
        if path not in expected:
            path.unlink()
    for path, text in sorted(expected.items()):
        path.write_text(text, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera wrapper Templater da YAML.")
    parser.add_argument("--check", action="store_true", help="Verifica senza scrivere.")
    args = parser.parse_args()

    errors: list[str] = []
    wrappers = load_source(errors)
    expected = validate(wrappers, errors)

    if errors and args.check:
        print("Wrapper Templater non validi:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    if not args.check:
        if errors:
            structural_errors = [error for error in errors if not error.endswith("wrapper non allineato a YAML") and "wrapper mancante" not in error]
            if structural_errors:
                print("Wrapper Templater non validi:", file=sys.stderr)
                for error in structural_errors:
                    print(f"- {error}", file=sys.stderr)
                return 1
        render(expected)

    print(f"Wrapper Templater OK: {len(wrappers)} wrapper generati da YAML.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
