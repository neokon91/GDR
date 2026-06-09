"""Test GDR — render_rules. Fixtures condivise (CORE/TEMPLATES/_snapshot/...) in _common."""

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
def test_profilo_match(tmp_path):
    """views.archetipiMatch: una combinazione di valori-assi attiva l'archetipo
    atteso (teocrazia su 'culto' con struttura/legalità alti), sui dati reali."""
    archetipi = CORE.get("archetipi", {}).get("culto") or []
    assert archetipi, "archetipi 'culto' assenti dal modello"
    harness = tmp_path / "profilo.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        f'const a={json.dumps(archetipi, ensure_ascii=False)};'
        'const r=m.exports.archetipiMatch(a,{struttura:5,legalita:5,rivelazione:3});'
        'process.stdout.write(JSON.stringify({ids:r.map(x=>x.id),tags:m.exports.profiloTags(r)}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert "teocrazia" in out["ids"]
    assert "profilo/ufficiale" in out["tags"]


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_preset_valori(tmp_path):
    """create_entity.presetValori deriva i valori-assi dal 'quando' di un archetipo
    (preset in creazione): teocrazia -> struttura>=4 e legalita==5, sui dati reali."""
    archetipi = CORE.get("archetipi", {}).get("culto") or []
    teo = next((a for a in archetipi if a["id"] == "teocrazia"), None)
    assert teo, "archetipo 'teocrazia' assente"
    harness = tmp_path / "preset.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "create_entity.js"))},"utf8");'
        'const m={exports:{}};new Function("module","exports","require",src)(m,m.exports,require);'
        f'process.stdout.write(JSON.stringify(m.exports.presetValori({json.dumps(teo, ensure_ascii=False)})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    valori = json.loads(res.stdout)
    assert valori.get("struttura", 0) >= 4 and valori.get("legalita") == 5


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_clock_svg(tmp_path):
    """views.clockSvg disegna N segmenti, i primi `filled` evidenziati (clock visivo)."""
    harness = tmp_path / "clock.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const svg=m.exports.clockSvg(6,2);'
        'process.stdout.write(JSON.stringify({ok:svg.startsWith("<svg")&&!svg.includes("undefined"),'
        'paths:(svg.match(/<path/g)||[]).length,filled:(svg.match(/c94040/g)||[]).length}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["ok"] and out["paths"] == 6 and out["filled"] == 2


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_encounter_xp(tmp_path):
    """views.xpForCreature: 'pe' diretto (SRD) o derivato dal 'gs' via cr_xp, sui dati
    reali (le tabelle xp del modello)."""
    cr_xp = (CORE.get("xp", {}) or {}).get("cr_xp") or {}
    assert cr_xp.get("2") == 450, "tabella cr_xp assente/errata"
    harness = tmp_path / "enc.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        f'const core={json.dumps({"xp": CORE.get("xp", {})}, ensure_ascii=False)};'
        'process.stdout.write(JSON.stringify({'
        'pe:m.exports.xpForCreature({pe:5900},core),'
        'gs:m.exports.xpForCreature({gs:"3"},core),'
        'frac:m.exports.xpForCreature({gs:"1/2"},core)}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["pe"] == 5900 and out["gs"] == cr_xp["3"] and out["frac"] == cr_xp["1/2"]


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_aggiorna_encounter_e2e(tmp_path):
    """meta_actions.aggiorna_encounter riscrive il blocco ```encounter``` dalle
    creature collegate (mock Obsidian): conta per nome (occorrenze ripetute =
    quantità), risolve i link al basename e allinea name al titolo, preservando
    players. Toglie il copia-incolla del residuo Fase 2."""
    harness = tmp_path / "enc_rewrite.js"
    harness.write_text(
        'const body = "# Incontro\\n\\n```encounter\\nname: Vecchio\\n'
        'players: false\\ncreatures:\\n  - 1: Nome Creatura\\n```\\n\\nfine";\n'
        'let saved = null;\n'
        'const file = { basename: "Imboscata", path: "Incontri/Imboscata.md" };\n'
        'global.Notice = class { constructor(m){} };\n'
        'global.app = {\n'
        '  workspace: { getActiveFile: () => file },\n'
        '  metadataCache: {\n'
        '    getFileCache: () => ({ frontmatter: { creature: ["[[Goblin]]","[[Goblin]]","[[Orco|Bruto]]"], alleati: ["[[Lupo Addestrato]]"] } }),\n'
        '    getFirstLinkpathDest: (t) => ({ basename: t }),\n'
        '  },\n'
        '  vault: { read: async () => body, modify: async (f, d) => { saved = d; } },\n'
        '};\n'
        f'const meta = require({json.dumps(META_ACTIONS_JS)});\n'
        'meta({}, "aggiorna_encounter").then(() => process.stdout.write(saved));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert "name: Imboscata" in out          # name allineato al titolo della nota
    assert "players: false" in out           # players preservato
    assert "  - 2: Goblin" in out            # occorrenze ripetute -> quantità
    assert "  - 1: Orco" in out              # link risolto al basename del target
    assert "  - Lupo Addestrato, ally" in out  # alleato emesso col flag ally (P2)
    assert "Nome Creatura" not in out        # placeholder sostituito
    assert out.count("```encounter") == 1    # un solo blocco, ben formato
    assert out.startswith("# Incontro") and out.rstrip().endswith("fine")  # corpo preservato


@pytest.mark.skipif(not render.SRD_DIR.is_dir(), reason="SRD assente")
def test_gs_baselines():
    """gs_baselines: tabella GS→statistiche base dai mostri SRD (mediane). Copre i GS
    chiave con AC/PF/attacco; i PF crescono col GS; mappa anche i GS frazionari."""
    t = render.gs_baselines()
    assert t, "tabella GS vuota (mostri SRD assenti?)"
    for gs in ("1", "5", "10"):
        assert gs in t and {"ac", "hp", "attacco"} <= set(t[gs]), f"GS {gs} incompleto: {t.get(gs)}"
    assert t["1"]["hp"] < t["5"]["hp"] < t["10"]["hp"]   # PF crescono col GS
    assert "1/2" in t                                     # GS frazionario mappato a stringa
    assert t["5"].get("danno_formula")                    # formula di danno rappresentativa


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_scaffold_statblock_e2e(tmp_path):
    """meta_actions.scaffold_statblock: riempie il blocco ```statblock``` di una creatura
    dai valori-base del suo GS (core.json gs_baseline) — un boss con solo `gs` diventa
    giocabile (AC/PF + azione d'attacco col bonus/danno + azione-salvezza). Preserva il
    layout, rimpiazza il placeholder, lascia intatto il resto del corpo."""
    base = {"ac": 15, "hp": 104, "pb": 3, "init": 2, "attacco": 7,
            "danno": 14, "danno_formula": "2d10 + 3", "danno_tipo": "taglienti", "cd": 14}
    core = {"gs_baseline": {"5": base}}
    harness = tmp_path / "scaffold.js"
    harness.write_text(
        'const body = "# Orrore\\n\\n```statblock\\nlayout: 5-5e-ita\\nname: x\\n'
        'ac: 10\\nhp: 10\\nstats: [10, 10, 10, 10, 10, 10]\\ncr: 1\\nactions: []\\n```\\n\\nfine";\n'
        'let saved = null;\n'
        'const file = { basename: "Orrore della Voragine", path: "Mondi/Creature/Orrore.md" };\n'
        'global.Notice = class { constructor(m){} };\n'
        f'const core = {json.dumps(core, ensure_ascii=False)};\n'
        'global.app = {\n'
        '  workspace: { getActiveFile: () => file },\n'
        '  metadataCache: { getFileCache: () => ({ frontmatter: { gs: "5", taglia: "Grande", tipo: "aberrazione" } }) },\n'
        '  vault: {\n'
        '    read: async () => body,\n'
        '    modify: async (f, d) => { saved = d; },\n'
        '    adapter: { read: async () => JSON.stringify(core) },\n'
        '  },\n'
        '};\n'
        f'const meta = require({json.dumps(META_ACTIONS_JS)});\n'
        'meta({}, "scaffold_statblock").then(() => process.stdout.write(saved));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert "ac: 15" in out and "hp: 104" in out                    # valori-base dal GS
    assert "name: Orrore della Voragine" in out                    # name = basename
    assert "size: Grande" in out and "type: aberrazione" in out    # da frontmatter
    assert 'cr: "5"' in out and 'pb: "+3"' in out
    assert "*Tiro per colpire:* +7" in out and "2d10 + 3" in out   # azione d'attacco reale
    assert "Multiattacco" in out and "effettua 2 attacchi" in out  # GS 5 -> multiattacco x2
    assert "saves:" in out and "FOR:" in out                       # TS competenti rollabili
    assert "CD 14" in out                                          # azione-salvezza dal GS
    assert "actions: []" not in out                                # placeholder sostituito
    assert "layout: 5-5e-ita" in out                               # layout preservato
    assert out.count("```statblock") == 1                          # un solo blocco
    assert out.startswith("# Orrore") and out.rstrip().endswith("fine")  # corpo preservato


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_pin_to_coord(tmp_path):
    """meta_actions.pinToCoord: un marker zoom-map (x/y NORMALIZZATI 0..1) + le dimensioni
    dell'immagine → coord-pixel "x, y" (stesso spazio degli import, letto da renderDintorni
    × scala_mappa). È il nucleo del sync pin→coord: la posizione che il GM piazza a mano
    sulla mappa diventa DATO. Input non valido (size o coord) → null."""
    harness = tmp_path / "pin.js"
    harness.write_text(
        f'const meta = require({json.dumps(META_ACTIONS_JS)});\n'
        'const out = {\n'
        '  mid: meta.pinToCoord({x: 0.5, y: 0.25}, {w: 1000, h: 800}),\n'
        '  edge: meta.pinToCoord({x: 1, y: 0}, {w: 200, h: 200}),\n'
        '  round: meta.pinToCoord({x: 0.3333, y: 0.6666}, {w: 300, h: 300}),\n'
        '  noSize: meta.pinToCoord({x: 0.5, y: 0.5}, {w: 0, h: 800}),\n'
        '  bad: meta.pinToCoord({x: "abc", y: 0.5}, {w: 100, h: 100}),\n'
        '};\n'
        'process.stdout.write(JSON.stringify(out));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["mid"] == "500, 200"      # 0.5*1000, 0.25*800
    assert out["edge"] == "200, 0"       # bordo della mappa
    assert out["round"] == "100, 200"    # arrotondamento al pixel
    assert out["noSize"] is None         # dimensioni non valide → null
    assert out["bad"] is None            # coord non numerica → null


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_verifica_gs(tmp_path):
    """views.verificaGS + parseStatblockStats + renderVerificaGS: invertono gs_baseline
    per stimare il GS difensivo (AC+PF) e offensivo (attacco+danno per colpo) e
    confrontarli col dichiarato. Un boss con PF da GS basso esce dal GS dichiarato."""
    table = {"1": {"ac": 13, "hp": 20, "attacco": 4, "danno": 6},
             "5": {"ac": 15, "hp": 90, "attacco": 6, "danno": 14},
             "10": {"ac": 17, "hp": 180, "attacco": 8, "danno": 28}}
    body = ('# Boss\n\n```statblock\nlayout: 5-5e-ita\nname: Boss\nac: 15\nhp: 90\n'
            'cr: "5"\nactions:\n  - name: Attacco\n    desc: "*Tiro per colpire:* +6, '
            'portata 1,5 m. *Colpito:* 14 (2d10 + 3) danni."\n```\n')
    harness = tmp_path / "vgs.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        f'const table={json.dumps(table, ensure_ascii=False)};'
        f'const body={json.dumps(body, ensure_ascii=False)};'
        'const ok=m.exports.verificaGS(table,{ac:15,hp:90,atk:6,danno:14},"5");'
        'const mis=m.exports.verificaGS(table,{ac:15,hp:20,atk:6,danno:14},"5");'
        'const parsed=m.exports.parseStatblockStats(body);'
        'const file={basename:"Boss",path:"Mondi/Creature/Boss.md"};'
        'const app={workspace:{getActiveFile:()=>file},'
        ' vault:{read:async()=>body, adapter:{read:async()=>JSON.stringify({gs_baseline:table})}}};'
        'm.exports.renderVerificaGS(app,{categoria:"creatura",gs:"5"}).then(r=>'
        ' process.stdout.write(JSON.stringify({ok,mis,parsed,r})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["ok"] == {"difensivo": "5", "offensivo": "5", "atteso": "5", "dichiarato": "5"}
    assert out["mis"]["difensivo"] == "1"          # PF 20 = GS 1, fuori dal GS 5 dichiarato
    assert out["parsed"] == {"ac": 15, "hp": 90, "atk": 6, "danno": 14}
    assert "Coerenza GS" in out["r"] and "GS 5" in out["r"]


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_aggiorna_encounter_varianti(tmp_path):
    """meta_actions.aggiorna_encounter: il campo `varianti` applica gli override
    HP/CA/iniziativa con la sintassi POSIZIONALE di Initiative Tracker (boss
    potenziato / gregario indebolito / incontro ripetibile). hp è l'ancora: una
    variante con solo ca non emette override (non esprimibile senza hp)."""
    harness = tmp_path / "enc_var.js"
    harness.write_text(
        'const body = "# Incontro\\n\\n```encounter\\nname: X\\n'
        'players: true\\ncreatures:\\n  - 1: Vecchio\\n```\\n";\n'
        'let saved = null;\n'
        'const file = { basename: "Agguato", path: "Incontri/Agguato.md" };\n'
        'global.Notice = class { constructor(m){} };\n'
        'global.app = {\n'
        '  workspace: { getActiveFile: () => file },\n'
        '  metadataCache: {\n'
        '    getFileCache: () => ({ frontmatter: {\n'
        '      creature: ["[[Salamandra]]","[[Salamandra]]","[[Goblin]]","[[Orco]]"],\n'
        '      varianti: ["[[Salamandra]]: hp 60, ca 12, init 20", "Goblin: pf 5", "[[Orco]]: ca 18"] } }),\n'
        '    getFirstLinkpathDest: (t) => ({ basename: t }),\n'
        '  },\n'
        '  vault: { read: async () => body, modify: async (f, d) => { saved = d; } },\n'
        '};\n'
        f'const meta = require({json.dumps(META_ACTIONS_JS)});\n'
        'meta({}, "aggiorna_encounter").then(() => process.stdout.write(saved));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert "  - 2: Salamandra, 60, 12, 20" in out  # hp+ca+init posizionali (boss)
    assert "  - 1: Goblin, 5" in out               # alias pf→hp, solo hp (gregario)
    assert "  - 1: Orco" in out and "Orco," not in out  # ca senza hp → nessun override


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_attacco_arma(tmp_path):
    """views.attaccoArma: caratteristica d'attacco (mischia→Forza, distanza→Destrezza,
    accurata/finesse→la migliore fra Forza e Destrezza del PG), dado di danno e effetto
    della padronanza (tiri Dice Roller che leggono mod_<car> + competenza dal frontmatter)."""
    harness = tmp_path / "att.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const A=m.exports.attaccoArma;'
        'const page={mod_forza:1, mod_destrezza:3, competenza:2};'
        'const mae={vessazione:{effetto:"VEX"}, fiaccare:{effetto:"SAP"}, lentezza:{effetto:"SLOW"}};'
        'const ascia={nome:"Ascia",danni:"1d6 taglienti",categoria:"Mischia semplice",proprieta:["leggera"],padronanza:"Vessazione"};'
        'const stocco={nome:"Stocco",danni:"1d8 perforanti",categoria:"Mischia da guerra",proprieta:["accurata"],padronanza:"Fiaccare"};'
        'const arco={nome:"Arco lungo",danni:"1d8 perforanti",categoria:"Distanza da guerra",proprieta:["munizioni"],padronanza:"Lentezza"};'
        'process.stdout.write(JSON.stringify({a:A(ascia,page,mae), s:A(stocco,page,mae), r:A(arco,page,mae)}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["a"]["colpire"] == "1d20 + mod_forza + competenza"   # mischia → Forza
    assert out["a"]["danni"] == "1d6 + mod_forza" and out["a"]["effetto"] == "VEX"
    assert "mod_destrezza" in out["s"]["colpire"]                   # finesse → mod migliore (DES 3 > FOR 1)
    assert "mod_destrezza" in out["r"]["colpire"]                   # distanza → Destrezza
    assert out["r"]["effetto"] == "SLOW"


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_armi_homebrew(tmp_path):
    """views.armiHomebrew: legge le note `oggetto` con tipo=arma dal vault e le porta
    nello stesso shape del catalogo SRD (parità di campi) → un'arma homebrew gioca in
    attaccoArma come quelle ufficiali (qui: accurata → mod migliore, danni, maestria).
    Le note non-arma (pozione) sono escluse. App headless senza vault → {} (no crash)."""
    harness = tmp_path / "hw.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const {armiHomebrew,attaccoArma}=m.exports;'
        'const fmOf={Fiammacupa:{categoria:"oggetto",tipo:"arma",danni:"1d8 taglienti",proprieta:"accurata, leggera",padronanza:"Affondo"},'
        '  Pozione:{categoria:"oggetto",tipo:"oggetto magico"}};'
        'const app={vault:{getMarkdownFiles:()=>[{basename:"Fiammacupa"},{basename:"Pozione"}]},'
        '  metadataCache:{getFileCache:(f)=>({frontmatter:fmOf[f.basename]})}};'
        'const H=armiHomebrew(app);'
        'const att=H.Fiammacupa?attaccoArma(H.Fiammacupa,{mod_forza:1,mod_destrezza:3},{affondo:{effetto:"LUNGE"}}):null;'
        'const safe=armiHomebrew({});'  # app senza vault → {} (try/catch)
        'process.stdout.write(JSON.stringify({H,att,safeKeys:Object.keys(safe).length}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert "Fiammacupa" in out["H"] and "Pozione" not in out["H"]          # solo le armi
    arma = out["H"]["Fiammacupa"]
    assert arma["danni"] == "1d8 taglienti" and arma["padronanza"] == "Affondo"
    assert arma["proprieta"] == ["accurata", "leggera"]                     # text → lista
    assert "mod_destrezza" in out["att"]["colpire"]                         # accurata: DES 3 > FOR 1
    assert out["att"]["danni"] == "1d8 + mod_destrezza" and out["att"]["effetto"] == "LUNGE"
    assert out["safeKeys"] == 0                                             # headless → {} senza crash


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_parse_nodo(tmp_path):
    """views.parseNodo (albero evolutivo): "grado | nome | prerequisito | effetto" →
    struttura; grado non numerico → 0; prerequisito "—" → vuoto."""
    harness = tmp_path / "nodo.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const P=m.exports.parseNodo;'
        'process.stdout.write(JSON.stringify({'
        'a:P("2 | Pelle di Brace | Tocco di Cenere | resistenza al fuoco"),'
        'b:P("1 | Tocco di Cenere | — | +1 danno da fuoco"),'
        'c:P("| Nodo sciolto")}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["a"] == {"grado": 2, "nome": "Pelle di Brace", "prereq": "Tocco di Cenere", "effetto": "resistenza al fuoco"}
    assert out["b"]["prereq"] == ""                 # "—" → nessun prerequisito
    assert out["c"]["grado"] == 0 and out["c"]["nome"] == "Nodo sciolto"  # grado mancante → 0


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_specie_tratti(tmp_path):
    """views.renderSpecieTratti: dalle sezioni SRD della specie del PG rende un
    callout pieghevole con descrizioni + tabelle (soffio/antenati draconici), così
    la scheda mostra i dettagli giocabili senza saltare alla nota SRD."""
    import build_personaggio
    data = build_personaggio.build_personaggio_options(CORE)
    assert (data.get("specie") or {}).get("dragonide", {}).get("sezioni"), "dragonide senza sezioni in personaggio.json"
    harness = tmp_path / "spt.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        f'const data={json.dumps(data, ensure_ascii=False)};'
        'const app={vault:{adapter:{read:async()=>JSON.stringify(data)}}};'
        'Promise.all(['
        '  m.exports.renderSpecieTratti(app,{specie:"dragonide"}),'
        '  m.exports.renderSpecieTratti(app,{}),'
        '  m.exports.renderSpecieTratti(app,null),'
        ']).then(([a,b,c])=>process.stdout.write(JSON.stringify({a,b,c})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["a"].startswith("> [!note]- Tratti di Dragonide")
    assert "Antenati draconici" in out["a"]                  # titolo della tabella
    assert "| Argento |" in out["a"] and "Freddo" in out["a"]  # riga tabella (antenato/danno)
    assert out["b"] == "" and out["c"] == ""                  # senza specie / senza page -> niente


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_risorse_pg(tmp_path):
    """views.renderRisorsePG: barre proporzionali (PF, Dadi Vita, Esaurimento) dal
    frontmatter, max VARIABILE calcolato a runtime (progressBar Meta Bind non lo
    permette). Stringa vuota se la nota non è una scheda PG compilata."""
    harness = tmp_path / "risorse.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const pg={pf:10,pf_max:20,pf_temp:3,esaurimento:3,dadi_vita_max:4,dadi_vita_spesi:1,'
        '  risorse_pg:[{id:"ira",label:"Ira",max:5,ric:"lungo",icona:"🔥"}],usi_ira:1};'
        'Promise.all(['
        '  m.exports.renderRisorsePG(pg),'
        '  m.exports.renderRisorsePG({}),'
        '  m.exports.renderRisorsePG(null),'
        ']).then(([a,b,c])=>process.stdout.write(JSON.stringify({a,b,c,pct:m.exports.barPct(3,6)})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert "gdr-bars" in out["a"]
    assert "width:50%" in out["a"]                 # PF 10/20 (ed Esaurimento 3/6)
    assert "width:75%" in out["a"]                 # Dadi Vita rimasti 3/4
    assert "(+3 temp)" in out["a"]                 # PF temporanei annotati
    assert "width:80%" in out["a"]                 # risorsa di classe Ira: rimasti 4/5
    assert "Ira" in out["a"] and "☀" in out["a"]   # etichetta + icona ricarica (lungo)
    assert out["b"] == ""                          # scheda non compilata -> niente
    assert out["c"] == "*Apri la scheda PG.*"      # senza page -> guida
    assert out["pct"] == 50


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_incantesimi_cd(tmp_path):
    """views.renderIncantesimi: testata con CD incantesimo (8+PB+mod) e bonus d'attacco
    (PB+mod). La caratteristica da incantatore = prima MENTALE fra le primarie della
    classe (Mago→Intelligenza); il mod si calcola dal punteggio nel frontmatter."""
    harness = tmp_path / "inc.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(VIEWS_JS)},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const data={classi:{mago:{incantatore:true,caratteristica_primaria:["intelligenza"],'
        ' incantesimi_pool:{"0":["Mano magica"],"1":["Dardo incantato"]}}}};'
        'const app={vault:{adapter:{read:async()=>JSON.stringify(data)}}};'
        'const page={classe:"mago",intelligenza:16,competenza:2,'
        ' trucchetti:["Mano magica"],incantesimi:["Dardo incantato"]};'
        'm.exports.renderIncantesimi(app,null,page).then(o=>process.stdout.write(o));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert "CD 13" in out                      # 8 + 2 (PB) + 3 (mod INT 16)
    assert "Attacco +5" in out                 # 2 (PB) + 3 (mod)
    assert "Intelligenza" in out               # caratteristica da incantatore
    assert "[[Dardo incantato]]" in out        # incantesimo elencato


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_riposo_lungo_e2e(tmp_path):
    """meta_actions.riposo_lungo: PF al massimo, PF temp/TS morte/slot_uso azzerati,
    e UN livello di Esaurimento rimosso (2024: −1 a riposo lungo, non azzerato)."""
    harness = tmp_path / "riposo.js"
    harness.write_text(
        'global.Notice = class { constructor(m){} };\n'
        'const fm = { pf:5, pf_max:20, pf_temp:4, ts_morte_successi:2, ts_morte_fallimenti:1,'
        ' slot_uso_1:1, esaurimento:3, concentrazione_su:"Benedizione", dadi_vita_max:4, dadi_vita_spesi:3,'
        ' risorse_pg:[{id:"ira",ric:"lungo"},{id:"disciplina",ric:"breve"}], usi_ira:2, usi_disciplina:3 };\n'
        'const file = { basename:"Eroe", path:"Personaggi/Eroe.md" };\n'
        'global.app = {\n'
        '  workspace: { getActiveFile: () => file },\n'
        '  metadataCache: { getFileCache: () => ({ frontmatter: fm }) },\n'
        '  fileManager: { processFrontMatter: async (f, fn) => fn(fm) },\n'
        '};\n'
        f'const meta = require({json.dumps(META_ACTIONS_JS)});\n'
        'meta({}, "riposo_lungo").then(() => process.stdout.write(JSON.stringify(fm)));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    fm = json.loads(res.stdout)
    assert fm["pf"] == 20 and fm["pf_temp"] == 0
    assert fm["ts_morte_successi"] == 0 and fm["ts_morte_fallimenti"] == 0
    assert fm["slot_uso_1"] == 0
    assert fm["esaurimento"] == 2   # −1, non azzerato (regola 2024)
    assert fm["concentrazione_su"] == ""        # concentrazione conclusa
    assert fm["dadi_vita_spesi"] == 1           # 3 − floor(4/2)=2 recuperati
    assert fm["usi_ira"] == 0 and fm["usi_disciplina"] == 0  # riposo lungo: TUTTE le risorse ricaricate


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_riposo_breve_e2e(tmp_path):
    """meta_actions.riposo_breve: spende UN Dado Vita, cura di (tiro+mod COS) entro
    il range del dado e cappato a pf_max; senza Dadi Vita non cambia nulla."""
    def run(fm_js):
        harness = tmp_path / "rb.js"
        harness.write_text(
            'global.Notice = class { constructor(m){} };\n'
            f'const fm = {fm_js};\n'
            'const file = { basename:"Eroe", path:"Personaggi/Eroe.md" };\n'
            'global.app = { workspace:{ getActiveFile:()=>file },\n'
            '  metadataCache:{ getFileCache:()=>({ frontmatter: fm }) },\n'
            '  fileManager:{ processFrontMatter: async (f, fn) => fn(fm) } };\n'
            f'const meta = require({json.dumps(META_ACTIONS_JS)});\n'
            'meta({}, "riposo_breve").then(() => process.stdout.write(JSON.stringify(fm)));\n',
            encoding="utf-8")
        res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
        assert res.returncode == 0, res.stderr
        return json.loads(res.stdout)

    # COS 14 (+2), d10: cura fra 1+2=3 e 10+2=12, pf 5→[8..17] cappato a 20.
    fm = run('{ pf:5, pf_max:20, dado_vita:10, costituzione:14, dadi_vita_max:3, dadi_vita_spesi:0,'
             ' risorse_pg:[{id:"disciplina",ric:"breve"},{id:"ira",ric:"lungo"}], usi_disciplina:2, usi_ira:2,'
             ' slot_ricarica:"breve", slot_uso_1:1 }')
    assert fm["dadi_vita_spesi"] == 1
    assert 8 <= fm["pf"] <= 17
    assert fm["usi_disciplina"] == 0   # risorsa a riposo breve: ricaricata
    assert fm["usi_ira"] == 2          # risorsa a riposo lungo: il breve non la tocca
    assert fm["slot_uso_1"] == 0       # slot del Patto (Warlock 2024): ricaricati al breve
    # Nessun Dado Vita rimasto: PF/Dadi Vita invariati, ma le risorse breve SI ricaricano.
    fm2 = run('{ pf:5, pf_max:20, dado_vita:10, costituzione:14, dadi_vita_max:1, dadi_vita_spesi:1,'
              ' risorse_pg:[{id:"disciplina",ric:"breve"}], usi_disciplina:2 }')
    assert fm2["dadi_vita_spesi"] == 1 and fm2["pf"] == 5
    assert fm2["usi_disciplina"] == 0  # ricarica anche SENZA Dadi Vita da spendere


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_usa_risorsa_e2e(tmp_path):
    """meta_actions.usa_risorsa: spende 1 uso (usi_<id>+1) della risorsa scelta nel
    suggester, cappato al max; già esaurita -> invariato."""
    def run(usi):
        harness = tmp_path / "ur.js"
        harness.write_text(
            'global.Notice = class { constructor(m){} };\n'
            f'const fm = {{ risorse_pg:[{{id:"ira",label:"Ira",max:3,ric:"lungo"}}], usi_ira:{usi} }};\n'
            'const file = { basename:"Eroe", path:"P/Eroe.md" };\n'
            'global.app = { workspace:{ getActiveFile:()=>file },\n'
            '  metadataCache:{ getFileCache:()=>({ frontmatter: fm }) },\n'
            '  fileManager:{ processFrontMatter: async (f, fn) => fn(fm) } };\n'
            'const tp = { system:{ suggester: async (labels, items) => items[0] } };\n'
            f'const meta = require({json.dumps(META_ACTIONS_JS)});\n'
            'meta(tp, "usa_risorsa").then(() => process.stdout.write(JSON.stringify(fm)));\n',
            encoding="utf-8")
        res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
        assert res.returncode == 0, res.stderr
        return json.loads(res.stdout)

    assert run(0)["usi_ira"] == 1   # speso 1 (0→1)
    assert run(2)["usi_ira"] == 3   # 2→3 (raggiunge il max)
    assert run(3)["usi_ira"] == 3   # già esaurita: invariato (non supera il max)


