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
    print('Uso: npm run import:azgaar -- <file.geojson> [--world "Nome Mondo"] [--dry-run]')


def properties(feature: dict[str, Any]) -> dict[str, Any]:
    props = feature.get("properties")
    return props if isinstance(props, dict) else {}


def geometry(feature: dict[str, Any]) -> dict[str, Any]:
    geom = feature.get("geometry")
    return geom if isinstance(geom, dict) else {}


def get_name(feature: dict[str, Any], index: int) -> str:
    props = properties(feature)
    return str(props.get("name") or props.get("Name") or props.get("NAME") or props.get("burg") or props.get("state") or props.get("label") or f"Luogo Azgaar {index + 1}")


def infer_type(feature: dict[str, Any]) -> str:
    props = properties(feature)
    raw = str(props.get("type") or props.get("Type") or props.get("kind") or props.get("layer") or props.get("featurecla") or "").lower()
    geom_type = str(geometry(feature).get("type") or "")
    if any(marker in raw for marker in ("burg", "town", "city", "settlement")):
        return "insediamento"
    if any(marker in raw for marker in ("state", "country", "province")):
        return "regione politica"
    if "culture" in raw:
        return "regione culturale"
    if "religion" in raw:
        return "regione religiosa"
    if "river" in raw:
        return "fiume"
    if "route" in raw or "road" in raw:
        return "rotta"
    if "Polygon" in geom_type:
        return "regione"
    if "Point" in geom_type:
        return "luogo"
    return "luogo"


def flatten_coords(coords: Any, acc: list[list[float]] | None = None) -> list[list[float]]:
    points = acc if acc is not None else []
    if not isinstance(coords, list):
        return points
    if len(coords) >= 2 and isinstance(coords[0], (int, float)) and isinstance(coords[1], (int, float)):
        points.append([float(coords[0]), float(coords[1])])
        return points
    for item in coords:
        flatten_coords(item, points)
    return points


def bbox(feature: dict[str, Any]) -> str:
    points = flatten_coords(geometry(feature).get("coordinates") or [])
    if not points:
        return ""
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return ", ".join(f"{value:.6f}" for value in [min(xs), min(ys), max(xs), max(ys)])


def first_point(feature: dict[str, Any]) -> str:
    points = flatten_coords(geometry(feature).get("coordinates") or [])
    return ", ".join(f"{value:.6f}" for value in points[0]) if points else ""


def note_body(feature: dict[str, Any], index: int, input_name: str, world: str) -> str:
    props = properties(feature)
    name = get_name(feature, index)
    item_type = infer_type(feature)
    id_source = props.get("id") or props.get("Id") or props.get("ID") or props.get("i") or index + 1
    frontmatter = render_frontmatter(
        {
            "id": f"azgaar-{slugify(name).lower().replace(' ', '-')}",
            "nome": yaml_quote(name),
            "categoria": "luogo",
            "tipo": yaml_quote(item_type),
            "stato": "bozza",
            "canonico": "false",
            "mondo": f"[[{world}]]" if world else "",
            "fonte": "azgaar",
            "file_import": yaml_quote(input_name),
            "azgaar_id": yaml_quote(id_source),
            "azgaar_layer": yaml_quote(props.get("layer") or props.get("type") or props.get("kind") or ""),
            "geometria": yaml_quote(geometry(feature).get("type") or ""),
            "coordinate": yaml_quote(first_point(feature)),
            "bbox": yaml_quote(bbox(feature)),
            "fazioni": "[]",
            "culture": "[]",
            "religioni": "[]",
            "personaggi": "[]",
            "missioni": "[]",
            "segreti": "[]",
            "domande_aperte": "[]",
        }
    )
    return f"""{frontmatter}

# {name}

> [!luogo] Importato Da Azgaar
> Questa nota e una bozza. Controlla nome, tipo, mondo e collegamenti prima di renderla canonica.

## Uso Nel Mondo

> [!scena] Perche e importante
>

## Dati Importati

```json
{json.dumps(props, ensure_ascii=False, indent=2)}
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
    if not isinstance(data, dict) or data.get("type") != "FeatureCollection" or not isinstance(data.get("features"), list):
        print("Formato non supportato: serve un GeoJSON FeatureCollection.", file=sys.stderr)
        return 1

    result = write_notes(
        dry_run=args.dry_run,
        items=data["features"],
        out_dir=OUT_DIR,
        target_name=get_name,
        render_item=lambda feature, index: note_body(feature, index, source["input_name"], args.world),
    )
    label = "Import simulato" if args.dry_run else "Import completato"
    print(f"{label}: {result['created']} note, {result['skipped']} gia esistenti.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
