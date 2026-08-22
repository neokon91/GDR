"""Catalogo armi dall'archivio (Weapon Mastery 2024): mappa nome→padronanza e catalogo
completo (danni/categoria/proprietà/padronanza) per views.renderAttacchi. Un'arma è una
voce di equipaggiamento con un blocco `danno` ({dado, tipo_danno})."""

from __future__ import annotations

from typing import Any

from build_srd import load_srd


def _e_arma(x: Any) -> bool:
    return isinstance(x, dict) and isinstance(x.get("danno"), dict) and x["danno"].get("dado")


def _padronanza(x: dict[str, Any]) -> str:
    return str(x.get("padronanza") or "").replace("-", " ").strip().capitalize()


def _danni(x: dict[str, Any]) -> str:
    """`{dado: d6, tipo_danno: contundente}` → "1d6 contundente" (il '1' serve al parser
    danniArma di renderAttacchi, che cerca \\d+d\\d+)."""
    dado = str((x.get("danno") or {}).get("dado") or "").lstrip("dD")
    tipo = str((x.get("danno") or {}).get("tipo_danno") or "").replace("-", " ").strip()
    return f"1d{dado} {tipo}".strip() if dado else ""


def _categoria(x: dict[str, Any]) -> str:
    """Da `tipo` compatto (`arma-distanza-semplice`) → "Distanza semplice" (renderAttacchi
    cerca /distanza/ per la caratteristica d'attacco). tipo assente → "" (dato archivio)."""
    t = str(x.get("tipo") or "").replace("arma-", "", 1).replace("-", " ").strip()
    return t.capitalize()


def _weapon_mastery_map() -> dict[str, str]:
    """Mappa nome-arma -> padronanza (dalle armi dell'archivio)."""
    return {x["nome"]: _padronanza(x) for x in load_srd("srd_5_2_1_equipment.json")
            if _e_arma(x) and x.get("nome") and x.get("padronanza")}


def _weapon_catalog() -> dict[str, dict[str, Any]]:
    """Catalogo armi (dall'archivio): nome -> {danni, categoria, proprieta, padronanza}.
    Lo usa la scheda PG (views.renderAttacchi) per gli attacchi con maestria."""
    out: dict[str, dict[str, Any]] = {}
    for x in load_srd("srd_5_2_1_equipment.json"):
        if not (_e_arma(x) and x.get("nome")):
            continue
        out[x["nome"]] = {
            "nome": x["nome"],
            "danni": _danni(x),
            "categoria": _categoria(x),
            "proprieta": [str(p).replace("-", " ") for p in (x.get("proprieta") or [])],
            "padronanza": _padronanza(x),
        }
    return out
