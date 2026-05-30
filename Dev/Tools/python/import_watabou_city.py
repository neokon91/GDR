#!/usr/bin/env python3

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from import_map_utils import parse_import_args, read_json_input, render_frontmatter, slugify, write_notes, yaml_quote

sys.dont_write_bytecode = True

ROOT = Path.cwd()
LUOGHI_DIR = ROOT / "Mondi" / "Luoghi"
MAPPE_DIR = ROOT / "Risorse" / "Mappe"


def usage() -> None:
    print('Uso: npm run import:watabou:city -- <file.json> [--world "Nome Mondo"] [--session "Sessione"] [--dry-run]')


def city_name(data: dict[str, Any], input_name: str) -> str:
    city = data.get("city") if isinstance(data.get("city"), dict) else {}
    info = data.get("info") if isinstance(data.get("info"), dict) else {}
    return str(data.get("name") or data.get("title") or city.get("name") or info.get("name") or Path(input_name).stem or "Citta Watabou").strip()


def first_number(*values: Any) -> Any:
    for value in values:
        try:
            number = float(value)
        except Exception:
            continue
        if number == number:
            return value
    return ""


def count_array(*values: Any) -> Any:
    for value in values:
        if isinstance(value, list):
            return len(value)
    return ""


def first_coordinate(data: dict[str, Any]) -> str:
    city = data.get("city") if isinstance(data.get("city"), dict) else {}
    point = data.get("center") or data.get("position") or data.get("coords") or data.get("coordinates") or city.get("center")
    if not isinstance(point, list) or len(point) < 2:
        return ""
    return ", ".join(f"{float(value):.6f}" for value in point[:2])


def session_list(session: str) -> str:
    return f"[[{session}]]" if session else ""


def render_city_place(data: dict[str, Any], input_name: str, world: str, session: str) -> str:
    name = city_name(data, input_name)
    city = data.get("city") if isinstance(data.get("city"), dict) else {}
    info = data.get("info") if isinstance(data.get("info"), dict) else {}
    wards = count_array(data.get("wards"), data.get("districts"), city.get("wards"), city.get("districts"))
    buildings = count_array(data.get("buildings"), data.get("houses"), city.get("buildings"))
    population = first_number(data.get("population"), info.get("population"), city.get("population"))
    map_link = f"[[{name} - Mappa]]"
    frontmatter = render_frontmatter(
        {
            "id": f"watabou-city-{slugify(name).lower().replace(' ', '-')}",
            "nome": yaml_quote(name),
            "categoria": "luogo",
            "fileClass": "luogo",
            "tipo": "insediamento",
            "sottotipo": "citta watabou",
            "stato": "bozza",
            "canonico": "false",
            "mondo": f"[[{world}]]" if world else "",
            "fonte": "watabou-city",
            "file_import": yaml_quote(input_name),
            "popolazione": population,
            "distretti": wards,
            "edifici": buildings,
            "coordinate": yaml_quote(first_coordinate(data)),
            "mappa": map_link,
            "mappe": f"[{map_link}]",
            "sessioni": f"[{session_list(session)}]" if session else "[]",
            "fazioni": "[]",
            "personaggi": "[]",
            "missioni": "[]",
            "segreti": "[]",
            "domande_aperte": "[]",
            "connessioni": f"[{map_link}]",
        }
    )
    return f"""{frontmatter}

# {name}

> [!luogo] Importato Da Watabou City
> Bozza di insediamento. Controlla nome, mondo, quartieri, poteri locali e collegamenti prima di renderla canonica.

## Uso Al Tavolo

> [!scena] Primo uso
>

## Dati Importati

```json
{json.dumps(data, ensure_ascii=False, indent=2)}
```
"""


def render_city_map(data: dict[str, Any], input_name: str, world: str, session: str) -> str:
    name = city_name(data, input_name)
    place_link = f"[[{name}]]"
    frontmatter = render_frontmatter(
        {
            "id": f"watabou-city-map-{slugify(name).lower().replace(' ', '-')}",
            "nome": yaml_quote(f"{name} - Mappa"),
            "categoria": "mappa",
            "tipo": "watabou city",
            "uso": "mappa insediamento",
            "stato": "bozza",
            "mondo": f"[[{world}]]" if world else "",
            "luogo": place_link,
            "luoghi": f"[{place_link}]",
            "fonte": "watabou-city",
            "file_import": yaml_quote(input_name),
            "sessioni": f"[{session_list(session)}]" if session else "[]",
            "coordinate": yaml_quote(first_coordinate(data)),
            "layer_mappa": "insediamenti",
            "tipo_mappa": "citta",
            "pubblico": "false",
            "player_safe": "",
            "segreto": "",
            "connessioni": f"[{place_link}]",
        }
    )
    return f"""{frontmatter}

# {name} - Mappa

> [!mappa] Importata Da Watabou City
> Collega qui PNG, fazioni, missioni e immagini/SVG esportati da Watabou.
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
        print("Formato non supportato: serve un JSON Watabou City.", file=sys.stderr)
        return 1

    place_result = write_notes(
        dry_run=args.dry_run,
        items=[data],
        out_dir=LUOGHI_DIR,
        target_name=lambda item, index: city_name(item, source["input_name"]),
        render_item=lambda item, index: render_city_place(item, source["input_name"], args.world, args.session),
    )
    map_result = write_notes(
        dry_run=args.dry_run,
        items=[data],
        out_dir=MAPPE_DIR,
        target_name=lambda item, index: f"{city_name(item, source['input_name'])} - Mappa",
        render_item=lambda item, index: render_city_map(item, source["input_name"], args.world, args.session),
    )
    created = place_result["created"] + map_result["created"]
    skipped = place_result["skipped"] + map_result["skipped"]
    label = "Import Watabou City simulato" if args.dry_run else "Import Watabou City completato"
    print(f"{label}: {created} note, {skipped} gia esistenti.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
