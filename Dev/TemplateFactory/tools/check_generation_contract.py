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

PIPELINE = ROOT / "Dev" / "TemplateFactory" / "modules" / "source_pipeline.yaml"
OBSIDIAN_CONFIG = ROOT / "Dev" / "TemplateFactory" / "modules" / "obsidian_config.yaml"
RELEASE_BOUNDARY = ROOT / "Dev" / "TemplateFactory" / "modules" / "release_boundary.yaml"


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def load_pipeline(errors: list[str]) -> dict[str, Any]:
    if not PIPELINE.exists():
        fail(errors, f"{PIPELINE.relative_to(ROOT)} mancante")
        return {}
    data = yaml.safe_load(PIPELINE.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        fail(errors, f"{PIPELINE.relative_to(ROOT)}: root YAML non valida")
        return {}
    if data.get("id") != "source_pipeline":
        fail(errors, f"{PIPELINE.relative_to(ROOT)}: id non valido")
    for key in ["policy", "steps"]:
        if key not in data:
            fail(errors, f"{PIPELINE.relative_to(ROOT)}: sezione mancante {key}")
    return data


def load_yaml(path: Path, errors: list[str]) -> dict[str, Any]:
    if not path.exists():
        fail(errors, f"{path.relative_to(ROOT)} mancante")
        return {}
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        fail(errors, f"{path.relative_to(ROOT)}: root YAML non valida")
        return {}
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


def generated_markdown_files_from_pipeline(pipeline: dict[str, Any], errors: list[str]) -> set[str]:
    generated_markdown: set[str] = set()
    steps = pipeline.get("steps") if isinstance(pipeline.get("steps"), dict) else {}
    for step_id, step in steps.items():
        if not isinstance(step, dict):
            fail(errors, f"{PIPELINE.relative_to(ROOT)}: step non valido {step_id}")
            continue
        for output in step.get("outputs") or []:
            rel_path = str(output).replace("\\", "/")
            if rel_path.endswith(".md") and not any(char in rel_path for char in "*?[]"):
                generated_markdown.add(rel_path)
    return generated_markdown


def validate_tracked_generated(pipeline: dict[str, Any], errors: list[str]) -> None:
    # I template materializzati e le preview locali sono output: non devono rientrare in Git.
    release_boundary = load_yaml(RELEASE_BOUNDARY, errors)
    generated_release_roots = [str(root).rstrip("/") for root in release_boundary.get("generated_release_roots", []) or []]
    generated_markdown_roots = ["z.bacheche"]
    for generated_path in ["z.modelli", "Dev/TemplateFactory/examples/generated", *generated_release_roots, *generated_markdown_roots]:
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

    for generated_path in sorted(generated_markdown_files_from_pipeline(pipeline, errors)):
        result = subprocess.run(
            ["git", "ls-files", generated_path],
            cwd=ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if result.returncode == 0 and result.stdout.strip():
            fail(errors, f"{generated_path}: output Markdown generato tracciato da Git")

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


def tracked_json_files(errors: list[str]) -> set[str]:
    result = subprocess.run(
        ["git", "ls-files", "*.json"],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode != 0:
        fail(errors, f"git ls-files *.json fallito: {result.stderr.strip()}")
        return set()
    return {line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()}


def obsidian_config_targets(errors: list[str]) -> set[str]:
    source = load_yaml(OBSIDIAN_CONFIG, errors)
    targets: set[str] = set()
    for item in source.get("configs") or []:
        if isinstance(item, dict) and item.get("target"):
            targets.add(str(item["target"]).replace("\\", "/"))
    return targets


def generated_json_from_pipeline(pipeline: dict[str, Any], errors: list[str]) -> set[str]:
    generated_json: set[str] = set()
    steps = pipeline.get("steps") if isinstance(pipeline.get("steps"), dict) else {}

    for step_id, step in steps.items():
        if not isinstance(step, dict):
            fail(errors, f"{PIPELINE.relative_to(ROOT)}: step non valido {step_id}")
            continue
        for output in step.get("outputs") or []:
            rel_path = str(output).replace("\\", "/")
            if rel_path == ".obsidian/**/*.json":
                generated_json.update(obsidian_config_targets(errors))
            elif rel_path.endswith(".json") and not any(char in rel_path for char in "*?[]"):
                generated_json.add(rel_path)

    required = {
        "Dev/plugin_matrix.json",
        "z.automazioni/data/srd/core.json",
        "z.automazioni/data/srd/opzioni_personaggio.json",
        "z.automazioni/data/workflows/quick_actions.json",
        ".obsidian/plugins/obsidian-meta-bind-plugin/data.json",
    }
    missing = sorted(required - generated_json)
    for rel_path in missing:
        fail(errors, f"{rel_path}: output generato non dichiarato in source_pipeline.yaml")

    return generated_json


def validate_json_source_boundary(pipeline: dict[str, Any], errors: list[str]) -> None:
    generated_json = generated_json_from_pipeline(pipeline, errors)
    native_json = {
        "package.json",
        "Dev/TemplateFactory/examples/importers/azgaar_sample.geojson",
        "Dev/TemplateFactory/examples/importers/watabou_city_sample.json",
        "Dev/TemplateFactory/examples/importers/watabou_dungeon_sample.json",
    }

    for rel_path in tracked_json_files(errors):
        if rel_path in generated_json:
            fail(errors, f"{rel_path}: JSON generato tracciato da Git")
            continue
        if rel_path in native_json:
            continue
        if rel_path.endswith("/manifest.json"):
            continue
        fail(errors, f"{rel_path}: JSON tracciato senza sorgente YAML/Jinja dichiarata")


def main() -> int:
    errors: list[str] = []
    pipeline = load_pipeline(errors)
    rendered, blueprints = expected_rendered()
    validate_render_plan(rendered, blueprints, errors)
    validate_tracked_generated(pipeline, errors)
    validate_json_source_boundary(pipeline, errors)

    if errors:
        print("Contratto generazione non valido:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Generation contract OK: {len(rendered)} template e artefatti dichiarati verificati.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
