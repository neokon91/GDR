"""Converter del rules-engine PG: fonde i JSON SRD (classi/specie/background/
talenti) con l'overlay curato pg_rules.yaml e produce le OPZIONI del personaggio
(z.automazioni/data/personaggio.json) che crea_personaggio.js legge a runtime.

Dove l'SRD è strutturato lo usa direttamente (dado vita, TS, abilità/ASI di
background); dove è in prosa (scelte-abilità di classe) lo PARSA in {scelte,
opzioni} mappando i nomi-in-prosa -> id abilità. Niente dati hard-coded di
regole qui se non l'overlay curato.

Pacchetto: l'orchestratore (build_personaggio_options) vive qui; i builder per
dominio in classes/species/backgrounds, il catalogo armi in equipment, gli
incantesimi in spells, gli helper condivisi in _helpers. API pubblica invariata:
`from build_personaggio import build_personaggio_options`."""

from __future__ import annotations

from typing import Any

from common import load_core, load_yaml

from ._helpers import _norm
from .backgrounds import build_backgrounds, build_feats
from .classes import build_classes
from .equipment import _weapon_catalog, _weapon_mastery_map
from .spells import _caster_slot_tables, _multiclass_slot_table
from .species import build_species

__all__ = ["build_personaggio_options"]


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

    classi = build_classes(pg_rules, stats, label_to_id, all_skill_ids)
    specie = build_species()
    background = build_backgrounds(stats, skills)
    talenti = build_feats()

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
        # Tabelle slot standard (pieno/mezzo) per i caster homebrew, dall'SRD.
        "slot_incantatore": _caster_slot_tables(classi),
        # Classi le cui SLOT ricaricano sul riposo BREVE (Patto del Warlock 2024):
        # crea_pg/sali_pg scrivono `slot_ricarica: breve`; riposo_breve azzera gli slot.
        "slot_ricarica_breve_classi": pg_rules.get("slot_ricarica_breve_classi", []) or [],
        # Multiclasse (2024, opzionale): prerequisiti RAW + competenze parziali per classe
        # (overlay curato). sali_pg li applica entrando in una nuova classe.
        "multiclasse": pg_rules.get("multiclasse", {}) or {},
        # Tabella SRD «Incantatore multiclasse» (slot 1-9 per livello-da-incantatore
        # COMBINATO): sali_pg la usa coi PG che hanno 2+ classi incantatrici.
        "slot_multiclasse": _multiclass_slot_table(),
        # Mappa nome-arma -> padronanza (Weapon Mastery 2024): crea_pg la usa per
        # offrire le armi alla scelta delle padronanze e per mostrarne l'effetto.
        "armi_padronanza": _weapon_mastery_map(),
        # Catalogo armi (danni/categoria/proprietà/padronanza): la scheda PG ne deriva
        # gli attacchi con maestria (views.renderAttacchi).
        "armi": _weapon_catalog(),
    }
