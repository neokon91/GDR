"""Classi del rules-engine PG: parsing della progressione SRD (slot/competenza/
privilegi), scelte-abilità in prosa, equipaggiamento/armature, padronanza d'armi e
risorse di classe a ricarica → opzioni-classe del personaggio (build_classes)."""

from __future__ import annotations

import re
from typing import Any, Callable

from build_srd import load_srd

from ._helpers import _COUNT_WORDS, _hit_die, _int_or_none, _norm
from .spells import _pact_table, _spell_pool


def _caster_kind(cls: dict[str, Any], prog: list[dict[str, Any]]) -> str:
    """Tipo di incantatore per la multiclasse: 'patto' (Warlock, colonne SRD dedicate),
    'pieno' (slot fino al 9º), 'mezzo' (fino al 5º: Paladino/Ranger), 'nessuno'. Deriva
    dalla riga di L20 della progressione (niente hard-code)."""
    raw = cls.get("progressione") or []
    if any(isinstance(r, dict) and ("Slot incantesimo" in r or "Livello slot" in r) for r in raw):
        return "patto"
    last = prog[-1] if prog else {}
    top = max((int(k) for k in (last.get("slot") or {})), default=0)
    if top >= 9:
        return "pieno"
    if 1 <= top <= 5:
        return "mezzo"
    return "nessuno"


def _armor_categories(prose: str) -> list[str]:
    """Da 'Armature leggere, medie e pesanti; scudi.' -> categorie indossabili."""
    norm = _norm(prose)
    cats = [c for c, key in (("leggera", "legger"), ("media", "medi"),
                             ("pesante", "pesant"), ("scudo", "scud")) if key in norm]
    return cats


def _equipment_options(prose: str) -> dict[str, str]:
    """'A: ...; oppure B: ...' -> {'A': '...', 'B': '...'} (B opzionale)."""
    text = re.sub(r"\s+", " ", str(prose or "")).strip()
    if not text:
        return {}
    match = re.match(r"\s*A\s*:\s*(.*?)\s*(?:;?\s*oppure\s*|;\s*)B\s*:\s*(.*)", text, re.IGNORECASE)
    if match:
        return {"A": match.group(1).strip(" .;"), "B": match.group(2).strip(" .;")}
    return {"A": text.strip(" .;")}


_ASI_RE = re.compile(r"aumento dei punteggi", re.I)
_SUB_RE = re.compile(r"sottoclasse", re.I)


def _prog_row(row: dict[str, Any]) -> dict[str, Any]:
    """Una riga di progressione SRD -> {livello, competenza, privilegi, trucchetti,
    preparati, slot}."""
    row = row or {}
    privilegi = [p.strip() for p in re.split(r",|;", str(row.get("Privilegi di classe", ""))) if p.strip()]
    slot = {str(n): _int_or_none(row.get(f"Slot {n}")) for n in range(1, 10)}
    comp = re.sub(r"\D", "", str(row.get("Bonus di competenza", "")))
    return {
        "livello": _int_or_none(row.get("Livello")),
        "competenza": int(comp) if comp else None,
        "privilegi": privilegi,
        "trucchetti": _int_or_none(row.get("Trucchetti")),
        "preparati": _int_or_none(row.get("Incantesimi preparati")),
        "slot": {n: v for n, v in slot.items() if v},
    }


def _progressione(prog: list[Any]) -> list[dict[str, Any]]:
    """Tabella di progressione 1-20 normalizzata (lista di _prog_row)."""
    return [_prog_row(r) for r in (prog or []) if isinstance(r, dict)]


def _class_resources(raw_prog: list[Any], risorse_map: dict[str, Any]) -> list[dict[str, Any]]:
    """Risorse di classe a ricarica (Ki/Ira/Incanalare divinità/...) dalle COLONNE-risorsa
    della progressione SRD, mappate in pg_rules.risorse_classe (chiave = nome colonna). Per
    ogni colonna presente: {id, label, ricarica, icona, valori:{livello:n}} — i livelli col
    valore '-' (la classe non l'ha ancora) sono saltati. crea_pg/sali_pg ne derivano il max
    al livello del PG; renderRisorsePG le disegna; i riposi le azzerano."""
    rows = [r for r in (raw_prog or []) if isinstance(r, dict)]
    out: list[dict[str, Any]] = []
    for col, spec in (risorse_map or {}).items():
        valori = {}
        for r in rows:
            liv = _int_or_none(r.get("Livello"))
            n = _int_or_none(r.get(col))
            if liv and n is not None:
                valori[liv] = n
        if valori:
            out.append({
                "id": spec["id"],
                "label": spec.get("label", col),
                "ricarica": spec.get("ricarica", "lungo"),
                "icona": spec.get("icona", ""),
                "valori": valori,
            })
    return out


def parse_class_skills(prose: str, all_skill_ids: list[str], label_to_id: dict[str, str]) -> dict[str, Any]:
    """Da una frase SRD ('Due a scelta tra Atletica, Intimidire o ...') ricava
    {scelte: N, opzioni: [id...]}. Senza elenco esplicito -> tutte le 18 abilità."""
    norm = _norm(prose)
    tokens = norm.split()
    scelte = _COUNT_WORDS.get(tokens[0], 2) if tokens else 2

    opzioni: list[str] = []
    match = re.search(r"\b(?:tra|fra)\b(.*)", norm)
    if match:
        for piece in re.split(r",| o | e | oppure ", match.group(1)):
            sid = label_to_id.get(piece.strip(" .;:"))
            if sid and sid not in opzioni:
                opzioni.append(sid)
    if not opzioni:
        opzioni = list(all_skill_ids)
    return {"scelte": scelte, "opzioni": opzioni}


# --- Padronanza delle armi (Weapon Mastery 2024) ---------------------------
_MASTERY_RE = re.compile(r"adronanza d['’]armi", re.I)


def _weapon_mastery_count(cls: dict[str, Any], privilegi_l1: list[str], fallback: int) -> int:
    """Padronanze d'armi note al L1: dalla colonna di progressione se presente
    (Barbaro 2, Guerriero 3); altrimenti il fallback 2024 se la classe ha il
    privilegio L1 'Padronanza d'armi' (Ladro/Paladino/Ranger); altrimenti 0."""
    def walk(o: Any):
        if isinstance(o, dict):
            if str(o.get("Livello")) == "1":
                for k, v in o.items():
                    if _MASTERY_RE.search(k):
                        digits = re.sub(r"\D", "", str(v))
                        if digits:
                            return int(digits)
            for v in o.values():
                r = walk(v)
                if r is not None:
                    return r
        elif isinstance(o, list):
            for v in o:
                r = walk(v)
                if r is not None:
                    return r
        return None
    n = walk(cls)
    if n is not None:
        return n
    return fallback if any(_MASTERY_RE.search(p) for p in privilegi_l1) else 0


def build_classes(pg_rules: dict[str, Any], stats: Callable[[Any], list[str]],
                  label_to_id: dict[str, str], all_skill_ids: list[str]) -> dict[str, Any]:
    """Opzioni-classe dal SRD classes + overlay pg_rules. `stats` mappa i nomi-in-prosa
    sugli id di caratteristica (chiusura dall'orchestratore). Include le risorse a
    ricarica (dalle colonne SRD) e quelle il cui max = mod. di una caratteristica."""
    mastery_fallback = int(pg_rules.get("padronanza_armi_fallback", 2))
    risorse_map = pg_rules.get("risorse_classe", {}) or {}
    classi: dict[str, Any] = {}
    for cls in load_srd("srd_5_2_1_classes.json"):
        comp = cls.get("competenze", {}) or {}
        prog = _progressione(cls.get("progressione"))
        prog1 = prog[0] if prog else _prog_row({})
        incantatore = bool(prog1["slot"] or prog1["trucchetti"])
        sottoclasse_srd = cls.get("sottoclasse_srd")
        livelli_asi = [r["livello"] for r in prog if any(_ASI_RE.search(p) for p in r["privilegi"])]
        sub_levels = [r["livello"] for r in prog if any(_SUB_RE.search(p) for p in r["privilegi"])]
        classi[cls["id"]] = {
            "label": cls.get("nome", cls["id"]),
            "dado_vita": _hit_die(cls.get("dado_vita")),
            "tiri_salvezza": stats(cls.get("tiri_salvezza")),
            "caratteristica_primaria": stats(cls.get("caratteristica_primaria")),
            "abilita": parse_class_skills(comp.get("abilita", ""), all_skill_ids, label_to_id),
            "competenze_armi": comp.get("armi", ""),
            "competenze_armature": comp.get("armature", ""),
            "competenze_armature_cat": _armor_categories(comp.get("armature", "")),
            "competenze_strumenti": comp.get("strumenti", ""),
            "equipaggiamento": _equipment_options(cls.get("equipaggiamento_iniziale", "")),
            "privilegi_l1": prog1["privilegi"],
            "incantatore": incantatore,
            # Tipo di incantatore per la multiclasse (pieno/mezzo/patto/nessuno):
            # sali_pg lo usa per il livello-da-incantatore combinato e per il Patto.
            "tipo_incantatore": _caster_kind(cls, prog),
            "trucchetti_noti": prog1["trucchetti"],
            "incantesimi_preparati": prog1["preparati"],
            "slot_l1": prog1["slot"],
            "incantesimi_pool": _spell_pool(cls.get("liste_incantesimi")) if incantatore else {},
            # Progressione 2-20 (sali di livello interattivo):
            "progressione": prog,
            "sottoclasse": sottoclasse_srd.get("nome") if isinstance(sottoclasse_srd, dict) else None,
            "livello_sottoclasse": sub_levels[0] if sub_levels else None,
            "livelli_asi": livelli_asi,
            # Padronanze d'armi note al L1 (Weapon Mastery 2024): quante l'utente
            # ne sceglie in creazione (0 per le classi che non la ottengono).
            "padronanza_armi": _weapon_mastery_count(cls, prog1["privilegi"], mastery_fallback),
            # Risorse di classe a ricarica (Ki/Ira/Incanalare/...): valori per livello
            # dalle colonne SRD + ricarica curata (pg_rules). crea_pg/sali_pg → risorse_pg.
            "risorse": _class_resources(cls.get("progressione"), risorse_map),
        }
        # Patto del Warlock (slot SEPARATI dagli slot a livello, ricarica a riposo
        # breve): tabella 1-20 dalle colonne SRD dedicate. Solo per le classi-patto.
        if classi[cls["id"]]["tipo_incantatore"] == "patto":
            classi[cls["id"]]["pact"] = _pact_table(cls)

    # Risorse il cui max = mod. di una caratteristica (Ispirazione bardica = mod CAR):
    # non in tabella SRD → appese qui alla classe; crea_pg/sali_pg ne calcolano il max.
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
