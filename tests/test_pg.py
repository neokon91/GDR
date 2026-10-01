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
    _snapshot, _env,
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


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_privilegi_per_livello(tmp_path):
    """I privilegi di una CLASSE homebrew si dichiarano per livello (`privilegi:` con
    `{livello, nome, concede}`) e si fondono col legacy `privilegi_l1`. sali_pg li mostra al
    livello giusto e ne applica il `concede` (qui verifichiamo il parsing per-livello)."""
    h = tmp_path / "priv.js"
    h.write_text(
        f'const s = require({json.dumps(str(render.JS_DIR / "sali_pg.js"))});\n'
        'const fm = { privilegi: ['
        '{livello: 5, nome: "Attacco Extra"},'
        '{livello: 1, nome: "Furia", concede: {risorsa: {nome: "Ira"}}}'
        '], privilegi_l1: "Difesa senza armatura; Foga" };\n'
        'process.stdout.write(JSON.stringify(s.privilegiPerLivello(fm)));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(h)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    nomi1 = [p["nome"] for p in out["1"]]
    assert "Furia" in nomi1 and "Difesa senza armatura" in nomi1 and "Foga" in nomi1  # struttura + legacy → L1
    assert [p["nome"] for p in out["5"]] == ["Attacco Extra"]                          # feature di livello 5
    furia = next(p for p in out["1"] if p["nome"] == "Furia")
    assert furia["concede"] == {"risorsa": {"nome": "Ira"}}                            # concede preservato


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_risorse_at_level(tmp_path):
    """risorseAtLevel (helper condiviso, `_pg_shared.js`): il max viene da una CARATTERISTICA (mod, min 1), da una
    TABELLA SRD (`valori`) o da un `max` fisso (homebrew); la ricarica passa a breve dalla
    soglia `ricarica_breve_da_livello` (Bardo: Fonte di ispirazione al 5º)."""
    harness = tmp_path / "ral.js"
    harness.write_text(
        f'const crea = require({json.dumps(str(render.JS_DIR / "sali_pg.js"))});\n'
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


@pytest.mark.skipif(not shutil.which("node") or not render.SRD_DIR.is_dir(), reason="node/SRD assenti")
def test_sali_pg_asi_costituzione_pf_retroattivi(tmp_path):
    """ASI che alza la Costituzione: i PF si ricalcolano su TUTTI i livelli (RAW 5.5e:
    +1 PF per livello per ogni +1 di mod COS), non solo sul livello nuovo. Regressione del
    bug «pf_max fissato col mod COS pre-ASI»."""
    pg = {
        "nome": "Robusto", "categoria": "personaggio", "tipo": "pg",
        "classe": "guerriero", "classi": [{"id": "guerriero", "livello": 3, "sottoclasse": ""}],
        "livello": 3, "competenza": 2, "dado_vita": 10, "dadi_vita_max": 3, "pf": 31, "pf_max": 31,
        "forza": 16, "destrezza": 14, "costituzione": 16, "intelligenza": 10, "saggezza": 12, "carisma": 8,
    }
    out = _sali_harness(tmp_path, pg, {
        "in quale classe": "guerriero",          # sale il guerriero (non multiclasse)
        "Aumento dei punteggi": "asi2",           # +2 a una caratteristica
        "quale caratteristica": "costituzione",   # COS 16 -> 18 (mod +3 -> +4)
    })["out"]
    assert out is not None
    assert out["costituzione"] == 18 and out["mod_costituzione"] == 4
    # L4 guerriero d10 COS18: 14 + 10 + 10 + 10 = 44 (col bug sarebbe 40: +1/livello NON retroattivo).
    assert out["pf_max"] == 44 and out["pf"] == 44


