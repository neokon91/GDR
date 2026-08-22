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
from pathlib import Path
from typing import Any

import yaml

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


def main() -> None:
    if not SRD_MONSTERS.is_dir():
        raise SystemExit(
            f"archivio/srd/mostro non trovato ({SRD_MONSTERS}). Manca il symlink/submodule 'archivio'?"
        )
    mostri = carica_mostri(SRD_MONSTERS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(mostri, ensure_ascii=False), encoding="utf-8")
    kb = OUT.stat().st_size / 1024
    print(f"[ok] {len(mostri)} mostri SRD → {OUT.relative_to(ROOT)} ({kb:.0f} KB)")


if __name__ == "__main__":
    main()
