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


@pytest.mark.parametrize("name", ["home.md.j2", "leggimi.md.j2", "ponte.md.j2", "fronti.md.j2", "rete.md.j2", "economia.md.j2", "geografia.md.j2"])
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


def test_panels_registered():
    """Guard di drift JS Engine: ogni pannello referenziato in una macro Jinja
    (`panel(...,"renderX")`) DEVE essere nel registro boot.mjs PANELS, e ogni PANELS
    deve puntare a una funzione esportata da views.js. Senza questo, una macro che
    nomina un pannello non registrato passa check/snapshot ma lancia 'Pannello JS
    Engine sconosciuto' SOLO in-app (i test chiamano le view dirette, bypassando boot)."""
    import re
    boot = (render.JS_DIR / "boot.mjs").read_text(encoding="utf-8")
    panels = set(re.findall(r"(\w+):\s*\{\s*mode:", boot))
    views = (render.JS_DIR / "views.js").read_text(encoding="utf-8")
    exported = set(re.findall(r"\b(render\w+)\b", views.split("module.exports", 1)[1]))
    referenced = set()
    for j in render.JINJA_DIR.glob("*.j2"):
        referenced |= set(re.findall(r'panel\([^)]*"(render\w+)"', j.read_text(encoding="utf-8")))
    assert referenced, "nessun panel(...) trovato nelle macro (regex rotta?)"
    assert not (referenced - panels), f"pannelli usati nelle macro ma non in boot.mjs PANELS: {sorted(referenced - panels)}"
    assert not (panels - exported), f"PANELS senza export corrispondente in views.js: {sorted(panels - exported)}"


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
    # Padronanza armi 2024 (dal SRD): mappa arma->padronanza + conteggi per classe.
    armi = opt["armi_padronanza"]
    assert len(armi) >= 30 and armi.get("Lancia") == "Fiaccare"
    assert opt["classi"]["barbaro"]["padronanza_armi"] == 2
    assert opt["classi"]["guerriero"]["padronanza_armi"] == 3
    # Ladro/Paladino/Ranger: hanno il privilegio ma non la colonna -> fallback 2.
    assert opt["classi"]["ladro"]["padronanza_armi"] == 2
    # I caster puri non ottengono padronanza d'armi.
    assert opt["classi"]["mago"]["padronanza_armi"] == 0


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
        '    getFileCache: () => ({ frontmatter: { creature: ["[[Goblin]]","[[Goblin]]","[[Orco|Bruto]]"], alleati: ["[[Lupo Addestrato]]"] } }),\n'
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
    assert "  - Lupo Addestrato, ally" in out  # alleato emesso col flag ally (P2)
    assert "Nome Creatura" not in out        # placeholder sostituito
    assert out.count("```encounter") == 1    # un solo blocco, ben formato
    assert out.startswith("# Incontro") and out.rstrip().endswith("fine")  # corpo preservato


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
        f'const meta = require({json.dumps(str(render.JS_DIR / "meta_actions.js"))});\n'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
def test_parse_nodo(tmp_path):
    """views.parseNodo (albero evolutivo): "grado | nome | prerequisito | effetto" →
    struttura; grado non numerico → 0; prerequisito "—" → vuoto."""
    harness = tmp_path / "nodo.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
def test_riposo_lungo_e2e(tmp_path):
    """meta_actions.riposo_lungo: PF al massimo, PF temp/TS morte/slot_uso azzerati,
    e UN livello di Esaurimento rimosso (2024: −1 a riposo lungo, non azzerato)."""
    harness = tmp_path / "riposo.js"
    harness.write_text(
        'global.Notice = class { constructor(m){} };\n'
        'const fm = { pf:5, pf_max:20, pf_temp:4, ts_morte_successi:2, ts_morte_fallimenti:1,'
        ' slot_uso_1:1, esaurimento:3, concentrazione_su:"Benedizione", dadi_vita_max:4, dadi_vita_spesi:3 };\n'
        'const file = { basename:"Eroe", path:"Personaggi/Eroe.md" };\n'
        'global.app = {\n'
        '  workspace: { getActiveFile: () => file },\n'
        '  metadataCache: { getFileCache: () => ({ frontmatter: fm }) },\n'
        '  fileManager: { processFrontMatter: async (f, fn) => fn(fm) },\n'
        '};\n'
        f'const meta = require({json.dumps(str(render.JS_DIR / "meta_actions.js"))});\n'
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
            f'const meta = require({json.dumps(str(render.JS_DIR / "meta_actions.js"))});\n'
            'meta({}, "riposo_breve").then(() => process.stdout.write(JSON.stringify(fm)));\n',
            encoding="utf-8")
        res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
        assert res.returncode == 0, res.stderr
        return json.loads(res.stdout)

    # COS 14 (+2), d10: cura fra 1+2=3 e 10+2=12, pf 5→[8..17] cappato a 20.
    fm = run('{ pf:5, pf_max:20, dado_vita:10, costituzione:14, dadi_vita_max:3, dadi_vita_spesi:0 }')
    assert fm["dadi_vita_spesi"] == 1
    assert 8 <= fm["pf"] <= 17
    # Nessun Dado Vita rimasto: invariato.
    fm2 = run('{ pf:5, pf_max:20, dado_vita:10, costituzione:14, dadi_vita_max:1, dadi_vita_spesi:1 }')
    assert fm2["dadi_vita_spesi"] == 1 and fm2["pf"] == 5


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


def test_validate_aux_yaml_real_files_pass():
    """Regressione: il validatore degli YAML ausiliari concorda con i file spediti
    (astrologia/generatori/fcg_it/pg_rules)."""
    assert render.validate_aux_yaml() == []


def test_validate_aux_yaml_catches_breakage(monkeypatch):
    """Fail-fast: un refuso negli YAML ausiliari è un errore di check(), non solo
    un crash in-app — qui un segno senza 'archetipo' viene segnalato."""
    import validate as _v
    real = _v.load_yaml

    def fake(name):
        if name == "astrologia.yaml":
            return {"segni": [{"nome": "Ariete", "elemento": "Fuoco"}],  # manca archetipo
                    "elementi": [{"nome": "Fuoco"}], "arcani": [{"nome": "Il Matto"}]}
        if name in ("generatori.yaml", "fcg_it.yaml", "pg_rules.yaml"):
            raise FileNotFoundError(name)  # opzionali: assenti -> saltati
        return real(name)

    monkeypatch.setattr(_v, "load_yaml", fake)
    errors = _v.validate_aux_yaml()
    assert any("archetipo" in e for e in errors), errors


def test_example_world():
    """Mondo-esempio: ogni nota del manifest si genera con categoria valida sotto la
    cartella riservata e popola le dashboard chiave; una nota-fronte espone il clock
    e la superficie giocabile (lore→tavolo)."""
    manifests = render.load_example_manifests()
    assert manifests, "nessun manifest mondo-esempio in Dev/Source/esempio/"
    man = manifests[0]
    notes = render.example_world_notes(man, CORE)
    assert len(notes) == len(man["note"]), "qualche nota saltata (categoria sconosciuta?)"
    cats = set(CORE["categories"])
    for rel, txt in notes:
        assert rel.startswith(f"Mondi/_Esempio — {man['mondo']}/"), rel
        cat_line = next(l for l in txt.splitlines() if l.startswith("categoria: "))
        assert cat_line.split(": ", 1)[1] in cats, rel
    joined = "\n".join(t for _, t in notes)
    for cat in ("mondo", "luogo", "fazione", "personaggio", "evento", "creatura", "incontro", "risorsa"):
        assert f"categoria: {cat}" in joined, f"manca una nota di categoria {cat}"
    voragine = next(t for r, t in notes if r.endswith("La Voragine.md"))
    assert "**Clock**: 4/6" in voragine and "[!tavolo]" in voragine and "list from" in voragine


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


def test_comparators_single_source():
    """matchesCond ha una sorgente canonica (_comparators.js); le copie in views.js
    e meta_actions.js coincidono byte-a-byte (anti-drift strutturale imposto da
    check(), oltre al guard runtime di test_anti_drift_matchescond)."""
    import validate as _v
    canonical = _v.marked_block((render.JS_DIR / "_comparators.js").read_text(encoding="utf-8"), "matchesCond")
    assert canonical, "blocco canonico matchesCond mancante in _comparators.js"
    for name in ("views.js", "meta_actions.js"):
        block = _v.marked_block((render.JS_DIR / name).read_text(encoding="utf-8"), "matchesCond")
        assert block == canonical, f"{name}: matchesCond diverge dalla sorgente canonica _comparators.js"


def test_homebrew_bridge_single_source():
    """Il ponte homebrew ha una sorgente canonica (_homebrew_bridge.js); le copie in
    crea_pg.js e sali_pg.js coincidono byte-a-byte — così creazione e level-up non
    possono divergere sulle regole homebrew (anti-drift imposto anche da check())."""
    import validate as _v
    canonical = _v.marked_block((render.JS_DIR / "_homebrew_bridge.js").read_text(encoding="utf-8"), "homebrew-bridge")
    assert canonical, "blocco canonico homebrew-bridge mancante in _homebrew_bridge.js"
    for name in ("crea_pg.js", "sali_pg.js"):
        block = _v.marked_block((render.JS_DIR / name).read_text(encoding="utf-8"), "homebrew-bridge")
        assert block == canonical, f"{name}: ponte homebrew diverge dalla sorgente canonica _homebrew_bridge.js"


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_famiglia_preset(tmp_path):
    """create_entity.famigliaPreset: la famiglia col campo 'assi' pre-compila i
    valori-assi (cultura/guerriera); famiglia senza preset o inesistente -> {}.
    Gli id-asse dei preset sono validati da validate (shape: famiglie)."""
    cats = CORE.get("categories") or {}
    spec = cats.get("cultura") or {}
    assert spec.get("famiglie"), "cultura senza famiglie"
    harness = tmp_path / "fam.js"
    harness.write_text(
        f'const crea=require({json.dumps(str(render.JS_DIR / "create_entity.js"))});'
        f'const spec={json.dumps(spec, ensure_ascii=False)};'
        f'const faz={json.dumps(cats.get("fazione") or {}, ensure_ascii=False)};'
        f'const div={json.dumps(cats.get("divinita") or {}, ensure_ascii=False)};'
        'process.stdout.write(JSON.stringify({'
        'guer:crea.famigliaPreset(spec,"guerriera"),'
        'nom:crea.famigliaPreset(spec,"nomadica"),'
        'x:crea.famigliaPreset(spec,"inesistente"),'
        'mil:crea.famigliaPreset(faz,"militare"),'
        'prim:crea.famigliaPreset(div,"primordiale")}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["guer"] == {"valori_dominanti": 3, "relazione_morte": 2, "ritualizzazione_vita": 4}
    assert out["nom"] == {}      # famiglia senza preset
    assert out["x"] == {}        # famiglia inesistente
    assert out["mil"] == {"struttura": 5, "etica_conflitto": 4, "coesione": 4}   # preset fazione
    assert out["prim"] == {"presenza_cosmica": 1, "incarnazione": 1, "volonta": 1}  # preset divinità


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_relations_to_ask(tmp_path):
    """create_entity.relationsToAsk: il wizard offre le relazioni della categoria
    escludendo quelle già chieste come creation.fields (no doppio-prompt).
    personaggio: fazione/luogo (in creation) esclusi, parenti/alleati/rivali inclusi;
    luogo: tutte le relazioni (creation = solo tipo+mondo)."""
    def asked(cat):
        cr = (CORE.get("creation") or {}).get(cat) or {}
        return [q["field"] for q in (cr.get("fields") or []) + (cr.get("body") or [])]
    rel = CORE.get("relazioni") or {}

    def expected(cat):
        return {r["field"] for r in rel.get(cat, [])} - set(asked(cat))

    harness = tmp_path / "rta.js"
    harness.write_text(
        f'const crea=require({json.dumps(str(render.JS_DIR / "create_entity.js"))});'
        f'const rel={json.dumps(rel, ensure_ascii=False)};'
        f'const asked={json.dumps({"personaggio": asked("personaggio"), "luogo": asked("luogo")}, ensure_ascii=False)};'
        'const f=(c)=>crea.relationsToAsk(rel[c], asked[c]).map(r=>r.field);'
        'process.stdout.write(JSON.stringify({png:f("personaggio"), luogo:f("luogo")}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    # Esclude le relazioni già chieste come creation.fields/body (no doppio-prompt).
    assert set(out["png"]) == expected("personaggio")
    assert set(out["luogo"]) == expected("luogo")
    assert "fazione" not in out["png"] and "luogo" not in out["png"]   # già in creation.fields
    assert {"parenti", "alleati", "rivali"} <= set(out["png"])


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_reciprocal_field(tmp_path):
    """meta_actions.reciprocalField: inverso TIPIZZATO quando la coppia è univoca
    (linkando luogo→cultura, cultura ha solo 'regioni'→luogo); null (→ generico
    connessioni) se ambiguo (personaggio→fazione: fazione ha figure E fondatori)."""
    rel = CORE.get("relazioni") or {}
    harness = tmp_path / "rf.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const s=fs.readFileSync({json.dumps(str(render.JS_DIR / "meta_actions.js"))},"utf8");'
        'const m={exports:{}};new Function("module","exports",s)(m,m.exports);'
        f'const rel={json.dumps(rel, ensure_ascii=False)};'
        'const rf=m.exports.reciprocalField;'
        'process.stdout.write(JSON.stringify({'
        'cultura:(rf(rel,"cultura","luogo")||{}).field||null,'
        'fazione:(rf(rel,"fazione","personaggio")||{}).field||null,'
        'epoca:(rf(rel,"epoca","evento")||{}).field||null}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["cultura"] == "regioni"   # coppia univoca -> inverso tipizzato
    assert out["fazione"] is None        # ambiguo (figure+fondatori) -> generico
    assert out["epoca"] == "eventi"      # univoca


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_inverse_relation(tmp_path):
    """meta_actions.inverseRelation: inverso ESPLICITO (rel.reciprocal) quando
    dichiarato — simmetrico (luogo.confina_con↔confina_con) o direzionale
    (evento.causato_da↔conseguenze); altrimenti ricade su reciprocalField (auto)
    o null. L'esplicito è ciò che rende corretto Collega dove l'auto è ambiguo."""
    rel = CORE.get("relazioni") or {}
    harness = tmp_path / "ir.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const s=fs.readFileSync({json.dumps(str(render.JS_DIR / "meta_actions.js"))},"utf8");'
        'const m={exports:{}};new Function("module","exports",s)(m,m.exports);'
        f'const core={json.dumps({"relazioni": rel}, ensure_ascii=False)};'
        'const find=(c,f)=>core.relazioni[c].find(r=>r.field===f);'
        'const ir=m.exports.inverseRelation;'
        'const r=(rel,sc,tc)=>{const x=ir(core,rel,sc,tc);return x?x.field:null;};'
        'process.stdout.write(JSON.stringify({'
        'confina:r(find("luogo","confina_con"),"luogo","luogo"),'        # simmetrico esplicito
        'causa:r(find("evento","causato_da"),"evento","evento"),'        # direzionale esplicito
        'conseg:r(find("evento","conseguenze"),"evento","evento"),'      # direzionale esplicito (inverso)
        'cultura:r(find("luogo","cultura"),"luogo","cultura"),'          # niente reciprocal -> auto
        'fazione:r(find("personaggio","fazione"),"personaggio","fazione")}));',  # ambiguo -> null
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["confina"] == "confina_con"   # esplicito simmetrico (sé stesso)
    assert out["causa"] == "conseguenze"     # esplicito direzionale
    assert out["conseg"] == "causato_da"     # esplicito direzionale (lato inverso)
    assert out["cultura"] == "regioni"       # nessun reciprocal -> auto-derivato
    assert out["fazione"] is None            # ambiguo, nessun reciprocal -> generico (connessioni)


def test_validate_reciprocals():
    """validate_reciprocals: il modello reale è pulito; un reciprocal che nomina un
    campo inesistente sul target è intercettato (fail-fast a build, non in-app)."""
    core = render.load_core()
    assert render.validate_reciprocals(core) == []
    broken = {"relazioni": {
        "luogo": [{"field": "confina_con", "label": "Confina con", "category": "luogo", "reciprocal": "nonesiste"}],
    }}
    errs = render.validate_reciprocals(broken)
    assert errs and "reciprocal 'nonesiste'" in errs[0]


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_homebrew_bridge(tmp_path):
    """Ponte homebrew→motore (crea_pg/sali_pg): incantesimiHomebrew filtra le note
    categoria=incantesimo per classe (classi cita la classe, o vuote = tutti),
    raggruppa per livello (mancante→1), esclude archiviate; fondiPool unisce SRD+
    homebrew senza duplicati; talentiHomebrew raccoglie le note categoria=talento.
    Degrada a vuoto senza app.vault.getMarkdownFiles (verificato dai test PG e2e)."""
    import build_personaggio
    full = build_personaggio.build_personaggio_options(CORE)
    opt = {"caratteristiche": full["caratteristiche"],
           "abilita": {k: {"label": v.get("label", k)} for k, v in full["abilita"].items()},
           "slot_incantatore": full["slot_incantatore"]}
    harness = tmp_path / "hb.js"
    harness.write_text(
        f'const crea=require({json.dumps(str(render.JS_DIR / "crea_pg.js"))});'
        f'const sali=require({json.dumps(str(render.JS_DIR / "sali_pg.js"))});'
        f'const opt={json.dumps(opt, ensure_ascii=False)};'
        'const F=(basename,fm)=>({f:{basename,path:basename+".md"},fm});'
        'const files=[F("Dardo arcano",{categoria:"incantesimo",livello:1,classi:"Mago, Stregone"}),'
        ' F("Tocco gelido",{categoria:"incantesimo",livello:0,classi:"Mago"}),'
        ' F("Cura ferite",{categoria:"incantesimo",livello:1,classi:"Chierico"}),'
        ' F("Eco senza scuola",{categoria:"incantesimo",livello:2}),'              # niente classi = a tutti
        ' F("Spell vecchio",{categoria:"incantesimo",livello:1,classi:"Mago",stato:"archiviata"}),'  # esclusa
        ' F("Maestro ombre",{categoria:"talento"}),'
        ' F("Talento vecchio",{categoria:"talento",stato:"archiviata"}),'          # esclusa
        ' F("Cenerino",{categoria:"background",car_background:"Forza, Costituzione, Saggezza",'
        '   abilita_background:"Atletica, Sopravvivenza",talento_origine:"Robusto",strumento:"Strumenti da fabbro"}),'
        ' F("Ceneride",{categoria:"specie",taglia:"Media",velocita:"9 m",tratti:"Vedono al buio: scurovisione a 18 m."}),'
        ' F("Lama del Vuoto",{categoria:"classe",dado_vita:"d10",ts_competenze:"Forza, Costituzione",'
        '   tipo_incantatore:"mezzo",competenze_armature:"Armature leggere e medie; scudi",abilita_numero:2,'
        '   privilegi_l1:"Colpo del vuoto; Lama spettrale",livello_sottoclasse:3}),'
        ' F("Bruto",{categoria:"classe",dado_vita:"d12",ts_competenze:"Forza, Costituzione",tipo_incantatore:"nessuno"}),'
        ' F("Setta del Nulla",{categoria:"sottoclasse",classe:"[[Lama del Vuoto]]"}),'  # sottoclasse homebrew
        ' F("Un luogo",{categoria:"luogo"})];'                                     # esclusa
        'global.app={vault:{getMarkdownFiles:()=>files.map(x=>x.f)},'
        ' metadataCache:{getFileCache:(f)=>({frontmatter:(files.find(x=>x.f===f)||{}).fm})}};'
        'const out={'
        ' mago:crea.incantesimiHomebrew("mago","Mago"),'
        ' chierico:crea.incantesimiHomebrew("chierico","Chierico"),'
        ' fusione:crea.fondiPool({"1":["Palla di fuoco"]},{"1":["Dardo arcano"],"0":["Tocco gelido"]}),'
        ' talenti:Object.keys(sali.talentiHomebrew()),'
        ' bg:crea.backgroundHomebrew(opt).Cenerino,'
        ' sp:crea.specieHomebrew().Ceneride,'
        ' cl:crea.classeHomebrew(opt)["Lama del Vuoto"],'
        ' clMartial:crea.classeHomebrew(opt).Bruto,'
        ' clSali:sali.classeHomebrew(opt)["Lama del Vuoto"],'
        ' sub:Object.keys(sali.sottoclasseHomebrew("Lama del Vuoto","Lama del Vuoto"))};'
        'process.stdout.write(JSON.stringify(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["mago"] == {"0": ["Tocco gelido"], "1": ["Dardo arcano"], "2": ["Eco senza scuola"]}  # Mago + senza-classi, no Chierico/archiviata
    assert out["chierico"] == {"1": ["Cura ferite"], "2": ["Eco senza scuola"]}
    assert out["fusione"]["1"] == ["Palla di fuoco", "Dardo arcano"] and out["fusione"]["0"] == ["Tocco gelido"]
    assert out["talenti"] == ["Maestro ombre"]                                     # talento attivo, no archiviata/luogo
    # Background homebrew: label umane → id del motore (tollerante).
    assert out["bg"]["punteggi_caratteristica"] == ["forza", "costituzione", "saggezza"]
    assert out["bg"]["competenze_abilita"] == ["atletica", "sopravvivenza"]
    assert out["bg"]["talento_origine"] == "Robusto" and out["bg"]["strumenti"] == "Strumenti da fabbro"
    # Specie homebrew: taglia/velocità parsate, scurovisione dedotta dai tratti.
    assert out["sp"]["taglia"] == "Media" and out["sp"]["velocita"] == 9 and out["sp"]["scurovisione"] is True
    # Classe homebrew CASTER (mezzo): dado vita, TS→id, categorie armatura, slot L1 dalla tabella SRD.
    cl = out["cl"]
    assert cl["dado_vita"] == 10 and cl["tiri_salvezza"] == ["forza", "costituzione"]
    assert cl["incantatore"] is True and cl["tipo_incantatore"] == "mezzo"
    assert cl["competenze_armature_cat"] == ["leggera", "media", "scudo"]
    assert cl["slot_l1"] == {"1": 2} and cl["abilita"]["scelte"] == 2 and len(cl["abilita"]["opzioni"]) == 18
    # Privilegi di 1º livello (lista, split su ";") + livello sottoclasse (default 3).
    assert cl["privilegi_l1"] == ["Colpo del vuoto", "Lama spettrale"] and cl["livello_sottoclasse"] == 3
    assert out["clMartial"]["incantatore"] is False and out["clMartial"]["slot_l1"] == {}  # marziale: niente slot
    assert out["clMartial"]["livello_sottoclasse"] == 3 and out["clMartial"]["privilegi_l1"] == []  # default/vuoto
    assert out["clSali"]["dado_vita"] == 10 and out["clSali"]["tipo_incantatore"] == "mezzo"  # twin crea/sali coerenti
    assert out["sub"] == ["Setta del Nulla"]  # sottoclasse homebrew legata alla classe (sali_pg)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_dintorni(tmp_path):
    """views.renderDintorni: regione contenitore, luoghi contenuti, distanza per
    CONFINI (BFS su confina_con) e IN LINEA D'ARIA (euclidea × mondo.scala_mappa, km),
    più le rotte. Grafo: Voragine—Forte—Bosco—Mercato (catena); rotta Forte↔Mercato.
    Coord (scala 2 km/u): Forte(50,50) Voragine(51,50) Bosco(62,50) Mercato(80,49)."""
    harness = tmp_path / "dint.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
    assert "🛣 Rotte di viaggio** (1): [[Mercato]]" in a      # rotta diretta ≠ adiacenza
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
def test_avanza_fronte(tmp_path):
    """meta_actions.avanza_fronte: clock +1 con cap a clock_dim; senza clock_dim no-op."""
    harness = tmp_path / "av.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const s=fs.readFileSync({json.dumps(str(render.JS_DIR / "meta_actions.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const s=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const s=fs.readFileSync({json.dumps(str(render.JS_DIR / "meta_actions.js"))},"utf8");'
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


def test_site_markdown_to_html():
    """Il convertitore Markdown→HTML copre il sottoinsieme delle note lore."""
    md = ("## Titolo\n\nProsa con **grassetto**, *corsivo* e `codice`.\n\n"
          "- uno\n- due\n\nVai a [[Forte Cenere|forte]] o [esterno](https://x.io).")
    links = {"forte cenere": "forte-cenere.html"}
    html = build_site.markdown_to_html(md, lambda n: links.get(n.lower()))
    assert "<h2>Titolo</h2>" in html
    assert "<strong>grassetto</strong>" in html and "<em>corsivo</em>" in html
    assert "<code>codice</code>" in html
    assert "<ul><li>uno</li><li>due</li></ul>" in html
    assert '<a href="forte-cenere.html">forte</a>' in html
    assert '<a href="https://x.io" rel="noopener">esterno</a>' in html


def test_site_strip_body_removes_dynamic_and_callouts():
    """strip_body toglie blocchi recintati, Templater, Meta Bind, callout (incl.
    GM) e l'H1, lasciando la sola prosa player-safe."""
    body = ("# Titolo\n\nProsa visibile.\n\n"
            "> [!segreto]- Segreto\n> contenuto top secret\n\n"
            "> [!tavolo] Uso al tavolo\n> mossa del DM\n\n"
            "```dataview\nlist\n```\n\n"
            "````tabs\n--- T\n```js-engine\nreturn x\n```\n````\n\n"
            "`INPUT[text:foo]` `VIEW[{bar}]`\n")
    out = build_site.strip_body(body)
    assert "Prosa visibile." in out
    for leak in ["top secret", "mossa del DM", "dataview", "js-engine", "INPUT[", "VIEW[", "Titolo"]:
        assert leak not in out, leak


def test_site_is_public():
    assert build_site.is_public({"categoria": "luogo"})
    assert not build_site.is_public({"categoria": "luogo", "visibilita": "dm"})
    assert not build_site.is_public({"categoria": "luogo", "pubblico": False})
    assert not build_site.is_public({"categoria": "sessione"})  # log/strumento DM
    assert not build_site.is_public({})  # senza categoria


def test_build_site_no_spoiler_leak(tmp_path):
    """Integrazione: il sito generato NON contiene mai campi GM (uso_al_tavolo/
    gancio/prossima_mossa/pressione/segreto), esclude le note `visibilita: dm`, e
    scrive index.html + site.css."""
    nd = tmp_path / "vault" / "Mondi" / "Mondo X"
    nd.mkdir(parents=True)
    (nd / "Cripta.md").write_text(
        "---\nnome: Cripta\ncategoria: luogo\ntipo: rovina\nmondo: '[[Mondo X]]'\n"
        "uso_al_tavolo: TRAPPOLA_DM\ngancio: AGGANCIO_DM\nprossima_mossa: MOSSA_DM\n"
        "pressione: 8\nsegreto: VERITA_NASCOSTA\nclima: gelido\n---\n\n"
        "# Cripta\n\nUna cripta antica. Tira `dice: [[Tabella DM]]` ROLL_DM qui.\n\n"
        "> [!segreto]- Segreto\n> ALTRO_SEGRETO\n",
        encoding="utf-8")
    (nd / "Privata.md").write_text(
        "---\nnome: Privata\ncategoria: luogo\nvisibilita: dm\nmondo: '[[Mondo X]]'\n---\n\nNON_DEVE_USCIRE\n",
        encoding="utf-8")
    out = tmp_path / "site"
    n = build_site.build_site(CORE, tmp_path / "vault", out)
    assert n == 1  # Privata (visibilita: dm) esclusa
    blob = "\n".join(p.read_text(encoding="utf-8") for p in out.glob("*.html"))
    assert "Una cripta antica." in blob and "gelido" in blob
    for spoiler in ["TRAPPOLA_DM", "AGGANCIO_DM", "MOSSA_DM", "VERITA_NASCOSTA", "ALTRO_SEGRETO", "NON_DEVE_USCIRE"]:
        assert spoiler not in blob, spoiler
    assert "dice:" not in blob and "Tabella DM" not in blob  # i tiri Dice Roller (DM) non trapelano (P3)
    assert (out / "index.html").is_file() and (out / "site.css").is_file()
