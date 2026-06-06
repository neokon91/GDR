"""Test GDR — world_engine. Fixtures condivise (CORE/TEMPLATES/_snapshot/...) in _common."""

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
    CORE, PLUGINS, TEMPLATES, PAGES, SNAP_DIR, VIEWS_JS, VIEWS_SRC, META_ACTIONS_JS,
    _snapshot, _env, _PG_HARNESS, _run_crea_pg,
)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_dintorni(tmp_path):
    """views.renderDintorni: regione contenitore, luoghi contenuti, distanza per
    CONFINI (BFS su confina_con) e IN LINEA D'ARIA (euclidea × mondo.scala_mappa, km).
    Le rotte NON si elencano qui (stanno in Viaggio). Grafo: Voragine—Forte—Bosco—Mercato.
    Coord (scala 2 km/u): Forte(50,50) Voragine(51,50) Bosco(62,50) Mercato(80,49)."""
    harness = tmp_path / "dint.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const L=(n)=>({path:n+".md"});'
        'const mk=(name,ex)=>Object.assign({file:{name,path:name+".md"},categoria:"luogo",stato:"pronto",mondo:L("Mondo")},ex);'
        'const all=[{file:{name:"Mondo",path:"Mondo.md"},categoria:"mondo",scala_mappa:2},'
        ' mk("Marche",{tipo:"regione"}),'
        ' mk("Forte",{regione:L("Marche"),coord:"50, 50",confina_con:[L("Bosco"),L("Voragine")],rotta_con:[L("Mercato")]}),'
        ' mk("Bosco",{regione:L("Marche"),coord:"62, 50",confina_con:[L("Forte"),L("Mercato")]}),'
        ' mk("Mercato",{regione:L("Marche"),coord:"80, 49",confina_con:[L("Bosco")],rotta_con:[L("Forte")]}),'
        ' mk("Voragine",{regione:L("Marche"),coord:"51, 50",confina_con:[L("Forte")]})];'
        'const dv={pages:()=>({where:(fn)=>({array:()=>all.filter(fn)})}),'
        ' page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};'
        'const f=(n)=>all.find(x=>x.file.name===n);'
        'Promise.all([m.exports.renderDintorni({},dv,f("Forte")),m.exports.renderDintorni({},dv,f("Marche"))])'
        '.then(([a,b])=>process.stdout.write(JSON.stringify({a,b})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    a = out["a"]                                              # Forte Cenere
    assert "📍 Regione**: [[Marche]]" in a
    assert "🧭 Confina con** (2): [[Bosco]], [[Voragine]]" in a
    assert "↔ A 2 confini** (1): [[Mercato]]" in a           # BFS: Mercato a 2 salti via Bosco
    assert "Rotte di viaggio" not in a                       # rotte spostate nel pannello Viaggio (no doppione)
    assert a.index("Confina con") < a.index("A 2 confini")   # anelli ordinati per distanza
    # Distanza metrica in km (scala 2): Voragine ~2, Bosco ~24, Mercato ~60.
    air = a.split("In linea d'aria")[1] if "In linea d'aria" in a else ""
    assert air, "sezione metrica assente"
    assert "[[Voragine]] ~2 km" in air and "[[Bosco]] ~24 km" in air and "[[Mercato]] ~60 km" in air
    assert air.index("Voragine") < air.index("Bosco") < air.index("Mercato")  # i più vicini in cima
    b = out["b"]                                              # Marche (regione)
    assert "🗺 Contiene** (4):" in b and "[[Forte]]" in b and "[[Voragine]]" in b
    assert "Confina con" not in b                             # la regione non ha confini propri
    assert "In linea d'aria" not in b                         # la regione non ha coord -> niente metrica


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_viaggio(tmp_path):
    """views.renderViaggio: destinazioni dirette (rotte 🛣 + confinanti 🧭) con tempo
    (distanza metrica ÷ passo del mondo) e rischio (pressione), + "cosa può succedere
    qui" (incontri con luogo==qui + insidie che includono qui). Scala 2, passo 30."""
    harness = tmp_path / "via.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const L=(n)=>({path:n+".md"});'
        'const mk=(name,ex)=>Object.assign({file:{name,path:name+".md"},categoria:"luogo",stato:"pronto",mondo:L("Mondo")},ex);'
        'const all=[{file:{name:"Mondo",path:"Mondo.md"},categoria:"mondo",scala_mappa:2,passo_viaggio:30},'
        ' mk("Forte",{coord:"50, 50",rotta_con:[L("Mercato")],confina_con:[L("Bosco"),L("Voragine")]}),'
        ' mk("Bosco",{coord:"62, 50"}),'
        ' mk("Mercato",{coord:"80, 49",pressione:3}),'
        ' mk("Voragine",{coord:"51, 50",confina_con:[L("Forte")]}),'
        ' {file:{name:"Agguato",path:"Agguato.md"},categoria:"incontro",tipo:"agguato",stato:"pronto",luogo:L("Voragine")},'
        ' {file:{name:"Trappola",path:"Trappola.md"},categoria:"insidia",stato:"pronto",luoghi:[L("Voragine")]}];'
        'const dv={pages:()=>({where:(fn)=>({array:()=>all.filter(fn)})}),'
        ' page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};'
        'const f=(n)=>all.find(x=>x.file.name===n);'
        'Promise.all([m.exports.renderViaggio({},dv,f("Forte")),m.exports.renderViaggio({},dv,f("Voragine"))])'
        '.then(([a,b])=>process.stdout.write(JSON.stringify({a,b})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    a = out["a"]                                              # Forte Cenere
    assert "🧳 Partenze da qui" in a and "30 km/g" in a
    assert "| Verso | Via | Tempo | Rischio |" in a
    assert "[[Mercato]] | 🛣 rotta | ~2 g | 🟢 Calma (3) |" in a   # rotta, 60km/30=2g
    assert "[[Bosco]] | 🧭 terra |" in a                           # confinante via terra
    assert "Cosa può succedere" not in a                           # nessun incontro/insidia a Forte
    b = out["b"]                                              # La Voragine
    assert "⚔ Cosa può succedere qui (2)" in b
    assert "[[Agguato]] *(incontro · agguato)*" in b              # incontro con luogo==qui
    assert "[[Trappola]] *(insidia" in b                          # insidia che include qui
    assert "[[Forte]] | 🧭 terra |" in b                          # partenza verso Forte


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_pressioni(tmp_path):
    """views.renderPressioni: per un Fronte (clock_dim) deriva le spinte dal grafo —
    dipendenza da risorsa contesa/controllata, produzione contesa, rotta a rischio,
    rivale in ascesa; "" se non è un fronte; tip se nessuna spinta."""
    harness = tmp_path / "press.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const L=(n)=>({path:n+".md"});'
        'const mk=(name,categoria,ex)=>Object.assign({file:{name,path:name+".md"},categoria,stato:"pronto"},ex);'
        'const all=[mk("Sale","risorsa",{pressione:6,controllata_da:L("Capitolo")}),'
        ' mk("Capitolo","fazione",{}),'
        ' mk("Reliquie","risorsa",{pressione:8}),'
        ' mk("Mercato","luogo",{pressione:8}),'
        ' mk("Rivale","fazione",{pressione:8}),'
        ' mk("Forte","luogo",{clock_dim:4,dipende_da:[L("Sale")],produce:[L("Reliquie")],rotta_con:[L("Mercato")],rivali:[L("Rivale")]}),'
        ' mk("Quieto","luogo",{clock_dim:4}),'                       # fronte senza spinte
        ' mk("NonFronte","luogo",{})];'                              # niente clock → non è un fronte
        'const dv={page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};'
        'const f=(n)=>all.find(x=>x.file.name===n);'
        'Promise.all([m.exports.renderPressioni({},dv,f("Forte")),m.exports.renderPressioni({},dv,f("Quieto")),m.exports.renderPressioni({},dv,f("NonFronte"))])'
        '.then(([a,b,c])=>process.stdout.write(JSON.stringify({a,b,c})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    a = out["a"]
    assert "⚡ Spinte dal grafo" in a
    assert "Dipendi da [[Sale]]" in a and "in mano a [[Capitolo]]" in a   # risorsa contesa + controllata
    assert "Produci [[Reliquie]]" in a                                    # produzione contesa
    assert "Rotta con [[Mercato]] a rischio" in a                         # rotta verso luogo in crisi
    assert "Rivale [[Rivale]] in ascesa" in a                             # rivale ad alta pressione
    assert "Fronte stabile" in out["b"]                                   # fronte senza spinte → tip
    assert out["c"] == ""                                                 # non è un fronte → vuoto


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_cosmic_push(tmp_path):
    """views.cosmicPush: una spinta cosmica vale se il linkato è caldo (pressione≥5)
    o un Fronte a metà/oltre; altrimenti null."""
    harness = tmp_path / "cosmic.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const C=m.exports.cosmicPush;'
        'process.stdout.write(JSON.stringify({'
        'hot:C({file:{name:"Voragine",path:"Voragine.md"},pressione:8},"Si manifesta in"),'
        'cold:C({file:{name:"Quiete",path:"Q.md"},pressione:2},"X"),'
        'adv:C({file:{name:"Crepa",path:"C.md"},clock_dim:3,clock:2},"Dipende da te"),'
        'low:C({file:{name:"Lieve",path:"L.md"},clock_dim:4,clock:1},"X")}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert "[[Voragine]]" in out["hot"] and "Crisi" in out["hot"]   # caldo → spinta
    assert out["cold"] is None                                      # tiepido, niente clock → null
    assert "fronte in corsa (2/3)" in out["adv"]                    # fronte a metà → spinta
    assert out["low"] is None                                       # clock 1/4 (<metà) + tiepido → null


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_pressioni_cosmico(tmp_path):
    """views.renderPressioni (grafo cosmico): un principio cosmico-Fronte è spinto
    dai suoi siti di manifestazione in crisi (outlink) e dai dipendenti che vacillano
    (inlink) — collega lo strato cosmologico alla superficie giocabile."""
    harness = tmp_path / "press_cosmo.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const L=(n)=>({path:n+".md"});'
        'const all=[Object.assign({file:{name:"Voragine",path:"Voragine.md"},categoria:"luogo"},{pressione:8}),'
        ' Object.assign({file:{name:"Cinerimanzia",path:"Cinerimanzia.md"},categoria:"sistema_magico"},{pressione:7}),'
        ' Object.assign({file:{name:"Legge del Fuoco",path:"Legge del Fuoco.md",inlinks:[L("Cinerimanzia")]},'
        '   categoria:"legge_fondamentale"},{clock_dim:6,luoghi:[L("Voragine")]})];'
        'const dv={page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};'
        'const f=(n)=>all.find(x=>x.file.name===n);'
        'm.exports.renderPressioni({},dv,f("Legge del Fuoco")).then(a=>process.stdout.write(a));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert "Spinte dal grafo" in out
    assert "Si manifesta in [[Voragine]]" in out          # sito di manifestazione in crisi (outlink)
    assert "Dipende da te [[Cinerimanzia]]" in out        # sistema magico dipendente in crisi (inlink)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_spinte_teologiche(tmp_path):
    """views.spinteFronte (grafo TEOLOGICO): un Fronte religioso (culto / tipo culto)
    è spinto dalla metafisica — il dio/dominio cosmico che venera che freme o si desta,
    un culto rivale in ascesa, una profezia che lo riguarda che matura. I culti-rivali
    NON sono duplicati dal grafo economico generico (li possiede il teologico)."""
    harness = tmp_path / "teo.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const L=(n)=>({path:n+".md"});'
        'const all=[\n'
        '  {file:{name:"Setta",path:"Setta.md",inlinks:[L("Profezia")]}, categoria:"fazione", tipo:"culto",'
        '   clock_dim:4, clock:2, domini:[L("Vorth")], rivali:[L("CultoB")]},\n'
        '  {file:{name:"Vorth",path:"Vorth.md"}, categoria:"divinita", pressione:6},\n'
        '  {file:{name:"CultoB",path:"CultoB.md"}, categoria:"culto", pressione:7},\n'
        '  {file:{name:"Profezia",path:"Profezia.md"}, categoria:"profezia", clock_dim:6, clock:4},\n'
        '];\n'
        'const dv={page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};\n'
        'const f=(n)=>all.find(x=>x.file.name===n);\n'
        'm.exports.spinteFronte({},dv,f("Setta")).then(a=>process.stdout.write(JSON.stringify(a)));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    joined = "\n".join(out)
    assert "🙏 [[Vorth]] che veneri freme" in joined        # il dio cosmico venerato freme (caldo)
    assert "☦ Culto rivale [[CultoB]] in ascesa" in joined  # culto rivale in ascesa
    assert "📜 La profezia [[Profezia]] matura (4/6)" in joined  # profezia che matura (inlink che avanza)
    assert sum("CultoB" in r for r in out) == 1            # NON duplicato dal grafo economico generico
    assert not any(r.startswith("⚔ Rivale [[CultoB]]") for r in out)  # il generico ha ceduto il culto-rivale


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_spinte_fronte_assi_e_scarsita(tmp_path):
    """views.spinteFronte: (1) gli ASSI di una divinità-Fronte SCENDONO sul tavolo
    (Volontà alta → interviene; intransigente+schierata → crociata; ancorata+incarnata →
    tangibile); (2) la SCARSITÀ di una risorsa è un driver economico (una risorsa rara è
    contesa anche a pressione bassa); (3) un dio venerato intransigente infiamma i fedeli."""
    harness = tmp_path / "assi.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const L=(n)=>({path:n+".md"});'
        'const all=[\n'
        '  {file:{name:"Vorth",path:"Vorth.md",inlinks:[]}, categoria:"divinita", pressione:6, clock_dim:8, clock:1,'
        '   volonta:5, etica_divina:5, polarita_cosmica:4, presenza_cosmica:4, incarnazione:5},\n'
        '  {file:{name:"Forte",path:"Forte.md",inlinks:[]}, categoria:"luogo", clock_dim:6, clock:1,'
        '   dipende_da:[L("Mithril")], produce:[L("Sale")]},\n'
        '  {file:{name:"Mithril",path:"Mithril.md"}, categoria:"risorsa", pressione:1, scarsita:"rara"},\n'
        '  {file:{name:"Sale",path:"Sale.md"}, categoria:"risorsa", pressione:0, scarsita:"scarsa"},\n'
        '  {file:{name:"Setta",path:"Setta.md",inlinks:[]}, categoria:"culto", clock_dim:4, clock:1, divinita:[L("Vorth")]},\n'
        '];\n'
        'const dv={page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};\n'
        'const f=(n)=>all.find(x=>x.file.name===n);\n'
        'Promise.all([f("Vorth"),f("Forte"),f("Setta")].map(p=>m.exports.spinteFronte({},dv,p)))'
        '.then(a=>process.stdout.write(JSON.stringify(a)));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    vorth, forte, setta = json.loads(res.stdout)
    jv = "\n".join(vorth)
    assert "Volontà interventista" in jv                       # volontà 5 → interviene
    assert "i suoi fedeli si fanno crociata" in jv             # etica 5 + polarità 4 → crociata
    assert "quasi incarnata" in jv                             # presenza 4 + incarnazione 5 → tangibile
    assert any("Mithril" in r and "rara" in r for r in forte)  # dipendenza da risorsa RARA (pressione 1)
    assert any("Sale" in r and "scarsa" in r for r in forte)   # produzione di risorsa SCARSA (pressione 0)
    assert "intransigenza divina infiamma" in "\n".join(setta) # il dio militante venerato infiamma i fedeli


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_stato_mondo(tmp_path):
    """views.renderStatoMondo (cruscotto Fronti): Fronti (clock_dim) ordinati per IMMINENZA
    = clock (countdown) + pressione autoriale + spinte dal grafo; conteggi in testa; non-
    fronti esclusi. La pressione conta: un 🔴 Crisi a clock vuoto non è più seppellito."""
    harness = tmp_path / "stato.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const L=(n)=>({path:n+".md"});'
        'const mk=(name,categoria,ex)=>Object.assign({file:{name,path:name+".md"},categoria,stato:"pronto"},ex);'
        'const all=[mk("Sale","risorsa",{pressione:8,controllata_da:L("Capitolo")}),'
        ' mk("Capitolo","fazione",{}),'
        ' mk("Forte","luogo",{clock_dim:4,clock:1,dipende_da:[L("Sale")]}),'   # 1 spinta → 0.375
        ' mk("Setta","fazione",{clock_dim:4,clock:3}),'                        # 3/4 → 0.75
        ' mk("Crisi","fazione",{pressione:9,clock_dim:6,clock:0}),'            # pressione 9, clock vuoto → 0.54
        ' mk("Quieto","luogo",{})];'                                          # niente clock → non è un fronte
        'const dv={pages:()=>({where:(fn)=>({array:()=>all.filter(fn)})}),'
        ' page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};'
        'm.exports.renderStatoMondo({},dv).then(out=>process.stdout.write(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert "**3 fronti**" in out                             # Forte + Setta + Crisi (Quieto/Sale/Capitolo no)
    assert out.index("[[Setta]]") < out.index("[[Crisi]]")   # Setta (0.75) prima di Crisi (0.54)
    assert out.index("[[Crisi]]") < out.index("[[Forte]]")   # Crisi (pressione 9, clock vuoto) NON sepolta sotto Forte (0.375)
    assert "⛓ Dipendi da [[Sale]]" in out                    # la spinta dal grafo di Forte è mostrata
    assert "3/4" in out and "1/4" in out and "0/6" in out    # stato del clock per fronte
    assert "Quieto" not in out                               # senza clock → escluso


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_motori_mondo_vivo(tmp_path):
    """meta_actions, motori del mondo vivo: propagaShock (CASCATA — BFS con decadimento per
    distanza, cicli gestiti, la sorgente non si auto-colpisce) e avanzamentoDaPressione
    (GIRO DEL MONDO — il calore/pressione decide i passi del clock)."""
    harness = tmp_path / "motori.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(META_ACTIONS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const grafo={A:[{nome:"B",via:"rivali"},{nome:"C",via:"confina_con"}],'
        ' B:[{nome:"D",via:"alleati"},{nome:"A",via:"rivali"}], C:[], D:[]};'
        'const shock=m.exports.propagaShock("A",(n)=>grafo[n]||[],[2,1]);'
        'const obj={};shock.forEach((v,k)=>{obj[k]=v;});'
        'process.stdout.write(JSON.stringify({shock:obj,'
        ' adv:[8,5,3,0].map((x)=>m.exports.avanzamentoDaPressione(x))}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["shock"]["B"] == {"delta": 2, "via": "rivali"}       # dist 1 → +2
    assert out["shock"]["C"] == {"delta": 2, "via": "confina_con"}  # dist 1 → +2
    assert out["shock"]["D"] == {"delta": 1, "via": "alleati"}      # dist 2 → +1 (decadimento)
    assert "A" not in out["shock"]                                  # sorgente: nessun auto-colpo (ciclo B→A gestito)
    assert out["adv"] == [2, 1, 0, 0]                               # 8→+2 (Crisi), 5→+1 (Tensione), 3/0→0 (Calma)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_forecast_heat_allineato(tmp_path):
    """Anti-drift fra motori: views.forecastHeat (Proiezione) DEVE dare gli stessi passi di
    meta_actions.avanzamentoDaPressione (Giro del mondo) per ogni pressione 0..10 — se
    divergono, la Proiezione mente su dove va il mondo."""
    harness = tmp_path / "drift.js"
    harness.write_text(
        'const fs=require("fs");'
        'const loadJ=(p)=>{const m={exports:{}};new Function("module","exports",fs.readFileSync(p,"utf8"))(m,m.exports);return m.exports;};'
        f'const V=loadJ({json.dumps(VIEWS_JS)});'
        f'const M=loadJ({json.dumps(META_ACTIONS_JS)});'
        'const out=[];for(let p=0;p<=10;p++)out.push([V.forecastHeat(p),M.avanzamentoDaPressione(p)]);'
        'process.stdout.write(JSON.stringify(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    pairs = json.loads(res.stdout)
    assert all(a == b for a, b in pairs), f"forecastHeat ≠ avanzamentoDaPressione: {pairs}"


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_proiezione(tmp_path):
    """views.renderProiezione (motore J, dry-run read-only): stima in quanti GIRI scatta ogni
    Fronte al ritmo attuale (calore costante: ceil((dim-clock)/passi)), ordina per imminenza,
    e anticipa l'ONDA (chi spingerà scattando, lookahead a 1 passo)."""
    harness = tmp_path / "proi.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const L=(n)=>({path:n+".md"});'
        'const all=[\n'
        '  {file:{name:"Corvi",path:"Corvi.md"}, categoria:"fazione", clock_dim:4, clock:3, pressione:7,'
        '   conseguenza:"Prendono il porto", rivali:[L("Gilda")]},\n'
        '  {file:{name:"Gilda",path:"Gilda.md"}, categoria:"fazione", clock_dim:6, clock:1, pressione:5},\n'
        '  {file:{name:"Quieto",path:"Quieto.md"}, categoria:"fazione", clock_dim:4, clock:0, pressione:2},\n'
        '];\n'
        'const dv={pages:()=>({where:(fn)=>({array:()=>all.filter(fn)})}),'
        ' page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};\n'
        'm.exports.renderProiezione({},dv).then(out=>process.stdout.write(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert out.index("[[Corvi]]") < out.index("[[Gilda]]")    # Corvi (eta 1) prima di Gilda (eta 5)
    assert "al prossimo giro" in out                          # Corvi (Crisi +2): (4-3)/2 → 1 giro
    assert "tra **5 giri**" in out                            # Gilda (Tensione +1): (6-1)/1 = 5
    assert "l'onda spingerà" in out                           # lookahead: Corvi scattando spingerà il rivale
    assert "fermo" in out                                     # Quieto (Calma) non avanza da solo


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_tensioni(tmp_path):
    """views.renderTensioni (motore G): il grafo PROPONE i suoi Fronti — rivalità inerti
    (A rivali B, nessuno già un Fronte) e profezie dormienti; un'entità che è GIÀ un Fronte
    non rigenera la proposta, e la coppia di rivali è deduplicata."""
    harness = tmp_path / "tens.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const L=(n)=>({path:n+".md"});'
        'const all=[\n'
        '  {file:{name:"Corvi",path:"Corvi.md"}, categoria:"fazione", rivali:[L("Gilda")]},\n'
        '  {file:{name:"Gilda",path:"Gilda.md"}, categoria:"fazione", rivali:[L("Corvi")]},\n'
        '  {file:{name:"Veggente",path:"Veggente.md"}, categoria:"profezia"},\n'
        '  {file:{name:"Setta",path:"Setta.md"}, categoria:"fazione", clock_dim:4, rivali:[L("Gilda")]},\n'
        '];\n'
        'const dv={pages:()=>({where:(fn)=>({array:()=>all.filter(fn)})}),'
        ' page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};\n'
        'm.exports.renderTensioni({},dv).then(out=>process.stdout.write(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert "rivalità senza orologio" in out and "Corvi" in out and "Gilda" in out  # P1
    assert out.count("⚔") == 1                                  # coppia rivali deduplicata
    assert "Veggente" in out and "profezia senza orologio" in out  # P3 dormiente
    assert "2 conflitti" in out                                 # P1 + P3; Setta esclusa (già un Fronte)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_memoria(tmp_path):
    """views.renderMemoria (il mondo ricorda): gli eventi che TOCCANO una nota (inlink
    filtrati a categoria evento) in ordine cronologico, le conseguenze marcate ⚑; "" se
    nessun evento la tocca (invisibile dove non c'è storia)."""
    harness = tmp_path / "mem.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const L=(n)=>({path:n+".md"});'
        'const all=[\n'
        '  {file:{name:"Porto",path:"Porto.md",inlinks:[L("Assedio"),L("Esito")]}, categoria:"luogo"},\n'
        '  {file:{name:"Assedio",path:"Assedio.md"}, categoria:"evento", tipo:"storico", quando:"anno 1200"},\n'
        '  {file:{name:"Esito",path:"Esito.md"}, categoria:"evento", tipo:"conseguenza", quando:"anno 1210"},\n'
        '  {file:{name:"Vuoto",path:"Vuoto.md",inlinks:[]}, categoria:"luogo"},\n'
        '];\n'
        'const dv={page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};\n'
        'const f=(n)=>all.find(x=>x.file.name===n);\n'
        'Promise.all([m.exports.renderMemoria({},dv,f("Porto")),m.exports.renderMemoria({},dv,f("Vuoto"))])'
        '.then(([a,b])=>process.stdout.write(JSON.stringify({porto:a,vuoto:b})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert "📜 Memoria — 2 eventi" in out["porto"]               # 2 eventi toccano il Porto
    assert out["porto"].index("Assedio") < out["porto"].index("Esito")  # cronologico (1200 < 1210)
    assert "⚑" in out["porto"]                                  # la conseguenza è marcata
    assert out["vuoto"] == ""                                    # nessun evento → invisibile


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_spinte_fronte_scadenza_e_fede(tmp_path):
    """views.spinteFronte: motore I (SCADENZA — una deadline in giri preme avvicinandosi) e
    motore F (FEDE⇄REALTÀ — i culti che fioriscono rafforzano il principio cosmico che
    venerano; il loop cosmo↔mortali si chiude, il culto NON è più trattato dal generico)."""
    harness = tmp_path / "scfe.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const L=(n)=>({path:n+".md"});'
        'const all=[\n'
        '  {file:{name:"Vorth",path:"Vorth.md",inlinks:[L("Setta")]}, categoria:"divinita", clock_dim:6, clock:1, scadenza:2},\n'
        '  {file:{name:"Setta",path:"Setta.md"}, categoria:"culto", pressione:7},\n'
        '];\n'
        'const dv={page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};\n'
        'const f=(n)=>all.find(x=>x.file.name===n);\n'
        'm.exports.spinteFronte({},dv,f("Vorth")).then(a=>process.stdout.write(JSON.stringify(a)));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    joined = "\n".join(out)
    assert "Scadenza tra 2 giri" in joined                       # I — la deadline incombe
    assert "La fede cresce" in joined and "[[Setta]]" in joined   # F — il culto fiorente rafforza il dio
    assert not any("Dipende da te [[Setta]]" in r for r in out)   # il culto è di F, non del generico cosmico


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_coerenza_tematica(tmp_path):
    """views.confrontoAssi + coerenzaNote: confronto su assi con lo STESSO id e note
    (contrasto forte ≥3 = tensione; rivale-specchio = tutti gli assi ≤1)."""
    harness = tmp_path / "coer.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const axes=[{id:"struttura",nome:"Struttura",valori:{1:{etichetta:"Orizzontale"},5:{etichetta:"Piramidale"}}},'
        ' {id:"legalita",nome:"Legalita",valori:{4:{etichetta:"Legale"}}}];'
        'const tg=(n,ex)=>Object.assign({file:{name:n,path:n+".md"}},ex);'
        'const c1=m.exports.confrontoAssi({struttura:5,legalita:4},tg("Ribelli",{struttura:1,legalita:4}),axes,axes);'
        'const c2=m.exports.confrontoAssi({struttura:5,legalita:4},tg("Gemello",{struttura:5,legalita:4}),axes,axes);'
        'process.stdout.write(JSON.stringify({'
        'c1:c1, tens:m.exports.coerenzaNote({field:"alleati"},tg("Ribelli"),c1),'
        'mirror:m.exports.coerenzaNote({field:"rivali"},tg("Gemello"),c2)}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    strutt = next(c for c in out["c1"] if c["id"] == "struttura")
    assert strutt["dist"] == 4                                       # 5 vs 1 → distanza 4
    assert any("Struttura" in n and "Piramidale ↔ Orizzontale" in n and "alleati ma lontani" in n for n in out["tens"])
    assert any("profilo quasi identico" in n for n in out["mirror"])  # rivale-specchio


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_tipo_profilo(tmp_path):
    """views.renderTipoProfilo: dal `tipo` della nota mostra il PROFILO del sottotipo
    (descrizione + campi dal frontmatter + flag clock/evoluzione). "" se il sottotipo
    non ha un profilo dedicato."""
    harness = tmp_path / "tp.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const core={categories:{luogo:{subtype_profiles:{dungeon:{descrizione:"Complesso esplorabile.",'
        ' campi:["livelli","occupante"],clock:true,evoluzione:false,wizard:["Origine e scopo","Il guardiano principale"]},'
        ' storico:{descrizione:"Un fatto del passato.",campi:[],clock:false,evoluzione:true}}}},'
        ' fields:{livelli:{label:"Livelli / aree"},occupante:{label:"Occupante"}},tappe_categorie:[]};'
        'const app={vault:{adapter:{read:async()=>JSON.stringify(core)}}};'
        'const dung={categoria:"luogo",tipo:"dungeon",livelli:3,occupante:"[[Corvi]]"};'
        'const altro={categoria:"luogo",tipo:"regione"};'
        'const senza={categoria:"luogo",tipo:"storico"};'
        'Promise.all([m.exports.renderTipoProfilo(app,dung),m.exports.renderTipoProfilo(app,altro),'
        ' m.exports.renderTipoProfilo(app,senza)])'
        '.then(([a,b,c])=>process.stdout.write(JSON.stringify({a,b,c})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert "🧩 dungeon" in out["a"] and "Complesso esplorabile" in out["a"]
    assert "**Livelli / aree**: 3" in out["a"] and "[[Corvi]]" in out["a"]
    assert "è un **Fronte**" in out["a"]                 # clock:true
    assert "Proprietà" in out["a"]                       # ha campi → mostra il promemoria
    assert "💡" in out["a"] and "Il guardiano principale" in out["a"]  # spunti del tipo (campo wizard attivato)
    assert out["b"] == ""                                # sottotipo senza profilo → vuoto
    # Sottotipo CON profilo ma SENZA campi (es. 'evento storico'): mostra descrizione e
    # flag, ma NON il footer «edita dal pannello Proprietà» (non ci sono campi-tipo).
    assert "🧩 storico" in out["c"] and "Un fatto del passato" in out["c"]
    assert "evolve" in out["c"] and "Proprietà" not in out["c"]
    # 'luogo' NON è in tappe_categorie (fixture) → niente riferimento «Cronologia» penzolante.
    assert "Cronologia" not in out["c"]


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_parse_tappa(tmp_path):
    """views.parseTappa (cronologia/mondo-che-cambia): "quando | stato" → struttura;
    senza '|' tutto è 'quando'."""
    harness = tmp_path / "tappa.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const P=m.exports.parseTappa;'
        'process.stdout.write(JSON.stringify({'
        'a:P("[[Era della Cenere]] | Caduto a città-stato"),'
        'b:P("Solo un\'epoca")}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["a"] == {"quando": "[[Era della Cenere]]", "stato": "Caduto a città-stato"}
    assert out["b"] == {"quando": "Solo un'epoca", "stato": ""}     # senza '|' → tutto quando


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_avanza_fronte(tmp_path):
    """meta_actions.avanza_fronte: clock +1 con cap a clock_dim; senza clock_dim no-op."""
    harness = tmp_path / "av.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const s=fs.readFileSync({json.dumps(META_ACTIONS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",s)(m,m.exports);'
        'global.Notice=function(){};'
        'const fm={clock_dim:4,clock:2};'
        'global.app={metadataCache:{getFileCache:()=>({frontmatter:fm})},'
        ' fileManager:{processFrontMatter:async(f,fn)=>fn(fm)}};'
        'const file={basename:"Fronte"};'
        '(async()=>{await m.exports.avanza_fronte(file);const a=fm.clock;'
        ' await m.exports.avanza_fronte(file);await m.exports.avanza_fronte(file);const b=fm.clock;'
        ' const fm2={};global.app.metadataCache.getFileCache=()=>({frontmatter:fm2});'
        ' await m.exports.avanza_fronte(file);'
        ' process.stdout.write(JSON.stringify({a,b,noclock:fm2.clock??null}));})();',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["a"] == 3                # 2 → 3
    assert out["b"] == 4                # 3 → 4 → 4 (cap a clock_dim)
    assert out["noclock"] is None       # niente clock_dim → nessuna mutazione


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_causalita(tmp_path):
    """views.renderCausalita: catena causale a monte (cause) e a valle (conseguenze),
    ricostruita ricorsivamente. Unione delle due direzioni: la causa di 'Patto' si
    deduce da 'Frattura'.conseguenze anche senza causato_da su 'Patto'. Esclude le
    archiviate; cicli/duplicati protetti."""
    harness = tmp_path / "caus.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const L=(n)=>({path:n+".md"});'
        'const mk=(name,ex)=>Object.assign({file:{name,path:name+".md"},categoria:"evento",stato:"pronto"},ex);'
        'const all=[mk("Crollo",{quando:"anno 0",conseguenze:[L("Frattura")]}),'      # solo lato discendente
        ' mk("Frattura",{quando:"anno 300",causato_da:[L("Crollo")],conseguenze:[L("Patto")]}),'
        ' mk("Patto",{quando:"anno 310"}),'                                          # nessun campo causale: dedotto
        ' mk("Vecchio",{quando:"anno 1",stato:"archiviata",conseguenze:[L("Patto")]})];'  # archiviato: escluso
        'const dv={pages:()=>({where:(fn)=>({array:()=>all.filter(fn)})}),'
        ' page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};'
        'const f=(n)=>all.find(x=>x.file.name===n);'
        'Promise.all([m.exports.renderCausalita({},dv,f("Frattura")),m.exports.renderCausalita({},dv,f("Patto"))])'
        '.then(([a,b])=>process.stdout.write(JSON.stringify({a,b})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    a = out["a"]                                              # Frattura: una causa, una conseguenza
    assert "⬆ Perché è successo" in a and "[[Crollo]]" in a
    assert "⬇ Cosa ne è derivato" in a and "[[Patto]]" in a
    b = out["b"]                                              # Patto: cause risalite per unione
    assert "⬆ Perché è successo" in b
    assert "[[Frattura]]" in b and "[[Crollo]]" in b         # Patto<-Frattura<-Crollo (ricorsivo)
    assert b.index("[[Frattura]]") < b.index("[[Crollo]]")   # Crollo annidato sotto Frattura
    assert "⬇ Cosa ne è derivato" not in b                   # Patto non ha conseguenze
    assert "[[Vecchio]]" not in a and "[[Vecchio]]" not in b  # archiviato non compare


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_incantesimi(tmp_path):
    """views.renderIncantesimi: trucchetti (liv 0) + incantesimi noti raggruppati per
    LIVELLO dal pool della classe, link SRD `[[..]]`, slot residui (max−uso) per livello;
    un non incantatore (nessuno spell, classe non incantatore) → "" (niente callout)."""
    harness = tmp_path / "inc.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        # personaggio.json: mago incantatore con pool per livello; ladra non incantatore.
        'const data={classi:{mago:{incantatore:true,incantesimi_pool:{'
        '"0":["Luce","Mano magica"],"1":["Dardo incantato","Scudo"],"3":["Palla di fuoco"]}},'
        ' ladra:{incantatore:false,incantesimi_pool:{}}}};'
        'global.app={vault:{adapter:{read:async()=>JSON.stringify(data)}}};'
        # PG mago liv 5: 2 trucchetti, 3 incantesimi (1º+3º), slot 3 di 1º (1 usato), 2 di 3º.
        'const mago={classe:"mago",trucchetti:["Luce","Mano magica"],'
        ' incantesimi:["Scudo","Dardo incantato","Palla di fuoco"],'
        ' slot_1:3,slot_uso_1:1,slot_3:2,slot_uso_3:0};'
        'const ladra={classe:"ladra"};'
        'Promise.all([m.exports.renderIncantesimi(app,null,mago),m.exports.renderIncantesimi(app,null,ladra)])'
        '.then(([a,b])=>process.stdout.write(JSON.stringify({a,b})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    a = out["a"]
    assert "🪄 Incantesimi" in a
    assert "**Trucchetti** (2)" in a and "[[Luce]]" in a            # liv 0
    assert "**1º livello** · slot 2/3 (2)" in a                     # max3−uso1=2 residui; 2 spell
    assert "[[Dardo incantato]]" in a and "[[Scudo]]" in a          # ordinati, linkati SRD
    assert "**3º livello** · slot 2/2 (1)" in a and "[[Palla di fuoco]]" in a
    assert a.index("Trucchetti") < a.index("1º livello") < a.index("3º livello")  # per livello
    assert out["b"] == ""                                           # non incantatore -> niente callout


def test_cosmic_axes():
    """Lo strato cosmico ha assi tematici (≥3 → radar): guard di regressione del
    finding 'entità alte mezze-costruite' (Carattere vuoto su dominio/piano/legge/
    entità primordiale). Gli assi sono in YAML/assi/<id>.yaml, rifusi da load_entities."""
    ax = CORE.get("assi_tematici", {})
    for cat in ("dominio", "piano", "legge_fondamentale", "entita_primordiale"):
        assi = ax.get(cat, [])
        assert len(assi) >= 3, f"{cat}: assi cosmici mancanti (tab Carattere vuota)"
        for a in assi:
            assert a.get("id") and a.get("nome") and len(a.get("valori", {})) == 5


def test_maestrie_catalog():
    """system.yaml maestrie_armi: 8 proprietà di maestria 2024 (nome/en/effetto).
    NB: solo gli effetti (la mappa arma→proprietà non è nel SRD 5.2.1)."""
    m = CORE.get("maestrie_armi") or []
    assert len(m) == 8
    nomi = {x["nome"] for x in m}
    # Nomi canonici SRD (combaciano col campo `padronanza` delle armi).
    assert {"Doppio fendente", "Rovesciamento", "Vessazione", "Spinta"} <= nomi
    assert all(x.get("nome") and x.get("en") and x.get("effetto") for x in m)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_maestrie(tmp_path):
    """views.maestrieMarkdown: callout quick-ref con le 8 maestrie (nome + effetto)."""
    m = CORE.get("maestrie_armi") or []
    harness = tmp_path / "ma.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const s=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const mod={exports:{}};new Function("module","exports",s)(mod,mod.exports);'
        f'const m={json.dumps(m, ensure_ascii=False)};'
        'process.stdout.write(mod.exports.maestrieMarkdown(m));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert "Maestria delle armi 2024" in out
    assert "**Rovesciamento**" in out and "Prono" in out


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_append_turno_log(tmp_path):
    """meta_actions.appendTurnoLog: crea la sezione 'Registro dei turni' se assente
    e inserisce le voci nuove IN CIMA (più recente prima)."""
    harness = tmp_path / "tl.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const s=fs.readFileSync({json.dumps(META_ACTIONS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",s)(m,m.exports);'
        'const f=m.exports.appendTurnoLog;'
        'let c=f("# Bastione\\n\\nDesc.\\n","2026-06-01","Fabbricato un anello.");'
        'c=f(c,"2026-06-08","Commerciato beni.");'
        'process.stdout.write(c);',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert out.count("## Registro dei turni") == 1     # sezione creata una sola volta
    assert out.index("2026-06-08") < out.index("2026-06-01")  # più recente in cima


# --- Sito dei giocatori (build_site) ----------------------------------------
import build_site  # noqa: E402


