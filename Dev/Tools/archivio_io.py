"""Lettura dell'ARCHIVIO: un punto solo per i generatori del plugin.

L'archivio ha due formati (come in Compendio, `lib/frontmatter.ts`): le ENTITÀ sono `.yaml`
(solo dati), le NOTE con prosa sono `.md` (frontmatter + corpo, che diventa `descrizione`).
Il TIPO si legge dall'id puntato `dnd.<tipo>.<slug>`, non dal nome del file.

Esiste perché ogni generatore globbava a modo suo i vecchi suffissi (`*.spell.yaml`,
`*.condition.yaml`, `*.oggetto-magico.yaml`): dopo le migrazioni dell'archivio di set 2026
leggevano 0 file e il plugin usciva senza condizioni, incantesimi né oggetti magici — con
la build verde. Ora un glob sbagliato non è possibile: si chiede un TIPO, non un nome-file.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import yaml

_NOTA = re.compile(r"^---\n(.*?)\n---\n?(.*)$", re.S)


def leggi(path: Path) -> dict[str, Any] | None:
    """Un file dell'archivio come dizionario: il `.yaml` intero, o il frontmatter di una nota
    `.md` col corpo in `descrizione` (se il frontmatter non ne ha già una)."""
    testo = path.read_text(encoding="utf-8")
    if path.suffix == ".md":
        m = _NOTA.match(testo)
        if not m:
            return None
        dati = yaml.safe_load(m.group(1))
        if not isinstance(dati, dict):
            return None
        corpo = m.group(2).strip()
        if corpo and not dati.get("descrizione"):
            dati["descrizione"] = corpo
        return dati
    dati = yaml.safe_load(testo)
    return dati if isinstance(dati, dict) else None


def voci(cartella: Path, tipo: str) -> list[tuple[Path, dict[str, Any]]]:
    """Le voci di un TIPO sotto `cartella` (ricorsivo), in ordine di percorso: `.yaml` e `.md`,
    riconosciute dall'id `dnd.<tipo>.…`. Un file illeggibile solleva: una voce che sparisce in
    silenzio è esattamente il difetto che questo modulo chiude."""
    prefisso = f"dnd.{tipo}."
    trovate = []
    for f in sorted([*cartella.rglob("*.yaml"), *cartella.rglob("*.md")]):
        if f.name.lower() == "readme.md":
            continue
        d = leggi(f)
        if d and str(d.get("id", "")).startswith(prefisso):
            trovate.append((f, d))
    return trovate
