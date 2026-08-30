"""Genera il catalogo ARMI che il plugin `gdr` usa per dare ai PG i bottoni d'attacco nella Board.

Legge le armi SRD dell'archivio (`srd/equipaggiamento/armi/*.yaml`) e ne scrive un JSON
normalizzato in `plugin/data/srd_armi.json`. Il plugin (`loadArmi`) le usa, insieme alle armi
homebrew del vault (note `oggetto` con tipo=arma), per derivare l'azione d'attacco di un PG dalla
sua `padronanze_armi`: colpire = mod(caratteristica) + competenza, danni = dado + mod. Il DATO
(le armi) vive in archivio; qui c'è solo il meccanismo che lo normalizza per il motore.

Forma per arma: `{nome, dado, tipo_danno, proprieta:[...], distanza:bool, padronanza}`.
La caratteristica (Forza/Destrezza/finesse) e i numeri li calcola il plugin (parità 2024).

Uso: /usr/local/bin/python3.11 Dev/Tools/gen_armi.py
"""
from __future__ import annotations

import json
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
SRD = ROOT / "archivio" / "srd"
OUT = ROOT / "plugin" / "data" / "srd_armi.json"


def main() -> None:
    if not SRD.is_dir():
        raise SystemExit(f"archivio/srd non trovato ({SRD}).")
    files = sorted((SRD / "equipaggiamento" / "armi").glob("*.yaml"))
    armi: list[dict] = []
    for f in files:
        a = yaml.safe_load(f.read_text(encoding="utf-8"))
        if not isinstance(a, dict) or not a.get("nome"):
            continue
        # La chiave del tipo è incoerente nell'archivio: `categoria` o `tipo`.
        classe = str(a.get("categoria") or a.get("tipo") or "").lower()
        danno = a.get("danno") or {}
        proprieta = a.get("proprieta") or []
        if not isinstance(proprieta, list):
            proprieta = [str(proprieta)]
        armi.append({
            "nome": a["nome"],
            "dado": str(danno.get("dado") or ""),
            "tipo_danno": str(danno.get("tipo_danno") or ""),
            "proprieta": [str(p) for p in proprieta],
            "distanza": "distanza" in classe,
            "padronanza": str(a.get("padronanza") or ""),
        })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(armi, ensure_ascii=False), encoding="utf-8")
    print(f"[ok] {len(armi)} armi SRD → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
