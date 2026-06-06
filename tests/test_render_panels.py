"""Test GDR — render_panels. Fixtures condivise (CORE/TEMPLATES/_snapshot/...) in _common."""

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
    CORE, PLUGINS, TEMPLATES, PAGES, SNAP_DIR, VIEWS_JS, VIEWS_SRC,
    _snapshot, _env, _PG_HARNESS, _run_crea_pg,
)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_timeline(tmp_path):
    """views.renderTimeline: raggruppa gli eventi per epoca (callout), li ordina
    per 'quando', esclude le archiviate, mette 'Senza epoca' in fondo, risolve i
    link epoca e mostra l'intervallo inizio–fine dell'epoca."""
    harness = tmp_path / "timeline.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        # Dataset: 1 epoca + 3 eventi attivi (2 nell\'epoca, 1 senza) + 1 archiviato.
        'const era={file:{name:"Prima",path:"ep/Prima.md"},categoria:"epoca",inizio:"anno 0",fine:"anno 500"};'
        'const all=[era,'
        ' {file:{name:"Guerra",path:"e/G.md"},categoria:"evento",stato:"pronto",quando:"anno 300",epoca:{path:"ep/Prima.md"},portata:"globale",tipo:"conflitto"},'
        ' {file:{name:"Fondazione",path:"e/F.md"},categoria:"evento",stato:"pronto",quando:"anno 100",epoca:{path:"ep/Prima.md"},portata:"regionale"},'
        ' {file:{name:"Presagio",path:"e/P.md"},categoria:"evento",stato:"bozza",quando:"anno 50"},'
        ' {file:{name:"Vecchio",path:"e/V.md"},categoria:"evento",stato:"archiviata",quando:"anno 1"}];'
        'const dv={pages:()=>({where:(fn)=>({array:()=>all.filter(fn)})}),'
        ' page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};'
        'm.exports.renderTimeline({},dv,null).then(out=>process.stdout.write(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert out.startswith("**3 eventi** · 1 epoca")        # archiviato escluso; 1 epoca
    assert "🏛 Prima · anno 0 – anno 500 (2)" in out        # link epoca risolto + intervallo + conteggio
    assert "🌫 Senza epoca" in out                          # evento senza epoca raggruppato
    # ordinamento per 'quando' dentro l'epoca: Fondazione (100) prima di Guerra (300)
    assert out.index("[[Fondazione]]") < out.index("[[Guerra]]")
    # l'epoca (inizio 0) precede 'Senza epoca' (in fondo)
    assert out.index("🏛 Prima") < out.index("🌫 Senza epoca")
    assert "**anno 100** [[Fondazione]] · regionale" in out
    assert "[[Vecchio]]" not in out                          # archiviato non compare
    # Nastro grafico delle epoche (resa "a colpo d'occhio") sopra il dettaglio pieghevole.
    assert '<div class="gdr-timeline">' in out and "gdr-tl-era" in out
    assert 'gdr-tl-name">🏛 Prima' in out                    # l'epoca compare nel nastro
    assert "2 voci" in out                                   # conteggio voci nel segmento (2 eventi nell'epoca)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_timeline_tappe(tmp_path):
    """views.renderTimeline integra le `tappe` delle entità durature nella linea del
    tempo (📜, il mondo che evolve): raggruppate per epoca se il 'quando' nomina
    un'epoca esistente, altrimenti in fondo; il conteggio tappe entra nell'intestazione."""
    harness = tmp_path / "timeline_tappe.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const era={file:{name:"Prima",path:"ep/Prima.md"},categoria:"epoca",inizio:"anno 0",fine:"anno 500"};'
        'const all=[era,'
        ' {file:{name:"Guerra",path:"e/G.md"},categoria:"evento",stato:"pronto",quando:"anno 300",epoca:{path:"ep/Prima.md"},portata:"globale"},'
        ' {file:{name:"Presagio",path:"e/P.md"},categoria:"evento",stato:"pronto",quando:"anno 50"},'
        ' {file:{name:"Capitale",path:"l/C.md"},categoria:"luogo",stato:"pronto",'
        '  tappe:["Prima | Fondata sulle rovine","Era Buia | Caduta nel silenzio"]}];'
        'const dv={pages:()=>({where:(fn)=>({array:()=>all.filter(fn)})}),'
        ' page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};'
        'm.exports.renderTimeline({},dv,null).then(out=>process.stdout.write(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert out.startswith("**2 eventi** · **2 tappe** · 1 epoca")          # conteggio tappe in testa
    assert "🏛 Prima · anno 0 – anno 500 (2)" in out                       # 1 evento + 1 tappa nell'epoca
    assert "📜 **Prima** [[Capitale]] — Fondata sulle rovine" in out       # tappa che nomina l'epoca
    assert "📜 **Era Buia** [[Capitale]] — Caduta nel silenzio" in out     # tappa senza epoca → in fondo
    assert "🌫 Senza epoca" in out


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_condizioni(tmp_path):
    """views.condizioniMarkdown: callout pieghevole con le condizioni (nome linkato
    alla nota SRD + effetti compatti), e messaggio se la lista è vuota."""
    harness = tmp_path / "cond.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const cond=[{nome:"Accecato",descrizione:"Non vede.",effetti:['
        '{nome:"Vista",descrizione:"Fallisce le prove basate sulla vista."},'
        '{nome:"Attacchi",descrizione:"Attacchi contro: vantaggio."}]}];'
        'process.stdout.write(JSON.stringify({'
        'full:m.exports.condizioniMarkdown(cond),empty:m.exports.condizioniMarkdown([])}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert "[!quote]- 📋 Condizioni 5.5e (quick-ref)" in out["full"]
    assert "**[[Accecato]]**" in out["full"]                       # nome linkato alla nota SRD
    assert "Fallisce le prove basate sulla vista. Attacchi contro: vantaggio." in out["full"]  # effetti uniti
    assert "non disponibili" in out["empty"]                       # lista vuota -> messaggio


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_connessioni(tmp_path):
    """views.renderConnessioni: tabella delle relazioni tipizzate forward risolte
    (Relazione/Nota/Tipo/Pressione); vuoto se nessun collegamento."""
    harness = tmp_path / "conn.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const core={relazioni:{fazione:[{field:"alleati",label:"Alleati"},{field:"capi",label:"Capi"}]}};'
        'global.app={vault:{adapter:{read:async()=>JSON.stringify(core)}}};'
        'const target={file:{name:"Casa Rossa"},categoria:"fazione",pressione:6};'
        'const dv={page:(l)=>((l&&l.path?l.path:l)==="[[Casa Rossa]]"?target:null)};'
        'const page={categoria:"fazione",alleati:["[[Casa Rossa]]"],capi:null};'
        'Promise.all(['
        '  m.exports.renderConnessioni(app,dv,page),'
        '  m.exports.renderConnessioni(app,dv,{categoria:"fazione"}),'
        ']).then(([a,b])=>process.stdout.write(JSON.stringify({a,b})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert "🕸 Rete di collegamenti" in out["a"]
    assert "| Alleati | [[Casa Rossa]] | fazione |" in out["a"]   # relazione risolta in riga
    assert "Tensione (6)" in out["a"]                              # pressione etichettata
    assert out["b"] == ""                                          # nessun collegamento -> vuoto


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_radar_markdown_from_values(tmp_path):
    """views.radarMarkdownFromValues: SVG inline (.gdr-radar) dai valori-assi passati
    (alimenta il radar REATTIVO meta-bind-js-view); messaggio se < 3 assi."""
    harness = tmp_path / "radar.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const v5={1:{},2:{},3:{},4:{},5:{}};'
        'const ax=(id)=>({id,nome:id,valori:v5});'
        'const core={assi_tematici:{culto:[ax("a"),ax("b"),ax("c")],poche:[ax("a")]}};'
        'process.stdout.write(JSON.stringify({'
        'full:m.exports.radarMarkdownFromValues(core,"culto",{a:4,b:2,c:5},"Test"),'
        'few:m.exports.radarMarkdownFromValues(core,"poche",{a:3},"Test")}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["full"].startswith('<div class="gdr-radar">') and "<svg" in out["full"]
    assert "Servono almeno 3 assi" in out["few"]


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_entity_panel(tmp_path):
    """views.renderEntityPanel: griglia stato-tavolo (uso/gancio/pressione/mossa) con
    classe ready/missing + backlinks risolti (renderBacklinks). Vuoto se page null."""
    harness = tmp_path / "entitypanel.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const citante={file:{name:"Forte Cenere"},categoria:"luogo",pressione:5};'
        'const dv={page:(l)=>((((l&&l.path)?l.path:l)==="[[Forte Cenere]]")?citante:null)};'
        'const page={uso_al_tavolo:"Hub dei PG",gancio:"",pressione:7,'
        'prossima_mossa:"Raddoppia le guardie",file:{inlinks:["[[Forte Cenere]]"]}};'
        'process.stdout.write(JSON.stringify({'
        'full:m.exports.renderEntityPanel(dv,page),'
        'empty:m.exports.renderEntityPanel(dv,null)}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert "Uso al tavolo" in out["full"] and "Prossima mossa" in out["full"]
    assert "gdr-card missing" in out["full"]          # gancio vuoto -> card "missing"
    assert "Crisi (7)" in out["full"]                  # pressione 7 etichettata
    assert "Citato da:" in out["full"] and "[[Forte Cenere]]" in out["full"]  # backlink risolto
    assert "Apri la nota" in out["empty"]


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_session_panel(tmp_path):
    """views.renderSessionPanel: card obiettivo/scena + tabella 'Fronti collegati' coi
    fronti (pressione + prossima mossa) delle note in `connessioni`. Vuoto se page null."""
    harness = tmp_path / "sessionpanel.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const front={file:{name:"La Setta"},pressione:8,prossima_mossa:"Apre la Voragine"};'
        'const dv={page:(l)=>((((l&&l.path)?l.path:l)==="[[La Setta]]")?front:null)};'
        'const page={obiettivo:"Fermare la Setta",scena_corrente:"Forte Cenere",'
        'connessioni:["[[La Setta]]"]};'
        'process.stdout.write(JSON.stringify({'
        'full:m.exports.renderSessionPanel(dv,page),'
        'empty:m.exports.renderSessionPanel(dv,null)}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert "Obiettivo" in out["full"] and "Fronti collegati" in out["full"]
    assert "Apre la Voragine" in out["full"] and "Crisi (8)" in out["full"]
    assert "Apri la sessione" in out["empty"]


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_diagnostica(tmp_path):
    """views.renderDiagnostica: confronta i plugin ESSENZIALI (core.json:plugins) coi
    plugin ATTIVI in Obsidian. Tutti attivi -> messaggio OK; qualcuno spento -> avviso
    + tabella (nome + cosa rompe) coi SOLI mancanti. Non usa Dataview (gira anche se
    Dataview è spento, il caso da diagnosticare). pluginAttivi normalizza Set/array."""
    harness = tmp_path / "diag.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const core={plugins:[{id:"a",name:"Alpha",rompe:"Le X non si vedono."},'
        '{id:"b",name:"Beta",rompe:"Le Y non funzionano."}]};'
        'const mk=(on)=>({vault:{adapter:{read:async()=>JSON.stringify(core)}},'
        'plugins:{enabledPlugins:new Set(on)}});'
        'Promise.all(['
        '  m.exports.renderDiagnostica(mk(["a","b"])),'
        '  m.exports.renderDiagnostica(mk(["a"])),'
        ']).then(([ok,miss])=>process.stdout.write(JSON.stringify({ok,miss,'
        'arr:[...m.exports.pluginAttivi({plugins:{enabledPlugins:["x"]}})]})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert "✅" in out["ok"] and "essenziali sono attivi" in out["ok"]      # tutti attivi -> OK
    assert "Manca 1 plugin essenziale su 2" in out["miss"]                  # singolare corretto
    assert "**Beta**" in out["miss"] and "Le Y non funzionano." in out["miss"]  # mancante + cosa rompe
    assert "Alpha" not in out["miss"]                                       # gli attivi non compaiono
    assert out["arr"] == ["x"]                                              # pluginAttivi normalizza l'array


# Mock minimale dell'elemento Obsidian (createEl) per testare il percorso di
# INJECTION nel DOM dei radar — la classe di bug che si è rotta in-app (il radar
# non disegnava). snap() riassume i figli iniettati: classe, presenza di <svg>, testo.
_DOM_HARNESS = (
    'function makeEl(){const el={children:[],innerHTML:"",text:""};'
    'el.createEl=(tag,o)=>{o=o||{};const c=makeEl();c.tag=tag;c.cls=o.cls;'
    'if(o.text!=null)c.text=o.text;el.children.push(c);return c;};return el;}'
    'function snap(el){return el.children.map(c=>'
    '({cls:c.cls,svg:String(c.innerHTML).includes("<svg"),text:c.text}));}'
)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_axes_compare(tmp_path):
    """views.renderAxesCompare: sovrappone gli assi delle note in `confronta` (≥3 assi,
    ≥1 entità della categoria) -> .gdr-radar con <svg>; guida se manca `confronta`."""
    harness = tmp_path / "axescompare.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        + _DOM_HARNESS +
        'const v5={1:{},2:{},3:{},4:{},5:{}};const ax=(id)=>({id,nome:id,valori:v5});'
        'const core={assi_tematici:{culto:[ax("a"),ax("b"),ax("c")]}};'
        'const app={vault:{adapter:{read:async()=>JSON.stringify(core)}}};'
        'const A={file:{name:"A"},categoria:"culto",a:5,b:1,c:3};'
        'const B={file:{name:"B"},categoria:"culto",a:2,b:4,c:5};'
        'const dv={page:(l)=>{const p=((l&&l.path)?l.path:l);'
        'return p==="[[A]]"?A:(p==="[[B]]"?B:null);}};'
        'const c1=makeEl(),c2=makeEl();'
        'Promise.all(['
        '  m.exports.renderAxesCompare(c1,app,dv,{confronta:["[[A]]","[[B]]"]}),'
        '  m.exports.renderAxesCompare(c2,app,dv,{}),'
        ']).then(()=>process.stdout.write(JSON.stringify('
        '{full:snap(c1),none:snap(c2)})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["full"][0]["cls"] == "gdr-radar" and out["full"][0]["svg"] is True
    assert out["none"][0]["cls"] == "gdr-radar-empty"        # niente confronta -> guida
    assert "confronta" in (out["none"][0]["text"] or "")     # messaggio col formato


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_emergenza_scala(tmp_path):
    """SYS-3 — stress-test dell'emergenza a scala: un grafo grande e SPORCO (84 fronti,
    link pendenti, pressione mancante, principi cosmici con molti inlink). Le funzioni
    emergenti NON devono crashare (robustezza) e l'output del cruscotto deve restare
    LIMITATO (niente muro illimitato di fronti). Emette anche dimensione/tempo."""
    harness = tmp_path / "scala.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        # core minimale: assi + relazioni per fazione (per renderCoerenza)
        'const ax=(id)=>({id,nome:id,valori:{1:{etichetta:"a"},2:{},3:{},4:{},5:{etichetta:"e"}}});'
        'const core={assi_tematici:{fazione:[ax("struttura"),ax("scopo"),ax("legalita")]},'
        'relazioni:{fazione:[{field:"alleati",label:"Alleati"},{field:"rivali",label:"Rivali"}]}};'
        'const app={vault:{adapter:{read:async()=>JSON.stringify(core)}}};'
        # generatore di grafo sintetico
        'const pages=[];const byPath=new Map();'
        'function mk(name,fm){const p=Object.assign({file:{name,path:name+".md",inlinks:[]},categoria:"luogo"},fm||{});'
        'pages.push(p);byPath.set("[["+name+"]]",p);byPath.set(name+".md",p);return p;}'
        'const dv={page:(l)=>{const k=(l&&l.path)?l.path:l;return byPath.get(k)||null;},'
        'pages:()=>({where:(fn)=>({array:()=>pages.filter(fn)})})};'
        # 60 risorse: pressione variabile (alcune hot, alcune ASSENTI = dati sporchi)
        'for(let i=0;i<60;i++){mk("R"+i,{categoria:"risorsa",'
        'pressione:i%3===0?8:(i%5===0?undefined:2),'
        'controllata_da:i%4===0?"[[Casata"+i+"]]":undefined});}'
        # 80 fronti con link al pool + un link PENDENTE per campo (GHOST = non risolve)
        'const F=80;for(let i=0;i<F;i++){const dim=4+(i%5);'
        'mk("Fronte"+i,{categoria:i%2?"fazione":"luogo",clock_dim:dim,clock:i%(dim+1),'
        'prossima_mossa:i%3?"mossa "+i:undefined,'
        'dipende_da:["[[R"+(i%60)+"]]","[[GHOST"+i+"]]"],'
        'produce:["[[R"+((i*7)%60)+"]]"],rotta_con:["[[R"+((i*3)%60)+"]]"],'
        'rivali:["[[Fronte"+((i+1)%F)+"]]","[[GHOSTR"+i+"]]"]});}'
        # 4 principi cosmici (dominio) come fronti, con MOLTI inlink (stress loop cosmico)
        'for(let c=0;c<4;c++){const cosm=mk("Principio"+c,{categoria:"dominio",clock_dim:6,clock:3,'
        'luoghi:["[[R"+c+"]]","[[R"+(c+3)+"]]"]});'
        'for(let k=0;k<40;k++){cosm.file.inlinks.push({path:"R"+((c*5+k)%60)+".md"});}}'
        # una fazione molto collegata per renderCoerenza (assi + 30 rivali, 1 pendente)
        'const faz=mk("Egemone",{categoria:"fazione",struttura:5,scopo:1,legalita:5,rivali:[]});'
        'for(let i=0;i<30;i++){mk("Riv"+i,{categoria:"fazione",struttura:i%5+1,scopo:(i*2)%5+1,legalita:(i*3)%5+1});'
        'faz.rivali.push("[[Riv"+i+"]]");}faz.rivali.push("[[GHOSTFAZ]]");'
        # run + metriche
        '(async()=>{'
        'const t0=Date.now();'
        'const sm=await m.exports.renderStatoMondo(app,dv);'
        'const t1=Date.now();'
        'const co=await m.exports.renderCoerenza(app,dv,faz);'
        'const sf=await m.exports.spinteFronte(app,dv,byPath.get("[[Principio0]]"));'
        'const blocks=(sm.match(/\\*\\*\\[\\[/g)||[]).length;'
        'const tot=(sm.match(/(\\d+) fronti/)||[])[1];'
        'process.stdout.write(JSON.stringify({ok:true,smLen:sm.length,blocks,'
        'totFronti:tot?Number(tot):null,coOk:co.includes("Coerenza"),'
        'coLines:(co.match(/> - /g)||[]).length,sfLen:sf.length,ms:t1-t0}));'
        '})().catch(e=>process.stdout.write(JSON.stringify({ok:false,err:String((e&&e.stack)||e)})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["ok"], out.get("err")                 # ROBUSTEZZA: niente crash su grafo sporco
    assert out["totFronti"] == 84                    # conta TUTTI i fronti (80 + 4 cosmici)
    assert out["coOk"]                               # coerenza gira su nota molto collegata
    # CAP anti-muro (SYS-3): il cruscotto tronca ai 12 più imminenti pur dichiarando il
    # totale (84); la coerenza tronca a 8 spunti + 1 riga di overflow.
    assert out["blocks"] <= 12, f"renderStatoMondo non limitato: {out['blocks']} blocchi"
    assert out["coLines"] <= 9, f"renderCoerenza non limitato: {out['coLines']} righe"
    # METRICA osservata (non assert flaky sul tempo): stampata per la diagnosi SYS-3.
    import sys as _sys
    print(f"\n[SYS-3] fronti={out['totFronti']} blocchi_resi={out['blocks']} "
          f"len={out['smLen']} coLines={out['coLines']} sfLen={out['sfLen']} ms={out['ms']}",
          file=_sys.stderr)


def test_astrologia_catalog():
    """Catalogo tema natale (astrologia.yaml): 12 segni (con archetipo/elemento/
    mbti), 22 arcani, 4 elementi — recupero #9."""
    a = render.load_yaml("astrologia.yaml")
    assert len(a["segni"]) == 12 and len(a["arcani"]) == 22 and len(a["elementi"]) == 4
    ari = next(s for s in a["segni"] if s["nome"] == "Ariete")
    assert ari["archetipo"] == "Il Pioniere" and ari["elemento"] == "Fuoco"
    assert ari["mbti"] and ari["ombra"]  # MBTI + ombra presenti
    assert all(s.get("archetipo") and s.get("elemento") for s in a["segni"])


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_tema_natale(tmp_path):
    """views.temaNataleMarkdown: dal segno deriva archetipo/elemento/MBTI/ombra,
    aggiunge l'arcano (destino) e l'allineamento D&D; suggerimento se vuoto."""
    a = render.load_yaml("astrologia.yaml")
    harness = tmp_path / "tema.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        f'const astro={json.dumps(a, ensure_ascii=False)};'
        'process.stdout.write(JSON.stringify({'
        'full:m.exports.temaNataleMarkdown(astro,{segno:"Ariete",arcano:"Il Matto",allineamento:"Caotico Buono"}),'
        'empty:m.exports.temaNataleMarkdown(astro,{})}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert "*Il Pioniere*" in out["full"] and "Fuoco cardinale" in out["full"]  # archetipo + elemento/modalità
    assert "MBTI ESTP/ENTJ" in out["full"]                                       # MBTI derivato
    assert "Ombra" in out["full"] and "Il Distruttore" in out["full"]            # ombra (per i difetti)
    assert "Arcano 0 · Il Matto" in out["full"]                                  # arcano destino
    assert "Caotico Buono" in out["full"]                                        # allineamento D&D accanto
    assert out["empty"].startswith("> [!tip] Tema natale")                       # vuoto -> guida


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_map(tmp_path):
    """views.renderMap: un'IMMAGINE → blocco zoommap interattivo (pan/zoom/pin); una
    nota/Excalidraw → embed ![[..]]; campo vuoto → suggerimento."""
    harness = tmp_path / "map.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const link={mappa:{path:"Mondi/Mappe/Valdoria.excalidraw.md"}};'
        'const imgLink={mappa:{path:"Media/Atlante.webp"}};'
        'const str={mappa:"[[Atlante.png]]"};'
        'const emb={mappa:"![[Atlante.png]]"};'  # imageSuggester può scrivere un embed
        'Promise.all(['
        '  m.exports.renderMap({},{},link),'
        '  m.exports.renderMap({},{},imgLink),'
        '  m.exports.renderMap({},{},str),'
        '  m.exports.renderMap({},{},{}),'
        '  m.exports.renderMap({},{},emb),'
        ']).then(([a,b,c,d,e])=>process.stdout.write(JSON.stringify({a,b,c,d,e})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["a"] == "![[Valdoria.excalidraw]]"                     # Excalidraw (.md) -> embed
    assert out["b"].startswith("```zoommap") and "image: Media/Atlante.webp" in out["b"]  # immagine (Link) -> mappa interattiva
    assert out["c"].startswith("```zoommap") and "image: Atlante.png" in out["c"]         # immagine (stringa) -> mappa interattiva
    assert out["d"].startswith("> [!tip] Nessuna mappa")             # campo vuoto -> guida
    assert out["e"].startswith("```zoommap") and "image: Atlante.png" in out["e"]         # immagine (![[embed]] da imageSuggester) -> mappa interattiva


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_sali_pg_e2e(tmp_path):
    """sali_pg.js sale un PG di livello (mock Obsidian): un mago L1->L2 aggiorna
    livello/competenza/slot dalla progressione e i PF (media fissa + mod COS)."""
    import build_personaggio
    pj = tmp_path / "personaggio.json"
    pj.write_text(json.dumps(build_personaggio.build_personaggio_options(CORE), ensure_ascii=False), encoding="utf-8")
    harness = tmp_path / "sali.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const data=fs.readFileSync({json.dumps(str(pj))},"utf8");'
        'global.Notice=class{constructor(m){}};'
        'const fm={tipo:"pg",classe:"mago",livello:1,costituzione:14,pf:8,pf_max:8,competenza:2,slot_1:2,'
        'trucchetti:["a","b","c"],incantesimi:["s1","s2","s3","s4"]};'
        'const file={basename:"Test",path:"x.md"};'
        'global.app={workspace:{getActiveFile:()=>file},metadataCache:{getFileCache:()=>({frontmatter:fm})},'
        'vault:{adapter:{read:async()=>data}},fileManager:{processFrontMatter:async(f,fn)=>fn(fm)}};'
        'const tp={system:{suggester:async(l,v)=>v[0]}};'
        f'require({json.dumps(str(render.JS_DIR / "sali_pg.js"))})(tp)'
        '.then(()=>process.stdout.write(JSON.stringify(fm)));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    fm = json.loads(res.stdout)
    assert fm["livello"] == 2
    assert fm["pf_max"] == 14  # 8 + (floor(6/2)+1) + mod(COS 14)=+2 = 8+4+2
    assert fm["competenza"] == 2 and fm["slot_1"] == 3
    assert fm["dadi_vita_max"] == 2  # Dadi Vita = livello del PG


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_sali_pg_sottoclasse_homebrew_e2e(tmp_path):
    """sali_pg.js: un PG di CLASSE homebrew, al `livello_sottoclasse`, riceve la
    SOTTOCLASSE homebrew del vault legata alla classe (qui unica → assegnata auto)."""
    import build_personaggio
    pj = tmp_path / "personaggio.json"
    pj.write_text(json.dumps(build_personaggio.build_personaggio_options(CORE), ensure_ascii=False), encoding="utf-8")
    harness = tmp_path / "salisub.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const data=fs.readFileSync({json.dumps(str(pj))},"utf8");'
        'global.Notice=class{constructor(m){}};'
        # PG di classe homebrew "Cinerante", livello 2 → sale a 3 (livello_sottoclasse).
        'const fm={tipo:"pg",classe:"Cinerante",livello:2,costituzione:12,pf:14,pf_max:14,competenza:2};'
        'const pgFile={basename:"PG",path:"pg.md"};'
        'const F=(basename,f)=>({f:{basename,path:basename+".md"},fm:f});'
        'const vault=[F("Cinerante",{categoria:"classe",dado_vita:"d8",ts_competenze:"Intelligenza, Saggezza",'
        '   tipo_incantatore:"nessuno",livello_sottoclasse:3}),'
        ' F("Via della Cenere",{categoria:"sottoclasse",classe:"[[Cinerante]]"})];'
        'global.app={workspace:{getActiveFile:()=>pgFile},'
        ' metadataCache:{getFileCache:(file)=>({frontmatter: file===pgFile ? fm : (vault.find(x=>x.f===file)||{}).fm})},'
        ' vault:{adapter:{read:async()=>data},getMarkdownFiles:()=>vault.map(x=>x.f)},'
        ' fileManager:{processFrontMatter:async(f,fn)=>fn(fm)}};'
        'const tp={system:{suggester:async(l,v)=>v[0]}};'
        f'require({json.dumps(str(render.JS_DIR / "sali_pg.js"))})(tp)'
        '.then(()=>process.stdout.write(JSON.stringify(fm)));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    fm = json.loads(res.stdout)
    assert fm["livello"] == 3
    assert fm["sottoclasse"] == "Via della Cenere"  # sottoclasse homebrew assegnata al 3º livello


def test_scena_indizio_model():
    """Modello entità scena/indizio (design d'avventura): gruppo tavolo, snodo/climax
    CHIAVE (regola dei 3 indizi), relazioni tipizzate e reciproci coerenti (scena↔
    indizio↔missione). L'integrità degli inversi regge a livello globale."""
    cats = CORE["categories"]
    assert cats.get("scena", {}).get("gruppo") == "tavolo"
    assert cats.get("indizio", {}).get("gruppo") == "tavolo"
    prof = cats["scena"]["subtype_profiles"]
    assert prof["snodo"].get("chiave") is True and prof["climax"].get("chiave") is True
    assert not prof["scena"].get("chiave") and not prof["apertura"].get("chiave")  # solo gli snodi
    rel = {r["field"]: r for r in CORE["relazioni"]["scena"]}
    assert rel["missione"]["reciprocal"] == "scene"
    assert rel["conduce_a"]["category"] == "scena"  # flusso (self-relation direzionale)
    assert rel["indizi"]["reciprocal"] == "rivela" and rel["indizi_qui"]["reciprocal"] == "scena"
    irel = {r["field"]: r for r in CORE["relazioni"]["indizio"]}
    assert irel["rivela"]["category"] == "scena" and irel["rivela"]["reciprocal"] == "indizi"
    assert irel["scena"]["reciprocal"] == "indizi_qui"
    assert any(r["field"] == "scene" and r["reciprocal"] == "missione" for r in CORE["relazioni"]["missione"])
    import validate
    assert validate.validate_reciprocals(CORE) == []  # nessun inverso fantasma


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_filo_avventura_tre_indizi(tmp_path):
    """views.renderFiloAvventura: elenca le scene dell'avventura col flusso «Conduce a»
    e applica la REGOLA DEI 3 INDIZI — uno snodo CHIAVE rivelato da <3 indizi finisce
    nell'avviso (con conteggio n/3); una scena non-chiave no."""
    core = {"categories": {"scena": {"subtype_profiles": {"snodo": {"chiave": True}, "climax": {"chiave": True}}}}}
    harness = tmp_path / "filo.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        f'const core={json.dumps(core)};'
        'const app={vault:{adapter:{read:async()=>JSON.stringify(core)}}};'
        'const P=(name,fm)=>Object.assign({file:{name,path:name+".md"}},fm);'
        # Avventura: Apertura (corrente) → Snodo (chiave) rivelato da soli 2 indizi.
        'const apertura=P("Apertura",{categoria:"scena",tipo:"apertura",missione:{path:"M.md"},conduce_a:[{path:"Snodo.md"}]});'
        'const snodo=P("Snodo",{categoria:"scena",tipo:"snodo",missione:{path:"M.md"}});'
        'const miss={file:{name:"M",path:"M.md"},categoria:"missione"};'
        'const c1=P("C1",{categoria:"indizio",rivela:[{path:"Snodo.md"}]});'
        'const c2=P("C2",{categoria:"indizio",rivela:[{path:"Snodo.md"}]});'
        'const all=[apertura,snodo,miss,c1,c2];'
        'const byp={};all.forEach(p=>byp[p.file.path]=p);'
        'const dv={pages:()=>({where:(fn)=>({array:()=>all.filter(fn)})}),page:(l)=>byp[(l&&l.path)||l]||null};'
        'm.exports.renderFiloAvventura(app,dv,apertura).then(out=>process.stdout.write(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert "Filo dell'avventura" in out
    assert "[[Apertura]]" in out and "[[Snodo]]" in out          # entrambe le scene elencate
    assert "conduce a: [[Snodo]]" in out                          # flusso «Conduce a»
    assert "🔴 2/3 indizi" in out                                 # snodo chiave sotto-soglia
    warn = out.split("Regola dei 3 indizi")[1]                    # sezione avviso
    assert "[[Snodo]] (2/3)" in warn
    assert "[[Apertura]]" not in warn                             # la scena non-chiave non è segnalata


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_timeline_corsie(tmp_path):
    """views.renderTimelineCorsie: una corsia per ATTORE — ogni Fazione/PNG coinvolto
    riceve gli eventi nel proprio filo (esclusi gli archiviati), le entità con `tappe`
    formano la propria corsia, e ogni filo è ordinato cronologicamente."""
    harness = tmp_path / "corsie.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const corvi={file:{name:"Corvi",path:"f/Corvi.md"},categoria:"fazione"};'
        'const re={file:{name:"Re",path:"p/Re.md"},categoria:"personaggio",tappe:["anno 10 | incoronato"]};'
        'const all=[corvi,re,'
        ' {file:{name:"Assedio",path:"e/A.md"},categoria:"evento",stato:"pronto",quando:"anno 20",fazioni:[{path:"f/Corvi.md"}],coinvolti:[{path:"p/Re.md"}],portata:"regionale"},'
        ' {file:{name:"Patto",path:"e/P.md"},categoria:"evento",stato:"pronto",quando:"anno 5",fazioni:[{path:"f/Corvi.md"}]},'
        ' {file:{name:"Vecchio",path:"e/V.md"},categoria:"evento",stato:"archiviata",quando:"anno 1",fazioni:[{path:"f/Corvi.md"}]}];'
        'const byp={};all.forEach(p=>byp[p.file.path]=p);'
        'const dv={pages:()=>({where:(fn)=>({array:()=>all.filter(fn)})}),page:(l)=>byp[(l&&l.path)||l]||null};'
        'm.exports.renderTimelineCorsie({},dv).then(out=>process.stdout.write(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert "fili paralleli" in out
    assert "🎭 [[Corvi]]" in out and "🎭 [[Re]]" in out           # una corsia per attore
    corvi = out.split("🎭 [[Corvi]]")[1].split("🎭")[0]          # blocco-corsia dei Corvi
    assert "[[Patto]]" in corvi and "[[Assedio]]" in corvi and "[[Vecchio]]" not in corvi  # niente archiviati
    assert corvi.index("[[Patto]]") < corvi.index("[[Assedio]]")  # ordine cronologico (anno 5 < 20)
    reblock = out.split("🎭 [[Re]]")[1]                           # Re: evento da coinvolto + tappa
    assert "[[Assedio]]" in reblock and "incoronato" in reblock


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_tabella(tmp_path):
    """views.renderTabella: numera le voci (una per riga, prefissi di elenco tollerati) e
    offre il tiro 1dN; un `dado` dichiarato più grande lascia i risultati alti a «ritira»."""
    harness = tmp_path / "tab.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const auto={categoria:"tabella",voci:"- Goblin\\n2. Lupi\\nBriganti"};'        # 3 voci, prefissi misti
        'const d6={categoria:"tabella",dado:"d6",voci:"Pioggia\\nNebbia\\nVento"};'       # 3 voci, dado dichiarato 6
        'Promise.all([m.exports.renderTabella({},auto),m.exports.renderTabella({},d6)])'
        '.then(([a,b])=>process.stdout.write(JSON.stringify({a,b})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    o = json.loads(res.stdout)
    assert "dice: 1d3" in o["a"]                          # dado auto = n. voci
    assert "| 1 | Goblin |" in o["a"] and "| 2 | Lupi |" in o["a"] and "| 3 | Briganti |" in o["a"]  # prefissi rimossi
    assert "dice: 1d6" in o["b"] and "ritira" in o["b"]   # dado dichiarato > voci → alti = ritira


