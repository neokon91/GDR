from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable


@dataclass
class ImportArgs:
    input: str = ""
    world: str = ""
    session: str = ""
    dry_run: bool = False


def parse_import_args(argv: list[str]) -> ImportArgs:
    args = ImportArgs()
    index = 0
    while index < len(argv):
        arg = argv[index]
        if arg == "--world":
            args.world = argv[index + 1] if index + 1 < len(argv) else ""
            index += 2
        elif arg == "--session":
            args.session = argv[index + 1] if index + 1 < len(argv) else ""
            index += 2
        elif arg == "--dry-run":
            args.dry_run = True
            index += 1
        elif not args.input:
            args.input = arg
            index += 1
        else:
            index += 1
    return args


def slugify(value: Any) -> str:
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    text = re.sub(r'[\\/:*?"<>|]', "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def yaml_quote(value: Any) -> str:
    return json.dumps(str(value or ""), ensure_ascii=False)


def render_frontmatter(values: dict[str, Any]) -> str:
    return "---\n" + "\n".join(f"{key}: {value}" for key, value in values.items()) + "\n---\n"


def read_json_input(root: Path, input_path: str) -> dict[str, Any]:
    path = (root / input_path).resolve()
    if not path.exists():
        raise FileNotFoundError(f"File non trovato: {input_path}")
    return {
        "input_path": path,
        "input_name": path.name,
        "data": json.loads(path.read_text(encoding="utf-8")),
    }


def write_notes(
    *,
    dry_run: bool,
    items: list[Any],
    out_dir: Path,
    target_name: Callable[[Any, int], str],
    render_item: Callable[[Any, int], str],
) -> dict[str, int]:
    if not dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)

    created = 0
    skipped = 0
    for index, item in enumerate(items):
        filename = f"{slugify(target_name(item, index))}.md"
        target = out_dir / filename
        if target.exists():
            skipped += 1
            continue
        if not dry_run:
            target.write_text(render_item(item, index), encoding="utf-8")
        created += 1
    return {"created": created, "skipped": skipped}
