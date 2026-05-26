#!/usr/bin/env python3

from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from typing import Any

import yaml

sys.dont_write_bytecode = True

from render_template_factory import materialized_targets, render_blueprint
from template_factory_utils import ROOT, build_jinja_env, load_modules, resolved_blueprints

CONTRACT = ROOT / "Dev" / "TemplateFactory" / "modules" / "generated_artifacts.yaml"
def fail(errors: list[str], message: str) -> None:
    errors.append(message)


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


def validate_render_plan(rendered: dict[str, str], blueprints: dict[str, dict[str, Any]], errors: list[str]) -> None:
    expected_paths: set[str] = set()

    for name, content in sorted(rendered.items()):
        if not content.strip():
            fail(errors, f"{name}: render vuoto")
        for target in materialized_targets(name, blueprints[name]):
            rel_path = str(target.relative_to(ROOT))
            if rel_path in expected_paths:
                fail(errors, f"{rel_path}: target z.modelli duplicato")
            expected_paths.add(rel_path)

    if not expected_paths:
        fail(errors, "nessun target z.modelli dichiarato dai blueprint")


def validate_tracked_generated(errors: list[str]) -> None:
    # I template materializzati e le preview locali sono output: non devono rientrare in Git.
    for generated_path in ["z.modelli", "Dev/TemplateFactory/examples/generated"]:
        result = subprocess.run(
            ["git", "ls-files", generated_path],
            cwd=ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if result.returncode == 0 and result.stdout.strip():
            fail(errors, f"{generated_path}: output generato tracciato da Git")

    result = subprocess.run(
        ["git", "ls-files", "dist"],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode == 0 and result.stdout.strip():
        fail(errors, "dist: pacchetto release generato tracciato da Git")


def main() -> int:
    errors: list[str] = []
    load_contract(errors)
    rendered, blueprints = expected_rendered()
    validate_render_plan(rendered, blueprints, errors)
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
