"""Genera gli INCANTESIMI che il plugin `gdr` carica a runtime per la Board di combattimento.

Legge tutti gli `*.spell.yaml` dell'archivio condiviso (`srd/spells/`) e ne scrive un unico
JSON in `plugin/data/srd_incantesimi.json`. È il catalogo da cui il plugin costruisce il
`RisolviIncantesimo` che `regole` `daMostro(m, risolvi)` usa: quando una creatura ha un blocco
`incantatore` che referenzia un id (`a_volonta`, `al_giorno`, `slot`), il risolvi trova qui la
sua `attivita` e l'incantesimo diventa ESEGUIBILE (attacco/TS coi numeri del lanciatore), non
solo narrato. È il gemello incantesimi di `gen_bestiario.py`/`gen_condizioni.py`.

Si tengono i SOLI campi che servono al risolvi: `id`, `nome`, `livello`, `tempo_lancio`,
`concentrazione`, `attivita`. La prosa (descrizione, scaling narrativo, gittata…) resta
nell'archivio — qui conta la meccanica. Gli incantesimi senza `attivita` restano nel catalogo
comunque (nome + concentrazione): si lanciano NARRATI (il motore li logga, spende lo slot).

Sidecar caricato on-demand all'apertura della board. `render.py:install_authored_plugins`
copia `plugin/data/` nel vault. Rigenera dopo un aggiornamento dell'archivio (o via
`npm run gen:incantesimi`, incluso nella build del plugin).

Uso: /usr/local/bin/python3.11 Dev/Tools/gen_incantesimi.py
"""
from __future__ import annotations

import json
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
SRD = ROOT / "archivio" / "srd"
OUT = ROOT / "plugin" / "data" / "srd_incantesimi.json"

# I campi che il risolvi consuma (vedi RisolviIncantesimo in regole/combattente.ts).
CAMPI = ("nome", "livello", "tempo_lancio", "concentrazione", "attivita")


def main() -> None:
    if not SRD.is_dir():
        raise SystemExit(f"archivio/srd non trovato ({SRD}). Manca il symlink/submodule 'archivio'?")
    files = sorted(SRD.rglob("*.spell.yaml"))
    per_id: dict[str, dict] = {}
    con_attivita = 0
    for f in files:
        c = yaml.safe_load(f.read_text(encoding="utf-8"))
        if not isinstance(c, dict):
            continue
        # id dal campo, con ripiego sullo stem del nome-file (prima del primo punto).
        idn = c.get("id") or f.name.split(".")[0]
        voce = {"id": idn}
        for k in CAMPI:
            if k in c and c[k] is not None:
                voce[k] = c[k]
        if voce.get("attivita"):
            con_attivita += 1
        per_id[idn] = voce
    incantesimi = list(per_id.values())
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(incantesimi, ensure_ascii=False), encoding="utf-8")
    print(f"[ok] {len(incantesimi)} incantesimi SRD ({con_attivita} meccanizzati) → "
          f"{OUT.relative_to(ROOT)} (da {len(files)} file)")


if __name__ == "__main__":
    main()
