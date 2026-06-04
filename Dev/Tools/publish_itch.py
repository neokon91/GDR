#!/usr/bin/env python3
"""Pubblica gli artefatti di release su itch.io via **butler** (la CLI ufficiale di
itch). Carica gli zip versionati prodotti da release.py sui canali di un progetto
itch già esistente.

Prerequisiti (una-tantum, lato utente):
  1. installa butler — https://itch.io/docs/butler/
  2. `butler login` (apre il browser, autentica col tuo account itch)
  3. crea il progetto su itch.io (tipo «Downloadable») e prendi nota di «utente/gioco»

Uso:  `npm run publish:itch`  (fa anche la build+zip).
Target itch da `config.itch` in package.json (es. "neokon91/gdr") o env `ITCH_TARGET`.
Niente credenziali in repo: butler usa la sua sessione locale (`butler login`)."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path

import common

# Canali itch → artefatto: il canale è l'etichetta della "release line" su itch.
CHANNELS = (("vault", "GDR-vault-v{ver}.zip"), ("site", "GDR-site-v{ver}.zip"))


def version() -> str:
    return json.loads((common.ROOT / "package.json").read_text(encoding="utf-8"))["version"]


def resolve_target() -> str:
    """Target itch «utente/gioco» da env ITCH_TARGET o package.json:config.itch."""
    env = os.environ.get("ITCH_TARGET", "").strip()
    if env:
        return env
    cfg = json.loads((common.ROOT / "package.json").read_text(encoding="utf-8"))
    return str((cfg.get("config") or {}).get("itch") or "").strip()


def main() -> int:
    target = resolve_target()
    if not target or "/" not in target:
        print("Target itch mancante o non valido (atteso «utente/gioco»).\n"
              "  Imposta `config.itch` in package.json (es. \"tuonome/gdr\") o l'env ITCH_TARGET.")
        return 1
    if not shutil.which("butler"):
        print("butler non trovato nel PATH.\n"
              "  Installa da https://itch.io/docs/butler/ e poi esegui `butler login`.")
        return 1

    ver = version()
    dist = common.ROOT / "dist"
    rc = 0
    pushed = 0
    for channel, pattern in CHANNELS:
        artifact = dist / pattern.format(ver=ver)
        if not artifact.is_file():
            print(f"  ⚠️  {artifact.name} assente — esegui prima `npm run dist`. Canale «{channel}» saltato.")
            continue
        dest = f"{target}:{channel}"
        print(f"butler push {artifact.name} → {dest}  (v{ver})")
        result = subprocess.run(["butler", "push", str(artifact), dest, "--userversion", ver])
        rc = rc or result.returncode
        if result.returncode == 0:
            pushed += 1
    if pushed and rc == 0:
        user, game = target.split("/", 1)
        print(f"\nFatto: {pushed} canale/i pubblicati. Pagina: https://{user}.itch.io/{game}")
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
