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


@pytest.mark.parametrize("category", list(CORE.get("categories", {})), ids=list(CORE.get("categories", {})))
def test_fileclass_well_formed(category):
    """Ogni fileClass ha campi con name/type e Select con opzioni non vuote."""
    for field in render.fileclass_fields(CORE, category):
        assert field["name"] and field["type"]
        if field["type"] == "Select":
            assert field["options"]["valuesList"], f"{category}.{field['name']}: Select senza opzioni"


@pytest.mark.skipif(not shutil.which("node"), reason="node non disponibile")
@pytest.mark.parametrize("js", sorted(render.JS_DIR.glob("*.js")), ids=lambda p: p.name)
def test_js_syntax(js):
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
    sb = render.srd_statblock_yaml(monsters[0], "Basic 5e Layout")
    assert "name:" in sb and "stats:" in sb and "actions:" in sb
