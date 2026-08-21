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
const wantBg = process.argv[5] || null;
global.app = { vault: { adapter: { read: async () => data } } };
const tp = { system: {
    prompt: async () => "Test PG",
    suggester: async (l, v, _f, title) => {
        if (wantClass && title && String(title).startsWith("Classe")) {
            const i = v.indexOf(wantClass); return v[i >= 0 ? i : 0];
        }
        if (wantBg && title && String(title).startsWith("Background")) {
            const i = v.indexOf(wantBg); return v[i >= 0 ? i : 0];
        }
        return v[0];
    } },
    file: { move: async () => {}, exists: async () => false } };
require(process.argv[3])(tp).then(fm => process.stdout.write(fm));
"""


def _run_crea_pg(tmp_path, classe=None, background=None):
    """Esegue crea_pg.js col mock Templater; ritorna (opzioni, frontmatter dict).
    `classe`/`background` forzano quelle scelte (per id o label); il resto = prima opzione."""
    import build_personaggio
    opt = build_personaggio.build_personaggio_options(CORE)
    pj = tmp_path / "personaggio.json"
    pj.write_text(json.dumps(opt, ensure_ascii=False), encoding="utf-8")
    harness = tmp_path / "harness.js"
    harness.write_text(_PG_HARNESS, encoding="utf-8")
    args = ["node", str(harness), str(pj), str(render.JS_DIR / "crea_pg.js")]
    if classe or background:
        args.append(classe or "")
    if background:
        args.append(background)
    res = subprocess.run(args, capture_output=True, text=True)
    assert res.returncode == 0, res.stderr
    return opt, yaml.safe_load(res.stdout.split("---")[1])

CORE = render.load_core()
PLUGINS = render.load_yaml("plugins.yaml")
TEMPLATES = render.load_templates()
PAGES = render.load_pages()

# views.js è frammentato (Dev/Source/JS/views/*.js) e CARICATO come file solo (bundle).
# I test ne vogliono il sorgente bundlato: VIEWS_SRC (testo) per chi lo ispeziona,
# VIEWS_JS (path a un tmp che lo contiene) per i loader node che fanno readFileSync.
import atexit
import tempfile

def _bundle_to_tmp(stem):
    src = render.bundle_js(stem)
    tmp = tempfile.NamedTemporaryFile("w", suffix=f"_{stem}.js", delete=False, encoding="utf-8")
    tmp.write(src)
    tmp.close()
    atexit.register(lambda: os.path.exists(tmp.name) and os.unlink(tmp.name))
    return src, tmp.name


VIEWS_SRC, VIEWS_JS = _bundle_to_tmp("views")
META_ACTIONS_SRC, META_ACTIONS_JS = _bundle_to_tmp("meta_actions")


def _env() -> Environment:
    # Delega a render.jinja_env() così i test usano ESATTAMENTE l'ambiente della build:
    # i pannelli/radar emettono i blocchi ```gdr (unica via — il plugin `gdr` li rende;
    # js-engine/Templater sono stati ritirati) e gli snapshot li riflettono.
    return render.jinja_env()


