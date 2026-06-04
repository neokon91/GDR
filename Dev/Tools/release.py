#!/usr/bin/env python3
"""Crea gli artefatti di release in dist/: il **vault Obsidian pronto all'uso**
(plugin inclusi → scompatti e «Apri cartella come vault») e il **sito dei
giocatori** statico, zippati e versionati (versione da package.json). Gli zip
restano in dist/ (gitignorato): si allegano a una GitHub release, non si committano.

Esclude lo stato locale dell'utente (workspace, cache, .DS_Store) così lo zip è
pulito e riproducibile. `python3 Dev/Tools/release.py` (o `npm run dist`)."""

from __future__ import annotations

import json
import subprocess
import sys
import zipfile
from pathlib import Path

import common
from build_site import SITE_OUT

# Stato locale/utente da NON spedire: layout dei pannelli, cache, file di sistema.
_EXCLUDE_NAMES = {".DS_Store", "workspace.json", "workspace-mobile.json",
                  "workspace.json.bak", "Thumbs.db"}
_EXCLUDE_DIR_PARTS = {".trash", ".git"}


def version() -> str:
    """Versione del progetto, da package.json (single source)."""
    return json.loads((common.ROOT / "package.json").read_text(encoding="utf-8"))["version"]


def _included(rel_parts: tuple[str, ...], name: str) -> bool:
    return name not in _EXCLUDE_NAMES and not (_EXCLUDE_DIR_PARTS & set(rel_parts))


def zip_tree(src: Path, zip_path: Path, arc_root: str) -> int:
    """Zippa `src` sotto la cartella-radice `arc_root` (così scompattando si ottiene
    una cartella sola). Salta lo stato locale. Ritorna il n. di file scritti."""
    count = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for path in sorted(src.rglob("*")):
            if not path.is_file():
                continue
            rel = path.relative_to(src)
            if not _included(rel.parts[:-1], path.name):
                continue
            z.write(path, f"{arc_root}/{rel.as_posix()}")
            count += 1
    return count


def build_artifacts() -> None:
    """Build pulita del vault + sito dei giocatori (via render.py CLI)."""
    render = str(common.ROOT / "Dev" / "Tools" / "render.py")
    subprocess.run([sys.executable, render], check=True)
    subprocess.run([sys.executable, render, "--site"], check=True)


def main() -> int:
    ver = version()
    build_artifacts()
    dist = common.ROOT / "dist"
    targets = [
        (common.VAULT, dist / f"GDR-vault-v{ver}.zip", "GDR-vault",
         "vault pronto: scompatta e «Apri cartella come vault» in Obsidian"),
        (SITE_OUT, dist / f"GDR-site-v{ver}.zip", "GDR-site",
         "sito dei giocatori statico: apri index.html o pubblicalo"),
    ]
    made: list[Path] = []
    print(f"Release v{ver}:")
    for src, zip_path, arc_root, desc in targets:
        if not src.is_dir():
            print(f"  ⚠️  {src.relative_to(common.ROOT)}/ assente — saltato.")
            continue
        n = zip_tree(src, zip_path, arc_root)
        mb = zip_path.stat().st_size / 1024 / 1024
        made.append(zip_path)
        print(f"  {zip_path.relative_to(common.ROOT)}  ({n} file, {mb:.1f} MB) — {desc}")
    if made:
        assets = " ".join(str(p.relative_to(common.ROOT)) for p in made)
        print(f"\nPer pubblicare:\n  gh release create v{ver} {assets} "
              f"--title \"GDR v{ver}\" --notes-file CHANGELOG.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
