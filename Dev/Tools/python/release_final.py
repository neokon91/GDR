#!/usr/bin/env python3

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

sys.dont_write_bytecode = True

ROOT = Path.cwd()


def run_step(label: str, command: list[str]) -> None:
    print(f"\n[release-final] {label}", flush=True)
    subprocess.run(command, cwd=ROOT, check=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera i sorgenti materializzati e crea la release finale.")
    parser.add_argument("--out", default="dist/vault-gdr-clean")
    parser.add_argument("--keep-generated", action="store_true")
    args = parser.parse_args()

    out = args.out.replace("\\", "/")
    default_out = out == "dist/vault-gdr-clean"
    if default_out:
        shutil.rmtree(ROOT / "dist", ignore_errors=True)

    exit_code = 0
    try:
        run_step(
            "Genera output YAML/Jinja",
            ["python3", "Dev/Tools/python/run_source_pipeline.py", "--mode", "render", "--outputs-only"],
        )
        run_step(
            "Crea vault release in dist",
            ["python3", "Dev/Tools/python/release_clean.py", "--out", args.out, "--quiet"],
        )
    except subprocess.CalledProcessError as error:
        exit_code = error.returncode or 1
    finally:
        if not args.keep_generated:
            try:
                run_step("Pulisci output generati dalla root", ["python3", "Dev/Tools/python/clean_generated_outputs.py"])
            except subprocess.CalledProcessError as error:
                exit_code = exit_code or error.returncode or 1

    if exit_code:
        return exit_code

    release_dir = ROOT / args.out
    zip_path = ROOT / f"{args.out}.zip"
    if not release_dir.exists():
        print(f"Release finale mancante: {args.out}", file=sys.stderr)
        return 1

    print(f"\nRelease finale pronta: {args.out}")
    if zip_path.exists():
        print(f"Zip finale pronto: {args.out}.zip")
    else:
        print("Zip finale non creato.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
