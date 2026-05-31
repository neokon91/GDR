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

    classi: dict[str, Any] = {}
    for cls in load_srd("srd_5_2_1_classes.json"):
        comp = cls.get("competenze", {}) or {}
        classi[cls["id"]] = {
            "label": cls.get("nome", cls["id"]),
            "dado_vita": _hit_die(cls.get("dado_vita")),
            "tiri_salvezza": stats(cls.get("tiri_salvezza")),
            "caratteristica_primaria": stats(cls.get("caratteristica_primaria")),
            "abilita": parse_class_skills(comp.get("abilita", ""), all_skill_ids, label_to_id),
            "competenze_armi": comp.get("armi", ""),
            "competenze_armature": comp.get("armature", ""),
        }

    specie: dict[str, Any] = {}
    for sp in load_srd("srd_5_2_1_species.json"):
        specie[sp["id"]] = {
            "label": sp.get("nome", sp["id"]),
            "taglia": sp.get("taglia", ""),
            "velocita": _speed(sp.get("velocita")),
            "tratti": sp.get("tratti_sintesi", ""),
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
        "classi": classi,
        "specie": specie,
        "background": background,
        "talenti": talenti,
    }
