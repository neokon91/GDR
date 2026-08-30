"""Genera gli OGGETTI-EFFETTO che il plugin `gdr` carica per la Board (bottone «🎒 Equipaggia»).

Legge gli oggetti magici dell'archivio (`srd/magic_items/*.oggetto-magico.yaml`) che portano un
campo `effetti:` (o `attivita:`) — il contratto canonico degli Active Effect, lo STESSO di
oggetti/condizioni homebrew — e ne scrive un unico JSON in `plugin/data/srd_oggetti.json`. Il
plugin (`loadOggetti`) li fonde con gli oggetti homebrew del vault (`oggettiComplete`) e li rende
equipaggiabili: gli `effetti` MORDONO i tiri di chi li porta (via `risolviCondizioni`, come le
condizioni). Es. «Arma +1» → +1 a colpire e danno.

Solo le voci CON `effetti`/`attivita` finiscono nel bundle: gli oggetti solo-prosa restano fuori
(niente picker gonfio di no-op). L'id nasce dal nome-file (`oggetto:<slug>`) se assente. Il DATO
(quali item hanno quali effetti) vive in ARCHIVIO; qui c'è solo il meccanismo che lo raccoglie.

Sidecar caricato on-demand. `render.py:install_authored_plugins` copia `plugin/data/` nel vault.
Rigenera dopo un aggiornamento dell'archivio (o via `npm run gen:oggetti`, incluso nella build).

Uso: /usr/local/bin/python3.11 Dev/Tools/gen_oggetti.py
"""
from __future__ import annotations

import json
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
SRD = ROOT / "archivio" / "srd"
OUT = ROOT / "plugin" / "data" / "srd_oggetti.json"


def _slug(name: str) -> str:
    return name.strip().lower().replace(" ", "-")


def main() -> None:
    if not SRD.is_dir():
        raise SystemExit(f"archivio/srd non trovato ({SRD}). Manca il symlink/submodule 'archivio'?")
    files = sorted((SRD / "magic_items").glob("*.oggetto-magico.yaml"))
    per_id: dict[str, dict] = {}
    for f in files:
        o = yaml.safe_load(f.read_text(encoding="utf-8"))
        if not isinstance(o, dict):
            continue
        effetti = o.get("effetti")
        attivita = o.get("attivita")
        # Solo gli oggetti con meccanica: gli altri (solo prosa) non sono equipaggiabili.
        if not isinstance(effetti, list) and not isinstance(attivita, list):
            continue
        # L'id: dal file (magic_items non hanno `id`); `oggetto:<slug>` come l'homebrew.
        oid = str(o["id"]) if o.get("id") else f"oggetto:{_slug(f.name.split('.')[0])}"
        voce = {"id": oid, "nome": o.get("nome") or f.name.split(".")[0]}
        if isinstance(attivita, list):
            voce["attivita"] = attivita
        else:
            voce["effetti"] = effetti
        per_id[oid] = voce
    oggetti = list(per_id.values())
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(oggetti, ensure_ascii=False), encoding="utf-8")
    print(f"[ok] {len(oggetti)} oggetti-effetto SRD → {OUT.relative_to(ROOT)} (da {len(files)} magic_items)")


if __name__ == "__main__":
    main()
