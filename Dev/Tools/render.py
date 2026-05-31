#!/usr/bin/env python3
"""Orchestratore della pipeline GDR: genera il vault Obsidian in dist/GDR-vault
dalle sorgenti YAML/Jinja/JS. Il modello dati e l'IO stanno in common.py, la
generazione SRD in build_srd.py, la validazione in validate.py; qui restano la
build() (render template + config .obsidian), clean()/seed() e la CLI.

Re-esporta i nomi pubblici dei moduli così i test (e gli usi storici) possono
continuare a riferirli come render.<nome>."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path
from typing import Any

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

from common import (  # noqa: F401 (re-export per i test/usi storici)
    GENERATED_DIRS,
    GENERATED_NOTES,
    HIDDEN_DIRS,
    INDEX_DIR,
    JINJA_DIR,
    JS_DIR,
    ROOT,
    SOURCE,
    SRD_DIR,
    STATBLOCKS_DIR,
    VAULT,
    apply_entities,
    deep_merge,
    entity_templates,
    generated_note_names,
    load_core,
    load_core_parts,
    load_entities,
    load_pages,
    load_templates,
    load_yaml,
    read_json,
    template_folder,
    write_json,
    write_text,
)
from build_srd import (  # noqa: F401 (re-export per i test)
    SRD_GEN,
    build_srd,
    load_srd,
    srd_statblock_yaml,
)
from build_personaggio import build_personaggio_options  # noqa: F401 (re-export)
from validate import (  # noqa: F401 (re-export per i test)
    CORE_ONLY_SECTIONS,
    PARTITIONED_SECTIONS,
    SYSTEM_ONLY_SECTIONS,
    check,
    validate_entities,
    validate_entity_schema,
    validate_split,
)


def clean() -> None:
    """Rimuove solo gli artefatti puramente generati (z.modelli, z.automazioni,
    z.classi, SRD, Home/LEGGIMI, pagine-indice). NON tocca .obsidian (config e
    plugin dell'utente) ne' i contenuti. Pulisce anche residui legacy in ROOT."""
    notes = generated_note_names() + [f"{INDEX_DIR}/{p['file']}.base" for p in load_pages()]
    for base in (VAULT, ROOT):
        for name in GENERATED_DIRS:
            path = base / name
            if path.is_dir():
                shutil.rmtree(path)
        for rel in notes:
            path = base / rel
            if path.is_file():
                path.unlink()
    legacy_build = ROOT / "Dev" / "Build"
    if legacy_build.is_dir():
        shutil.rmtree(legacy_build)


# --- Config .obsidian (merge non distruttivo) -------------------------------
def merge_json(path: Path, updates: dict[str, Any]) -> None:
    """Aggiorna solo le chiavi gestite dalla pipeline, preservando il resto
    della config (impostazioni utente). Scrive solo se qualcosa cambia."""
    data = read_json(path)
    data = data if isinstance(data, dict) else {}
    merged = {**data, **updates}
    if merged != data:
        write_json(path, merged)


def merge_plugin_config(obsidian: Path, plugin_id: str, updates: dict[str, Any]) -> None:
    """Inietta la config generata solo se il plugin e' gia' installato: non
    crea cartelle plugin fittizie (romperebbero Obsidian)."""
    plugin_dir = obsidian / "plugins" / plugin_id
    if plugin_dir.is_dir():
        merge_json(plugin_dir / "data.json", updates)


def union_list(path: Path, values: list[str]) -> None:
    """Unione ordinata: garantisce le voci della pipeline senza rimuovere
    quelle aggiunte dall'utente."""
    existing = read_json(path)
    existing = existing if isinstance(existing, list) else []
    merged = list(dict.fromkeys([*existing, *values]))
    if merged != existing:
        write_json(path, merged)


def union_list_key(path: Path, key: str, values: list[str]) -> None:
    """Come union_list ma per una lista DENTRO una chiave di un JSON-oggetto
    (preserva le altre chiavi e le voci utente). Per app.json/appearance.json."""
    data = read_json(path)
    data = data if isinstance(data, dict) else {}
    existing = data.get(key) if isinstance(data.get(key), list) else []
    merged = list(dict.fromkeys([*existing, *values]))
    if merged != existing:
        data[key] = merged
        write_json(path, data)


# Snippet CSS generato: nasconde le cartelle di sistema (z.*) dall'esploratore.
# Restano indicizzate (data-path presente), quindi Templater/Metadata Menu/Dataview
# continuano a vederle: nascondiamo solo la riga nell'albero dei file.
HIDE_FOLDERS_SNIPPET = """/* GDR — generato. Snippet del vault (nascondi z.* + stile pannelli Vista). */

/* Nasconde le cartelle di sistema (z.*) dall'esploratore. */
.nav-folder.tree-item:has(> .tree-item-self[data-path^="z."]) {
  display: none;
}

/* Card del pannello Vista (views.js: renderEntityPanel). Variabili del tema. */
.gdr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  margin: 8px 0;
}
.gdr-card {
  border: 1px solid var(--background-modifier-border);
  border-left: 3px solid var(--background-modifier-border);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--background-secondary);
  font-size: var(--font-ui-small);
}
.gdr-card.ready { border-left-color: var(--color-green); }
.gdr-card.missing { border-left-color: var(--color-red); opacity: 0.85; }

/* Radar degli assi tematici (views.js: renderAxesRadar / renderAxesCompare). */
.gdr-radar { display: flex; justify-content: center; margin: 8px 0; }
.gdr-radar-svg { width: 100%; max-width: 300px; height: auto; }
.gdr-radar-empty { color: var(--text-muted); font-size: var(--font-ui-small); }
"""


def write_workspace_chrome(obsidian: Path) -> None:
    """Pulizia dell'esploratore: snippet CSS che nasconde le z.* + esclusione da
    ricerca/grafo/suggerimenti (userIgnoreFilters). Tutto non distruttivo."""
    write_text(obsidian / "snippets" / "gdr.css", HIDE_FOLDERS_SNIPPET)
    union_list_key(obsidian / "appearance.json", "enabledCssSnippets", ["gdr"])
    union_list_key(obsidian / "app.json", "userIgnoreFilters", [f"{d}/" for d in HIDDEN_DIRS])


# Impostazioni core consigliate, iniettate non distruttivamente così la config è
# riproducibile dal vault generato (non dipende da settaggi manuali).
# propertiesInDocument 'hidden': nasconde il pannello Proprietà nelle note — GDR
# si edita via Meta Bind nel corpo, le proprietà grezze sarebbero ridondanti.
APP_SETTINGS = {"propertiesInDocument": "hidden"}
# Plugin core usati dalla pipeline: bookmarks legge il bookmarks.json generato;
# bases rende le viste-indice native (.base) generate in INDEX_DIR/.
CORE_PLUGINS = ("bookmarks", "bases")


def write_core_settings(obsidian: Path) -> None:
    """Default core consigliati: nasconde le Proprietà nelle note e abilita i
    plugin core usati. Non distruttivo (merge; preserva il resto della config)."""
    merge_json(obsidian / "app.json", APP_SETTINGS)
    core_plugins = read_json(obsidian / "core-plugins.json")
    if isinstance(core_plugins, dict):
        updated = {**core_plugins, **{pid: True for pid in CORE_PLUGINS if not core_plugins.get(pid)}}
        if updated != core_plugins:
            write_json(obsidian / "core-plugins.json", updated)


# Config del plugin Homepage: apre Home all'avvio. Scritta SOLO al primo setup
# (se manca data.json) per non sovrascrivere le scelte dell'utente.
HOMEPAGE_CONFIG = {
    "version": 4,
    "homepages": {"Main Homepage": {
        "value": "Home", "kind": "File", "openOnStartup": True,
        "openMode": "Replace all open notes", "manualOpenMode": "Replace all open notes",
        "view": "Default view", "revertView": True, "openWhenEmpty": False,
        "refreshDataview": True, "autoCreate": False, "autoScroll": False,
        "pin": False, "commands": [], "alwaysApply": False, "hideReleaseNotes": False,
    }},
    "separateMobile": False,
}


def write_homepage(obsidian: Path) -> None:
    """Configura Homepage per aprire Home all'avvio — solo se non già configurato
    (rispetta le scelte dell'utente; il plugin dev'essere installato)."""
    plugin_dir = obsidian / "plugins" / "homepage"
    data_json = plugin_dir / "data.json"
    if plugin_dir.is_dir() and not data_json.is_file():
        write_json(data_json, HOMEPAGE_CONFIG)


def crea_wrapper_js(template: dict[str, Any]) -> str:
    """Wizard di creazione per-template generato: `tp.user.crea_<id>` delega al
    motore condiviso create_entity.js. Le entità bespoke hanno un crea_<id>.js
    hand-authored in JS/ (override) e non passano di qui."""
    tid = template["id"]
    return (
        f'// GENERATO da render.py — wizard del template "{tid}" (categoria {template["category"]}).\n'
        f'// Delega al motore create_entity.js; lo schema è in entities/{template["category"]}.yaml.\n'
        f'module.exports = async (tp) => tp.user.create_entity(tp, "{tid}");\n'
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
    """Bottoni che eseguono un'azione Templater (marca canonico, archivia, ...)."""
    buttons = []
    for button in plugins.get("buttons", []):
        target = f"z.modelli/azioni/{button['label']}.md"
        buttons.append({
            "id": button["id"],
            "label": button["label"],
            "style": "destructive" if button["id"] == "archivia-nota" else "primary",
            "actions": [{"type": "runTemplaterFile", "templateFile": target}],
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
    subtypes = (core.get("categories", {}).get(category) or {}).get("subtypes", []) or []
    if subtypes:
        select("tipo", subtypes)
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


def write_bases(pages: list[dict[str, Any]]) -> None:
    """Scrive una vista Base (.base) per pagina in INDEX_DIR/ (accanto all'hub)."""
    for page in pages:
        dumped = yaml.safe_dump(bases_doc(page), allow_unicode=True, sort_keys=False)
        write_text(VAULT / INDEX_DIR / f"{page['file']}.base", dumped)


def jinja_env() -> Environment:
    """Ambiente Jinja della pipeline. StrictUndefined: un campo mancante è un
    errore (non una stringa vuota); trim/lstrip_blocks tengono pulito l'output."""
    return Environment(
        loader=FileSystemLoader(str(JINJA_DIR)),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def write_engine_data(core: dict[str, Any], templates: list[dict[str, Any]]) -> None:
    """Dati e script che il JS Engine legge a runtime: il payload core.json
    (modello distillato per views.js), le opzioni del rules-engine PG, gli script
    Templater (copia 1:1) e un wizard di creazione per-template (wrapper sul
    motore create_entity.js, salvo override hand-authored crea_<id>.js in JS/)."""
    payload = {
        "folders": core.get("folders", {}),
        "fields": core.get("fields", {}),
        "categories": core.get("categories", {}),
        "states": core.get("states", []),
        # assi_tematici: serve a views.js per disegnare il radar del Carattere e il
        # confronto fra entità (carica gli assi per categoria a runtime).
        "assi_tematici": core.get("assi_tematici", {}),
        # relazioni: usate da meta_actions.collega (link tipizzato reciproco).
        # archetipi: combinazioni di valori-assi -> tag, derivati da views.renderProfilo
        # e applicati da meta_actions.applica_profilo.
        "relazioni": core.get("relazioni", {}),
        "archetipi": core.get("archetipi", {}),
        # xp: tabelle CR->XP + budget 2024, per views.renderEncounter (difficoltà).
        "xp": core.get("xp", {}),
        "creation": core.get("creation", {}),
        "templates": templates,
    }
    # YAML -> JSON che gli script JS leggono a runtime via app.vault.adapter.read.
    write_json(VAULT / "z.automazioni" / "data" / "core.json", payload)
    # Opzioni del rules-engine PG (SRD + pg_rules.yaml) per crea_personaggio.js.
    write_json(VAULT / "z.automazioni" / "data" / "personaggio.json", build_personaggio_options(core))
    # Gli script Templater sono autonomi (niente require/bundling): copia 1:1.
    for source in sorted(JS_DIR.glob("*.js")):
        shutil.copy2(source, VAULT / "z.automazioni" / source.name)
    for template in templates:
        if not (JS_DIR / f"crea_{template['id']}.js").is_file():
            write_text(VAULT / "z.automazioni" / f"crea_{template['id']}.js", crea_wrapper_js(template))


def render_notes(env: Environment, core: dict[str, Any], plugins: dict[str, Any],
                 templates: list[dict[str, Any]], actions: list[dict[str, Any]],
                 pages: list[dict[str, Any]]) -> dict[str, str]:
    """Rende tutti i Jinja sul vault e ritorna {target: testo}: le note-modello
    (z.modelli/), le azioni Templater, le note di radice (Home/LEGGIMI/Ponte/
    Fronti) e le pagine-indice per dominio (Indici/, per tenere pulita la radice)."""
    rendered: dict[str, str] = {}
    for template in templates:
        text = env.get_template(template["jinja"]).render(core=core, plugins=plugins, template=template)
        write_text(VAULT / template["target"], text)
        rendered[template["target"]] = text

    action_template = env.get_template("action.md.j2")
    for action in actions:
        text = action_template.render(action=action)
        write_text(VAULT / action["target"], text)
        rendered[action["target"]] = text

    for name, jinja_name in (("Home.md", "home.md.j2"), ("LEGGIMI.md", "leggimi.md.j2"),
                             (f"{INDEX_DIR}/Ponte Mondo-Sistema.md", "ponte.md.j2"),
                             (f"{INDEX_DIR}/Fronti.md", "fronti.md.j2")):
        text = env.get_template(jinja_name).render(core=core, plugins=plugins, templates=templates, pages=pages)
        write_text(VAULT / name, text)
        rendered[name] = text

    index_template = env.get_template("index.md.j2")
    for page in pages:
        rel = f"{INDEX_DIR}/{page['file']}.md"
        text = index_template.render(core=core, plugins=plugins, templates=templates, page=page)
        write_text(VAULT / rel, text)
        rendered[rel] = text
    return rendered


# --- Config .obsidian (merge non distruttivo, un writer per plugin) ----------
def write_metadata_menu(obsidian: Path, core: dict[str, Any]) -> None:
    """Metadata Menu: uno fileClass per categoria (schema campi tipizzati) in
    z.classi/, e il puntamento del plugin a quella cartella."""
    for category in core.get("categories", {}):
        write_text(VAULT / "z.classi" / f"{category}.md", fileclass_note(core, category))
    merge_plugin_config(obsidian, "metadata-menu", {"classFilesPath": "z.classi/"})


def write_iconize(obsidian: Path, core: dict[str, Any], plugins: dict[str, Any]) -> None:
    """Iconize: icona (emoji) per cartella di categoria. Chiavi top-level
    percorso->emoji nel data.json (emojiStyle native); 'settings' preservato."""
    folders = core.get("folders", {})
    icons = {folders[key]: emoji for key, emoji in (plugins.get("folder_icons") or {}).items() if key in folders}
    if icons:
        merge_plugin_config(obsidian, "obsidian-icon-folder", icons)


def write_callout_manager(obsidian: Path, plugins: dict[str, Any]) -> None:
    """Callout Manager: callout GDR custom (id/color/icon) in callouts.custom,
    preservando settings/detection. Degradano a callout standard se assenti."""
    cm_dir = obsidian / "plugins" / "callout-manager"
    if cm_dir.is_dir() and plugins.get("callouts"):
        cm = read_json(cm_dir / "data.json")
        cm = cm if isinstance(cm, dict) else {}
        callouts_cfg = cm.get("callouts") if isinstance(cm.get("callouts"), dict) else {}
        custom = callouts_cfg.get("custom") if isinstance(callouts_cfg.get("custom"), list) else []
        known = {c.get("id") for c in custom if isinstance(c, dict)}
        changed = False
        for callout in plugins["callouts"]:
            if callout["id"] not in known:
                custom.append({"id": callout["id"], "color": callout["color"], "icon": callout["icon"]})
                changed = True
        if changed:
            callouts_cfg["custom"] = custom
            cm["callouts"] = callouts_cfg
            write_json(cm_dir / "data.json", cm)


def write_statblock_layouts(obsidian: Path) -> None:
    """Fantasy Statblocks: rende disponibili i layout italiani 5e/5.5e (uno per
    file in Dev/Source/statblocks/) + abilita il Dice Roller negli statblock. NON
    cambia il default (li selezioni tu in FS). Union per id: preserva default e
    layout esistenti dell'utente."""
    fs_dir = obsidian / "plugins" / "obsidian-5e-statblocks"
    if fs_dir.is_dir():
        fs_data = read_json(fs_dir / "data.json")
        if isinstance(fs_data, dict):
            layouts = fs_data.get("layouts") if isinstance(fs_data.get("layouts"), list) else []
            known = {l.get("id") for l in layouts if isinstance(l, dict)}
            changed = False
            # Dice Roller: rende cliccabili attacchi/danni negli statblock (mostri
            # SRD + creature). Default consigliato, non distruttivo (solo se off).
            if fs_data.get("diceRolling") is not True:
                fs_data["diceRolling"] = True
                changed = True
            for fs_layout in load_statblock_layouts():
                if fs_layout.get("id") not in known:
                    layouts.append(fs_layout)
                    known.add(fs_layout.get("id"))
                    changed = True
            if changed:
                fs_data["layouts"] = layouts
                write_json(fs_dir / "data.json", fs_data)


def write_bookmarks(obsidian: Path, pages: list[dict[str, Any]]) -> None:
    """Bookmarks (core): le poche pagine di riferimento a un clic (Home, hub, SRD
    se generata, Base per pagina). Non distruttivo: aggiunge solo le voci mancanti,
    preservando i bookmark dell'utente. Va dopo build_srd (referenzia SRD/Indice)."""
    bookmark_targets = [("Home.md", "🏠 Home"), *((f"{INDEX_DIR}/{p['file']}.md", p["title"]) for p in pages)]
    if (VAULT / "SRD" / "Indice.md").is_file():
        bookmark_targets.append(("SRD/Indice.md", "📚 SRD"))
    bookmark_targets += [(f"{INDEX_DIR}/{p['file']}.base", f"{p['title']} · Base") for p in pages]
    bookmarks = read_json(obsidian / "bookmarks.json")
    bookmarks = bookmarks if isinstance(bookmarks, dict) else {}
    items = bookmarks.get("items") if isinstance(bookmarks.get("items"), list) else []
    known = {it.get("path") for it in items if isinstance(it, dict)}
    added = False
    for path, title in bookmark_targets:
        if path not in known:
            items.append({"type": "file", "path": path, "title": title})
            added = True
    if added:
        bookmarks["items"] = items
        write_json(obsidian / "bookmarks.json", bookmarks)


def write_obsidian_config(obsidian: Path, core: dict[str, Any], plugins: dict[str, Any],
                          templates: list[dict[str, Any]], pages: list[dict[str, Any]]) -> None:
    """Config .obsidian: merge NON distruttivo. Le impostazioni e i plugin
    installati dall'utente sono preservati; si aggiornano solo le chiavi che la
    pipeline possiede (Templater, Dataview, Meta Bind, Metadata Menu, Iconize,
    Callout Manager, Fantasy Statblocks, bookmarks, chrome esploratore, default
    core, homepage)."""
    union_list(obsidian / "community-plugins.json", [p["id"] for p in plugins.get("plugins", [])])
    merge_plugin_config(obsidian, "templater-obsidian", {
        "templates_folder": "z.modelli",
        "user_scripts_folder": "z.automazioni",
    })
    merge_plugin_config(obsidian, "dataview", {"enableDataviewJs": True})
    merge_plugin_config(obsidian, "obsidian-meta-bind-plugin", meta_bind_config(plugins, core, templates))
    write_metadata_menu(obsidian, core)
    write_iconize(obsidian, core, plugins)
    write_callout_manager(obsidian, plugins)
    write_statblock_layouts(obsidian)
    write_bookmarks(obsidian, pages)
    # Pulizia esploratore: nasconde le cartelle z.* + le esclude da ricerca/grafo.
    write_workspace_chrome(obsidian)
    # Default core consigliati (proprietà nascoste, plugin core) — config riproducibile.
    write_core_settings(obsidian)
    # Homepage: apre Home all'avvio (solo se non già configurato).
    write_homepage(obsidian)


def scaffold_folders(core: dict[str, Any]) -> None:
    """Scaffolding delle cartelle contenuti (idempotente): mostra la struttura
    senza mai sovrascrivere note esistenti."""
    for folder in core.get("folders", {}).values():
        (VAULT / folder).mkdir(parents=True, exist_ok=True)


def build() -> dict[str, str]:
    """Orchestratore della build: carica il modello, scrive dati+script del JS
    Engine, rende tutte le note, genera Bases e SRD, scrive la config .obsidian
    e scaffolda le cartelle contenuti. Ritorna {target: testo} delle note rese."""
    core = load_core()
    plugins = load_yaml("plugins.yaml")
    templates = load_templates()
    actions = load_yaml("templates.yaml").get("actions", [])
    pages = load_pages()

    write_engine_data(core, templates)
    rendered = render_notes(jinja_env(), core, plugins, templates, actions, pages)
    # Bases (core): una vista DB nativa (.base) per pagina, stessa single-source
    # degli hub. Additivo: gli hub Dataview restano come fallback.
    write_bases(pages)

    # SRD 5.2.1 (CC-BY-4.0, IT): albero di sola lettura, separato dall'homebrew.
    # Prima della config .obsidian, che vi appende un bookmark.
    srd_count = build_srd(core)
    if srd_count:
        print(f"SRD: {srd_count} voci generate in SRD/.")

    write_obsidian_config(VAULT / ".obsidian", core, plugins, templates, pages)
    scaffold_folders(core)
    return rendered


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera il vault Obsidian GDR in dist/GDR-vault da sorgenti YAML/Jinja/JS.")
    parser.add_argument("--clean", action="store_true", help="Rimuove solo gli artefatti generati (non i contenuti/plugin).")
    parser.add_argument("--check", action="store_true", help="Valida YAML/Jinja senza scrivere output.")
    args = parser.parse_args()

    if args.clean:
        clean()
        print("Artefatti generati rimossi.")
        return 0
    if args.check:
        return check()

    clean()
    rendered = build()

    rel = VAULT.relative_to(ROOT)
    print(f"Build OK: {len(rendered)} note generate, {len(list(JS_DIR.glob('*.js')))} JS runtime.")
    print(f"Vault: {rel}/  — apri questa cartella in Obsidian.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
