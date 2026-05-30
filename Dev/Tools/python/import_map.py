#!/usr/bin/env python3

from __future__ import annotations

import sys
from typing import Callable

import import_azgaar_geojson
import import_watabou_city
import import_watabou_dungeon


COMMANDS: dict[str, Callable[[list[str] | None], int]] = {
    "azgaar": import_azgaar_geojson.main,
    "watabou-city": import_watabou_city.main,
    "city": import_watabou_city.main,
    "watabou-dungeon": import_watabou_dungeon.main,
    "dungeon": import_watabou_dungeon.main,
}


def usage() -> None:
    print(
        "\n".join(
            [
                "Uso: npm run import:map -- <azgaar|watabou-city|watabou-dungeon> <file> [opzioni]",
                "",
                "Esempi:",
                '  npm run import:map -- azgaar export.geojson --world "Mondo" --dry-run',
                '  npm run import:map -- watabou-city city.json --session "Sessione"',
                "  npm run import:map -- watabou-dungeon dungeon.json --dry-run",
            ]
        )
    )


def main(argv: list[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]
    kind = args[0] if args else ""
    command = COMMANDS.get(kind)
    if not command:
        usage()
        return 1
    return command(args[1:])


if __name__ == "__main__":
    raise SystemExit(main())
