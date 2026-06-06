"""Test GDR — pg. Fixtures condivise (CORE/TEMPLATES/_snapshot/...) in _common."""

import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest
import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

import render
from _common import (
    CORE, PLUGINS, TEMPLATES, PAGES, SNAP_DIR,
    _snapshot, _env, _PG_HARNESS, _run_crea_pg,
)


@pytest.mark.skipif(not render.SRD_DIR.is_dir(), reason="SRD non vendorizzata")
def test_personaggio_options():
    """Il converter rules-engine PG: struttura + parser scelte-abilità di classe
    (tutte mappano a id abilità validi, scelte plausibili)."""
    import build_personaggio
    opt = build_personaggio.build_personaggio_options(CORE)
    assert len(opt["abilita"]) == 18
    assert len(opt["caratteristiche"]) == 6
    assert opt["classi"] and opt["specie"] and opt["background"]
    skill_ids = set(opt["abilita"])
    for cid, classe in opt["classi"].items():
        ab = classe["abilita"]
        assert 1 <= ab["scelte"] <= 4, f"{cid}: scelte fuori range"
        assert ab["opzioni"], f"{cid}: nessuna opzione abilità"
        assert all(o in skill_ids for o in ab["opzioni"]), f"{cid}: opzione non valida"
        assert classe["dado_vita"] >= 6
        assert all(s in opt["caratteristiche"] for s in classe["tiri_salvezza"])
    for bg in opt["background"].values():
        assert all(s in opt["caratteristiche"] for s in bg["punteggi_caratteristica"])
        assert all(s in skill_ids for s in bg["competenze_abilita"])
    # Padronanza armi 2024 (dal SRD): mappa arma->padronanza + conteggi per classe.
    armi = opt["armi_padronanza"]
    assert len(armi) >= 30 and armi.get("Lancia") == "Fiaccare"
    assert opt["classi"]["barbaro"]["padronanza_armi"] == 2
    assert opt["classi"]["guerriero"]["padronanza_armi"] == 3
    # Ladro/Paladino/Ranger: hanno il privilegio ma non la colonna -> fallback 2.
    assert opt["classi"]["ladro"]["padronanza_armi"] == 2
    # I caster puri non ottengono padronanza d'armi.
    assert opt["classi"]["mago"]["padronanza_armi"] == 0
    # Risorse di classe a ricarica (loop di sessione 2024): pool numerici dalle colonne
    # SRD + ricarica curata (pg_rules). Barbaro=Ira (lungo, 2→6); Monaco=Disciplina/Ki
    # (breve, = livello da L2); caster puri/Ladro senza contatore; Warlock=slot a riposo breve.
    barb = {r["id"]: r for r in opt["classi"]["barbaro"]["risorse"]}
    assert barb["ira"]["ricarica"] == "lungo" and barb["ira"]["valori"][1] == 2
    assert max(barb["ira"]["valori"].values()) == 6
    monk = {r["id"]: r for r in opt["classi"]["monaco"]["risorse"]}
    assert monk["disciplina"]["ricarica"] == "breve" and monk["disciplina"]["valori"][2] == 2
    assert not opt["classi"]["mago"]["risorse"] and not opt["classi"]["ladro"]["risorse"]
    assert opt["slot_ricarica_breve_classi"] == ["warlock"]
    # Ispirazione bardica: risorsa il cui max = mod Carisma (non in tabella SRD), con
    # ricarica che passa a riposo breve dal 5º livello (Fonte di ispirazione 2024).
    bard = {r["id"]: r for r in opt["classi"]["bardo"]["risorse"]}
    assert bard["ispirazione"]["caratteristica"] == "carisma" and "valori" not in bard["ispirazione"]
    assert bard["ispirazione"]["ricarica"] == "lungo" and bard["ispirazione"]["ricarica_breve_da_livello"] == 5


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_crea_pg_nome_vuoto(tmp_path):
    """crea_pg.nomeFile: un nome vuoto o di soli caratteri proibiti NON dà un basename
    vuoto (eviterebbe la nota orfana '.md') — cade su un default; un nome valido resta."""
    harness = tmp_path / "nomefile.js"
    harness.write_text(
        f'const crea = require({json.dumps(str(render.JS_DIR / "crea_pg.js"))});\n'
        'const out = ["", "   ", "***", "Eroe di Prova"].map(crea.nomeFile);\n'
        'process.stdout.write(JSON.stringify(out));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert all(out), f"basename vuoto prodotto: {out}"
    assert out[0] == out[1] == out[2] == "Nuovo_PG"   # vuoto/spazi/proibiti -> default
    assert out[3] == "Eroe_di_Prova"                  # nome valido invariato


@pytest.mark.skipif(not shutil.which("node") or not render.SRD_DIR.is_dir(), reason="node/SRD assenti")
def test_crea_personaggio_padronanze(tmp_path):
    """crea_pg: una classe con padronanza d'armi (Barbaro, 2) sceglie 2 armi in
    creazione; ogni voce è 'Arma — Padronanza' (dalla mappa SRD)."""
    opt, fm = _run_crea_pg(tmp_path, classe="Barbaro")
    assert fm["classe"] == "barbaro"
    pad = fm.get("padronanze_armi") or []
    assert len(pad) == 2
    assert all(" — " in p for p in pad), pad


@pytest.mark.skipif(not shutil.which("node") or not render.SRD_DIR.is_dir(), reason="node/SRD assenti")
def test_crea_personaggio_e2e(tmp_path):
    """crea_pg.js applica le regole 5.5e end-to-end (mock Templater): frontmatter
    YAML valido, PF=dado_vita+mod COS, TS della classe, 18 flag prof + i dati SRD
    di 1º livello (specie/competenze/lingue/privilegi/CA da armatura)."""
    opt, fm = _run_crea_pg(tmp_path)
    assert fm["categoria"] == "personaggio" and fm["tipo"] == "pg"
    assert fm["classe"] in opt["classi"]
    classe = opt["classi"][fm["classe"]]
    assert fm["pf"] == max(1, classe["dado_vita"] + (fm["costituzione"] - 10) // 2)
    assert fm["dado_vita"] == classe["dado_vita"] and fm["dadi_vita_max"] == 1  # Dadi Vita 2024
    for c in opt["caratteristiche"]:
        assert fm[f"mod_{c}"] == (fm[c] - 10) // 2  # mod_<car> seedato per i tiri Dice Roller
    for stat in classe["tiri_salvezza"]:
        assert fm[f"ts_{stat}"] == 1
    assert sum(1 for k in fm if k.startswith("prof_")) == 18
    # Ottimizzazioni SRD L1: tratti specie, competenze, lingue, privilegi, CA armatura.
    assert isinstance(fm["scurovisione"], bool)
    assert fm["lingue"][0] == opt["lingue"]["comune"]
    assert fm["privilegi_classe"] == classe["privilegi_l1"]
    assert fm["competenze_armi"] == classe["competenze_armi"]
    arm = opt["armature"][fm["armatura"]]
    mod_des = (fm["destrezza"] - 10) // 2
    cap = mod_des if arm["dex_max"] is None else min(mod_des, arm["dex_max"])
    assert fm["ca"] == arm["ca_base"] + cap + (2 if fm["scudo"] else 0)


def test_crea_personaggio_caster_e2e(tmp_path):
    """Per un incantatore (mago) il wizard applica trucchetti/incantesimi/slot di
    1º livello dalla progressione e dai pool SRD della classe."""
    opt, fm = _run_crea_pg(tmp_path, classe="mago")
    mago = opt["classi"]["mago"]
    assert fm["classe"] == "mago" and fm["incantatore"] is True
    assert len(fm["trucchetti"]) == mago["trucchetti_noti"]
    assert len(fm["incantesimi"]) == mago["incantesimi_preparati"]
    assert fm["slot_1"] == mago["slot_l1"]["1"]
    assert set(fm["trucchetti"]).issubset(set(mago["incantesimi_pool"]["0"]))
    assert set(fm["incantesimi"]).issubset(set(mago["incantesimi_pool"]["1"]))


@pytest.mark.skipif(not shutil.which("node") or not render.SRD_DIR.is_dir(), reason="node/SRD assenti")
def test_crea_personaggio_risorse_e2e(tmp_path):
    """Per una classe con risorsa a ricarica (Barbaro→Ira) il wizard scrive `risorse_pg`
    (lista di oggetti) e il contatore usi_<id>=0 nel frontmatter: YAML valido e parsabile."""
    opt, fm = _run_crea_pg(tmp_path, classe="Barbaro")
    assert fm["classe"] == "barbaro"
    risorse = {r["id"]: r for r in fm["risorse_pg"]}
    assert "ira" in risorse
    assert risorse["ira"]["max"] == 2 and risorse["ira"]["ric"] == "lungo"  # L1 = 2 Ire
    assert fm["usi_ira"] == 0   # contatore spesi inizializzato
    # Bardo: Ispirazione = mod Carisma (min 1), ricarica lungo al 1º livello (< soglia 5).
    _, fmb = _run_crea_pg(tmp_path, classe="bardo")
    risb = {r["id"]: r for r in fmb["risorse_pg"]}
    assert "ispirazione" in risb
    assert risb["ispirazione"]["max"] == max(1, (fmb["carisma"] - 10) // 2)
    assert risb["ispirazione"]["ric"] == "lungo" and fmb["usi_ispirazione"] == 0


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_risorse_at_level(tmp_path):
    """crea_pg.risorseAtLevel: il max viene da una CARATTERISTICA (mod, min 1), da una
    TABELLA SRD (`valori`) o da un `max` fisso (homebrew); la ricarica passa a breve dalla
    soglia `ricarica_breve_da_livello` (Bardo: Fonte di ispirazione al 5º)."""
    harness = tmp_path / "ral.js"
    harness.write_text(
        f'const crea = require({json.dumps(str(render.JS_DIR / "crea_pg.js"))});\n'
        'const R = ['
        '  {id:"ispir",label:"Isp",caratteristica:"carisma",ricarica:"lungo",ricarica_breve_da_livello:5},'
        '  {id:"ira",label:"Ira",valori:{1:2,3:3},ricarica:"lungo"},'
        '  {id:"hb",label:"HB",max:4,ricarica:"breve"} ];\n'
        'process.stdout.write(JSON.stringify({'
        '  l1: crea.risorseAtLevel(R, 1, {carisma:14}),'
        '  l5: crea.risorseAtLevel(R, 5, {carisma:8}) }));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    l1 = {r["id"]: r for r in out["l1"]}
    assert l1["ispir"]["max"] == 2 and l1["ispir"]["ric"] == "lungo"   # mod(14)=2 · L1<5 → lungo
    assert l1["ira"]["max"] == 2                                       # tabella al L1
    assert l1["hb"]["max"] == 4 and l1["hb"]["ric"] == "breve"         # max fisso (homebrew)
    l5 = {r["id"]: r for r in out["l5"]}
    assert l5["ispir"]["max"] == 1 and l5["ispir"]["ric"] == "breve"   # mod(8)=−1 → min 1 · L5≥5 → breve
    assert l5["ira"]["max"] == 3                                       # tabella: max sui livelli ≤5


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_crea_pg_annullamento(tmp_path):
    """crea_pg.js: un Escape (suggester→null) a metà NON crasha né scrive un PG
    corrotto — degrada a una bozza VALIDA con Notice."""
    import build_personaggio
    pj = tmp_path / "personaggio.json"
    pj.write_text(json.dumps(build_personaggio.build_personaggio_options(CORE), ensure_ascii=False), encoding="utf-8")
    harness = tmp_path / "annulla.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const data=fs.readFileSync({json.dumps(str(pj))},"utf8");'
        'let avvisato=false; global.Notice=class{constructor(m){avvisato=true;}};'
        'global.app={ vault:{ adapter:{ read: async()=>data } } };'
        # Sceglie array_standard come metodo, poi annulla (null) all'assegnazione valori.
        'const tp={ system:{ prompt: async()=>"PG Annullato",'
        ' suggester: async(l,v,_f,title)=> String(title||"").startsWith("Metodo") ? "array_standard" : null },'
        ' file:{ move: async()=>{} } };'
        f'require({json.dumps(str(render.JS_DIR / "crea_pg.js"))})(tp)'
        '.then(fm=>process.stdout.write(JSON.stringify({fm, avvisato})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr  # nessun crash
    out = json.loads(res.stdout)
    assert out["avvisato"] is True  # Notice mostrata
    fm = yaml.safe_load(out["fm"].split("---")[1])  # YAML valido
    assert fm["categoria"] == "personaggio" and fm["tipo"] == "pg" and fm["stato"] == "bozza"
    assert "pf" not in fm and "destrezza" not in fm  # nessun dato meccanico corrotto/parziale


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_crea_pg_annullamento_manuale(tmp_path):
    """crea_pg.js: Escape sull'inserimento MANUALE delle caratteristiche annulla
    PULITO (bozza valida) — non assegna il default 10 e prosegue."""
    import build_personaggio
    pj = tmp_path / "personaggio.json"
    pj.write_text(json.dumps(build_personaggio.build_personaggio_options(CORE), ensure_ascii=False), encoding="utf-8")
    harness = tmp_path / "annulla_man.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const data=fs.readFileSync({json.dumps(str(pj))},"utf8");'
        'let avvisato=false; global.Notice=class{constructor(m){avvisato=true;}};'
        'global.app={ vault:{ adapter:{ read: async()=>data } } };'
        # Nome ok; suggester sempre null → metodo=null → inserimentoManuale; il prompt
        # delle caratteristiche torna null (Escape) → deve annullare, non assegnare 10.
        'const tp={ system:{ prompt: async(t)=> String(t||"").startsWith("Nome") ? "Manuale Test" : null,'
        ' suggester: async()=> null },'
        ' file:{ move: async()=>{} } };'
        f'require({json.dumps(str(render.JS_DIR / "crea_pg.js"))})(tp)'
        '.then(fm=>process.stdout.write(JSON.stringify({fm, avvisato})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["avvisato"] is True                                   # Notice mostrata
    fm = yaml.safe_load(out["fm"].split("---")[1])
    assert fm["categoria"] == "personaggio" and fm["stato"] == "bozza"
    assert "forza" not in fm and "pf" not in fm                      # niente caratteristica a 10 + proseguito


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_crea_pg_nome_clash(tmp_path):
    """crea_pg.js: se esiste già un PG omonimo, tp.file.exists fa disambiguare il
    nome-file (Test_PG → Test_PG_2) invece di sovrascrivere la nota esistente."""
    import build_personaggio
    pj = tmp_path / "personaggio.json"
    pj.write_text(json.dumps(build_personaggio.build_personaggio_options(CORE), ensure_ascii=False), encoding="utf-8")
    harness = tmp_path / "clash.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const data=fs.readFileSync({json.dumps(str(pj))},"utf8");'
        'global.Notice=class{constructor(m){}};'
        'global.app={vault:{adapter:{read:async()=>data}}};'
        'let moved=null;'
        'const taken=new Set(["Mondi/Personaggi/Test_PG.md"]);'  # un PG omonimo esiste già
        'const tp={system:{prompt:async()=>"Test PG", suggester:async(l,v)=>v[0]},'
        ' file:{ move:async(p)=>{moved=p;}, exists:async(p)=>taken.has(p) }};'
        f'require({json.dumps(str(render.JS_DIR / "crea_pg.js"))})(tp)'
        '.then(()=>process.stdout.write(JSON.stringify({moved})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    assert json.loads(res.stdout)["moved"] == "Mondi/Personaggi/Test_PG_2"


