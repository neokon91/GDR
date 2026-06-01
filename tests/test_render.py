"""Suite di verifica: valida il modello e rende ogni artefatto senza scrivere
sul vault (nessun build). Mirror automatizzato di `npm run check` + render
standalone, eseguibile con `npm test`."""

import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest
import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

import render

# Snapshot dei render: golden file in tests/snapshots/. Rigenera con
# UPDATE_SNAPSHOTS=1 pytest (es. dopo una modifica VOLUTA dell'output).
SNAP_DIR = Path(__file__).parent / "snapshots"


def _snapshot(name: str, content: str) -> str:
    SNAP_DIR.mkdir(exist_ok=True)
    path = SNAP_DIR / name
    if os.environ.get("UPDATE_SNAPSHOTS") or not path.is_file():
        path.write_text(content, encoding="utf-8")
    return path.read_text(encoding="utf-8")

# Mock di Templater per testare crea_personaggio.js fuori da Obsidian: sceglie
# sempre la prima opzione e legge personaggio.json dal path passato.
_PG_HARNESS = """
const fs = require("fs");
const data = fs.readFileSync(process.argv[2], "utf8");
const wantClass = process.argv[4] || null;
global.app = { vault: { adapter: { read: async () => data } } };
const tp = { system: {
    prompt: async () => "Test PG",
    suggester: async (l, v, _f, title) => {
        if (wantClass && title && String(title).startsWith("Classe")) {
            const i = v.indexOf(wantClass); return v[i >= 0 ? i : 0];
        }
        return v[0];
    } },
    file: { move: async () => {} } };
require(process.argv[3])(tp).then(fm => process.stdout.write(fm));
"""


def _run_crea_pg(tmp_path, classe=None):
    """Esegue crea_pg.js col mock Templater; ritorna (opzioni, frontmatter dict)."""
    import build_personaggio
    opt = build_personaggio.build_personaggio_options(CORE)
    pj = tmp_path / "personaggio.json"
    pj.write_text(json.dumps(opt, ensure_ascii=False), encoding="utf-8")
    harness = tmp_path / "harness.js"
    harness.write_text(_PG_HARNESS, encoding="utf-8")
    args = ["node", str(harness), str(pj), str(render.JS_DIR / "crea_pg.js")]
    if classe:
        args.append(classe)
    res = subprocess.run(args, capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    return opt, yaml.safe_load(res.stdout.split("---")[1])

CORE = render.load_core()
PLUGINS = render.load_yaml("plugins.yaml")
TEMPLATES = render.load_templates()
PAGES = render.load_pages()


def _env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(render.JINJA_DIR)),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def test_check_passes():
    """check() valida YAML/Jinja (split, field, tavolo, relazioni, pagine)."""
    assert render.check() == 0


def test_no_duplicate_ids():
    """Lo split è una partizione: nessun id condiviso fra core.yaml e system.yaml
    nelle sezioni-mappa (folders/fields/categories/creation/relazioni)."""
    core_raw, system_raw = render.load_core_parts()
    assert system_raw, "system.yaml mancante o vuoto"
    for section in render.PARTITIONED_SECTIONS:
        shared = set(core_raw.get(section, {}) or {}) & set(system_raw.get(section, {}) or {})
        assert not shared, f"{section}: id condivisi fra core e system: {sorted(shared)}"


def test_entity_schema():
    """Schema strutturale dei file-entità (tipi + chiavi richieste)."""
    assert render.validate_entity_schema(render.load_entities()) == []


@pytest.mark.parametrize("tpl", TEMPLATES, ids=[t["id"] for t in TEMPLATES])
def test_crea_js_present(tpl):
    """Ogni template ha un crea_<id>.js: hand-authored in JS/ o generato (wrapper)."""
    if (render.JS_DIR / f"crea_{tpl['id']}.js").is_file():
        return  # override hand-authored
    js = render.crea_wrapper_js(tpl)
    assert f'create_entity(tp, "{tpl["id"]}")' in js


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_crea_wrapper_valid(tmp_path):
    """Il wrapper generato è JS sintatticamente valido."""
    js = render.crea_wrapper_js({"id": "luogo", "category": "luogo"})
    f = tmp_path / "crea_luogo.js"
    f.write_text(js, encoding="utf-8")
    assert subprocess.run(["node", "--check", str(f)], capture_output=True).returncode == 0


@pytest.mark.parametrize("tpl", TEMPLATES, ids=[t["id"] for t in TEMPLATES])
def test_template_snapshot(tpl):
    """Il render di ogni template combacia col golden (tests/snapshots/)."""
    out = _env().get_template(tpl["jinja"]).render(core=CORE, plugins=PLUGINS, template=tpl)
    assert out == _snapshot(f"template_{tpl['id']}.md", out)


@pytest.mark.parametrize("page", PAGES, ids=[p["id"] for p in PAGES])
def test_page_snapshot(page):
    out = _env().get_template("index.md.j2").render(core=CORE, plugins=PLUGINS, templates=TEMPLATES, page=page)
    assert out == _snapshot(f"page_{page['id']}.md", out)


@pytest.mark.parametrize("name", ["home.md.j2", "leggimi.md.j2", "ponte.md.j2", "fronti.md.j2"])
def test_root_note_snapshot(name):
    out = _env().get_template(name).render(core=CORE, plugins=PLUGINS, templates=TEMPLATES, pages=PAGES)
    assert out == _snapshot(f"root_{name}.md", out)


FOLDER_NOTES = render.folder_index_pages(CORE, PLUGINS)


@pytest.mark.parametrize("fn", FOLDER_NOTES, ids=[f["page"]["category"] for f in FOLDER_NOTES])
def test_folder_note_snapshot(fn):
    """Le note-cartella (auto-indice per categoria, Folder Notes) combaciano col golden."""
    out = _env().get_template("index.md.j2").render(core=CORE, plugins=PLUGINS, templates=TEMPLATES, page=fn["page"])
    assert out == _snapshot(f"folder_{fn['page']['category']}.md", out)


def test_entities_merge():
    """I file-entità (entities/*.yaml) contribuiscono a 'core' e ai template, e
    non collidono con core.yaml/system.yaml (validato anche da check)."""
    entities = render.load_entities()
    if not entities:
        pytest.skip("nessun file-entità (split per-entità non ancora avviato)")
    core_raw, system_raw = render.load_core_parts()
    assert not render.validate_entities(core_raw, system_raw, entities, CORE)
    for entity in entities:
        eid = entity["id"]
        assert eid in CORE["categories"], f"{eid} non fuso in categories"
        assert CORE["folders"].get(eid) == entity["folder"]
        for template in entity.get("templates", []):
            assert any(t["id"] == template["id"] and t["category"] == eid
                       for t in TEMPLATES), f"template {template['id']} mancante"


def test_split_planes():
    """Confine: le sezioni di piano stanno nel file giusto e il merge include
    tutte le categorie di entrambi i piani."""
    core_raw, system_raw = render.load_core_parts()
    for section in render.CORE_ONLY_SECTIONS:
        assert section not in system_raw, f"'{section}' (worldbuilding) non deve stare in system.yaml"
    for section in render.SYSTEM_ONLY_SECTIONS:
        assert section not in core_raw, f"'{section}' (sistema) non deve stare in core.yaml"
    merged_cats = set(CORE.get("categories", {}))
    assert {"mondo", "personaggio", "incontro"} <= merged_cats  # worldbuilding
    assert {"classe", "incantesimo", "oggetto"} <= merged_cats  # sistema 5.5e


def test_famiglie_classification():
    """Classificazione a 2 livelli: le 'famiglie' confluiscono in core.categories
    (con label personalizzabile) e generano un select 'famiglia' nel fileClass."""
    cats = CORE.get("categories", {})
    luogo = cats.get("luogo", {})
    assert luogo.get("famiglie") and all(f.get("nome") and f.get("descrizione") for f in luogo["famiglie"])
    assert cats.get("personaggio", {}).get("famiglia_label") == "Ruolo narrativo"  # label custom
    assert "famiglie" not in cats.get("mondo", {})  # entità senza famiglie: niente classificazione
    fields = {f["name"]: f for f in render.fileclass_fields(CORE, "luogo")}
    assert fields.get("famiglia", {}).get("type") == "Select"
    assert fields["famiglia"]["options"]["valuesList"]  # opzioni non vuote
    # le 14 categorie classificate a 2 livelli (lore + DM + cosmiche minori)
    con_famiglie = {c for c, m in cats.items() if m.get("famiglie")}
    assert {"luogo", "fazione", "personaggio", "evento", "cultura", "divinita",
            "specie", "epoca", "lingua", "cosmologia", "dominio", "legge_fondamentale",
            "incontro", "insidia"} <= con_famiglie


@pytest.mark.parametrize("category", list(CORE.get("categories", {})), ids=list(CORE.get("categories", {})))
def test_fileclass_well_formed(category):
    """Ogni fileClass ha campi con name/type e Select con opzioni non vuote."""
    for field in render.fileclass_fields(CORE, category):
        assert field["name"] and field["type"]
        if field["type"] == "Select":
            assert field["options"]["valuesList"], f"{category}.{field['name']}: Select senza opzioni"


@pytest.mark.skipif(not shutil.which("node"), reason="node non disponibile")
@pytest.mark.parametrize(
    "js",
    sorted(render.JS_DIR.glob("*.js")) + sorted(render.JS_DIR.glob("*.mjs")),
    ids=lambda p: p.name,
)
def test_js_syntax(js):
    # node --check deduce CommonJS/ESM dall'estensione (.js vs .mjs).
    assert subprocess.run(["node", "--check", str(js)], capture_output=True).returncode == 0


@pytest.mark.skipif(not render.SRD_DIR.is_dir(), reason="SRD non vendorizzata")
@pytest.mark.parametrize("spec", render.SRD_GEN, ids=[s["dest"] for s in render.SRD_GEN])
def test_srd_json_loads(spec):
    """Ogni JSON SRD carica una lista di voci con 'nome'."""
    entries = render.load_srd(spec["json"])
    assert entries, f"{spec['json']} -> 0 voci"
    for entry in entries[:30]:
        assert entry.get("nome")


def test_fs_layouts_valid():
    """I layout Fantasy Statblocks IT (Dev/Source/statblocks/*.json) sono JSON
    validi, con id/name e blocchi non vuoti; gli id dei layout sono univoci."""
    layouts = render.load_statblock_layouts()
    assert len(layouts) >= 2, "attesi almeno i layout 5e e 5.5e italiani"
    layout_ids = [l["id"] for l in layouts]
    assert len(layout_ids) == len(set(layout_ids)), "id dei layout non univoci"
    for layout in layouts:
        assert layout.get("name")
        assert isinstance(layout.get("blocks"), list) and layout["blocks"]


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


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_profilo_match(tmp_path):
    """views.archetipiMatch: una combinazione di valori-assi attiva l'archetipo
    atteso (teocrazia su 'culto' con struttura/legalità alti), sui dati reali."""
    archetipi = CORE.get("archetipi", {}).get("culto") or []
    assert archetipi, "archetipi 'culto' assenti dal modello"
    harness = tmp_path / "profilo.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        '    getFileCache: () => ({ frontmatter: { creature: ["[[Goblin]]","[[Goblin]]","[[Orco|Bruto]]"] } }),\n'
        '    getFirstLinkpathDest: (t) => ({ basename: t }),\n'
        '  },\n'
        '  vault: { read: async () => body, modify: async (f, d) => { saved = d; } },\n'
        '};\n'
        f'const meta = require({json.dumps(str(render.JS_DIR / "meta_actions.js"))});\n'
        'meta({}, "aggiorna_encounter").then(() => process.stdout.write(saved));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert "name: Imboscata" in out          # name allineato al titolo della nota
    assert "players: false" in out           # players preservato
    assert "  - 2: Goblin" in out            # occorrenze ripetute -> quantità
    assert "  - 1: Orco" in out              # link risolto al basename del target
    assert "Nome Creatura" not in out        # placeholder sostituito
    assert out.count("```encounter") == 1    # un solo blocco, ben formato
    assert out.startswith("# Incontro") and out.rstrip().endswith("fine")  # corpo preservato


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_timeline(tmp_path):
    """views.renderTimeline: raggruppa gli eventi per epoca (callout), li ordina
    per 'quando', esclude le archiviate, mette 'Senza epoca' in fondo, risolve i
    link epoca e mostra l'intervallo inizio–fine dell'epoca."""
    harness = tmp_path / "timeline.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_condizioni(tmp_path):
    """views.condizioniMarkdown: callout pieghevole con le condizioni (nome linkato
    alla nota SRD + effetti compatti), e messaggio se la lista è vuota."""
    harness = tmp_path / "cond.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
    """views.renderMap: embed ![[..]] della mappa collegata (Link Dataview o
    stringa), con suggerimento se il campo è vuoto."""
    harness = tmp_path / "map.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const link={mappa:{path:"Mondi/Mappe/Valdoria.excalidraw.md"}};'
        'const str={mappa:"[[Atlante.png]]"};'
        'Promise.all(['
        '  m.exports.renderMap({},{},link),'
        '  m.exports.renderMap({},{},str),'
        '  m.exports.renderMap({},{},{}),'
        ']).then(([a,b,c])=>process.stdout.write(JSON.stringify({a,b,c})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["a"] == "![[Valdoria.excalidraw]]"   # Link risolto al basename (senza .md)
    assert out["b"] == "![[Atlante.png]]"            # stringa [[..]] -> embed immagine
    assert out["c"].startswith("> [!tip] Nessuna mappa")  # campo vuoto -> guida


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


@pytest.mark.skipif(not render.SRD_DIR.is_dir(), reason="SRD non vendorizzata")
def test_srd_counts_and_statblock():
    """Conteggi attesi + il mostro si mappa su uno statblock Fantasy Statblocks."""
    assert len(render.load_srd("srd_5_2_1_spells.json")) > 300
    monsters = render.load_srd("srd_5_2_1_monsters.json")
    assert len(monsters) > 300
    glossary = render.load_srd("srd_5_2_1_rules_glossary.json")
    assert sum(1 for g in glossary if g.get("descrittore") == "condizione") == 15
    sb = render.srd_statblock_yaml(monsters[0], "Basic 5e Layout", CORE)
    assert "name:" in sb and "stats:" in sb and "actions:" in sb
    # Mappatura 5.5e completa: un mostro ricco espone i campi 2024.
    vampiro = next((m for m in monsters if m.get("nome") == "Vampiro"), None)
    if vampiro:
        vsb = render.srd_statblock_yaml(vampiro, "x", CORE)
        for field in ("initiative:", "saves:", "skillsaves:", "bonus_actions:",
                      "legendary_description:", "pb:"):
            assert field in vsb, f"campo 5.5e mancante: {field}"


@pytest.mark.skipif(not render.SRD_DIR.is_dir(), reason="SRD non vendorizzata")
def test_srd_condizioni():
    """srd_condizioni: le 15 condizioni 5.5e in forma compatta (nome + effetti) per
    il quick-ref runtime; gli effetti pieni stanno nelle note SRD/Condizioni/."""
    cond = render.srd_condizioni()
    assert len(cond) == 15
    nomi = {c["nome"] for c in cond}
    assert {"Accecato", "Afferrato", "Spaventato"} <= nomi
    acc = next(c for c in cond if c["nome"] == "Accecato")
    assert acc["effetti"] and all(e.get("descrizione") for e in acc["effetti"])


def test_srd_note_dedup_and_extras():
    """srd_note (funzione pura): de-duplica le prose ripetute (descrizione/
    beneficio/sezione, tipico dei talenti), rende lo statblock delle creature
    evocate inline e il footer 'Vedi anche' coi link risolti."""
    entry = {
        "nome": "Prova",
        "descrizione": "Stesso testo benefico.",
        "beneficio": "Stesso testo benefico.",
        "sezioni": [
            {"titolo": "Beneficio", "descrizione": "Stesso testo benefico."},
            {"titolo": "Extra", "descrizione": "Testo diverso."},
        ],
        "creature_evocate_inline": [{"nome": "Famiglio", "statblock": {
            "tipo": "Bestia Minuscola", "allineamento": "neutrale",
            "classe_armatura": 12, "punti_ferita": "5", "velocita": "3 m",
            "caratteristiche": {"forza": {"valore": 3, "modificatore": "-4"},
                                "destrezza": {"valore": 15, "modificatore": 2}},
            "azioni": [{"nome": "Morso", "descrizione": "1 danno perforante."}],
        }}],
        "vedi_anche": ["afferrato", "id_inesistente"],
    }
    out = render.srd_note(entry, "srd-talento", [], {"afferrato": "Afferrato"})
    assert out.count("Stesso testo benefico.") == 1   # de-dup: una sola volta
    assert "Testo diverso." in out                     # sezione distinta preservata
    assert "### Beneficio" not in out                  # sezione svuotata dal dedup -> niente heading vuoto
    assert "[!example]- Creatura evocata: Famiglio" in out
    assert "**CA** 12" in out
    assert "**For** 3 (-4)" in out and "**Des** 15 (+2)" in out
    assert "**Morso** — 1 danno perforante." in out
    assert "[[Afferrato]]" in out                       # vedi_anche risolto a link
    assert "id inesistente" in out                      # id non risolto -> testo in chiaro


def test_generatori_catalog():
    """generatori.yaml (generatore homebrew): stili con parti-nome complete +
    affissi toponimi + forme fazioni; le opzioni del select stile_nomi combaciano
    con gli stili (anti-drift, stesso check di validate)."""
    import re as _re
    g = render.load_yaml("generatori.yaml")
    stili = g["stili"]
    assert len(stili) >= 4
    for sid, s in stili.items():
        p = s["persona"]
        assert p["inizi"] and p["fini_m"] and p["fini_f"], sid
        assert s.get("label"), sid
    assert g["toponimi"]["prefissi"] and g["toponimi"]["suffissi"]
    faz = g["fazioni"]
    assert faz["forme"] and faz["sintagma"] and faz["nucleo_pl"] and faz["aggettivo"]
    decl = (render.load_yaml("plugins.yaml").get("metabind_inputs") or {}).get("stile_nomi", "")
    assert set(_re.findall(r"option\(\s*([a-z_]+)", decl)) == set(stili)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_genera_e2e(tmp_path):
    """genera.js: per ogni stile compone persona/toponimo/fazione non vuoti; le
    fazioni risolvono tutti i placeholder ({..}); generaLista dà opzioni distinte."""
    gen = render.load_yaml("generatori.yaml")
    harness = tmp_path / "g.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const genera=require({json.dumps(str(render.JS_DIR / "genera.js"))});'
        f'const gen={json.dumps(gen, ensure_ascii=False)};'
        'let s=7;const rng=()=>(s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff;'
        'const out={};'
        'for(const st of Object.keys(gen.stili)){'
        '  out[st]={p:genera.generaPersona(gen,st,rng),t:genera.generaToponimo(gen,st,rng),f:genera.generaFazione(gen,st,rng)};'
        '}'
        'out.__lista=genera.generaLista(gen,"persona",Object.keys(gen.stili)[0],8,rng);'
        'process.stdout.write(JSON.stringify(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    for st in gen["stili"]:
        assert out[st]["p"] and out[st]["t"] and out[st]["f"], st
        assert "{" not in out[st]["f"], f"placeholder non risolto ({st}): {out[st]['f']}"
        assert out[st]["f"][0].isupper()
    assert len(set(out["__lista"])) >= 6   # generaLista: opzioni distinte


def test_fcg_it_settings():
    """fcg_it.yaml: i gruppi override hanno TUTTE le chiavi che il generatore FCG
    legge (il merge del plugin è shallow → una chiave mancante romperebbe quel
    generatore). Struttura dal reverse di DEFAULT_SETTINGS."""
    s = render.load_yaml("fcg_it.yaml")["settings"]
    inn = s["innSettings"]
    assert all(inn.get(k) for k in ("prefixes", "innType", "nouns", "desc", "rumors")), "innSettings incompleto"
    assert all(s["drinkSettings"].get(k) for k in ("adj", "nouns")), "drinkSettings incompleto"
    assert s["currencyTypes"] and all(c.get("name") and c.get("rarity") for c in s["currencyTypes"])


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_anti_drift_matchescond(tmp_path):
    """Anti-drift: la logica dei comparatori 'matchesCond' è duplicata in views.js
    e meta_actions.js (script autonomi, niente modulo condiviso). Questo guard
    verifica che (1) le due copie diano risultati IDENTICI sugli stessi input, e
    (2) l'invariante preset↔match regga: per ogni archetipo reale i valori-assi
    derivati da create_entity.presetValori soddisfano matchesCond sul 'quando'."""
    vectors = [(5, ">=4"), (3, ">=4"), (2, "<=2"), (5, ">3"), (3, "<3"), (4, "4"),
               (4, "==4"), (3, "2-4"), (5, "2-4"), (1, "3"), ("x", ">=2"), (None, "4")]
    archetipi = [a for lst in (CORE.get("archetipi") or {}).values() for a in lst]
    harness = tmp_path / "drift.js"
    harness.write_text(
        'const fs=require("fs");'
        'function load(p){const s=fs.readFileSync(p,"utf8");const m={exports:{}};'
        'new Function("module","exports",s)(m,m.exports);return m.exports;}'
        f'const views=load({json.dumps(str(render.JS_DIR / "views.js"))});'
        f'const meta=load({json.dumps(str(render.JS_DIR / "meta_actions.js"))});'
        f'const crea=require({json.dumps(str(render.JS_DIR / "create_entity.js"))});'
        f'const vec={json.dumps(vectors)};'
        f'const archs={json.dumps(archetipi, ensure_ascii=False)};'
        'const diff=vec.filter(([v,c])=>Boolean(views.matchesCond(v,c))!==Boolean(meta.matchesCond(v,c)));'
        'const inv=[];'
        'for(const a of archs){const vals=crea.presetValori(a);'
        'for(const [ax,cond] of Object.entries(a.quando||{})){'
        'if((ax in vals)&&!views.matchesCond(vals[ax],cond)) inv.push((a.nome||"?")+":"+ax);}}'
        'process.stdout.write(JSON.stringify({diff, inv}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["diff"] == [], f"matchesCond diverge tra views e meta_actions: {out['diff']}"
    assert out["inv"] == [], f"preset non soddisfa matchesCond: {out['inv']}"
    assert archetipi, "nessun archetipo: l'invariante preset↔match non è stata esercitata"
