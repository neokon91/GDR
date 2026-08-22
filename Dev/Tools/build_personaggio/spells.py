"""Incantesimi del rules-engine PG: tabelle slot standard (pieno/mezzo/multiclasse),
DERIVATE dalle progressioni delle classi dell'archivio (niente hard-code, niente
tabella a parte). Il pool per livello di classe lo deriva `classes._spell_pool` dagli
spell (`spell.classi`)."""

from __future__ import annotations

from typing import Any


def _multiclass_slot_table(classi: dict[str, Any]) -> list[dict[str, int]]:
    """Tabella «Incantatore multiclasse: slot 1-9» = la progressione di un incantatore
    PIENO (identica in SRD 2024) → lista per livello-incantatore COMBINATO 1-20 di
    {'1':n,...}. Derivata dalle classi (niente tabella a parte in `regole`)."""
    for c in classi.values():
        prog = c.get("progressione") or []
        if len(prog) >= 20 and max((int(k) for k in (prog[19].get("slot") or {})), default=0) >= 9:
            return [r.get("slot", {}) for r in prog]
    return []


def _caster_slot_tables(classi: dict[str, Any]) -> dict[str, list[dict[str, int]]]:
    """Tabelle slot STANDARD per i caster HOMEBREW, derivate dall'SRD (niente
    hard-code): 'pieno' = una classe che arriva al 9º livello di slot, 'mezzo' = una
    che si ferma al 5º. Ogni tabella è la lista degli slot per livello PG (1-20).
    crea_pg/sali_pg le usano per i caster homebrew (tipo_incantatore pieno/mezzo)."""
    out: dict[str, list[dict[str, int]]] = {}
    for cid, c in classi.items():
        prog = c.get("progressione") or []
        if len(prog) < 20:
            continue
        top = max((int(k) for k in (prog[19].get("slot") or {})), default=0)
        if top >= 9 and "pieno" not in out:
            out["pieno"] = [r.get("slot", {}) for r in prog]
        elif top == 5 and "mezzo" not in out:
            out["mezzo"] = [r.get("slot", {}) for r in prog]
    return out
