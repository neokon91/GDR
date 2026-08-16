"""Background e talenti del rules-engine PG: dal SRD backgrounds (ASI/talento
d'origine/competenze) e feats (con `categoria` per il gating ai talenti)."""

from __future__ import annotations

from typing import Any, Callable

from build_srd import load_srd

from ._helpers import _slug


def build_backgrounds(stats: Callable[[Any], list[str]],
                      skills: Callable[[Any], list[str]]) -> dict[str, Any]:
    """Opzioni-background {id: {label, punteggi_caratteristica, talento_origine,
    competenze_abilita, strumenti}}. `stats`/`skills` mappano i nomi-in-prosa SRD
    sugli id di caratteristica/abilità del modello (chiusure passate dall'orchestratore)."""
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
    return background


def build_feats(feat_spells: dict[str, Any] | None = None) -> dict[str, Any]:
    """Talenti {slug: {label, categoria[, incantesimi]}} dal SRD feats. La `categoria`
    (Origini / Generale / Stile di combattimento / Dono epico) serve al gating dei talenti a
    un ASI (sali_pg.talentoAmmesso): solo i Generali, e i Doni epici dal 19. `feat_spells`
    (overlay pg_rules.talenti_incantesimi, chiave = slug) aggiunge `incantesimi`
    ({trucchetti, incantesimi, liste}) ai talenti che concedono incantesimi (Iniziato alla
    magia): crea_pg.scegliIncantesimiTalenti lo legge per guidare la scelta."""
    feat_spells = feat_spells or {}
    talenti: dict[str, Any] = {}
    for f in load_srd("srd_5_2_1_feats.json"):
        if not f.get("nome"):
            continue
        slug = _slug(f.get("nome"))
        entry: dict[str, Any] = {"label": f.get("nome", ""), "categoria": f.get("categoria", "")}
        if slug in feat_spells:
            entry["incantesimi"] = feat_spells[slug]
        talenti[slug] = entry
    return talenti
