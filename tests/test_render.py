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
    file: { move: async () => {}, exists: async () => false } };
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


def test_initiative_statuses():
    """render.initiative_statuses: le condizioni 5.5e (core.condizioni) diventano status
    di Initiative Tracker {name, id, description}, con gli effetti uniti nella descrizione;
    id = nome (convenzione IT); le voci senza nome sono scartate; descrizione mai vuota."""
    core = {"condizioni": [
        {"nome": "Accecato", "descrizione": "Non vede.", "effetti": [{"descrizione": "Fallisce le prove a vista."}]},
        {"nome": "Avvelenato", "descrizione": "", "effetti": []},
        {"nome": "", "descrizione": "x"},
    ]}
    st = render.initiative_statuses(core)
    assert len(st) == 2                                     # la voce senza nome è scartata
    a = next(s for s in st if s["name"] == "Accecato")
    assert a["id"] == "Accecato" and "Fallisce le prove a vista" in a["description"]
    assert all(s["description"] for s in st)               # mai vuota (fallback al nome)


def test_background_2024_legale():
    """Un background homebrew 2024-legale DEVE concedere ASI (3 caratteristiche), 2
    abilità, 1 strumento e un Talento d'Origine: il wizard rende OBBLIGATORI questi
    campi-meccanica, così non si crea un background non conforme al 2024."""
    bg = next((e for e in render.load_entities() if e["id"] == "background"), None)
    assert bg, "entità background mancante"
    req = {q["field"] for q in (bg.get("creation", {}).get("fields") or []) if q.get("required")}
    for f in ("car_background", "abilita_background", "talento_origine", "strumento"):
        assert f in req, f"campo background '{f}' non obbligatorio → background non 2024-legale"


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


@pytest.mark.parametrize("name", ["home.md.j2", "leggimi.md.j2", "third_party_licenses.md.j2", "crea_il_tuo_mondo.md.j2", "ponte.md.j2", "fronti.md.j2", "rete.md.j2", "economia.md.j2", "geografia.md.j2", "missioni.md.j2", "occhi_giocatore.md.j2", "guida_combattimento.md.j2"])
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
        f'const meta = require({json.dumps(str(render.JS_DIR / "meta_actions.js"))});\n'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
def test_armi_homebrew(tmp_path):
    """views.armiHomebrew: legge le note `oggetto` con tipo=arma dal vault e le porta
    nello stesso shape del catalogo SRD (parità di campi) → un'arma homebrew gioca in
    attaccoArma come quelle ufficiali (qui: accurata → mod migliore, danni, maestria).
    Le note non-arma (pozione) sono escluse. App headless senza vault → {} (no crash)."""
    harness = tmp_path / "hw.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
def test_render_risorse_pg(tmp_path):
    """views.renderRisorsePG: barre proporzionali (PF, Dadi Vita, Esaurimento) dal
    frontmatter, max VARIABILE calcolato a runtime (progressBar Meta Bind non lo
    permette). Stringa vuota se la nota non è una scheda PG compilata."""
    harness = tmp_path / "risorse.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
    assert "CD incantesimo 13" in out          # 8 + 2 (PB) + 3 (mod INT 16)
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
            f'const meta = require({json.dumps(str(render.JS_DIR / "meta_actions.js"))});\n'
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
            f'const meta = require({json.dumps(str(render.JS_DIR / "meta_actions.js"))});\n'
            'meta(tp, "usa_risorsa").then(() => process.stdout.write(JSON.stringify(fm)));\n',
            encoding="utf-8")
        res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
        assert res.returncode == 0, res.stderr
        return json.loads(res.stdout)

    assert run(0)["usi_ira"] == 1   # speso 1 (0→1)
    assert run(2)["usi_ira"] == 3   # 2→3 (raggiunge il max)
    assert run(3)["usi_ira"] == 3   # già esaurita: invariato (non supera il max)


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
def test_render_timeline_tappe(tmp_path):
    """views.renderTimeline integra le `tappe` delle entità durature nella linea del
    tempo (📜, il mondo che evolve): raggruppate per epoca se il 'quando' nomina
    un'epoca esistente, altrimenti in fondo; il conteggio tappe entra nell'intestazione."""
    harness = tmp_path / "timeline_tappe.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_render_entity_panel(tmp_path):
    """views.renderEntityPanel: griglia stato-tavolo (uso/gancio/pressione/mossa) con
    classe ready/missing + backlinks risolti (renderBacklinks). Vuoto se page null."""
    harness = tmp_path / "entitypanel.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_talento_ammesso(tmp_path):
    """sali_pg.talentoAmmesso: gating talenti 2024 a un ASI — solo GENERALE; i DONI
    EPICI dal livello 19; ORIGINE/STILE esclusi; categoria ignota (homebrew non
    marcato) = permesso (non blocca)."""
    harness = tmp_path / "ta.js"
    harness.write_text(
        f'const s=require({json.dumps(str(render.JS_DIR / "sali_pg.js"))});'
        'const f=(cat,liv)=>s.talentoAmmesso({categoria:cat},liv);'
        'process.stdout.write(JSON.stringify({'
        'gen:f("Generale",4), ori:f("Origini",4), stile:f("Stile di combattimento",4),'
        'epic8:f("Dono epico",8), epic19:f("Dono epico",19),'
        'hb:f("generale",8), vuoto:f("",4)}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    assert json.loads(res.stdout) == {
        "gen": True, "ori": False, "stile": False,
        "epic8": False, "epic19": True, "hb": True, "vuoto": True}


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
    for sec in ("png", "taverna", "gancio",                          # spunti Stage 1
                "diceria", "bottino", "insediamento", "oggetto",     # spunti Stage 2
                "meteo", "dungeon_stanza", "bevanda"):               # spunti Stage 3
        assert g[sec]["forme"], f"{sec}.forme assente"
    # tesoro (SRD): generatore dedicato (niente `forme`, lo salta il validatore) —
    # le sue parti italiane vivono in YAML, i nomi-oggetto li inietta render.py.
    tes = g["tesoro"]
    assert tes["fasce"] and tes["monete"] and tes["importi"], "tesoro: scaffolding incompleto"
    assert set(tes["fasce"]) <= set(tes["monete"]) and set(tes["fasce"]) <= set(tes["importi"]), \
        "tesoro: ogni fascia deve avere monete e importi"
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


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_genera_spunti_e2e(tmp_path):
    """genera.js: i generatori-spunto (png/taverna/gancio, via generaDaForme) producono
    opzioni distinte, non vuote e con TUTTI i placeholder risolti (nessun {..} residuo)."""
    gen = render.load_yaml("generatori.yaml")
    harness = tmp_path / "gs.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const genera=require({json.dumps(str(render.JS_DIR / "genera.js"))});'
        f'const gen={json.dumps(gen, ensure_ascii=False)};'
        'let s=11;const rng=()=>(s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff;'
        'const st=Object.keys(gen.stili)[0];const out={};'
        'for(const tipo of ["png","taverna","gancio","diceria","bottino","insediamento","oggetto","meteo","dungeon_stanza","bevanda"]){out[tipo]=genera.generaLista(gen,tipo,st,6,rng);}'
        'process.stdout.write(JSON.stringify(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    for tipo in ("png", "taverna", "gancio", "diceria", "bottino", "insediamento", "oggetto",
                 "meteo", "dungeon_stanza", "bevanda"):
        lst = out[tipo]
        assert len(lst) >= 4, f"{tipo}: troppe poche opzioni distinte: {lst}"
        for v in lst:
            assert v and "{" not in v, f"{tipo}: placeholder non risolto o vuoto: {v!r}"


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_genera_tesoro_e2e(tmp_path):
    """genera.js: il tesoro SRD (generaTesoro) lega monete a fascia + un oggetto/equip
    REALE dell'SRD. Verifica che render inietti i nomi, che ogni opzione citi un item
    vero, riporti le monete, e che gli oggetti magici (non mondani) portino la rarità."""
    gen = render.load_yaml("generatori.yaml")
    pool = render.srd_loot_pool()
    assert pool.get("mondano") and pool.get("rara"), "loot pool SRD vuoto o incompleto"
    gen["tesoro"]["_srd"] = pool                                      # iniezione (come in core.json)
    all_names = {n for names in pool.values() for n in names}
    mondani = set(pool["mondano"])
    harness = tmp_path / "gt.js"
    harness.write_text(
        f'const genera=require({json.dumps(str(render.JS_DIR / "genera.js"))});'
        f'const gen={json.dumps(gen, ensure_ascii=False)};'
        'let s=3;const rng=()=>(s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff;'
        'const st=Object.keys(gen.stili)[0];'
        'process.stdout.write(JSON.stringify(genera.generaLista(gen,"tesoro",st,8,rng)));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    lst = json.loads(res.stdout)
    assert len(lst) >= 4, f"tesoro: troppe poche opzioni distinte: {lst}"
    for v in lst:
        assert v and "{" not in v, f"tesoro: vuoto o placeholder residuo: {v!r}"
        cited = [n for n in all_names if n in v]
        assert cited, f"tesoro: nessun oggetto SRD reale citato: {v!r}"     # NON è item-soup
        assert any(c.isdigit() for c in v) or "rame" in v, f"tesoro: monete assenti: {v!r}"
        # Oggetto magico -> riporta la rarità; oggetto mondano -> niente tag.
        if "(rarità " in v:
            assert any(n in v and n not in mondani for n in cited), f"tesoro: tag rarità su item mondano: {v!r}"


def test_validate_aux_yaml_real_files_pass():
    """Regressione: il validatore degli YAML ausiliari concorda con i file spediti
    (astrologia/generatori/pg_rules)."""
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
        if name in ("generatori.yaml", "pg_rules.yaml"):
            raise FileNotFoundError(name)  # opzionali: assenti -> saltati
        return real(name)

    monkeypatch.setattr(_v, "load_yaml", fake)
    errors = _v.validate_aux_yaml()
    assert any("archetipo" in e for e in errors), errors


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_preset_satisfies_matchescond(tmp_path):
    """Invariante preset↔match: per ogni archetipo reale i valori-assi derivati da
    create_entity.presetValori soddisfano matchesCond sul suo 'quando'. (La parità
    BYTE di matchesCond fra views.js/meta_actions.js, sorgente unica _comparators.js,
    è imposta da check()/test_check_passes — qui resta solo l'invariante semantica.)"""
    archetipi = [a for lst in (CORE.get("archetipi") or {}).values() for a in lst]
    harness = tmp_path / "preset.js"
    harness.write_text(
        'const fs=require("fs");'
        'function load(p){const s=fs.readFileSync(p,"utf8");const m={exports:{}};'
        'new Function("module","exports",s)(m,m.exports);return m.exports;}'
        f'const views=load({json.dumps(str(render.JS_DIR / "views.js"))});'
        f'const crea=require({json.dumps(str(render.JS_DIR / "create_entity.js"))});'
        f'const archs={json.dumps(archetipi, ensure_ascii=False)};'
        'const inv=[];'
        'for(const a of archs){const vals=crea.presetValori(a);'
        'for(const [ax,cond] of Object.entries(a.quando||{})){'
        'if((ax in vals)&&!views.matchesCond(vals[ax],cond)) inv.push((a.nome||"?")+":"+ax);}}'
        'process.stdout.write(JSON.stringify({inv}));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["inv"] == [], f"preset non soddisfa matchesCond: {out['inv']}"
    assert archetipi, "nessun archetipo: l'invariante preset↔match non è stata esercitata"


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_wizard_writes_inverse(tmp_path):
    """create_entity.writeInverses: il wizard scrive l'inverso reciproco sul target (come
    Collega, ma ALLA CREAZIONE). `personaggio.fazione=[[Corvi]]` → sul target Corvi compare
    `figure: [[Mira]]` (coppia univoca, multi)."""
    core = {"relazioni": {
        "personaggio": [{"field": "fazione", "label": "Fazione", "category": "fazione"}],
        "fazione": [{"field": "figure", "label": "Figure", "category": "personaggio", "multi": True}],
    }}
    harness = tmp_path / "wizinv.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "create_entity.js"))},"utf8");'
        'const m={exports:{}};new Function("module","exports","require",src)(m,m.exports,require);'
        f'const core={json.dumps(core, ensure_ascii=False)};'
        'let saved=null;'
        'const target={path:"Mondi/Fazioni/Corvi.md", basename:"Corvi"};'
        'global.app={'
        '  metadataCache:{'
        '    getFirstLinkpathDest:(n)=>(n==="Corvi"?target:null),'
        '    getFileCache:()=>({frontmatter:{categoria:"fazione"}}),'
        '  },'
        '  fileManager:{processFrontMatter:async(f,fn)=>{const fm={};fn(fm);saved=fm;}},'
        '};'
        'm.exports.writeInverses(core,"personaggio","Mira",{fazione:"[[Corvi]]"})'
        '.then(()=>process.stdout.write(JSON.stringify(saved)));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out == {"figure": ["[[Mira]]"]}   # inverso tipizzato scritto sul target (coppia univoca, multi)


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_pick_multi(tmp_path):
    """create_entity.pickMulti: usa tp.system.multi_suggester (Templater >= 2.16) in un
    solo modale quando c'è; fallback al suggester ripetuto con "(fine)" quando manca."""
    harness = tmp_path / "pm.js"
    harness.write_text(
        f'const crea=require({json.dumps(str(render.JS_DIR / "create_entity.js"))});'
        'const items=["a","b","c"];'
        # con multi_suggester: ritorna direttamente il sottoinsieme scelto
        'const tpA={system:{multi_suggester:async(lf,its)=>its.slice(0,2)}};'
        # senza multi_suggester: suggester ripetuto, [null,...pool] -> vals[1]=primo del pool; null=(fine)
        'let calls=0;'
        'const tpB={system:{suggester:async(labels,vals)=>{calls++; return calls<=2?vals[1]:null;}}};'
        'Promise.all([crea.pickMulti(tpA,"L",items),crea.pickMulti(tpB,"L",[...items])])'
        '.then(([a,b])=>process.stdout.write(JSON.stringify({a,b})));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["a"] == ["a", "b"]   # multi_suggester: sottoinsieme in un colpo
    assert out["b"] == ["a", "b"]   # fallback: due scelte poi "(fine)"


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
    CONFINI (BFS su confina_con) e IN LINEA D'ARIA (euclidea × mondo.scala_mappa, km).
    Le rotte NON si elencano qui (stanno in Viaggio). Grafo: Voragine—Forte—Bosco—Mercato.
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
def test_spinte_teologiche(tmp_path):
    """views.spinteFronte (grafo TEOLOGICO): un Fronte religioso (culto / tipo culto)
    è spinto dalla metafisica — il dio/dominio cosmico che venera che freme o si desta,
    un culto rivale in ascesa, una profezia che lo riguarda che matura. I culti-rivali
    NON sono duplicati dal grafo economico generico (li possiede il teologico)."""
    harness = tmp_path / "teo.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
def test_render_stato_mondo(tmp_path):
    """views.renderStatoMondo (cruscotto Fronti): i Fronti (clock_dim) ordinati per
    imminenza (clock + spinte dal grafo); intestazione coi conteggi; non-fronti esclusi."""
    harness = tmp_path / "stato.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
        'const m={exports:{}};new Function("module","exports",src)(m,m.exports);'
        'const L=(n)=>({path:n+".md"});'
        'const mk=(name,categoria,ex)=>Object.assign({file:{name,path:name+".md"},categoria,stato:"pronto"},ex);'
        'const all=[mk("Sale","risorsa",{pressione:8,controllata_da:L("Capitolo")}),'
        ' mk("Capitolo","fazione",{}),'
        ' mk("Forte","luogo",{clock_dim:4,clock:1,dipende_da:[L("Sale")]}),'   # 1 spinta → score 0.375
        ' mk("Setta","fazione",{clock_dim:4,clock:3}),'                        # 0 spinte, 3/4 → score 0.75
        ' mk("Quieto","luogo",{})];'                                          # niente clock → non è un fronte
        'const dv={pages:()=>({where:(fn)=>({array:()=>all.filter(fn)})}),'
        ' page:(l)=>{const p=l&&l.path?l.path:l;return all.find(x=>x.file&&(x.file.path===p||x.file.name===p))||null;}};'
        'm.exports.renderStatoMondo({},dv).then(out=>process.stdout.write(out));',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = res.stdout
    assert "**2 fronti**" in out                             # Forte + Setta (Quieto/Sale/Capitolo non sono fronti)
    assert out.index("[[Setta]]") < out.index("[[Forte]]")   # Setta (0.75) prima di Forte (0.375)
    assert "⛓ Dipendi da [[Sale]]" in out                    # la spinta dal grafo di Forte è mostrata
    assert "3/4" in out and "1/4" in out                     # stato del clock per fronte
    assert "Quieto" not in out                               # senza clock → escluso


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_coerenza_tematica(tmp_path):
    """views.confrontoAssi + coerenzaNote: confronto su assi con lo STESSO id e note
    (contrasto forte ≥3 = tensione; rivale-specchio = tutti gli assi ≤1)."""
    harness = tmp_path / "coer.js"
    harness.write_text(
        'const fs=require("fs");'
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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
        f'const src=fs.readFileSync({json.dumps(str(render.JS_DIR / "views.js"))},"utf8");'
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


# --- Mappa mondo-esempio + asset sito ---------------------------------------
def test_site_image_embed_preserves_underscores():
    """L'embed-immagine diventa `<img>` con la src INTATTA (regressione: il filtro
    corsivo mangiava gli `_` dentro src/alt). Gli embed di NOTE restano inerti."""
    resolved = {}

    def image(name):
        if Path(name).suffix.lower() in build_site._IMG_EXT:
            resolved[name] = f"media/{Path(name).name}"
            return resolved[name]
        return None

    md = "Vedi ![[mappa_del_sale.svg|Mappa]] e ![[Una Nota]] qui."
    html = build_site.markdown_to_html(md, lambda n: None, image)
    assert '<img src="media/mappa_del_sale.svg" alt="Mappa" loading="lazy">' in html
    assert "<em>" not in html and "media/mappa<em>" not in html  # underscore intatti
    assert "Una Nota" not in html  # embed di nota: inerte, sparisce
    assert resolved == {"mappa_del_sale.svg": "media/mappa_del_sale.svg"}


def test_build_site_copies_referenced_assets(tmp_path):
    """Integrazione: mappa embeddata nel corpo e ritratto in frontmatter →
    <img src="media/..."> nelle pagine e i file copiati in <out>/media/."""
    vault = tmp_path / "vault"
    media = vault / "Media"
    media.mkdir(parents=True)
    (media / "mappa_del_borgo.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"0" * 16)
    (media / "sigillo.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"0" * 16)
    nd = vault / "Mondi" / "Mondo Y"
    nd.mkdir(parents=True)
    (nd / "Borgo.md").write_text(
        "---\nnome: Borgo\ncategoria: luogo\ntipo: insediamento\nmondo: '[[Mondo Y]]'\n"
        "ritratto: '[[sigillo.png]]'\n---\n\n# Borgo\n\nUn borgo fluviale.\n\n"
        "## Mappa\n\n![[mappa_del_borgo.png]]\n", encoding="utf-8")
    out = tmp_path / "site"
    n = build_site.build_site(CORE, vault, out)
    assert n == 1
    html = (out / "borgo.html").read_text(encoding="utf-8")
    assert '<img src="media/mappa_del_borgo.png"' in html      # mappa dal corpo
    assert 'class="portrait" src="media/sigillo.png"' in html  # ritratto da frontmatter
    assert (out / "media" / "mappa_del_borgo.png").is_file()
    assert (out / "media" / "sigillo.png").is_file()


# --- Rivelazione progressiva (sito-giocatori v2) ----------------------------
def test_reveal_rank_helpers():
    """Tier ordinati: nota senza/ignoto → pubblico(0); build `tutto` → max."""
    assert build_site.note_reveal_rank({}) == 0
    assert build_site.note_reveal_rank({"rivelazione": "segreto"}) == 2
    assert build_site.note_reveal_rank({"rivelazione": "boh"}) == 0   # ignoto → pubblico
    assert build_site.build_reveal_rank("pubblico") == 0
    assert build_site.build_reveal_rank("incontrato") == 1
    assert build_site.build_reveal_rank("tutto") == 2
    assert build_site.build_reveal_rank(None) == 0


def test_site_reveal_gating(tmp_path):
    """Il gate progressivo include una nota se il suo tier <= livello del build;
    le note non taggate (pubblico) escono sempre (retro-compatibile)."""
    nd = tmp_path / "vault" / "Mondi" / "Mondo Z"
    nd.mkdir(parents=True)
    notes = {"Piazza": "", "Cripta": "incontrato", "Verita": "segreto"}
    for nome, tier in notes.items():
        riv = f"rivelazione: {tier}\n" if tier else ""
        (nd / f"{nome}.md").write_text(
            f"---\nnome: {nome}\ncategoria: luogo\nmondo: '[[Mondo Z]]'\n{riv}---\n\nProsa di {nome}.\n",
            encoding="utf-8")
    out = tmp_path / "site"
    # pubblico (default): solo Piazza; 2 da rivelare.
    assert build_site.build_site(CORE, tmp_path / "vault", out, reveal="pubblico") == 1
    assert "2 voci ancora da rivelare" in (out / "index.html").read_text(encoding="utf-8")
    assert (out / "piazza.html").is_file() and not (out / "cripta.html").is_file()
    # incontrato: Piazza + Cripta; Verita ancora no.
    assert build_site.build_site(CORE, tmp_path / "vault", out, reveal="incontrato") == 2
    assert (out / "cripta.html").is_file() and not (out / "verita.html").is_file()
    # tutto: tutte e tre.
    assert build_site.build_site(CORE, tmp_path / "vault", out, reveal="tutto") == 3
    assert (out / "verita.html").is_file()


def test_occhi_giocatore_dashboard():
    """La dashboard «Occhi del giocatore» raggruppa per tier di rivelazione e
    rispecchia la logica di build_site (esclude visibilita-DM dai tier condivisi,
    isola il solo-DM, esclude le categorie-strumento)."""
    out = _env().get_template("occhi_giocatore.md.j2").render(
        core=CORE, plugins=PLUGINS, templates=TEMPLATES, pages=PAGES)
    for header in ("Noto da subito", "Da scoprire", "Colpi di scena", "Solo DM"):
        assert header in out, header
    assert 'rivelazione = "incontrato"' in out and 'rivelazione = "segreto"' in out
    assert '!rivelazione or rivelazione = "pubblico"' in out      # untagged = pubblico
    # i tier condivisi escludono il solo-DM; il gruppo DM lo isola.
    assert '!visibilita or !contains(list("dm", "gm", "master", "privato", "segreto")' in out
    assert 'visibilita and contains(list("dm", "gm", "master", "privato", "segreto")' in out
    assert 'where !contains(list("sessione", "incontro", "insidia"), categoria)' in out
    assert "--reveal" in out                                       # rimanda al build


# --- Rivelazione PER-SEZIONE (callout [!rivela|tier]) ------------------------
def test_strip_body_reveal_callout():
    """Un callout `[!rivela|tier]` è svelato (contenuto → prosa) se il suo tier <=
    reveal_level; sotto resta celato. Gli altri callout sono sempre rimossi."""
    body = ("Prosa pubblica.\n\n"
            "> [!rivela|segreto]- Verità\n> IL SEGRETO.\n\n"
            "> [!rivela|incontrato] Scoperta\n> COSA SI SCOPRE.\n\n"
            "> [!nota] Normale\n> callout qualsiasi (sempre fuori).\n")
    # livello pubblico (0): nessun rivela svelato.
    s0 = build_site.strip_body(body, 0)
    assert "Prosa pubblica." in s0
    assert "IL SEGRETO." not in s0 and "COSA SI SCOPRE." not in s0
    # livello incontrato (1): solo l'incontrato.
    s1 = build_site.strip_body(body, 1)
    assert "COSA SI SCOPRE." in s1 and "IL SEGRETO." not in s1
    assert "### Scoperta" in s1                       # il titolo del callout → heading
    # livello segreto (2): entrambi.
    s2 = build_site.strip_body(body, 2)
    assert "IL SEGRETO." in s2 and "COSA SI SCOPRE." in s2
    # i callout non-rivela non trapelano mai.
    for s in (s0, s1, s2):
        assert "callout qualsiasi" not in s


def test_site_section_reveal_integration(tmp_path):
    """Una nota PUBBLICA con un callout `[!rivela|segreto]`: la pagina esce sempre,
    ma il segreto compare solo a --reveal segreto."""
    nd = tmp_path / "vault" / "Mondi" / "Mondo S"
    nd.mkdir(parents=True)
    (nd / "Rocca.md").write_text(
        "---\nnome: Rocca\ncategoria: luogo\nmondo: '[[Mondo S]]'\n---\n\n"
        "# Rocca\n\nUna rocca sul fiume.\n\n> [!rivela|segreto]- Sotto\n> CRIPTA_NASCOSTA.\n",
        encoding="utf-8")
    out = tmp_path / "site"
    build_site.build_site(CORE, tmp_path / "vault", out, reveal="pubblico")
    assert (out / "rocca.html").is_file()
    assert "CRIPTA_NASCOSTA" not in (out / "rocca.html").read_text(encoding="utf-8")
    build_site.build_site(CORE, tmp_path / "vault", out, reveal="segreto")
    assert "CRIPTA_NASCOSTA" in (out / "rocca.html").read_text(encoding="utf-8")


# --- Release / distribuzione (release.py) ------------------------------------
import release  # noqa: E402


def test_release_version_matches_package():
    """release.version() legge la versione da package.json (single source)."""
    import json
    pkg = json.loads((render.ROOT / "package.json").read_text(encoding="utf-8"))
    assert release.version() == pkg["version"]


def test_release_zip_tree_excludes_local_state(tmp_path):
    """zip_tree mette tutto sotto un'unica cartella-radice ed esclude lo stato
    locale (workspace/.DS_Store/.trash) → zip pulito e riproducibile."""
    import zipfile
    src = tmp_path / "vault"
    (src / ".obsidian").mkdir(parents=True)
    (src / ".trash").mkdir()
    (src / "nota.md").write_text("x", encoding="utf-8")
    (src / ".obsidian" / "app.json").write_text("{}", encoding="utf-8")
    (src / ".obsidian" / "workspace.json").write_text("{}", encoding="utf-8")
    (src / ".DS_Store").write_text("", encoding="utf-8")
    (src / ".trash" / "vecchia.md").write_text("y", encoding="utf-8")
    zpath = tmp_path / "out.zip"
    n = release.zip_tree(src, zpath, "GDR-vault")
    names = zipfile.ZipFile(zpath).namelist()
    assert "GDR-vault/nota.md" in names and "GDR-vault/.obsidian/app.json" in names
    assert all(name.startswith("GDR-vault/") for name in names)        # radice unica
    for excl in ("workspace.json", ".DS_Store", ".trash"):
        assert not any(excl in name for name in names), excl
    assert n == 2                                                      # nota + app.json


def test_third_party_licenses_complete():
    """Attribuzione plugin: ogni plugin bundlato (plugins.yaml) ha author/repo/
    license e compare in THIRD-PARTY-LICENSES con licenza e link al repo. Se aggiungi
    un plugin senza questi campi, il test fallisce → ti forza a verificarne la licenza."""
    out = _env().get_template("third_party_licenses.md.j2").render(
        core=CORE, plugins=PLUGINS, templates=TEMPLATES, pages=PAGES)
    plugins = PLUGINS["plugins"]
    assert len(plugins) >= 18
    for p in plugins:
        for field in ("author", "repo", "license"):
            assert p.get(field), f"{p['id']}: manca '{field}' (attribuzione)"
        assert p["name"] in out and p["license"] in out
        assert f"https://github.com/{p['repo']}" in out
    assert "mera aggregazione" in out                         # base legale dichiarata
    for lic in ("MIT", "GPL-3.0", "AGPL-3.0"):
        assert lic in out, lic


# --- Onboarding tour «Crea il tuo mondo» + libreria spunti ------------------
def test_spunti_library():
    """La libreria spunti (core.spunti) copre le categorie d'avvio, ognuna con
    almeno 3 domande-stimolo."""
    spunti = CORE.get("spunti", {})
    for cat in ("mondo", "luogo", "fazione", "cultura", "divinita", "regno",
                "specie", "evento", "personaggio"):
        assert spunti.get(cat) and len(spunti[cat]) >= 3, cat


def test_tour_crea_il_tuo_mondo():
    """Il tour «Crea il tuo mondo»: 5 tappe, bottoni Crea, spunti reali pescati
    da core.spunti, e i link ai cruscotti (lore→tavolo)."""
    tour = _env().get_template("crea_il_tuo_mondo.md.j2").render(
        core=CORE, plugins=PLUGINS, templates=TEMPLATES, pages=PAGES)
    for b in ("crea-mondo", "crea-luogo", "crea-fazione"):
        assert f"BUTTON[{b}]" in tour, b
    assert CORE["spunti"]["mondo"][0] in tour          # pesca davvero gli spunti
    for link in ("[[Fronti]]", "[[Rete del mondo]]", "[[Occhi del giocatore]]"):
        assert link in tour, link
    for step in ("1 ·", "2 ·", "3 ·", "4 ·", "5 ·"):
        assert step in tour, step


# --- World Board (Obsidian Canvas) ------------------------------------------
@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_world_board_runtime_e2e(tmp_path):
    """world_board (azione runtime, mock Obsidian): enumera le note del mondo scelto
    (la nota-mondo + ogni nota col suo `mondo`), costruisce il canvas e lo SCRIVE
    accanto alla nota-mondo. Con un solo mondo non serve il suggester. Verifica
    card-per-nota, archi tipizzati e percorso del file."""
    core = {
        "categories": {"mondo": {}, "luogo": {}, "fazione": {}},
        "relazioni": {"luogo": [{"field": "controllata_da", "label": "Controllata da", "category": "fazione"}]},
        "canvas_colors": {"luogo": "4", "fazione": "1"},
    }
    harness = tmp_path / "wb_rt.js"
    harness.write_text(
        f'const CORE={json.dumps(core, ensure_ascii=False)};\n'
        'const files=[\n'
        '  {basename:"Eldoria", path:"Mondi/Eldoria/Eldoria.md", parent:{path:"Mondi/Eldoria"}},\n'
        '  {basename:"Capitale", path:"Mondi/Eldoria/Capitale.md", parent:{path:"Mondi/Eldoria"}},\n'
        '  {basename:"Gilda", path:"Mondi/Eldoria/Gilda.md", parent:{path:"Mondi/Eldoria"}},\n'
        '  {basename:"Estraneo", path:"Mondi/Altro/Estraneo.md", parent:{path:"Mondi/Altro"}},\n'
        '];\n'
        'const fmByPath={\n'
        '  "Mondi/Eldoria/Eldoria.md":{categoria:"mondo"},\n'
        '  "Mondi/Eldoria/Capitale.md":{categoria:"luogo", mondo:"[[Eldoria]]", controllata_da:"[[Gilda]]"},\n'
        '  "Mondi/Eldoria/Gilda.md":{categoria:"fazione", mondo:"[[Eldoria]]"},\n'
        '  "Mondi/Altro/Estraneo.md":{categoria:"luogo", mondo:"[[Altro]]"},\n'
        '};\n'
        'let saved=null, savedPath=null;\n'
        'global.Notice=class{constructor(m){}};\n'
        'global.app={\n'
        '  vault:{\n'
        '    getMarkdownFiles:()=>files,\n'
        '    adapter:{read:async()=>JSON.stringify(CORE)},\n'
        '    getAbstractFileByPath:()=>null,\n'
        '    create:async(p,t)=>{savedPath=p; saved=t; return {path:p};},\n'
        '    modify:async()=>{},\n'
        '  },\n'
        '  metadataCache:{\n'
        '    getFileCache:(f)=>({frontmatter:fmByPath[f.path]||{}}),\n'
        '    getFirstLinkpathDest:(name)=>({basename:String(name).split("/").pop()}),\n'
        '  },\n'
        '  workspace:{getActiveFile:()=>null, getLeaf:()=>({openFile:async()=>{}})},\n'
        '};\n'
        f'const wb=require({json.dumps(str(render.JS_DIR / "world_board.js"))});\n'
        'wb({config:{}}).then(()=>process.stdout.write(JSON.stringify({path:savedPath, board:JSON.parse(saved)})));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["path"] == "Mondi/Eldoria/Eldoria — Board.canvas"   # accanto alla nota-mondo
    files_nodes = [n for n in out["board"]["nodes"] if n["type"] == "file"]
    names = {n["file"].split("/")[-1] for n in files_nodes}
    assert names == {"Eldoria.md", "Capitale.md", "Gilda.md"}      # mondo + sue note, NON l'estraneo
    edges = out["board"]["edges"]
    assert len(edges) == 1 and edges[0]["label"] == "Controllata da"  # relazione tipizzata


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_bastione_resolver_puro(tmp_path):
    """meta_actions.rollInline tira i dadi inline (NdM, ×K, ±B) lasciando l'etichetta;
    resolveTurno parsa «Struttura | Ordine | esito» e risolve gli esiti. RNG iniettato
    → deterministico. License-safe: ordini/esiti sono autoriali, l'azione fa i conti."""
    harness = tmp_path / "bast.js"
    harness.write_text(
        f'const meta=require({json.dumps(str(render.JS_DIR / "meta_actions.js"))});\n'
        'const zero=()=>0, hi=()=>0.99;\n'
        'const out={\n'
        '  min:meta.rollInline("1d6 lingotti", zero),\n'           # 1 -> "1 lingotti"
        '  mult:meta.rollInline("1d4×10 mo", hi),\n'               # (3+1)*10 -> "40 mo"
        '  modd:meta.rollInline("2d6+1 difensori", zero),\n'       # (1+1)+1 -> "3 difensori"
        '  nodice:meta.rollInline("un appunto sul nemico", zero),\n'
        '  turno:meta.resolveTurno(["Fucina | Fabbricare | 1d6 lingotti","Biblioteca | Ricercare | appunto"], zero),\n'
        '};\n'
        'process.stdout.write(JSON.stringify(out));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["min"] == "1 lingotti"
    assert out["mult"] == "40 mo"
    assert out["modd"] == "3 difensori"
    assert out["nodice"] == "un appunto sul nemico"          # nessun dado -> invariato
    assert out["turno"] == [
        {"struttura": "Fucina", "ordine": "Fabbricare", "esito": "1 lingotti"},
        {"struttura": "Biblioteca", "ordine": "Ricercare", "esito": "appunto"}]


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_bastione_turno_e2e(tmp_path):
    """meta_actions.turno_bastione risolve un turno dalle `ordini` dichiarate (mock
    Obsidian): numera il turno (turni+1), tira gli esiti e scrive un blocco datato
    nel *Registro dei turni*, aggiornando il frontmatter `turni`/`ultimo_turno`."""
    harness = tmp_path / "turno.js"
    harness.write_text(
        'const body="# Forte Cenere\\n\\n## Registro dei turni\\n";\n'
        'const fm={categoria:"bastione", turni:2, ordini:["Fucina | Fabbricare | 1d6 lingotti","Caserma | Reclutare | 1d4 difensori"]};\n'
        'let saved=null;\n'
        'global.Notice=class{constructor(m){}};\n'
        'const file={basename:"Forte Cenere", path:"Mondi/Bastioni/Forte Cenere.md"};\n'
        'global.app={\n'
        '  workspace:{getActiveFile:()=>file},\n'
        '  metadataCache:{getFileCache:()=>({frontmatter:fm})},\n'
        '  vault:{read:async()=>body, modify:async(f,d)=>{saved=d;}},\n'
        '  fileManager:{processFrontMatter:async(f,fn)=>{fn(fm);}},\n'
        '};\n'
        'const tp={date:{now:()=>"2026-06-04"}};\n'
        f'const meta=require({json.dumps(str(render.JS_DIR / "meta_actions.js"))});\n'
        'meta(tp,"turno_bastione").then(()=>process.stdout.write(JSON.stringify({saved, turni:fm.turni, ultimo:fm.ultimo_turno})));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["turni"] == 3 and out["ultimo"] == "2026-06-04"   # turno numerato + datato
    saved = out["saved"]
    assert "**Turno 3**" in saved
    assert "**Fucina** → *Fabbricare*" in saved
    assert "**Caserma** → *Reclutare*" in saved
    assert "- **2026-06-04** — **Turno 3**" in saved            # voce datata nel Registro
    assert saved.count("## Registro dei turni") == 1            # niente heading duplicato


@pytest.mark.skipif(not shutil.which("node"), reason="node assente")
def test_inizia_incontro_e2e(tmp_path):
    """meta_actions.inizia_incontro (ponte Initiative Tracker, mock plugin): auto-popola
    il Party IT dai PG (personaggio · tipo pg) — `playerFromPg` mappa nome/PF/CA/init-mod;
    aggiunge solo i PG MANCANTI al roster (`savePlayer`), unisce i nomi al party di
    default e persiste (`saveSettings`); i non-PG e i PG già presenti sono esclusi."""
    harness = tmp_path / "it.js"
    harness.write_text(
        'const saved=[];\n'
        'const it={data:{players:[{name:"Esistente"}], parties:[{name:"Gruppo",players:["Esistente"]}], defaultParty:"Gruppo"},\n'
        '  savePlayer:async function(p){this.data.players.push(p); saved.push(p.name);},\n'
        '  saveSettings:async function(){this.data._saved=(this.data._saved||0)+1;}};\n'
        'const files=[\n'
        '  {basename:"Vera", path:"Mondi/Personaggi/Vera.md"},\n'
        '  {basename:"Renzo", path:"Mondi/Personaggi/Renzo.md"},\n'
        '  {basename:"Goblin", path:"x/Goblin.md"},\n'
        '  {basename:"Esistente", path:"Mondi/Personaggi/Esistente.md"},\n'
        '];\n'
        'const fmByPath={\n'
        '  "Mondi/Personaggi/Vera.md":{categoria:"personaggio", tipo:"pg", nome:"Vera Sabbialesta", pf_max:25, ca:16, destrezza:14, livello:3},\n'
        '  "Mondi/Personaggi/Renzo.md":{categoria:"personaggio", tipo:"pg", nome:"Renzo", pf_max:18, ca:14, destrezza:16, livello:2},\n'
        '  "x/Goblin.md":{categoria:"creatura", tipo:"mostro"},\n'
        '  "Mondi/Personaggi/Esistente.md":{categoria:"personaggio", tipo:"pg", nome:"Esistente", pf_max:10, ca:12},\n'
        '};\n'
        'global.Notice=class{constructor(m){}};\n'
        'global.app={\n'
        '  vault:{getMarkdownFiles:()=>files},\n'
        '  metadataCache:{getFileCache:(f)=>({frontmatter:fmByPath[f.path]||{}})},\n'
        '  plugins:{plugins:{"initiative-tracker":it}},\n'
        '  commands:{executeCommandById:()=>{}},\n'
        '};\n'
        f'const meta=require({json.dumps(str(render.JS_DIR / "meta_actions.js"))});\n'
        'const pf=meta.playerFromPg({basename:"Vera"},fmByPath["Mondi/Personaggi/Vera.md"]);\n'
        'meta.inizia_incontro({}).then(()=>process.stdout.write(JSON.stringify({\n'
        '  pf, saved, party: it.data.parties.find(p=>p.name==="Gruppo").players,\n'
        '  roster: it.data.players.map(p=>p.name), savedCount: it.data._saved})));\n',
        encoding="utf-8")
    res = subprocess.run(["node", str(harness)], capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    out = json.loads(res.stdout)
    assert out["pf"] == {"name": "Vera Sabbialesta", "player": True, "hp": 25, "ac": 16, "modifier": 2, "level": 3}
    assert out["saved"] == ["Renzo", "Vera Sabbialesta"]        # solo i PG MANCANTI (Esistente già nel roster)
    assert set(out["party"]) == {"Esistente", "Renzo", "Vera Sabbialesta"}  # union col party esistente
    assert "Goblin" not in out["party"]                          # i non-PG esclusi
    assert out["savedCount"] >= 1                                # persistito (saveSettings)


# --- Pubblicazione itch (publish_itch.py) -----------------------------------
import publish_itch  # noqa: E402


def test_publish_itch_helpers(monkeypatch):
    """resolve_target(): env ITCH_TARGET ha precedenza; version() da package.json."""
    monkeypatch.setenv("ITCH_TARGET", "tizio/gdr")
    assert publish_itch.resolve_target() == "tizio/gdr"
    import json as _json
    pkg = _json.loads((render.ROOT / "package.json").read_text(encoding="utf-8"))
    assert publish_itch.version() == pkg["version"]
    # canali attesi (vault + sito)
    assert {c for c, _ in publish_itch.CHANNELS} == {"vault", "site"}


def test_callout_appearance_css_bare_icons():
    """Aspetto callout in gdr.css: --callout-icon col nome Lucide NUDO (senza
    'lucide-'), l'unico formato accettato dalla variabile CSS nativa (verificato
    in-app). L'infobox: solo icona (il colore viene dall'accento-categoria)."""
    css = render.callout_appearance_css(PLUGINS)
    assert '.callout[data-callout="tavolo"] {' in css
    assert "--callout-icon: swords;" in css
    assert "lucide-" not in css                          # mai il prefisso nella CSS var
    assert "--callout-color: 201, 64, 64;" in css
    assert "--callout-icon: scroll-text;" in css         # infobox
    assert '--callout-color' not in css.split('data-callout="infobox"')[1].split('}')[0]
