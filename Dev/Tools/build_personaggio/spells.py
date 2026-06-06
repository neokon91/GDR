"""Incantesimi del rules-engine PG: pool per livello dalle liste SRD di classe
(_spell_pool) e tabelle slot standard (pieno/mezzo) per i caster homebrew
(_caster_slot_tables, derivate dall'SRD: niente hard-code)."""

from __future__ import annotations

from typing import Any

from build_srd import load_srd

from ._helpers import _int_or_none, _norm


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


def _multiclass_slot_table() -> list[dict[str, int]]:
    """Tabella SRD «Incantatore multiclasse: slot incantesimo 1-9» (regole 5.2.1) ->
    lista per livello-da-incantatore COMBINATO 1-20 di {'1':n, ..., '9':n} (gli slot
    '-' sono saltati). sali_pg la usa quando il PG ha 2+ classi incantatrici: somma
    i livelli (pieno ×1, mezzo ÷2 arrot. in difetto) e legge la riga corrispondente.
    Niente hard-code: i numeri vengono dal JSON SRD."""
    def find(node: Any) -> dict[str, Any] | None:
        if isinstance(node, dict):
            if str(node.get("titolo", "")).lower().startswith("incantatore multiclasse"):
                return node
            for value in node.values():
                hit = find(value)
                if hit:
                    return hit
        elif isinstance(node, list):
            for value in node:
                hit = find(value)
                if hit:
                    return hit
        return None

    rules: list[dict[str, int]] = []
    for doc in load_srd("srd_5_2_1_rules.json"):
        table = find(doc)
        if not table:
            continue
        for row in table.get("righe", []) or []:
            slot = {str(n): _int_or_none(row.get(f"Slot {n}")) for n in range(1, 10)}
            rules.append({n: v for n, v in slot.items() if v})
        break
    return rules


def _pact_table(cls: dict[str, Any]) -> list[dict[str, int]]:
    """Patto del Warlock dalle colonne SRD «Slot incantesimo» (quantità) e «Livello
    slot» (livello degli slot) della progressione warlock -> lista 1-20 di
    {slot, liv}. Il Patto è SEMPRE separato dagli slot a livello (ricarica a riposo
    breve); oggi il warlock non scriveva slot perché usa queste colonne, non «Slot N»."""
    out: list[dict[str, int]] = []
    for row in (cls.get("progressione") or []):
        if not isinstance(row, dict):
            continue
        out.append({
            "slot": _int_or_none(row.get("Slot incantesimo")) or 0,
            "liv": _int_or_none(row.get("Livello slot")) or 0,
        })
    return out


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
