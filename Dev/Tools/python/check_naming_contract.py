#!/usr/bin/env python3

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path
from typing import Any

from template_factory_utils import ROOT, load_yaml

sys.dont_write_bytecode = True

CONTRACT = ROOT / "Dev" / "Source" / "YAML" / "quality" / "naming_contract.yaml"


def rel_path(path: Path) -> str:
    return str(path.relative_to(ROOT))


def normalize_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def git_files(args: list[str], errors: list[str]) -> list[str]:
    result = subprocess.run(
        ["git", *args],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode != 0:
        errors.append(f"git {' '.join(args)} fallito: {result.stderr.strip()}")
        return []
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def is_under_root(path_text: str, root: str) -> bool:
    normalized_root = root.rstrip("/")
    return path_text == normalized_root or path_text.startswith(f"{normalized_root}/")


def term_regex(term: dict[str, Any]) -> re.Pattern[str]:
    flags = 0 if term.get("case_insensitive") is False else re.IGNORECASE
    raw = re.escape(str(term.get("term") or ""))
    pattern = rf"\b{raw}\b" if term.get("match") == "word" else raw
    return re.compile(pattern, flags)


def main() -> int:
    errors: list[str] = []
    contract = load_yaml(CONTRACT)
    if contract.get("id") != "naming_contract":
        errors.append(f"{rel_path(CONTRACT)}: id non valido")

    policy = contract.get("policy") if isinstance(contract.get("policy"), dict) else {}
    scan_roots = normalize_list(policy.get("scan_roots"))
    text_extensions = set(normalize_list(policy.get("text_extensions")))
    allowed_historical_paths = set(normalize_list(policy.get("allowed_historical_paths")))
    forbidden_terms = policy.get("forbidden_active_terms") if isinstance(policy.get("forbidden_active_terms"), list) else []

    if not scan_roots:
        errors.append(f"{rel_path(CONTRACT)}: policy.scan_roots vuoto")
    if not text_extensions:
        errors.append(f"{rel_path(CONTRACT)}: policy.text_extensions vuoto")
    if not forbidden_terms:
        errors.append(f"{rel_path(CONTRACT)}: policy.forbidden_active_terms vuoto")

    files = set(git_files(["ls-files"], errors))
    files.update(git_files(["ls-files", "--others", "--exclude-standard"], errors))

    compiled_terms = [
        (term, term_regex(term))
        for term in forbidden_terms
        if isinstance(term, dict) and str(term.get("term") or "").strip()
    ]

    for path_text in sorted(files):
        full_path = ROOT / path_text
        if not full_path.exists() or not full_path.is_file():
            continue
        if not any(is_under_root(path_text, root) for root in scan_roots):
            continue
        if path_text in allowed_historical_paths:
            continue

        extension = full_path.suffix
        if path_text != "package.json" and extension not in text_extensions:
            continue

        for term, regex in compiled_terms:
            label = str(term.get("term") or "").strip()
            replacement = term.get("replacement") or "nome di dominio"
            if regex.search(path_text):
                errors.append(f"{path_text}: path contiene nome obsoleto ({label}); usare {replacement}")

        text = full_path.read_text(encoding="utf-8")
        for term, regex in compiled_terms:
            label = str(term.get("term") or "").strip()
            replacement = term.get("replacement") or "nome di dominio"
            for index, line in enumerate(text.splitlines(), start=1):
                if regex.search(line):
                    errors.append(f"{path_text}:{index}: nome obsoleto ({label}); usare {replacement}")

    if errors:
        print("Naming contract non valido:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Naming contract OK: {len(forbidden_terms)} termini legacy vietati fuori dai documenti storici.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
