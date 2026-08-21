"""Genera il BESTIARIO che il plugin `gdr` carica a runtime per la Board di combattimento.

Legge i mostri SRD dell'archivio condiviso (`archivio/srd/monsters/*.monster.yaml`, il
sottoinsieme CC-BY) e ne scrive un unico JSON in `plugin/data/srd_bestiario.json`. Ogni
mostro resta nella sua forma GREZZA (`RawMostro`): è esattamente ciò che `regole`
`daMostro()` digerisce in un `Combattente` — il .monster.yaml NON va appiattito (a
differenza di `srd_adapter.py`, che proietta uno statblock Fantasy Statblocks lossy per il
solo rendering). Qui si tolgono solo i campi di PURA PROSA/testata che il motore non usa
(`testo` delle voci, descrizione, velocità, sensi, lingue, allineamento…): il taglio è
motore-equivalente (verificato: 0 differenze sul Combattente prodotto, su tutti i 334).

Sidecar, non inline: il file sta accanto a main.js e il plugin lo legge SOLO quando la
board si apre (main.js resta magro). `render.py:install_authored_plugins` copia `plugin/data/`
nel vault. Rigenera dopo un aggiornamento dell'archivio.

Uso: /usr/local/bin/python3.11 Dev/Tools/gen_bestiario.py
"""
from __future__ import annotations

import json
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
SRD_MONSTERS = ROOT / "archivio" / "srd" / "monsters"
OUT = ROOT / "plugin" / "data" / "srd_bestiario.json"

# Campi di sola presentazione: il motore (`daMostro`) non li legge. Toglierli
# alleggerisce il bundle senza cambiare un solo Combattente prodotto.
_DROP = {
    "descrizione", "fonte", "velocita", "sensi", "lingue", "percezione_passiva",
    "allineamento", "gruppo", "tipo", "ambienti", "immagine", "note",
}
# Dentro le voci-azione la prosa narrativa (`testo`) è display: le `attivita`
# strutturate — quelle sì che servono — restano.
_VOCI = ("azioni", "tratti", "reazioni", "azioni_leggendarie")


def _strip_voce(v: dict) -> dict:
    return {k: val for k, val in v.items() if k != "testo"}


def _trim(m: dict) -> dict:
    o = {k: val for k, val in m.items() if k not in _DROP}
    for key in _VOCI:
        if isinstance(o.get(key), list):
            o[key] = [_strip_voce(v) for v in o[key]]
    return o


def main() -> None:
    if not SRD_MONSTERS.is_dir():
        raise SystemExit(
            f"archivio/srd/monsters non trovato ({SRD_MONSTERS}). Manca il symlink/submodule 'archivio'?"
        )
    files = sorted(SRD_MONSTERS.glob("*.monster.yaml"))
    mostri = []
    for f in files:
        m = _trim(yaml.safe_load(f.read_text(encoding="utf-8")))
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
