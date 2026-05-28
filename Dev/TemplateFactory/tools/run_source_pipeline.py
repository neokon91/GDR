#!/usr/bin/env python3

from __future__ import annotations

import argparse
import fnmatch
import subprocess
import sys
from pathlib import Path
from typing import Any

import yaml

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[3]
PIPELINE = ROOT / "Dev" / "TemplateFactory" / "modules" / "source_pipeline.yaml"


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
    if not isinstance(data.get("steps"), dict) or not data.get("steps"):
        fail(errors, f"{PIPELINE.relative_to(ROOT)}: steps mancante")
    return data


def validate_command(step_id: str, mode: str, command: Any, errors: list[str]) -> list[str]:
    if not isinstance(command, list) or not command:
        fail(errors, f"{PIPELINE.relative_to(ROOT)}: {step_id}.{mode} deve essere lista comando")
        return []
    normalized = [str(part) for part in command]
    script = normalized[1] if len(normalized) > 1 else ""
    if script and (script.endswith(".py") or script.endswith(".js")) and not (ROOT / script).exists():
        fail(errors, f"{PIPELINE.relative_to(ROOT)}: {step_id}.{mode} script mancante {script}")
    return normalized


def validate_pipeline(data: dict[str, Any], mode: str, errors: list[str]) -> list[tuple[str, list[str]]]:
    commands: list[tuple[str, list[str]]] = []
    steps = data.get("steps") if isinstance(data.get("steps"), dict) else {}
    no_repo_output_roots = set(data.get("policy", {}).get("no_repo_output_roots", []) or [])
    outputs_available_after_previous_steps: set[str] = set()

    def source_generated_by_previous_step(source: str) -> bool:
        for pattern in outputs_available_after_previous_steps:
            if fnmatch.fnmatch(source, pattern):
                return True
            if "/**/" in pattern and fnmatch.fnmatch(source, pattern.replace("/**/", "/")):
                return True
        return False

    for step_id, step in steps.items():
        if not isinstance(step, dict):
            fail(errors, f"{PIPELINE.relative_to(ROOT)}: step non valido {step_id}")
            continue
        for key in ("purpose", "sources", "outputs", "render", "check"):
            if key not in step:
                fail(errors, f"{PIPELINE.relative_to(ROOT)}: {step_id} senza {key}")
        release_only = step.get("release_only") is True
        for source in step.get("sources") or []:
            source_text = str(source)
            source_path = ROOT / source_text
            source_is_glob = any(char in source_text for char in "*?[]")
            generated_during_render = mode == "render" and source_generated_by_previous_step(source_text)
            if not source_is_glob and not source_path.exists() and not generated_during_render:
                generated_during_check = mode == "check" and source_generated_by_previous_step(source_text)
                if generated_during_check:
                    fail(
                        errors,
                        f"{PIPELINE.relative_to(ROOT)}: {step_id} source generato mancante {source}; eseguire npm run sync:sources",
                    )
                else:
                    fail(errors, f"{PIPELINE.relative_to(ROOT)}: {step_id} source mancante {source}")
        for output in step.get("outputs") or []:
            first = str(output).split("/", 1)[0]
            if first in no_repo_output_roots and not release_only:
                fail(errors, f"{PIPELINE.relative_to(ROOT)}: {step_id} output {first} richiede release_only")
        command = validate_command(step_id, mode, step.get(mode), errors)
        if release_only and mode == "render" and command and "--check" not in command:
            fail(errors, f"{PIPELINE.relative_to(ROOT)}: {step_id} release_only deve validare in memoria durante sync:sources")
        if command:
            commands.append((str(step_id), command))
        for output in step.get("outputs") or []:
            outputs_available_after_previous_steps.add(str(output))
    return commands


def run_commands(commands: list[tuple[str, list[str]]]) -> int:
    for step_id, command in commands:
        print(f"[source-pipeline] {step_id}: {' '.join(command)}", flush=True)
        result = subprocess.run(command, cwd=ROOT, text=True)
        if result.returncode != 0:
            return result.returncode
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Esegue la pipeline unica YAML/Jinja/codice -> output vault.")
    parser.add_argument("--mode", choices=["check", "render"], default="check")
    parser.add_argument("--list", action="store_true", help="Mostra gli step senza eseguirli.")
    args = parser.parse_args()

    errors: list[str] = []
    data = load_pipeline(errors)
    commands = validate_pipeline(data, args.mode, errors)

    if errors:
        print("Source pipeline non valida:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        if any("source generato mancante" in error for error in errors):
            print(
                "\nOutput generati assenti: esegui `npm run sync:sources` e poi ripeti `npm run check`.",
                file=sys.stderr,
            )
        return 1

    if args.list:
        for step_id, command in commands:
            print(f"{step_id}: {' '.join(command)}")
        return 0

    return run_commands(commands)


if __name__ == "__main__":
    raise SystemExit(main())
