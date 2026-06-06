"""Catalogo armi dal SRD equipment (Weapon Mastery 2024): mappa nome→padronanza e
catalogo completo (danni/categoria/proprietà/padronanza) per views.renderAttacchi."""

from __future__ import annotations

from typing import Any

from build_srd import load_srd


def _weapon_mastery_map() -> dict[str, str]:
    """Mappa nome-arma -> padronanza (dal SRD equipment, chiave `padronanza`)."""
    out: dict[str, str] = {}
    for x in load_srd("srd_5_2_1_equipment.json"):
        if isinstance(x, dict) and str(x.get("tipo")) == "arma" and x.get("padronanza"):
            out[x["nome"]] = x["padronanza"]
    return out


def _weapon_catalog() -> dict[str, dict[str, Any]]:
    """Catalogo armi (dal SRD equipment): nome -> {danni, categoria, proprieta,
    padronanza}. Lo usa la scheda PG (views.renderAttacchi) per gli attacchi con
    maestria: caratteristica d'attacco (finesse/distanza), dado di danno ed effetto
    della padronanza, per ciascuna arma di cui il PG ha padronanza."""
    out: dict[str, dict[str, Any]] = {}
    for x in load_srd("srd_5_2_1_equipment.json"):
        if isinstance(x, dict) and str(x.get("tipo")) == "arma" and x.get("nome"):
            out[x["nome"]] = {
                "nome": x["nome"],
                "danni": x.get("danni", ""),
                "categoria": x.get("categoria", ""),
                "proprieta": x.get("proprieta", []) or [],
                "padronanza": x.get("padronanza", ""),
            }
    return out
