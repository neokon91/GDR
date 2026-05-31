#!/usr/bin/env python3
"""Validazione del modello GDR (confine core/system, dup-ID, snake_case, shape,
file-entità) e dei template/Jinja. Estratto da render.py: check() ritorna 0/1 ed
è il cuore di `npm run check` e del test test_check_passes."""

from __future__ import annotations

import re
import sys
from typing import Any

from common import (
    JINJA_DIR,
    apply_entities,
    deep_merge,
    load_core_parts,
    load_entities,
    load_pages,
    load_templates,
    load_yaml,
)

# Cattura gli id usati nei Jinja come field('id') / field("id").
FIELD_REF_RE = re.compile(r"""field\(\s*['"]([a-z0-9_]+)['"]""")

# Identificatore che diventa chiave di frontmatter / cartella: snake_case.
SNAKE_RE = re.compile(r"^[a-z][a-z0-9_]*$")

# Sezioni "di piano": devono restare nel rispettivo file. tavolo/assi_tematici/
# states (il differenziatore worldbuilding) solo in core.yaml; scheda/statblock/
# caratteristiche (i meccanismi 5.5e) solo in system.yaml.
CORE_ONLY_SECTIONS = ("tavolo", "assi_tematici", "states")
SYSTEM_ONLY_SECTIONS = ("scheda", "statblock", "caratteristiche", "abilita")

# Sezioni-mappa (id -> definizione) partizionate fra i due file: gli stessi id
# non devono comparire in entrambi (dup-ID).
PARTITIONED_SECTIONS = ("folders", "fields", "categories", "creation", "relazioni")


def validate_split(core_raw: dict[str, Any], system_raw: dict[str, Any], merged: dict[str, Any]) -> list[str]:
    """Valida il confine core/system + dup-ID + snake_case + shape del modello
    fuso. Ritorna la lista degli errori (vuota = tutto a posto)."""
    errors: list[str] = []

    # 1) Confine: ogni sezione "di piano" vive in un solo file.
    for section in CORE_ONLY_SECTIONS:
        if section in system_raw:
            errors.append(f"confine: '{section}' è worldbuilding -> va in core.yaml, non in system.yaml")
    for section in SYSTEM_ONLY_SECTIONS:
        if section in core_raw:
            errors.append(f"confine: '{section}' è di sistema 5.5e -> va in system.yaml, non in core.yaml")

    # 2) dup-ID: nessun id partizionato compare in entrambi i file.
    for section in PARTITIONED_SECTIONS:
        shared = set(core_raw.get(section, {}) or {}) & set(system_raw.get(section, {}) or {})
        for key in sorted(shared):
            errors.append(f"dup-ID: '{key}' definito sia in core.{section} sia in system.{section}")

    # 3) snake_case: gli identificatori che diventano chiavi di frontmatter/cartelle.
    def snake(scope: str, names: Any) -> None:
        for name in names or []:
            if name is not None and not SNAKE_RE.match(str(name)):
                errors.append(f"snake_case: '{name}' in {scope} non è snake_case")

    snake("folders", merged.get("folders", {}))
    snake("fields", merged.get("fields", {}))
    snake("categories", merged.get("categories", {}))
    snake("abilita", merged.get("abilita", {}))
    snake("caratteristiche", [c.get("id") for c in merged.get("caratteristiche", []) or []])
    for cat, assi in (merged.get("assi_tematici", {}) or {}).items():
        snake(f"assi_tematici[{cat}]", [a.get("id") for a in assi or []])
    for cat, rels in (merged.get("relazioni", {}) or {}).items():
        snake(f"relazioni[{cat}]", [r.get("field") for r in rels or []])

    # 4) shape: struttura attesa delle sezioni del modello.
    fields = merged.get("fields", {}) or {}
    folders = merged.get("folders", {}) or {}
    for fid, spec in fields.items():
        if not isinstance(spec, dict) or not spec.get("label") or not spec.get("widget"):
            errors.append(f"shape: campo '{fid}' senza label/widget")
    for cat, spec in (merged.get("categories", {}) or {}).items():
        if not isinstance(spec, dict) or not spec.get("folder") or not spec.get("subtypes"):
            errors.append(f"shape: categoria '{cat}' senza folder/subtypes")
        elif spec.get("folder") not in folders:
            errors.append(f"shape: categoria '{cat}' -> folder '{spec.get('folder')}' non in folders")
    for entry in merged.get("tavolo", []) or []:
        if not all(entry.get(k) for k in ("field", "callout", "title")):
            errors.append(f"shape: voce tavolo {entry} senza field/callout/title")
    for cat, campi in (merged.get("scheda", {}) or {}).items():
        for fid in campi or []:
            if fid not in fields:
                errors.append(f"shape: scheda[{cat}] -> campo '{fid}' non in fields")
    for cat, rels in (merged.get("relazioni", {}) or {}).items():
        for rel in rels or []:
            if not all(rel.get(k) for k in ("field", "label", "category")):
                errors.append(f"shape: relazioni[{cat}] voce {rel} senza field/label/category")
    for entry in merged.get("caratteristiche", []) or []:
        if not entry.get("id") or not entry.get("sigla"):
            errors.append(f"shape: caratteristica {entry} senza id/sigla")
    car_ids = {c.get("id") for c in merged.get("caratteristiche", []) or []}
    for aid, spec in (merged.get("abilita", {}) or {}).items():
        if not isinstance(spec, dict) or not spec.get("label") or spec.get("caratteristica") not in car_ids:
            errors.append(f"shape: abilità '{aid}' senza label o con caratteristica non valida")
    for cat, assi in (merged.get("assi_tematici", {}) or {}).items():
        for a in assi or []:
            if not all(a.get(k) for k in ("id", "sinistra", "destra")):
                errors.append(f"shape: assi_tematici[{cat}] voce {a} senza id/sinistra/destra")
    return errors


def validate_entities(core_raw: dict[str, Any], system_raw: dict[str, Any],
                      entities: list[dict[str, Any]], merged: dict[str, Any]) -> list[str]:
    """Valida i file-entità: shape minima + nessuna collisione di id-categoria o
    di campo con core.yaml/system.yaml (un'entità non ridefinisce cose globali)."""
    errors: list[str] = []
    base_cats = set(core_raw.get("categories", {}) or {}) | set(system_raw.get("categories", {}) or {})
    base_fields = set(core_raw.get("fields", {}) or {}) | set(system_raw.get("fields", {}) or {})
    seen_ids: set[str] = set()
    for entity in entities:
        eid = entity.get("id")
        if not eid or not entity.get("folder"):
            errors.append(f"entity {entity.get('id')!r}: manca id o folder")
            continue
        if eid in seen_ids:
            errors.append(f"entity '{eid}': id duplicato fra i file-entità")
        seen_ids.add(eid)
        if eid in base_cats:
            errors.append(f"entity '{eid}': categoria già in core.yaml/system.yaml (dup)")
        for field_id in (entity.get("fields") or {}):
            if field_id in base_fields:
                errors.append(f"entity '{eid}': campo '{field_id}' già in core/system (dup)")
        for template in entity.get("templates", []) or []:
            for key in ("id", "title", "jinja", "target"):
                if not template.get(key):
                    errors.append(f"entity '{eid}': template senza '{key}'")
    return errors


def check() -> int:
    errors: list[str] = []
    core_raw, system_raw = load_core_parts()
    entities = load_entities()
    core = apply_entities(deep_merge(core_raw, system_raw), entities)
    errors.extend(validate_split(core_raw, system_raw, core))
    errors.extend(validate_entities(core_raw, system_raw, entities, core))
    plugins = load_yaml("plugins.yaml")
    categories = core.get("categories", {})
    folders = core.get("folders", {})
    fields = core.get("fields", {})
    metabind = plugins.get("metabind_inputs") or {}

    # Le categorie dei template (templates.yaml + file-entità) devono essere
    # dichiarate e avere una cartella risolvibile (i bottoni 'Crea ...' creano la
    # nota in quella cartella).
    for template in load_templates():
        category = template.get("category")
        if category not in categories:
            errors.append(f"{template.get('id')}: categoria non dichiarata ({category})")
        else:
            folder_key = (categories.get(category) or {}).get("folder", category)
            if folder_key not in folders:
                errors.append(f"{template.get('id')}: cartella '{folder_key}' non in folders")
        jinja = str(template.get("jinja", ""))
        if not (JINJA_DIR / jinja).exists():
            errors.append(f"{template.get('id')}: Jinja mancante ({jinja})")

    # Ogni widget non-text/number del registro deve avere un template Meta Bind.
    for field_id, spec in fields.items():
        widget = (spec or {}).get("widget")
        if widget and widget not in ("text", "number") and widget not in metabind:
            errors.append(f"campo {field_id}: widget '{widget}' assente da metabind_inputs")

    # Ogni field('<id>') usato nei Jinja deve esistere nel registro core.fields.
    # I partial (_*.j2) definiscono le macro, non le usano: vanno esclusi.
    for path in sorted(JINJA_DIR.glob("*.j2")):
        if path.name.startswith("_"):
            continue
        for field_id in FIELD_REF_RE.findall(path.read_text(encoding="utf-8")):
            if field_id not in fields:
                errors.append(f"{path.name}: campo '{field_id}' non nel registro core.fields")

    # La superficie giocabile (core.tavolo) è renderizzata da macro: i suoi campi
    # non passano dal controllo field('id') sopra, quindi validali qui.
    for entry in core.get("tavolo", []) or []:
        field_id = entry.get("field")
        if field_id not in fields:
            errors.append(f"tavolo: campo '{field_id}' non nel registro core.fields")

    # Le relazioni tipizzate puntano a una categoria target con cartella risolvibile
    # (la macro relazioni() costruisce un suggester su quella cartella).
    for source_cat, rels in (core.get("relazioni", {}) or {}).items():
        if source_cat not in categories:
            errors.append(f"relazioni: categoria '{source_cat}' non dichiarata")
        for rel in rels or []:
            target = rel.get("category")
            if target not in categories:
                errors.append(f"relazioni[{source_cat}].{rel.get('field')}: target '{target}' non dichiarato")
            elif (categories.get(target) or {}).get("folder", target) not in folders:
                errors.append(f"relazioni[{source_cat}].{rel.get('field')}: cartella di '{target}' non in folders")

    # Pagine-indice: categoria dichiarata e template index disponibile.
    if load_pages() and not (JINJA_DIR / "index.md.j2").exists():
        errors.append("index.md.j2 mancante (richiesto da pages.yaml)")
    for page in load_pages():
        if page.get("category") not in categories:
            errors.append(f"page {page.get('id')}: categoria non dichiarata ({page.get('category')})")

    if errors:
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    return 0
