"""Test GDR — model. Fixtures condivise (CORE/TEMPLATES/_snapshot/...) in _common."""

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


def test_check_passes():
    """check() valida YAML/Jinja (split, field, tavolo, relazioni, pagine)."""
    assert render.check() == 0


def test_runtime_payloads_schema():
    """I payload runtime (core.json/personaggio.json) conformano ai loro JSON Schema —
    il contratto Python→JS reso esplicito. E lo schema RIFIUTA un payload malformato
    (testa la guardia, non solo i dati buoni → un drift di shape si fermerebbe al build)."""
    import validate
    assert validate.validate_runtime_payloads(CORE, TEMPLATES) == []
    import jsonschema
    schema = json.loads((validate.SCHEMA_DIR / "core.schema.json").read_text(encoding="utf-8"))
    errs = list(jsonschema.Draft202012Validator(schema).iter_errors({"folders": {}}))
    assert errs, "lo schema core dovrebbe rifiutare un payload senza le chiavi richieste"


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


@pytest.mark.parametrize("name", ["home.md.j2", "leggimi.md.j2", "third_party_licenses.md.j2", "crea_il_tuo_mondo.md.j2", "diagnostica.md.j2", "ponte.md.j2", "fronti.md.j2", "rete.md.j2", "economia.md.j2", "geografia.md.j2", "missioni.md.j2", "occhi_giocatore.md.j2", "guida_combattimento.md.j2"])
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
    sorted(render.JS_DIR.glob("*.js")) + sorted(render.JS_DIR.glob("*/*.js")) + sorted(render.JS_DIR.glob("*.mjs")),
    ids=lambda p: p.name if p.parent == render.JS_DIR else f"{p.parent.name}/{p.name}",
)
def test_js_syntax(js):
    # node --check deduce CommonJS/ESM dall'estensione (.js vs .mjs). Include i
    # frammenti degli script bundlati (JS_DIR/<pkg>/*.js), come `npm run check`.
    assert subprocess.run(["node", "--check", str(js)], capture_output=True).returncode == 0


@pytest.mark.skipif(not shutil.which("node"), reason="node non disponibile")
@pytest.mark.parametrize(
    "pkg",
    sorted(d.name for d in render.JS_DIR.iterdir() if d.is_dir() and any(d.glob("*.js"))),
)
def test_js_bundle_syntax(pkg, tmp_path):
    """Il BUNDLE (concatenazione di JS_DIR/<pkg>/*.js) è l'artefatto runtime reale —
    ciò che boot.mjs valuta: dev'essere JS valido, non solo i singoli frammenti."""
    f = tmp_path / f"{pkg}.js"
    f.write_text(render.bundle_js(pkg), encoding="utf-8")
    assert subprocess.run(["node", "--check", str(f)], capture_output=True).returncode == 0


def test_panels_registered():
    """Guard di drift JS Engine: ogni pannello referenziato in una macro Jinja
    (`panel(...,"renderX")`) DEVE essere nel registro boot.mjs PANELS, e ogni PANELS
    deve puntare a una funzione esportata da views.js. Senza questo, una macro che
    nomina un pannello non registrato passa check/snapshot ma lancia 'Pannello JS
    Engine sconosciuto' SOLO in-app (i test chiamano le view dirette, bypassando boot)."""
    import re
    boot = (render.JS_DIR / "boot.mjs").read_text(encoding="utf-8")
    panels = set(re.findall(r"(\w+):\s*\{\s*mode:", boot))
    views = VIEWS_SRC
    exported = set(re.findall(r"\b(render\w+)\b", views.split("module.exports", 1)[1]))
    referenced = set()
    for j in render.JINJA_DIR.glob("*.j2"):
        referenced |= set(re.findall(r'panel\([^)]*"(render\w+)"', j.read_text(encoding="utf-8")))
    assert referenced, "nessun panel(...) trovato nelle macro (regex rotta?)"
    assert not (referenced - panels), f"pannelli usati nelle macro ma non in boot.mjs PANELS: {sorted(referenced - panels)}"
    assert not (panels - exported), f"PANELS senza export corrispondente in views.js: {sorted(panels - exported)}"


@pytest.mark.parametrize("tpl", TEMPLATES, ids=[t["id"] for t in TEMPLATES])
def test_guida_rendered(tpl):
    """Guard anti-config-morta: ogni entità con un blocco `guida:` DEVE renderlo (callout
    ℹ️ Guida). Un template standalone che non chiama m.guida() (né estende _entity_base)
    la lascerebbe invisibile — bug scoperto su class/spell/hazard/subclass nella review."""
    if not CORE.get("guida", {}).get(tpl["category"]):
        return  # niente guida configurata per questa categoria → niente da rendere
    out = _env().get_template(tpl["jinja"]).render(core=CORE, plugins=PLUGINS, template=tpl)
    assert "ℹ️ Guida" in out, f"{tpl['id']}: ha guida config ma {tpl['jinja']} non la rende (config morta)"


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
        # Guardia anti-regressione: su un layout CUSTOM i dadi si tirano solo se il
        # layout porta le proprie regole diceParsing (vuoto = attacchi/danni non
        # tirabili, issue FS #353). Ri-esportare il layout da Fantasy Statblocks le
        # azzererebbe in silenzio: qui lo intercettiamo.
        dice = layout.get("diceParsing")
        assert isinstance(dice, list) and dice, \
            f"layout {layout['id']}: diceParsing vuoto → dadi non tirabili negli statblock"
        for rule in dice:
            assert rule.get("regex") and rule.get("parser"), \
                f"layout {layout['id']}: regola diceParsing senza regex/parser"


