"""Test di PARITÀ SRD (mostri): i dati core di ogni mostro nell'`archivio`
(`srd/mostro/`, forma `RawMostro`) devono coincidere con quelli del JSON sorgente
`Dev/Source/SRD/srd_5_2_1_monsters.json` (forma statblock).

È il gate del ritiro dei JSON (audit A1): finché non c'è parità, `archivio` non può
essere la fonte unica. Qui si legano CA / PF / GS / nomi. La rappresentazione
differisce (PF: JSON `media` vs archivio `dadi_vita`+taglia+Cos da calcolare; GS:
JSON float vs archivio frazione `1/2`; taglia a volte lista per gli umanoidi
bi-taglia): il test riconcilia la forma, non i valori.
"""

import json
import math
import re
from pathlib import Path

import pytest

import gen_bestiario

ROOT = Path(__file__).resolve().parents[1]
JSON_MOSTRI = ROOT / "Dev" / "Source" / "SRD" / "srd_5_2_1_monsters.json"

# Dado vita per taglia (5.5e): d4/d6/d8/d10/d12/d20.
FACCE = {"minuscola": 4, "piccola": 6, "media": 8, "grande": 10, "enorme": 12, "mastodontica": 20}


def _norm(s) -> str:
    return re.sub(r"\s+", " ", str(s or "").strip().lower())


def _taglia1(a) -> str:
    t = a.get("taglia")
    return _norm(t[0]) if isinstance(t, list) and t else _norm(t)


def _cos_mod(a) -> int:
    v = ((a.get("caratteristiche") or {}).get("costituzione") or {}).get("valore")
    return (int(v) - 10) // 2 if v is not None else 0


def _pf_archivio(a):
    """PF medi dai dadi vita: dadi × media-del-dado(taglia) + dadi × mod-Cos."""
    dv = a.get("dadi_vita")
    if dv is None:
        return a.get("pf") or a.get("pf_max")
    f = FACCE.get(_taglia1(a))
    if not f:
        return None
    return math.floor(dv * (f / 2 + 0.5)) + dv * _cos_mod(a)


def _gs_num(g):
    if isinstance(g, dict):
        g = g.get("valore")
    s = str(g)
    if "/" in s:
        n, d = s.split("/")
        return float(n) / float(d)
    try:
        return float(s)
    except ValueError:
        return None


def _ca_arch(a):
    ca = a.get("ca")
    return ca.get("valore") if isinstance(ca, dict) else ca


@pytest.fixture(scope="module")
def coppie():
    if not gen_bestiario.SRD_MONSTERS.is_dir():
        pytest.skip("archivio/srd/mostro assente — symlink 'archivio'?")
    if not JSON_MOSTRI.is_file():
        pytest.skip("Dev/Source/SRD/srd_5_2_1_monsters.json assente")
    arch = gen_bestiario.carica_mostri(gen_bestiario.SRD_MONSTERS)
    jsn = json.loads(JSON_MOSTRI.read_text(encoding="utf-8"))
    abyname = {_norm(m.get("nome")): m for m in arch}
    jbyname = {_norm(m.get("nome")): m for m in jsn}
    return jbyname, abyname


def test_nomi_in_parita(coppie):
    jbyname, abyname = coppie
    assert len(abyname) >= 334
    solo_json = set(jbyname) - set(abyname)
    solo_arch = set(abyname) - set(jbyname)
    assert not solo_json, f"mostri solo nel JSON: {sorted(solo_json)[:10]}"
    assert not solo_arch, f"mostri solo in archivio: {sorted(solo_arch)[:10]}"


def test_ca_in_parita(coppie):
    jbyname, abyname = coppie
    diff = [(n, jbyname[n].get("classe_armatura"), _ca_arch(abyname[n]))
            for n in jbyname if jbyname[n].get("classe_armatura") != _ca_arch(abyname[n])]
    assert not diff, f"CA divergenti: {diff[:12]}"


def test_pf_in_parita(coppie):
    jbyname, abyname = coppie
    diff = [(n, (jbyname[n].get("punti_ferita") or {}).get("media"), _pf_archivio(abyname[n]))
            for n in jbyname
            if (jbyname[n].get("punti_ferita") or {}).get("media") != _pf_archivio(abyname[n])]
    assert not diff, f"PF divergenti: {diff[:12]}"


def test_gs_in_parita(coppie):
    jbyname, abyname = coppie
    diff = [(n, jbyname[n].get("grado_sfida"), abyname[n].get("gs"))
            for n in jbyname
            if _gs_num(jbyname[n].get("grado_sfida")) != _gs_num(abyname[n].get("gs"))]
    assert not diff, f"GS divergenti: {diff[:12]}"
