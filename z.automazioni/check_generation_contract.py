#!/usr/bin/env python3

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import yaml

sys.dont_write_bytecode = True

from render_template_factory import materialized_targets, render_blueprint
from template_factory_utils import (
    GENERATED,
    ROOT,
    build_jinja_env,
    load_modules,
    resolved_blueprints,
)

CONTRACT = ROOT / "Dev" / "TemplateFactory" / "modules" / "generated_artifacts.yaml"
PREVIEW_MANIFEST = GENERATED / "manifest.json"
MATERIALIZED_MANIFEST = ROOT / "z.modelli" / ".templatefactory-manifest.json"


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def load_contract(errors: list[str]) -> dict[str, Any]:
    if not CONTRACT.exists():
        fail(errors, f"{CONTRACT.relative_to(ROOT)} mancante")
        return {}
    data = yaml.safe_load(CONTRACT.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        fail(errors, f"{CONTRACT.relative_to(ROOT)}: root YAML non valida")
        return {}
    for key in ["policy", "artifacts"]:
        if key not in data:
            fail(errors, f"{CONTRACT.relative_to(ROOT)}: sezione mancante {key}")
    return data


def expected_rendered() -> tuple[dict[str, str], dict[str, dict[str, Any]]]:
    modules = load_modules()
    blueprints = resolved_blueprints(modules)
    env = build_jinja_env()
    rendered = {
        name: render_blueprint(env, name, blueprint, modules)
        for name, blueprint in blueprints.items()
    }
    return rendered, blueprints


def validate_previews(rendered: dict[str, str], errors: list[str]) -> None:
    manifest = read_json(PREVIEW_MANIFEST)
    manifest_files = {
        item.get("blueprint"): item.get("path")
        for item in manifest.get("files", [])
        if isinstance(item, dict)
    }

    for name, content in sorted(rendered.items()):
        rel_path = f"Dev/TemplateFactory/examples/generated/{name}.preview.md"
        path = ROOT / rel_path
        if manifest_files.get(name) != rel_path:
            fail(errors, f"{PREVIEW_MANIFEST.relative_to(ROOT)}: preview non dichiarata per {name}")
        if not path.exists():
            fail(errors, f"{rel_path}: preview generata mancante")
            continue
        if path.read_text(encoding="utf-8") != content:
            fail(errors, f"{rel_path}: preview non allineata a YAML/Jinja")


def validate_materialized(rendered: dict[str, str], blueprints: dict[str, dict[str, Any]], errors: list[str]) -> None:
    manifest = read_json(MATERIALIZED_MANIFEST)
    manifest_paths = {
        item.get("path")
        for item in manifest.get("files", [])
        if isinstance(item, dict) and item.get("path")
    }
    expected_paths: set[str] = set()

    for name, content in sorted(rendered.items()):
        for target in materialized_targets(name, blueprints[name]):
            rel_path = str(target.relative_to(ROOT))
            expected_paths.add(rel_path)
            if rel_path not in manifest_paths:
                fail(errors, f"{MATERIALIZED_MANIFEST.relative_to(ROOT)}: target non dichiarato {rel_path}")
            if not target.exists():
                fail(errors, f"{rel_path}: output z.modelli mancante; eseguire npm run generate:templates")
                continue
            if target.read_text(encoding="utf-8") != content:
                fail(errors, f"{rel_path}: output z.modelli non allineato a YAML/Jinja")

    extra = sorted(path for path in manifest_paths if path not in expected_paths)
    for rel_path in extra:
        fail(errors, f"{MATERIALIZED_MANIFEST.relative_to(ROOT)}: target obsoleto {rel_path}")


def validate_tracked_generated(errors: list[str]) -> None:
    # I template materializzati sono generati: se vengono tracciati, devono essere nel manifest.
    manifest = read_json(MATERIALIZED_MANIFEST)
    manifest_paths = {
        item.get("path")
        for item in manifest.get("files", [])
        if isinstance(item, dict) and item.get("path")
    }
    for path in (ROOT / "z.modelli").glob("**/*.md"):
        rel_path = str(path.relative_to(ROOT))
        if rel_path not in manifest_paths:
            fail(errors, f"{rel_path}: template in z.modelli fuori manifest generato")


def main() -> int:
    errors: list[str] = []
    load_contract(errors)
    rendered, blueprints = expected_rendered()
    validate_previews(rendered, errors)
    validate_materialized(rendered, blueprints, errors)
    validate_tracked_generated(errors)

    if errors:
        print("Contratto generazione non valido:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Generation contract OK: {len(rendered)} template e artefatti dichiarati verificati.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
