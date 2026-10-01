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


