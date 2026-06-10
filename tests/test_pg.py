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
    # Multiclasse (2024): tipo incantatore per classe (livello-da-incantatore combinato),
    # Patto del Warlock separato, tabella slot multiclasse SRD e overlay prereq/competenze.
    assert opt["classi"]["mago"]["tipo_incantatore"] == "pieno"
    assert opt["classi"]["paladino"]["tipo_incantatore"] == "mezzo"
    assert opt["classi"]["warlock"]["tipo_incantatore"] == "patto"
    assert opt["classi"]["guerriero"]["tipo_incantatore"] == "nessuno"
    pact = opt["classi"]["warlock"]["pact"]
    assert len(pact) == 20 and pact[0] == {"slot": 1, "liv": 1} and pact[19]["liv"] == 5  # Patto 1-20
    assert "pact" not in opt["classi"]["mago"]  # solo le classi-patto hanno la tabella Patto
    mc = opt["slot_multiclasse"]
    assert len(mc) == 20 and mc[0] == {"1": 2} and mc[2] == {"1": 4, "2": 2}  # tabella SRD MC
    assert max(int(k) for k in mc[19]) == 9  # al livello-incantatore 20 si arriva al 9º
    prereq = opt["multiclasse"]["prerequisiti"]
    assert prereq["guerriero"] == [{"forza": 13}, {"destrezza": 13}]   # Forza O Destrezza
    assert prereq["monaco"] == [{"destrezza": 13, "saggezza": 13}]      # entrambe
    assert opt["multiclasse"]["competenze"]["ladro"]["abilita_scelte"] == 1


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
    assert out[0] == out[1] == out[2] == "Nuovo PG"   # vuoto/spazi/proibiti -> default
    assert out[3] == "Eroe di Prova"                  # nome valido invariato (spazi preservati)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_applyconcede_homebrew_effetti(tmp_path):
    """Il campo `concede` di un talento/privilegio/tratto homebrew ALIMENTA l'automazione:
    bonus ai punteggi (cap 20), competenze di abilità (prof_<id>, accento normalizzato) e
    armi/armature/strumenti. Solo gli effetti dichiarati; senza `concede` è inerte (prosa SRD)."""
    req = f'const s = require({json.dumps(str(render.JS_DIR / "sali_pg.js"))});\n'
    h = tmp_path / "concede.js"
    h.write_text(
        req +
        'const CARS = ["forza","destrezza","costituzione","intelligenza","saggezza","carisma"];\n'
        'const abil = { furtivita: "furtivita", atletica: "atletica" };\n'
        'const u = {}; const fm = { destrezza: 15, forza: 20 };\n'
        'const eff = s.applyConcede(u, fm, {caratteristica:{destrezza:1, forza:1}, abilita:["Furtività"], armi:"asce"}, CARS, abil);\n'
        'const u2 = {}; const eff2 = s.applyConcede(u2, {}, undefined, CARS, abil);\n'
        'process.stdout.write(JSON.stringify({u, eff, u2, eff2}));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(h)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["u"]["destrezza"] == 16            # +1 → punteggio aggiornato
    assert out["u"]["forza"] == 20                # cap 20 (era 20 → resta 20, non 21)
    assert out["u"]["prof_furtivita"] == 1        # competenza d'abilità (label con accento risolta)
    assert out["u"]["competenze_armi"] == "asce"  # competenza testuale
    assert out["u2"] == {} and out["eff2"] == []  # niente `concede` (SRD/prosa) → inerte


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
    nome-file (Test PG → «Test PG 2») invece di sovrascrivere la nota esistente."""
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
        'const taken=new Set(["Mondi/Personaggi/Test PG.md"]);'  # un PG omonimo esiste già
        'const tp={system:{prompt:async()=>"Test PG", suggester:async(l,v)=>v[0]},'
        ' file:{ move:async(p)=>{moved=p;}, exists:async(p)=>taken.has(p) }};'
        f'require({json.dumps(str(render.JS_DIR / "crea_pg.js"))})(tp)'
        '.then(()=>process.stdout.write(JSON.stringify({moved})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    assert json.loads(res.stdout)["moved"] == "Mondi/Personaggi/Test PG 2"


@pytest.mark.skipif(not shutil.which("node") or not render.SRD_DIR.is_dir(), reason="node/SRD assenti")
def test_multiclasse_funzioni(tmp_path):
    """sali_pg: funzioni pure della multiclasse (2024) sui DATI SRD reali — prerequisiti
    (OR/AND), gate RAW, livello-incantatore combinato, slot a livello (1 vs 2+ caster) e
    Patto del Warlock separato. Le regole vivono nell'overlay/SRD, non nel codice."""
    import build_personaggio
    pj = tmp_path / "personaggio.json"
    pj.write_text(json.dumps(build_personaggio.build_personaggio_options(CORE), ensure_ascii=False), encoding="utf-8")
    harness = tmp_path / "mc.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const opt=JSON.parse(fs.readFileSync({json.dumps(str(pj))},"utf8"));'
        f'const s=require({json.dumps(str(render.JS_DIR / "sali_pg.js"))});'
        'const c=opt.classi, P=opt.multiclasse.prerequisiti;'
        'process.stdout.write(JSON.stringify({'
        '  prereq_or: s.prereqOk({forza:13,destrezza:8}, P.guerriero),'        # Forza O Destrezza
        '  prereq_and_fail: s.prereqOk({destrezza:15,saggezza:10}, P.monaco),' # serve anche Saggezza
        '  gate_block: s.multiclassGate({intelligenza:10,forza:15}, ["guerriero"], "mago", P),'
        '  gate_ok: s.multiclassGate({intelligenza:13,forza:15}, ["guerriero"], "mago", P),'
        '  combined_g3m2: s.combinedCasterLevel([{id:"guerriero",livello:3},{id:"mago",livello:2}], c),'
        '  combined_p4m4: s.combinedCasterLevel([{id:"paladino",livello:4},{id:"mago",livello:4}], c),'
        '  slots_single_mago3: s.leveledSlots([{id:"mago",livello:3}], opt, c),'
        '  slots_mc_2caster: s.leveledSlots([{id:"chierico",livello:1},{id:"mago",livello:1}], opt, c),'
        '  pact_w3: s.pactSlots([{id:"warlock",livello:3}], c),'
        '  slots_warlock_alone: s.leveledSlots([{id:"warlock",livello:5}], opt, c) }));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    r = json.loads(res.stdout)
    opt = build_personaggio.build_personaggio_options(CORE)
    assert r["prereq_or"] is True and r["prereq_and_fail"] is False
    assert r["gate_block"]["ok"] is False and "mago" in r["gate_block"]["mancanti"]  # RAW: blocca
    assert r["gate_ok"]["ok"] is True
    assert r["combined_g3m2"] == 2          # solo il mago conta (pieno ×1); il guerriero no
    assert r["combined_p4m4"] == 6          # mago 4 + paladino floor(4/2)=2
    # 1 sola classe incantatrice → la SUA tabella; 2+ → tabella multiclasse SRD combinata.
    assert r["slots_single_mago3"] == opt["classi"]["mago"]["progressione"][2]["slot"]
    assert r["slots_mc_2caster"] == opt["slot_multiclasse"][1]   # livello-incantatore 2
    # Patto del Warlock: SEMPRE separato dagli slot a livello.
    assert r["pact_w3"] == opt["classi"]["warlock"]["pact"][2]
    assert r["slots_warlock_alone"] == {}   # il warlock non entra negli slot a livello


def _sali_harness(tmp_path, fm0, picks):
    """Esegue sali_pg.js col mock di un PG attivo (fm0) e un suggester guidato da `picks`
    (dict: sotto-stringa del titolo -> valore scelto; default = primo). Ritorna {out, note}:
    `out` = frontmatter finale (None se processFrontMatter non è stato chiamato)."""
    import build_personaggio
    pj = tmp_path / "personaggio.json"
    pj.write_text(json.dumps(build_personaggio.build_personaggio_options(CORE), ensure_ascii=False), encoding="utf-8")
    harness = tmp_path / "sali.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const data=fs.readFileSync({json.dumps(str(pj))},"utf8");'
        'let out=null,note="";'
        'global.Notice=class{constructor(m){note=String(m);}};'
        'const file={path:"PG.md"};'
        f'const fm0={json.dumps(fm0)};'
        f'const picks={json.dumps(picks)};'
        'global.app={'
        ' workspace:{getActiveFile:()=>file},'
        ' metadataCache:{getFileCache:()=>({frontmatter:fm0})},'
        ' vault:{adapter:{read:async()=>data}},'
        ' fileManager:{processFrontMatter:async(f,fn)=>{fn(fm0);out=JSON.parse(JSON.stringify(fm0));}}'
        '};'
        'const tp={system:{suggester:async(labels,values,_f,title)=>{'
        '  title=String(title||"");'
        '  for(const k of Object.keys(picks)) if(title.includes(k)) return picks[k];'
        '  return values[0];'
        '}}};'
        f'require({json.dumps(str(render.JS_DIR / "sali_pg.js"))})(tp)'
        '.then(()=>process.stdout.write(JSON.stringify({out,note})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    return json.loads(res.stdout)


# PG di partenza per gli e2e di sali_pg: Guerriero 1, INT 13 (regge il prereq del Mago).
_PG_GUERRIERO_L1 = {
    "nome": "Multi", "categoria": "personaggio", "tipo": "pg",
    "classe": "guerriero", "classi": [{"id": "guerriero", "livello": 1, "sottoclasse": ""}],
    "livello": 1, "competenza": 2, "dado_vita": 10, "dadi_vita_max": 1, "pf": 13, "pf_max": 13,
    "forza": 16, "destrezza": 14, "costituzione": 16, "intelligenza": 13, "saggezza": 10, "carisma": 8,
}


@pytest.mark.skipif(not shutil.which("node") or not render.SRD_DIR.is_dir(), reason="node/SRD assenti")
def test_sali_pg_multiclasse_e2e(tmp_path):
    """sali_pg end-to-end: un Guerriero 1 (INT 13) multiclassa in Mago. Risultato: breakdown
    a 2 voci, livello-personaggio 2, competenza dal totale, slot da incantatore (Mago=unica
    classe incantatrice → la sua tabella), flag incantatore e incantesimi assegnati."""
    out = _sali_harness(tmp_path, dict(_PG_GUERRIERO_L1),
                        {"in quale classe": "__multiclasse__", "Multiclasse: nuova classe": "mago"})["out"]
    assert out is not None
    assert out["classi"] == [{"id": "guerriero", "livello": 1, "sottoclasse": ""},
                             {"id": "mago", "livello": 1, "sottoclasse": ""}]
    assert out["livello"] == 2 and out["competenza"] == 2     # competenza dal livello TOTALE
    assert out["classe"] == "guerriero"                       # primaria invariata
    assert out["incantatore"] is True
    assert out["slot_1"] == 2                                 # Mago L1 (unico caster) → sua tabella
    assert isinstance(out.get("trucchetti"), list) and out["trucchetti"]
    assert isinstance(out.get("incantesimi"), list) and out["incantesimi"]
    # PF aumentati col dado del MAGO (d6: media 4 + mod COS 3 = 7).
    assert out["pf_max"] == _PG_GUERRIERO_L1["pf_max"] + (4 + 3)


@pytest.mark.skipif(not shutil.which("node") or not render.SRD_DIR.is_dir(), reason="node/SRD assenti")
def test_sali_pg_multiclasse_prereq_blocca(tmp_path):
    """sali_pg (prereq RAW): un Guerriero con INT 10 NON può multiclassare in Mago (serve
    Intelligenza 13). Il frontmatter resta intatto e una Notice spiega il blocco."""
    fm = dict(_PG_GUERRIERO_L1, intelligenza=10)
    res = _sali_harness(tmp_path, fm,
                       {"in quale classe": "__multiclasse__", "Multiclasse: nuova classe": "mago"})
    assert res["out"] is None                  # processFrontMatter mai chiamato → niente scrittura
    assert "negata" in res["note"].lower() and "mago" in res["note"].lower()


