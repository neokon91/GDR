"""Genera le CONDIZIONI che il plugin `gdr` carica a runtime per la Board di combattimento.

Legge tutte le `*.condition.yaml` dell'archivio condiviso (oggi in `srd/rules_glossary/`) e
ne scrive un unico JSON in `plugin/data/srd_condizioni.json`. Sono le stesse condizioni che
`regole` `risolviCondizioni()` traduce in `DefinizioniCondizioni` (i `defs` che il motore
applica ai tiri: prono→svantaggio, afferrato→velocità 0, avvelenato→svantaggio, ecc.).

Restano in forma GREZZA: `{id, nome, attivita:[{tipo:passivo, effetti:[…]}], effetti:[…prosa]}`.
Sidecar caricato on-demand all'apertura della board. `render.py:install_authored_plugins`
copia `plugin/data/` nel vault. Rigenera dopo un aggiornamento dell'archivio (o via
`npm run gen:condizioni`, incluso nella build del plugin).

Uso: /usr/local/bin/python3.11 Dev/Tools/gen_condizioni.py
"""
from __future__ import annotations

import json
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
SRD = ROOT / "archivio" / "srd"
OUT = ROOT / "plugin" / "data" / "srd_condizioni.json"


def main() -> None:
    if not SRD.is_dir():
        raise SystemExit(f"archivio/srd non trovato ({SRD}). Manca il symlink/submodule 'archivio'?")
    files = sorted(SRD.rglob("*.condition.yaml"))
    condizioni = [yaml.safe_load(f.read_text(encoding="utf-8")) for f in files]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(condizioni, ensure_ascii=False), encoding="utf-8")
    print(f"[ok] {len(condizioni)} condizioni SRD → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
