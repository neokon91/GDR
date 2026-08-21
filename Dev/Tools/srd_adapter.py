"""SPIKE — adapter: mostro SRD di Compendio (archivio/srd/monsters/*.monster.yaml)
→ statblock GDR (formato Fantasy Statblocks). Prova che GDR DIGERISCE il modello dati
condiviso; è lo stesso ponte che servirà al motore di combattimento (→ Combattente).

Legge SOLO da `archivio/srd/` (submodule/symlink) — il sottoinsieme CC-BY condivisibile.
Uso: /usr/local/bin/python3.11 Dev/Tools/srd_adapter.py [nome-file-mostro]
"""
from __future__ import annotations

import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
SRD_MONSTERS = ROOT / "archivio" / "srd" / "monsters"

# Dado dei PG per taglia (media del dado vita) → PF = dadi_vita × media + mod_COS × dadi_vita.
_AVG_DIE = {"minuscola": 2.5, "piccola": 3.5, "media": 4.5,
            "grande": 5.5, "enorme": 6.5, "mastodontica": 10.5}
_ABIL = ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"]


def _mod(v: int) -> int:
    return (int(v) - 10) // 2


def _pf(m: dict) -> int:
    n = int(m.get("dadi_vita") or 1)
    avg = _AVG_DIE.get(str(m.get("taglia", "media")).lower(), 4.5)
    cos = ((m.get("caratteristiche") or {}).get("costituzione") or {}).get("valore", 10)
    return max(1, int(n * avg) + _mod(cos) * n)


def adatta(m: dict) -> dict:
    """Compendio-monster → dict statblock in campi Fantasy Statblocks."""
    car = m.get("caratteristiche") or {}
    stats = [int((car.get(a) or {}).get("valore", 10)) for a in _ABIL]
    saves = {a[:3]: _mod((car.get(a) or {}).get("valore", 10))
             for a in _ABIL if (car.get(a) or {}).get("competenza")}
    vel = m.get("velocita") or {}
    speed = ", ".join(f"{v} m{'' if k == 'camminata' else ' ('+k+')'}" for k, v in vel.items())
    sensi = m.get("sensi") or {}
    senses = ", ".join(f"{k.replace('_',' ')} {v} m" for k, v in sensi.items())
    if m.get("percezione_passiva"):
        senses += (", " if senses else "") + f"percezione passiva {m['percezione_passiva']}"
    return {
        "layout": "Basic 5e Layout",
        "name": m.get("nome", "?"),
        "size": m.get("taglia", ""),
        "type": m.get("tipo", "") + (f" ({m['gruppo']})" if m.get("gruppo") else ""),
        "alignment": m.get("allineamento", ""),
        "ac": (m.get("ca") or {}).get("valore", ""),
        "hp": _pf(m),
        "hit_dice": f"{m.get('dadi_vita')}d{int(_AVG_DIE.get(str(m.get('taglia','media')).lower(),4.5)*2)}",
        "speed": speed,
        "stats": stats,
        "saves": [saves] if saves else [],
        "skillsaves": m.get("competenza_abilita", []),
        "senses": senses,
        "languages": ", ".join(m.get("lingue", []) or []),
        "cr": m.get("gs", ""),
        "traits": [{"name": t.get("nome"), "desc": (t.get("testo") or "").strip()}
                   for t in (m.get("tratti") or [])],
        "actions": [{"name": a.get("nome"), "desc": (a.get("testo") or "").strip()}
                    for a in (m.get("azioni") or [])],
    }


def main() -> None:
    if not SRD_MONSTERS.is_dir():
        sys.exit(f"archivio/srd/monsters non trovato ({SRD_MONSTERS}). Manca il symlink/submodule 'archivio'?")
    arg = sys.argv[1] if len(sys.argv) > 1 else "granchio-gigante.monster.yaml"
    path = SRD_MONSTERS / (arg if arg.endswith(".yaml") else f"{arg}.monster.yaml")
    m = yaml.safe_load(path.read_text(encoding="utf-8"))
    sb = adatta(m)
    print(f"# {sb['name']} — adattato da archivio SRD → statblock GDR\n")
    print("```statblock")
    print(yaml.safe_dump(sb, allow_unicode=True, sort_keys=False).rstrip())
    print("```")
    n_mostri = len(list(SRD_MONSTERS.glob("*.monster.yaml")))
    print(f"\n[ok] {path.name} adattato · {n_mostri} mostri SRD disponibili nell'archivio condiviso.")


if __name__ == "__main__":
    main()
