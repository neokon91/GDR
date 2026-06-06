"""Specie del rules-engine PG: dal SRD species (taglia/velocità/tratti/sezioni)
alle opzioni-specie del personaggio."""

from __future__ import annotations

from typing import Any

from build_srd import load_srd

from ._helpers import _norm, _speed


def build_species() -> dict[str, Any]:
    """Opzioni-specie {id: {label, taglia, velocita, tratti, scurovisione, sezioni}}
    dal SRD species. Le `sezioni` strutturate alimentano views.renderSpecieTratti."""
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
    return specie
