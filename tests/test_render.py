"""Suite di verifica: valida il modello e rende ogni artefatto senza scrivere
sul vault (nessun build). Mirror automatizzato di `npm run check` + render
standalone, eseguibile con `npm test`."""

import shutil
import subprocess

import pytest
from jinja2 import Environment, FileSystemLoader, StrictUndefined

import render

CORE = render.load_yaml("core.yaml")
PLUGINS = render.load_yaml("plugins.yaml")
TEMPLATES = render.load_yaml("templates.yaml")["templates"]
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
    """check() valida YAML/Jinja (field, tavolo, relazioni, categorie pagine)."""
    assert render.check() == 0


@pytest.mark.parametrize("tpl", TEMPLATES, ids=[t["id"] for t in TEMPLATES])
def test_template_renders(tpl):
    out = _env().get_template(tpl["jinja"]).render(core=CORE, plugins=PLUGINS, template=tpl)
    assert out.strip()


@pytest.mark.parametrize("page", PAGES, ids=[p["id"] for p in PAGES])
def test_page_renders(page):
    out = _env().get_template("index.md.j2").render(
        core=CORE, plugins=PLUGINS, templates=TEMPLATES, page=page
    )
    assert out.strip()


@pytest.mark.parametrize("name", ["home.md.j2", "leggimi.md.j2"])
def test_root_note_renders(name):
    out = _env().get_template(name).render(
        core=CORE, plugins=PLUGINS, templates=TEMPLATES, pages=PAGES
    )
    assert out.strip()


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


def test_fs_layout_valid():
    """Il layout Fantasy Statblocks 2024 è JSON valido con blocchi a id univoci."""
    import json as _json
    path = render.SOURCE / "statblock-2024.json"
    if not path.is_file():
        pytest.skip("layout FS assente")
    layout = _json.loads(path.read_text(encoding="utf-8"))
    assert layout.get("id") and layout.get("name")
    blocks = layout.get("blocks")
    assert isinstance(blocks, list) and blocks
    ids = [b.get("id") for b in blocks]
    assert len(ids) == len(set(ids)), "id dei blocchi non univoci"


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
