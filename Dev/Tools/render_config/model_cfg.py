"""Config derivata dal MODELLO: bottoni di creazione, fileClass (Metadata Menu), Meta Bind, viste Bases, layout statblock."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from common import (
    HIDDEN_DIRS,
    INDEX_DIR,
    STATBLOCKS_DIR,
    VAULT,
    read_json,
    template_folder,
    write_json,
    write_text,
)




def load_statblock_layouts() -> list[dict[str, Any]]:
    """Layout Fantasy Statblocks vendorizzati (Dev/Source/statblocks/*.json), uno
    per file. Ognuno deve essere un oggetto con id+name; gli altri sono ignorati."""
    if not STATBLOCKS_DIR.is_dir():
        return []
    layouts = []
    for path in sorted(STATBLOCKS_DIR.glob("*.json")):
        data = read_json(path)
        if isinstance(data, dict) and data.get("id") and data.get("name"):
            layouts.append(data)
    return layouts


# --- Bottoni e fileClass (derivati dal modello) -----------------------------
def creation_buttons(core: dict[str, Any], templates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Un bottone 'Crea <Titolo>' per ogni template, derivato dai file-entità."""
    buttons = []
    for template in templates:
        buttons.append({
            "id": f"crea-{template['id']}",
            "label": f"Crea {template['title']}",
            "style": "primary",
            "actions": [{
                "type": "templaterCreateNote",
                "templateFile": template["target"],
                "folderPath": template_folder(core, template["category"]),
                "openNote": True,
            }],
        })
    return buttons


def action_buttons(plugins: dict[str, Any]) -> list[dict[str, Any]]:
    """Bottoni-azione: o eseguono un file Templater (marca canonico, archivia, ...)
    o lanciano un comando di Obsidian (button con 'command'). I command-button NON
    richiedono un'azione-nota in templates.yaml (nessun runTemplaterFile da risolvere)."""
    buttons = []
    for button in plugins.get("buttons", []):
        if button.get("command"):
            action = {"type": "command", "command": button["command"]}
        else:
            target = f"z.modelli/azioni/{button['label']}.md"
            action = {"type": "runTemplaterFile", "templateFile": target}
        buttons.append({
            "id": button["id"],
            "label": button["label"],
            "style": "destructive" if button["id"] == "archivia-nota" else "primary",
            "actions": [action],
        })
    return buttons


def values_list(values: list[str]) -> dict[str, str]:
    """Opzioni di un Select Metadata Menu: oggetto con chiavi intere da "1"
    (formato del plugin, verificato in main.js: options.valuesList)."""
    return {str(i + 1): value for i, value in enumerate(values)}


def fileclass_fields(core: dict[str, Any], category: str) -> list[dict[str, Any]]:
    """Campi tipizzati Metadata Menu per una categoria, derivati dal wizard YAML.
    Mapping: stato/tipo->Select (opzioni da states/subtypes), notes->File/MultiFile,
    pressione/number->Number, resto->Input."""
    fields: list[dict[str, Any]] = []
    seen: set[str] = set()

    def add(field_id: str, ftype: str, options: dict[str, Any] | None = None) -> None:
        if field_id in seen:
            return
        seen.add(field_id)
        fields.append({"name": field_id, "type": ftype, "options": options or {}, "path": "", "id": field_id})

    def select(field_id: str, choices: list[str]) -> None:
        add(field_id, "Select", {"sourceType": "ValuesList", "valuesList": values_list(choices)})

    select("stato", core.get("states", []) or [])
    cat_meta = core.get("categories", {}).get(category) or {}
    subtypes = cat_meta.get("subtypes", []) or []
    if subtypes:
        select("tipo", subtypes)
    # Classificazione a 2 livelli: la 'famiglia' (select dalle famiglie curate) come
    # Property tipizzata e interrogabile, accanto a 'tipo'.
    famiglie = [f["nome"] for f in (cat_meta.get("famiglie") or []) if isinstance(f, dict) and f.get("nome")]
    if famiglie:
        select("famiglia", famiglie)
    if category != "mondo":
        add("mondo", "File")
    creation = (core.get("creation", {}) or {}).get(category, {})
    for question in (creation.get("fields", []) or []) + (creation.get("body", []) or []):
        field_id = question["field"]
        if field_id in seen:
            continue
        if question.get("from") == "notes":
            add(field_id, "MultiFile" if question.get("multi") else "File")
        elif field_id == "pressione" or question.get("from") == "number":
            add(field_id, "Number")
        else:
            add(field_id, "Input")
    # Campi strutturati della scheda (worldbuilding/sistema): tipizzati in Properties.
    for field_id in (core.get("scheda", {}) or {}).get(category, []) or []:
        add(field_id, "Number" if field_id == "livello" else "Input")
    for rel in (core.get("relazioni", {}) or {}).get(category, []) or []:
        add(rel["field"], "MultiFile" if rel.get("multi") else "File")
    add("connessioni", "MultiFile")
    add("sessioni", "MultiFile")
    return fields


def fileclass_note(core: dict[str, Any], category: str) -> str:
    frontmatter = {
        "fields": fileclass_fields(core, category),
        "filesPaths": [template_folder(core, category)],
        "mapWithTag": False,
        "tagNames": [],
    }
    dumped = yaml.safe_dump(frontmatter, allow_unicode=True, sort_keys=False)
    return f"---\n{dumped}---\n\n# fileClass: {category}\n"


def meta_bind_config(plugins: dict[str, Any], core: dict[str, Any], templates: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "enableJs": True,
        "inputFieldTemplates": [
            {"name": name, "declaration": declaration}
            for name, declaration in sorted((plugins.get("metabind_inputs") or {}).items())
        ],
        "buttonTemplates": creation_buttons(core, templates) + action_buttons(plugins),
    }


# --- Bases (core): viste-indice native (.base) ------------------------------
# Schema verificato sui .base reali dell'utente (Obsidian 1.12): nei CONTESTI
# di espressione (filters/order/sort.property) le proprietà del frontmatter sono
# NUDE (`categoria`, `pressione`); `file.name` è il nome nota, `formula.X` una
# formula. Solo nelle MAPPE (properties/columnSize) la chiave è `note.<campo>`.
def bases_doc(page: dict[str, Any]) -> dict[str, Any]:
    """Documento Bases (.base) per una pagina-indice, dalla STESSA single-source
    di pages.yaml: filtra per categoria (escludendo le archiviate) ed espone le
    colonne della pagina come vista tabellare nativa. Gli hub Dataview restano
    come fallback non distruttivo finché lo schema è confermato in-app."""
    category = page["category"]
    columns = page.get("columns", []) or []
    order = ["file.name"] + [col["field"] for col in columns]
    # properties: displayName per le colonne (chiave = id risolto: note.<campo>).
    properties = {"file.name": {"displayName": "Nome"}}
    for col in columns:
        properties[f"note.{col['field']}"] = {"displayName": col["label"]}
    parts = (page.get("sort") or "file.name asc").split()
    sort = []
    if parts:
        direction = "DESC" if len(parts) > 1 and parts[1].lower() == "desc" else "ASC"
        sort = [{"property": parts[0], "direction": direction}]
    return {
        "filters": {"and": [f'categoria == "{category}"', 'stato != "archiviata"']},
        "properties": properties,
        "views": [{"type": "table", "name": "Tutte le voci", "order": order, "sort": sort}],
    }


def explora_base() -> dict[str, Any]:
    """Hub Bases NO-CODE trasversale a tutto il mondo del DM (cartella Mondi/): una
    vista-database nativa, filtrabile/ordinabile/raggruppabile dall'UI di Bases SENZA
    scrivere query. È il «querabile per non-tecnici» orizzontale (gli indici .base sono
    uno per-categoria); il DM aggiunge le sue viste/filtri col + di Bases. Resta dentro
    Mondi/ → esclude l'SRD (sola lettura) e i template z.*."""
    return {
        "filters": {"and": ['file.inFolder("Mondi")', 'categoria.isEmpty() == false', 'stato != "archiviata"']},
        "properties": {
            "file.name": {"displayName": "Nome"},
            "note.categoria": {"displayName": "Categoria"},
            "note.tipo": {"displayName": "Tipo"},
            "note.mondo": {"displayName": "Mondo"},
            "note.stato": {"displayName": "Stato"},
            "note.pressione": {"displayName": "Pressione"},
        },
        "views": [
            {"type": "table", "name": "Tutto il mondo",
             "order": ["file.name", "categoria", "tipo", "mondo", "stato"],
             "sort": [{"property": "categoria", "direction": "ASC"},
                      {"property": "file.name", "direction": "ASC"}]},
            {"type": "table", "name": "Cosa scotta",
             "order": ["file.name", "categoria", "pressione", "mondo"],
             "sort": [{"property": "pressione", "direction": "DESC"}]},
        ],
    }


def write_bases(pages: list[dict[str, Any]]) -> None:
    """Scrive una vista Base (.base) per pagina in INDEX_DIR/ (accanto all'hub), più
    l'hub no-code trasversale Esplora.base (querabile per non-tecnici)."""
    for page in pages:
        dumped = yaml.safe_dump(bases_doc(page), allow_unicode=True, sort_keys=False)
        write_text(VAULT / INDEX_DIR / f"{page['file']}.base", dumped)
    write_text(VAULT / INDEX_DIR / "Esplora.base",
               yaml.safe_dump(explora_base(), allow_unicode=True, sort_keys=False))
