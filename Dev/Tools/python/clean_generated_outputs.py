#!/usr/bin/env python3

from __future__ import annotations

import shutil
import sys
from pathlib import Path
from typing import Any

import yaml

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[3]
PIPELINE = ROOT / "Dev" / "Source" / "YAML" / "pipeline" / "source_pipeline.yaml"
OBSIDIAN_CONFIG = ROOT / "Dev" / "Source" / "YAML" / "json" / "obsidian_config.yaml"

GENERATED_DIRS = [
    "Dev/Build/template-previews",
    "Hub",
    "z.automazioni/data",
    "z.automazioni/templater",
    "z.bases",
    "z.fileclass",
    "z.modelli",
]

PRUNE_ROOTS = [
    ".obsidian",
    "Dev/Build",
    "Risorse",
    "z.automazioni",
]


def load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise SystemExit(f"{path.relative_to(ROOT)} mancante")
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        raise SystemExit(f"{path.relative_to(ROOT)}: root YAML non valida")
    return data


def is_glob(value: str) -> bool:
    return any(marker in value for marker in "*?[]")


def obsidian_config_targets() -> set[str]:
    source = load_yaml(OBSIDIAN_CONFIG)
    targets: set[str] = set()
    for item in source.get("configs") or []:
        if isinstance(item, dict) and item.get("target"):
            targets.add(str(item["target"]).replace("\\", "/"))
    return targets


def pipeline_file_outputs() -> set[Path]:
    pipeline = load_yaml(PIPELINE)
    outputs: set[str] = set()
    steps = pipeline.get("steps") if isinstance(pipeline.get("steps"), dict) else {}

    for step in steps.values():
        if not isinstance(step, dict):
            continue
        for output in step.get("outputs") or []:
            rel_path = str(output).replace("\\", "/")
            if rel_path == ".obsidian/**/*.json":
                outputs.update(obsidian_config_targets())
            elif rel_path == "memoria" or is_glob(rel_path):
                continue
            else:
                outputs.add(rel_path)

    return {ROOT / rel_path for rel_path in outputs}


def remove_file(path: Path, removed: list[str]) -> None:
    if path.exists() and path.is_file():
        path.unlink()
        removed.append(str(path.relative_to(ROOT)))


def remove_dir(path: Path, removed: list[str]) -> None:
    if path.exists() and path.is_dir():
        shutil.rmtree(path)
        removed.append(f"{path.relative_to(ROOT)}/")


def prune_empty(root: Path, removed: list[str]) -> None:
    if not root.exists() or not root.is_dir():
        return
    for path in sorted((item for item in root.rglob("*") if item.is_dir()), key=lambda item: len(item.parts), reverse=True):
        if not any(path.iterdir()):
            path.rmdir()
            removed.append(f"{path.relative_to(ROOT)}/")
    if root.exists() and root.is_dir() and not any(root.iterdir()):
        root.rmdir()
        removed.append(f"{root.relative_to(ROOT)}/")


def remove_pycache(removed: list[str]) -> None:
    for path in ROOT.rglob("__pycache__"):
        if ".git" in path.parts or "node_modules" in path.parts:
            continue
        remove_dir(path, removed)
    for pattern in ("*.pyc", "*.pyo"):
        for path in ROOT.rglob(pattern):
            if ".git" in path.parts or "node_modules" in path.parts:
                continue
            remove_file(path, removed)


def main() -> int:
    removed: list[str] = []

    for rel_dir in GENERATED_DIRS:
        remove_dir(ROOT / rel_dir, removed)

    for path in sorted(pipeline_file_outputs()):
        remove_file(path, removed)

    for rel_dir in PRUNE_ROOTS:
        prune_empty(ROOT / rel_dir, removed)

    remove_pycache(removed)

    if removed:
        print("Output generati rimossi:")
        for rel_path in sorted(set(removed)):
            print(f"- {rel_path}")
    else:
        print("Output generati gia assenti.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
