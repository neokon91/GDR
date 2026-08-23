"""Genera il BESTIARIO che il plugin `gdr` carica a runtime per la Board di combattimento.

Legge i mostri SRD dell'archivio condiviso (`archivio/srd/mostro/*.yaml`, il sottoinsieme
CC-BY) e ne scrive un unico JSON in `plugin/data/srd_bestiario.json`. Ogni mostro resta
nella sua forma GREZZA (`RawMostro`): è esattamente ciò che `regole` `daMostro()` digerisce
in un `Combattente` — lo YAML NON va appiattito (a differenza di uno statblock Fantasy
Statblocks, che è una proiezione lossy).

Transizione (come `gen_condizioni.py`): la cartella è passata da `srd/monsters/` a
`srd/mostro/` e i mostri migrano dal file unico `<slug>.monster.yaml` (legacy, senza id,
`generata: true`) al file qualificato `<slug>.yaml` (con `id: dnd.mostro.<slug>`). Si
leggono ENTRAMBE le forme; a parità di slug vince il file qualificato. L'id viene dal
frontmatter se presente, altrimenti dallo slug del file — coerente con la tolleranza del
lookup `trovaMostro` (plugin/statblock.ts).

Dato COMPLETO (non trimmato): oltre a ciò che serve al motore, la board mostra anche uno
STATBLOCK nativo (che sostituisce Fantasy Statblocks) → servono i campi di presentazione
(prosa `testo` di tratti/azioni, velocità, sensi, lingue, allineamento…). Il motore ignora
i campi extra; tenerli qui serve solo al rendering. È un sidecar caricato SOLO all'apertura
della board (main.js resta magro), quindi il peso in più non pesa sull'avvio.

`render.py:install_authored_plugins` copia `plugin/data/` nel vault. Rigenera dopo un
aggiornamento dell'archivio (o via `npm run gen:bestiario`, incluso nella build del plugin).

Uso: /usr/local/bin/python3.11 Dev/Tools/gen_bestiario.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import yaml

from srd_links import norm_ref, risolvi_wikilink

ROOT = Path(__file__).resolve().parents[2]
SRD_MONSTERS = ROOT / "archivio" / "srd" / "mostro"
OUT = ROOT / "plugin" / "data" / "srd_bestiario.json"


def _slug(nome_file: str) -> str:
    """Slug dal nome-file, indifferente alla forma: `arpia.monster.yaml`→`arpia`,
    `aboleth.yaml`→`aboleth`. È l'ULTIMO segmento dell'id qualificato `dnd.mostro.<slug>`."""
    return nome_file.removesuffix(".yaml").removesuffix(".monster")


def carica_mostri(src: Path) -> list[dict[str, Any]]:
    """Legge i mostri SRD da `src` (ordinati per slug). `glob("*.yaml")` prende ENTRAMBE
    le forme (il legacy `.monster.yaml` finisce in `.yaml`); a parità di slug il file
    qualificato (`<slug>.yaml`) vince sul legacy (`<slug>.monster.yaml`). L'id viene dal
    frontmatter se presente, altrimenti dallo slug — coerente con `trovaMostro`."""
    per_slug: dict[str, dict[str, Any]] = {}
    for f in sorted(src.glob("*.yaml")):
        slug = _slug(f.name)
        qualificato = not f.name.endswith(".monster.yaml")
        if slug in per_slug and not qualificato:
            continue  # un legacy non scavalca un qualificato già letto
        m = yaml.safe_load(f.read_text(encoding="utf-8"))
        # id = frontmatter.id ?? slug-da-filename. `daMostro` esige un id; i qualificati lo
        # dichiarano (`dnd.mostro.<slug>`), i legacy lo prendono dallo slug del file.
        m.setdefault("id", slug)
        per_slug[slug] = m
    return [per_slug[k] for k in sorted(per_slug)]


def indice_nomi(srd_root: Path) -> dict[str, str]:
    """Mappa `norm_ref(slug/id) -> Nome` su TUTTE le voci SRD dell'archivio (yaml + prosa .md),
    per risolvere i wikilink della prosa dei mostri (`[[incantesimi/costrizione]]` → `[[Costrizione]]`).
    Le pagine SRD del vault sono nominate per Nome; senza questo la prosa mostro avrebbe link rotti."""
    idx: dict[str, str] = {}

    def _reg(slug_file: str, m: dict[str, Any]) -> None:
        nome = m.get("nome")
        if not nome:
            return
        idx.setdefault(norm_ref(m.get("id") or slug_file), str(nome))
        idx.setdefault(norm_ref(slug_file), str(nome))

    for f in srd_root.rglob("*.yaml"):
        try:
            m = yaml.safe_load(f.read_text(encoding="utf-8"))
        except yaml.YAMLError:
            continue
        if isinstance(m, dict):
            _reg(f.name.split(".")[0], m)
    for f in srd_root.rglob("*.md"):
        if f.name.lower() == "readme.md":
            continue
        mm = re.match(r"^---\n(.*?)\n---", f.read_text(encoding="utf-8"), re.S)
        if not mm:
            continue
        try:
            fm = yaml.safe_load(mm.group(1))
        except yaml.YAMLError:
            continue
        if isinstance(fm, dict):
            _reg(f.name[:-3].split(".")[0], fm)
    return idx


def _risolvi_prosa(obj: Any, idx: dict[str, str]) -> Any:
    """Applica la risoluzione dei wikilink a OGNI stringa (ricorsiva su liste/dict): coglie la
    prosa di tratti/azioni/reazioni/leggendarie ovunque sia, senza dipendere dai nomi-campo."""
    if isinstance(obj, str):
        return risolvi_wikilink(obj, lambda t: idx.get(norm_ref(t)))
    if isinstance(obj, list):
        return [_risolvi_prosa(x, idx) for x in obj]
    if isinstance(obj, dict):
        return {k: _risolvi_prosa(v, idx) for k, v in obj.items()}
    return obj


def main() -> None:
    if not SRD_MONSTERS.is_dir():
        raise SystemExit(
            f"archivio/srd/mostro non trovato ({SRD_MONSTERS}). Manca il symlink/submodule 'archivio'?"
        )
    mostri = carica_mostri(SRD_MONSTERS)
    # Risolvi i wikilink della prosa (id/slug/path → Nome) contro l'indice dell'archivio SRD,
    # così lo statblock nativo li rende come link validi in Obsidian.
    idx = indice_nomi(SRD_MONSTERS.parent)
    mostri = [_risolvi_prosa(m, idx) for m in mostri]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(mostri, ensure_ascii=False), encoding="utf-8")
    kb = OUT.stat().st_size / 1024
    print(f"[ok] {len(mostri)} mostri SRD → {OUT.relative_to(ROOT)} ({kb:.0f} KB)")


if __name__ == "__main__":
    main()
