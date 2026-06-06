"""Helper condivisi del rules-engine PG: normalizzazione testo e parsing di valori,
usati da classes/species/backgrounds/spells. Nessuna dipendenza dal modello/SRD."""

from __future__ import annotations

import re
import unicodedata
from typing import Any

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
