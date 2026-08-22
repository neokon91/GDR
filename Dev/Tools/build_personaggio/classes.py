"""Classi del rules-engine PG, dall'ARCHIVIO (forma strutturata: `tabella_progressione.
benefici` = righe per livello con privilegi-slug, slot_incantesimo, colonne-risorsa e
padronanza_armi; `competenze_abilita` = {quantita, scelte}; `privilegi` = prosa). Il pool
incantesimi si DERIVA dagli spell (`spell.classi`), non da una lista nella classe."""

from __future__ import annotations

import re
from typing import Any, Callable

from build_srd import load_srd

from ._helpers import _hit_die, _norm

# Slug-privilegio che valgono uno slot ASI (Aumento dei punteggi 4/8/12/16 + Dono epico 19).
_ASI_SLUGS = ("aumento-punteggi", "dono-epico")
# Colonna-risorsa archivio → chiave in pg_rules.risorse_classe (label/ricarica/icona).
_RISORSA_COL = {
    "numero_ira": "Ire", "punti_stregoneria": "Punti stregoneria", "concentrazione": "Concentrazione",
    "incanalare_divinita": "Incanalare divinità", "forma_selvatica": "Forma selvatica",
    "recuperare_energie": "Recuperare energie", "nemico_prescelto": "Nemico prescelto",
}


def _is_asi(privilegi: list[str]) -> bool:
    return any(any(a in str(p) for a in _ASI_SLUGS) for p in privilegi)


def _is_sub(privilegi: list[str]) -> bool:
    return any("sottoclasse" in str(p) for p in privilegi)


def _prog_row(row: dict[str, Any]) -> dict[str, Any]:
    """Riga di progressione archivio → {livello, competenza, privilegi(slug), trucchetti,
    preparati, slot, _raw}. La competenza segue la formula standard (non è in archivio)."""
    liv = row.get("livello")
    slot: dict[str, int] = {}
    for k, v in (row.get("slot_incantesimo") or {}).items():
        m = re.match(r"livello(\d+)", str(k))
        if m and v:
            slot[m.group(1)] = int(v)
    return {
        "livello": liv,
        "competenza": 2 + (int(liv) - 1) // 4 if liv else None,
        "privilegi": list(row.get("privilegi") or []),
        "trucchetti": row.get("trucchetti_conosciuti"),
        "preparati": row.get("incantesimi_preparati"),
        "slot": slot,
        "_raw": row,
    }


def _progressione(cls: dict[str, Any]) -> list[dict[str, Any]]:
    benefici = ((cls.get("tabella_progressione") or {}).get("benefici")) or []
    return [_prog_row(r) for r in benefici if isinstance(r, dict)]


def _caster_kind(cls: dict[str, Any], prog: list[dict[str, Any]]) -> str:
    """pieno/mezzo/patto/nessuno per la multiclasse. Il Warlock è 'patto' (slot a livello
    unico, ricarica breve): lo si riconosce per id."""
    if _id_nudo(cls) == "warlock":
        return "patto"
    top = max((int(k) for r in prog for k in (r.get("slot") or {})), default=0)
    if top >= 9:
        return "pieno"
    if 1 <= top <= 5:
        return "mezzo"
    return "nessuno"


def _id_nudo(cls: dict[str, Any]) -> str:
    return str(cls.get("id") or "").split(".")[-1]


def _armor_categories(armature: Any) -> list[str]:
    """Categorie di armatura indossabili dalle competenze_armature archivio (lista di slug/
    dict). Riconosce leggera/media/pesante/scudo."""
    testo = _norm(" ".join(str(x) for x in armature) if isinstance(armature, list) else str(armature))
    return [c for c, key in (("leggera", "legger"), ("media", "medi"),
                             ("pesante", "pesant"), ("scudo", "scud")) if key in testo]


def _competenze_str(v: Any) -> str:
    """competenze_armi/armature/strumenti dell'archivio (lista di slug e/o dict
    {categoria, proprieta}) → stringa leggibile (il frontmatter PG le vuole stringa)."""
    if isinstance(v, list):
        parts = [str(x.get("categoria", "")) if isinstance(x, dict) else str(x) for x in v]
        return ", ".join(_norm_dash(p) for p in parts if p)
    return _norm_dash(str(v or ""))


def _norm_dash(s: str) -> str:
    return s.replace("-", " ")


def _class_skills(comp_abilita: Any, all_skill_ids: list[str]) -> dict[str, Any]:
    """competenze_abilita {quantita, scelte:[slug]} → {scelte:N, opzioni:[id]} (slug→id per
    trattino→underscore). Senza elenco: tutte le abilità."""
    if isinstance(comp_abilita, dict) and comp_abilita.get("scelte"):
        opz = []
        for s in comp_abilita["scelte"]:
            sid = str(s).replace("-", "_")
            if sid in all_skill_ids and sid not in opz:
                opz.append(sid)
        return {"scelte": comp_abilita.get("quantita", 2), "opzioni": opz or list(all_skill_ids)}
    return {"scelte": 2, "opzioni": list(all_skill_ids)}


def _weapon_mastery_count(prog1: dict[str, Any]) -> int:
    """Padronanze d'armi al L1: dalla colonna `padronanza_armi` della riga L1 (Barbaro 2,
    Guerriero 3) o 2 se un privilegio L1 la concede (Ladro/Paladino/Ranger)."""
    col = (prog1.get("_raw") or {}).get("padronanza_armi")
    if col is not None:
        try:
            return int(col)
        except (TypeError, ValueError):
            pass
    if any("maestria-nelle-armi" in str(p) or "padronanza-armi" in str(p) for p in prog1.get("privilegi", [])):
        return 2
    return 0


def _class_resources(prog: list[dict[str, Any]], risorse_map: dict[str, Any]) -> list[dict[str, Any]]:
    """Risorse a ricarica dalle COLONNE-risorsa archivio (numero_ira, recuperare_energie…),
    mappate su pg_rules.risorse_classe → {id,label,ricarica,icona,valori:{livello:n}}."""
    out: list[dict[str, Any]] = []
    for col, pg_key in _RISORSA_COL.items():
        spec = risorse_map.get(pg_key)
        if not spec:
            continue
        valori = {}
        for r in prog:
            v = (r.get("_raw") or {}).get(col)
            if r.get("livello") and isinstance(v, (int, float)) and v:
                valori[r["livello"]] = int(v)
        if valori:
            out.append({"id": spec["id"], "label": spec.get("label", col),
                        "ricarica": spec.get("ricarica", "lungo"), "icona": spec.get("icona", ""),
                        "valori": valori})
    return out


def _spell_pool(class_id: str) -> dict[str, list[str]]:
    """Pool incantesimi della classe: derivato dagli spell (`spell.classi` contiene la
    classe) → {livello: [nomi]}. È la lista da cui il PG sceglie."""
    pool: dict[str, list[str]] = {}
    for sp in load_srd("srd_5_2_1_spells.json"):
        classi = [str(c).lower() for c in (sp.get("classi") or [])]
        if class_id in classi and sp.get("nome"):
            pool.setdefault(str(sp.get("livello", 0)), []).append(sp["nome"])
    for lvl in pool:
        pool[lvl].sort()
    return pool


def _pact_table(prog: list[dict[str, Any]]) -> list[dict[str, int]]:
    """Patto del Warlock: da ogni riga, {slot: numero slot, liv: livello degli slot} — gli
    slot del patto sono tutti dello stesso livello (il più alto disponibile)."""
    out = []
    for r in prog:
        slot = r.get("slot") or {}
        if slot:
            liv = max(int(k) for k in slot)
            out.append({"slot": int(slot[str(liv)]), "liv": liv})
        else:
            out.append({"slot": 0, "liv": 0})
    return out


def build_classes(pg_rules: dict[str, Any], stats: Callable[[Any], list[str]],
                  label_to_id: dict[str, str], all_skill_ids: list[str]) -> dict[str, Any]:
    """Opzioni-classe dall'archivio + overlay pg_rules (ricariche risorse)."""
    risorse_map = pg_rules.get("risorse_classe", {}) or {}
    classi: dict[str, Any] = {}
    for cls in load_srd("srd_5_2_1_classes.json"):
        cid = _id_nudo(cls)
        prog = _progressione(cls)
        prog1 = prog[0] if prog else {"privilegi": [], "slot": {}, "trucchetti": None, "preparati": None, "_raw": {}}
        incantatore = bool(prog1.get("slot") or prog1.get("trucchetti"))
        livelli_asi = [r["livello"] for r in prog if _is_asi(r["privilegi"])]
        sub_levels = [r["livello"] for r in prog if _is_sub(r["privilegi"])]
        tipo_inc = _caster_kind(cls, prog)
        classi[cid] = {
            "label": cls.get("nome", cid),
            "dado_vita": _hit_die(cls.get("dado_vita")),
            "tiri_salvezza": stats(cls.get("tiri_salvezza")),
            "caratteristica_primaria": stats(cls.get("caratteristica_primaria")),
            "abilita": _class_skills(cls.get("competenze_abilita"), all_skill_ids),
            "competenze_armi": _competenze_str(cls.get("competenze_armi")),
            "competenze_armature": _competenze_str(cls.get("competenze_armature")),
            "competenze_armature_cat": _armor_categories(cls.get("competenze_armature", "")),
            "competenze_strumenti": _competenze_str(cls.get("competenze_strumenti")),
            "equipaggiamento": {},
            "privilegi_l1": prog1["privilegi"],
            "incantatore": incantatore,
            "tipo_incantatore": tipo_inc,
            "trucchetti_noti": prog1.get("trucchetti"),
            "incantesimi_preparati": prog1.get("preparati"),
            "slot_l1": prog1.get("slot", {}),
            "incantesimi_pool": _spell_pool(cid) if incantatore else {},
            "progressione": prog,
            "sottoclasse": None,
            "livello_sottoclasse": sub_levels[0] if sub_levels else None,
            "livelli_asi": livelli_asi,
            "padronanza_armi": _weapon_mastery_count(prog1),
            "risorse": _class_resources(prog, risorse_map),
        }
        if tipo_inc == "patto":
            classi[cid]["pact"] = _pact_table(prog)

    for cid, spec in (pg_rules.get("risorse_caratteristica", {}) or {}).items():
        if cid in classi:
            classi[cid].setdefault("risorse", []).append({
                "id": spec["id"], "label": spec.get("label", spec["id"]),
                "ricarica": spec.get("ricarica", "lungo"),
                "ricarica_breve_da_livello": spec.get("ricarica_breve_da_livello"),
                "caratteristica": spec.get("caratteristica"),
                "icona": spec.get("icona", ""),
            })
    return classi
