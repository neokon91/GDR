#!/usr/bin/env python3
"""Converter del rules-engine PG: fonde i JSON SRD (classi/specie/background/
talenti) con l'overlay curato pg_rules.yaml e produce le OPZIONI del personaggio
(z.automazioni/data/personaggio.json) che crea_personaggio.js legge a runtime.

Dove l'SRD è strutturato lo usa direttamente (dado vita, TS, abilità/ASI di
background); dove è in prosa (scelte-abilità di classe) lo PARSA in {scelte,
opzioni} mappando i nomi-in-prosa -> id abilità. Niente dati hard-coded di
regole qui se non l'overlay curato."""

from __future__ import annotations

import re
import unicodedata
from typing import Any

from build_srd import load_srd
from common import load_core, load_yaml

# Parole-numero italiane per "N a scelta".
_COUNT_WORDS = {"una": 1, "uno": 1, "due": 2, "tre": 3, "quattro": 4, "cinque": 5}


def _norm(value: Any) -> str:
    """Minuscolo, senza accenti, spazi normalizzati: per confronti robusti fra i
    nomi-in-prosa SRD e le label dell'overlay."""
    text = unicodedata.normalize("NFD", str(value or ""))
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", text).strip().lower()


def _slug(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "_", _norm(value)).strip("_") or "voce"


def _hit_die(value: Any) -> int:
    """'D12' -> 12; valore non parsabile -> 8 (default 5e)."""
    digits = re.sub(r"\D", "", str(value or ""))
    return int(digits) if digits else 8


def _speed(value: Any) -> int:
    """'9 m' / '10' -> 9 / 10; default 9."""
    match = re.search(r"\d+", str(value or ""))
    return int(match.group()) if match else 9


def _int_or_none(value: Any) -> int | None:
    s = str(value if value is not None else "").strip()
    return int(s) if s.isdigit() else None


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


def _spell_pool(liste: list[Any]) -> dict[str, list[str]]:
    """Da liste_incantesimi -> pool per livello {'0': [trucchetti], '1': [...], ...,
    '9': [...]} (ordinati). '0' = trucchetti; serve alla selezione incantesimi a
    ogni livello (creazione + sali di livello)."""
    pool: dict[str, list[str]] = {}
    for lista in liste or []:
        for riga in lista.get("righe", []) or []:
            liv = _norm(riga.get("Livello"))
            nome = str(riga.get("Incantesimo", "")).strip()
            if not nome:
                continue
            key = "0" if liv.startswith("trucch") else (liv if liv.isdigit() else None)
            if key is None:
                continue
            pool.setdefault(key, [])
            if nome not in pool[key]:
                pool[key].append(nome)
    return {k: sorted(v) for k, v in pool.items()}


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


def _weapon_mastery_map() -> dict[str, str]:
    """Mappa nome-arma -> padronanza (dal SRD equipment, chiave `padronanza`)."""
    out: dict[str, str] = {}
    for x in load_srd("srd_5_2_1_equipment.json"):
        if isinstance(x, dict) and str(x.get("tipo")) == "arma" and x.get("padronanza"):
            out[x["nome"]] = x["padronanza"]
    return out


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


def build_personaggio_options(core: dict[str, Any] | None = None) -> dict[str, Any]:
    """Costruisce il dizionario di opzioni PG (da scrivere in personaggio.json).
    SRD assente -> classi/specie/background vuoti (rules-engine degradato)."""
    core = core if core is not None else load_core()
    pg_rules = load_yaml("pg_rules.yaml")

    car_ids = [c["id"] for c in core.get("caratteristiche", []) or []]
    name_to_stat = {_norm(cid): cid for cid in car_ids}
    abilita = core.get("abilita", {}) or {}
    label_to_id = {_norm(spec.get("label")): aid for aid, spec in abilita.items()}
    all_skill_ids = list(abilita.keys())

    def stats(names: Any) -> list[str]:
        return [name_to_stat[_norm(n)] for n in (names or []) if _norm(n) in name_to_stat]

    def skills(names: Any) -> list[str]:
        return [label_to_id[_norm(n)] for n in (names or []) if _norm(n) in label_to_id]

    mastery_fallback = int(pg_rules.get("padronanza_armi_fallback", 2))
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
        }

    specie: dict[str, Any] = {}
    for sp in load_srd("srd_5_2_1_species.json"):
        tratti = sp.get("tratti_sintesi", "")
        specie[sp["id"]] = {
            "label": sp.get("nome", sp["id"]),
            "taglia": sp.get("taglia", ""),
            "velocita": _speed(sp.get("velocita")),
            "tratti": tratti,
            "scurovisione": "scurovision" in _norm(tratti),
            # Sezioni SRD strutturate (descrizioni + tabelle: soffio, antenati
            # draconici...): la scheda PG (views.renderSpecieTratti) ne mostra i
            # dettagli giocabili senza saltare alla nota SRD.
            "sezioni": sp.get("sezioni", []) or [],
        }

    background: dict[str, Any] = {}
    for bg in load_srd("srd_5_2_1_backgrounds.json"):
        comp = bg.get("competenze", {}) or {}
        background[bg["id"]] = {
            "label": bg.get("nome", bg["id"]),
            "punteggi_caratteristica": stats(bg.get("punteggi_caratteristica")),
            "talento_origine": bg.get("talento_origine", ""),
            "competenze_abilita": skills(comp.get("abilita")),
            "strumenti": comp.get("strumenti", ""),
        }

    talenti = {_slug(f.get("nome")): {"label": f.get("nome", "")}
               for f in load_srd("srd_5_2_1_feats.json") if f.get("nome")}

    return {
        "caratteristiche": car_ids,
        "abilita": abilita,
        "generazione_caratteristiche": pg_rules.get("generazione_caratteristiche", {}),
        "aumento_background": pg_rules.get("aumento_background", {}),
        "armature": pg_rules.get("armature", {}),
        "lingue": pg_rules.get("lingue", {}),
        "classi": classi,
        "specie": specie,
        "background": background,
        "talenti": talenti,
        # Mappa nome-arma -> padronanza (Weapon Mastery 2024): crea_pg la usa per
        # offrire le armi alla scelta delle padronanze e per mostrarne l'effetto.
        "armi_padronanza": _weapon_mastery_map(),
    }
