"""Genera il BESTIARIO che il plugin `gdr` carica a runtime per la Board di combattimento.

Legge i mostri SRD dell'archivio condiviso (`archivio/srd/monsters/*.monster.yaml`, il
sottoinsieme CC-BY) e ne scrive un unico JSON in `plugin/data/srd_bestiario.json`. Ogni
mostro resta nella sua forma GREZZA (`RawMostro`): è esattamente ciò che `regole`
`daMostro()` digerisce in un `Combattente` — il .monster.yaml NON va appiattito (a
differenza di `srd_adapter.py`, che proietta uno statblock Fantasy Statblocks lossy).

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

import yaml

ROOT = Path(__file__).resolve().parents[2]
SRD_MONSTERS = ROOT / "archivio" / "srd" / "monsters"
OUT = ROOT / "plugin" / "data" / "srd_bestiario.json"


def main() -> None:
    if not SRD_MONSTERS.is_dir():
        raise SystemExit(
            f"archivio/srd/monsters non trovato ({SRD_MONSTERS}). Manca il symlink/submodule 'archivio'?"
        )
    files = sorted(SRD_MONSTERS.glob("*.monster.yaml"))
    mostri = []
    for f in files:
        m = yaml.safe_load(f.read_text(encoding="utf-8"))
        # id = frontmatter.id ?? slug-da-filename (convenzione archivio). `daMostro`
        # esige un id; solo ~11/334 lo dichiarano, gli altri lo prendono dal nome-file.
        m.setdefault("id", f.name.removesuffix(".monster.yaml"))
        mostri.append(m)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(mostri, ensure_ascii=False), encoding="utf-8")
    kb = OUT.stat().st_size / 1024
    print(f"[ok] {len(mostri)} mostri SRD → {OUT.relative_to(ROOT)} ({kb:.0f} KB)")


if __name__ == "__main__":
    main()
