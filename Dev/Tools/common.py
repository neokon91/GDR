#!/usr/bin/env python3
"""Libreria condivisa della pipeline GDR: percorsi, IO e modello dati (carica e
fonde core.yaml + system.yaml + entities/*.yaml in un unico 'core'). Importata
da render.py (orchestratore), build_srd.py e validate.py — nessun ciclo."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "Dev" / "Source"
YAML_DIR = SOURCE / "YAML"
JINJA_DIR = SOURCE / "Jinja"
JS_DIR = SOURCE / "JS"
SRD_DIR = SOURCE / "SRD"  # SRD 5.2.1 vendorizzata (JSON IT, CC-BY-4.0)
STATBLOCKS_DIR = SOURCE / "statblocks"  # layout Fantasy Statblocks (uno per file)

# Unico target di output: il vault Obsidian vivo. Si apre questa cartella in
# Obsidian e si rilancia `build` per vedere i cambiamenti dal vivo. Il repo di
# sviluppo (ROOT) resta pulito: nessun artefatto generato fuori da qui.
VAULT = ROOT / "dist" / "GDR-vault"

# Sottocartelle interamente generate: sicure da azzerare a ogni build. z.* =
# cartelle di SISTEMA (nascoste dall'esploratore + escluse da ricerca). SRD =
# generata ma USER-FACING (navigabile): in GENERATED_DIRS solo per il wipe del
# clean, NON tra le nascoste.
HIDDEN_DIRS = ("z.modelli", "z.automazioni", "z.classi")
GENERATED_DIRS = (*HIDDEN_DIRS, "SRD")

# Cartella delle pagine-indice (hub): tiene la radice pulita.
INDEX_DIR = "Indici"

# Note generate alla radice del vault (non contenuti utente).
GENERATED_NOTES = ("Home.md", "LEGGIMI.md")

# Lo schema 5.5e vive in system.yaml, separato dall'ontologia di core.yaml; lo
# schema per-entità in entities/*.yaml. Tutto si fonde in un unico 'core'.
SYSTEM_YAML = "system.yaml"
ENTITIES_DIRNAME = "entities"
# Assi tematici scorporati dai file-entità: un file per entità in YAML/assi/<id>.yaml
# (glossario coeso, formato ricco 1-5). load_entities li rifonde nell'entità: i file
# entities/*.yaml restano snelli, gli assi sono sfogliabili/confrontabili a parte.
ASSI_DIRNAME = "assi"


# --- IO ---------------------------------------------------------------------
def load_yaml(name: str) -> dict[str, Any]:
    path = YAML_DIR / name
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path}: YAML root non mappa")
    return data


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8")


def read_json(path: Path) -> Any:
    if path.is_file():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            return None
    return None


def frontmatter_block(data: dict[str, Any]) -> str:
    dumped = yaml.safe_dump(data, allow_unicode=True, sort_keys=False)
    return f"---\n{dumped}---\n\n"


# --- Modello (core.yaml + system.yaml + entities/*.yaml -> 'core' unico) -----
def deep_merge(base: dict[str, Any], overlay: dict[str, Any]) -> dict[str, Any]:
    """Fonde 'overlay' dentro 'base': i dict si fondono ricorsivamente per chiave,
    gli altri valori (liste/scalari) li sovrascrive overlay. Lo split è lossless,
    quindi in pratica i file non condividono chiavi (lo garantisce check)."""
    merged = dict(base)
    for key, value in overlay.items():
        current = merged.get(key)
        if isinstance(current, dict) and isinstance(value, dict):
            merged[key] = deep_merge(current, value)
        else:
            merged[key] = value
    return merged


def load_core_parts() -> tuple[dict[str, Any], dict[str, Any]]:
    """Le due metà del modello: core.yaml (worldbuilding) e system.yaml (5.5e).
    system.yaml assente -> {} (lo split è opzionale, per retrocompatibilità)."""
    core = load_yaml("core.yaml")
    system = load_yaml(SYSTEM_YAML) if (YAML_DIR / SYSTEM_YAML).is_file() else {}
    return core, system


def load_entities() -> list[dict[str, Any]]:
    """Gli schemi per-entità (Dev/Source/YAML/entities/*.yaml), in ordine di nome.
    Cartella assente -> lista vuota (lo split per-entità è incrementale)."""
    entities_dir = YAML_DIR / ENTITIES_DIRNAME
    if not entities_dir.is_dir():
        return []
    assi_dir = YAML_DIR / ASSI_DIRNAME
    out = []
    for path in sorted(entities_dir.glob("*.yaml")):
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        if isinstance(data, dict) and data.get("id"):
            # Rifondi gli assi scorporati (assi/<id>.yaml) se l'entità non li dichiara
            # inline (retrocompat: un'entità può ancora tenere 'assi' nel proprio file).
            if "assi" not in data:
                assi_file = assi_dir / f"{data['id']}.yaml"
                if assi_file.is_file():
                    assi_doc = yaml.safe_load(assi_file.read_text(encoding="utf-8")) or {}
                    if assi_doc.get("assi"):
                        data["assi"] = assi_doc["assi"]
            out.append(data)
    return out


# Sezioni-mappa che un file-entità contribuisce a 'core', keyate per id-entità.
_ENTITY_SECTIONS = (("scheda", "scheda"), ("assi", "assi_tematici"),
                    ("relazioni", "relazioni"), ("creation", "creation"))


def apply_entities(core: dict[str, Any], entities: list[dict[str, Any]]) -> dict[str, Any]:
    """Distribuisce ogni file-entità nelle sezioni globali di 'core': folders,
    categories (folder+subtypes), fields, scheda, assi_tematici, relazioni,
    creation. Ritorna un nuovo dict (non muta l'input)."""
    merged = dict(core)
    for section in ("folders", "fields", "categories", "scheda", "assi_tematici", "relazioni", "creation"):
        merged[section] = dict(merged.get(section, {}) or {})
    for entity in entities:
        eid = entity["id"]
        merged["folders"][eid] = entity["folder"]
        merged["categories"][eid] = {"folder": eid, "subtypes": entity.get("subtypes", []) or []}
        for field_id, spec in (entity.get("fields") or {}).items():
            merged["fields"][field_id] = spec
        for src_key, dest_key in _ENTITY_SECTIONS:
            if entity.get(src_key) is not None:
                merged[dest_key][eid] = entity[src_key]
    return merged


def entity_templates(entities: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """I template dichiarati dai file-entità (con category = id-entità), ordinati
    per il campo 'order' dell'entità (preserva l'ordine curato dei bottoni Home).
    Sono appesi a quelli di templates.yaml."""
    templates = []
    for entity in sorted(entities, key=lambda e: e.get("order", 10**9)):
        for template in entity.get("templates", []) or []:
            templates.append({**template, "category": entity["id"]})
    return templates


def load_core() -> dict[str, Any]:
    """Modello unificato (core.yaml + system.yaml + entities/*.yaml). Unico
    ingresso per build()/check()/test: i consumatori vedono un solo 'core'."""
    core, system = load_core_parts()
    return apply_entities(deep_merge(core, system), load_entities())


def load_templates() -> list[dict[str, Any]]:
    """Tutti i template: quelli di templates.yaml + quelli dei file-entità."""
    base = load_yaml("templates.yaml").get("templates", []) or []
    return base + entity_templates(load_entities())


def load_pages() -> list[dict[str, Any]]:
    """Pagine-indice (hub per dominio). Assenti = lista vuota (opzionali)."""
    path = YAML_DIR / "pages.yaml"
    if not path.is_file():
        return []
    return (yaml.safe_load(path.read_text(encoding="utf-8")) or {}).get("pages", []) or []


def generated_note_names() -> list[str]:
    """Note generate: Home/LEGGIMI alla radice + una pagina-indice per voce di
    pages.yaml (in INDEX_DIR/). Cosi' clean() le rimuove senza nomi hard-coded."""
    return [*GENERATED_NOTES, *(f"{INDEX_DIR}/{p['file']}.md" for p in load_pages())]


def template_folder(core: dict[str, Any], category: str) -> str:
    folders = core.get("folders", {})
    folder_key = (core.get("categories", {}).get(category) or {}).get("folder", category)
    return folders.get(folder_key) or folders.get(category) or "Inbox"
