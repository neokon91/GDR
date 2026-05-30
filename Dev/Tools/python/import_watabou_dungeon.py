#!/usr/bin/env python3

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from import_map_utils import parse_import_args, read_json_input, render_frontmatter, slugify, write_notes, yaml_quote

sys.dont_write_bytecode = True

ROOT = Path.cwd()
OUT_DIR = ROOT / "Mondi" / "Luoghi"


def usage() -> None:
    print('Uso: npm run import:watabou:dungeon -- <file.json> [--world "Nome Mondo"] [--session "Sessione"] [--dry-run]')


def dungeon_name(data: dict[str, Any], input_name: str) -> str:
    dungeon = data.get("dungeon") if isinstance(data.get("dungeon"), dict) else {}
    info = data.get("info") if isinstance(data.get("info"), dict) else {}
    return str(data.get("name") or data.get("title") or dungeon.get("name") or info.get("name") or Path(input_name).stem or "Dungeon Watabou").strip()


def first_array(*values: Any) -> list[Any]:
    for value in values:
        if isinstance(value, list):
            return value
    return []


def rooms(data: dict[str, Any]) -> list[Any]:
    dungeon = data.get("dungeon") if isinstance(data.get("dungeon"), dict) else {}
    map_data = data.get("map") if isinstance(data.get("map"), dict) else {}
    levels = data.get("levels") if isinstance(data.get("levels"), list) else []
    first_level = levels[0] if levels and isinstance(levels[0], dict) else {}
    return first_array(data.get("rooms"), dungeon.get("rooms"), map_data.get("rooms"), first_level.get("rooms"))


def room_lines(data: dict[str, Any]) -> str:
    entries = rooms(data)
    if not entries:
        return "- Stanze non strutturate nel JSON o formato non riconosciuto."
    lines = []
    for index, room in enumerate(entries):
        if not isinstance(room, dict):
            lines.append(f"- {index + 1}: {room}")
            continue
        label = room.get("name") or room.get("title") or room.get("id") or room.get("number") or index + 1
        note = room.get("note") or room.get("notes") or room.get("description") or ""
        lines.append(f"- {label}{f': {note}' if note else ''}")
    return "\n".join(lines)


def session_list(session: str) -> str:
    return f"[[{session}]]" if session else ""


def render_dungeon(data: dict[str, Any], input_name: str, world: str, session: str) -> str:
    name = dungeon_name(data, input_name)
    room_count = len(rooms(data))
    frontmatter = render_frontmatter(
        {
            "id": f"watabou-dungeon-{slugify(name).lower().replace(' ', '-')}",
            "nome": yaml_quote(name),
            "categoria": "luogo",
            "fileClass": "luogo",
            "tipo": "dungeon",
            "sottotipo": "dungeon watabou",
            "stato": "bozza",
            "canonico": "false",
            "mondo": f"[[{world}]]" if world else "",
            "fonte": "watabou-dungeon",
            "file_import": yaml_quote(input_name),
            "stanze": room_count,
            "pericolo": "",
            "fazioni": "[]",
            "personaggi": "[]",
            "creature": "[]",
            "incontri": "[]",
            "missioni": "[]",
            "mappe": "[]",
            "sessioni": f"[{session_list(session)}]" if session else "[]",
            "segreti": "[]",
            "indizi": "[]",
            "ricompense": "[]",
            "domande_aperte": "[]",
            "connessioni": "[]",
        }
    )
    return f"""{frontmatter}

# {name}

> [!dungeon] Importato Da Watabou One Page Dungeon
> Bozza di dungeon. Trasforma stanze, indizi e pericoli in incontri o scene prima del tavolo.

## Stanze

{room_lines(data)}

## Incontri Da Preparare

- [ ] Definire almeno un incontro, trappola o scelta.

## Dati Importati

```json
{json.dumps(data, ensure_ascii=False, indent=2)}
```
"""


def main(argv: list[str] | None = None) -> int:
    args = parse_import_args(argv if argv is not None else sys.argv[1:])
    if not args.input:
        usage()
        return 1
    try:
        source = read_json_input(ROOT, args.input)
    except Exception as error:
        print(error, file=sys.stderr)
        return 1

    data = source["data"]
    if not isinstance(data, dict):
        print("Formato non supportato: serve un JSON Watabou Dungeon.", file=sys.stderr)
        return 1

    result = write_notes(
        dry_run=args.dry_run,
        items=[data],
        out_dir=OUT_DIR,
        target_name=lambda item, index: dungeon_name(item, source["input_name"]),
        render_item=lambda item, index: render_dungeon(item, source["input_name"], args.world, args.session),
    )
    label = "Import Watabou Dungeon simulato" if args.dry_run else "Import Watabou Dungeon completato"
    print(f"{label}: {result['created']} note, {result['skipped']} gia esistenti.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
