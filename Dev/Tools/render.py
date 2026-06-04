#!/usr/bin/env python3
"""Orchestratore della pipeline GDR: genera il vault Obsidian in dist/GDR-vault
dalle sorgenti YAML/Jinja/JS. Il modello dati e l'IO stanno in common.py, la
generazione SRD in build_srd.py, la validazione in validate.py; qui restano la
build() (render template + config .obsidian), clean()/seed() e la CLI.

Re-esporta i nomi pubblici dei moduli così i test (e gli usi storici) possono
continuare a riferirli come render.<nome>."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path
from typing import Any

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

from common import (  # noqa: F401 (re-export per i test/usi storici)
    ESEMPIO_DIR,
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
    load_example_manifests,
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
    gs_baselines,
    load_srd,
    srd_condizioni,
    srd_loot_pool,
    srd_note,
    srd_statblock_yaml,
)
from build_personaggio import build_personaggio_options  # noqa: F401 (re-export)
from build_site import SITE_OUT, build_site  # noqa: F401 (re-export per i test)
from validate import (  # noqa: F401 (re-export per i test)
    CORE_ONLY_SECTIONS,
    PARTITIONED_SECTIONS,
    SYSTEM_ONLY_SECTIONS,
    check,
    validate_aux_yaml,
    validate_entities,
    validate_entity_schema,
    validate_reciprocals,
    validate_split,
)


def clean() -> None:
    """Rimuove solo gli artefatti puramente generati (z.modelli, z.automazioni,
    z.classi, SRD, Home/LEGGIMI, pagine-indice). NON tocca .obsidian (config e
    plugin dell'utente) ne' i contenuti. Pulisce anche residui legacy in ROOT."""
    notes = generated_note_names() + [f"{INDEX_DIR}/{p['file']}.base" for p in load_pages()]
    # Note-cartella auto-indice (Folder Notes): derivate dal modello, rimosse qui.
    notes += [fp["target"] for fp in folder_index_pages(load_core(), load_yaml("plugins.yaml"))]
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

/* Barre risorse PG (views.js: renderRisorsePG). Max variabile calcolato a runtime
   nel JS Engine: il progressBar Meta Bind accetta solo max letterali. */
.gdr-bars { display: grid; gap: 4px; margin: 6px 0; }
.gdr-bar { display: grid; grid-template-columns: 5.5em 1fr auto; align-items: center; gap: 8px; font-size: var(--font-ui-small); }
.gdr-bar-label { color: var(--text-muted); }
.gdr-bar-track { height: 10px; border-radius: 5px; background: var(--background-modifier-border); overflow: hidden; }
.gdr-bar-fill { display: block; height: 100%; border-radius: 5px; }
.gdr-bar-val { font-variant-numeric: tabular-nums; white-space: nowrap; }

/* === Feel wiki (rifinitura) — tutto su variabili del tema (chiaro/scuro). === */

/* Infobox (macro identita_card): scheda d'identità in cima alla nota. Box
   distinto + ritratto incorniciato + tabella-fatti compatta (chiave in muted). */
.callout[data-callout="infobox"] {
  border: 1px solid var(--background-modifier-border);
  border-radius: 10px;
  background: var(--background-secondary);
  padding: 0.5em 0.9em 0.7em;
}
.callout[data-callout="infobox"] > .callout-title {
  font-size: var(--font-ui-medium);
  border-bottom: 1px solid var(--background-modifier-border);
  padding-bottom: 0.3em;
  margin-bottom: 0.4em;
}
.callout[data-callout="infobox"] table {
  border-collapse: collapse;
  width: 100%;
  font-size: var(--font-ui-small);
}
.callout[data-callout="infobox"] td {
  border: none;
  padding: 2px 6px;
  vertical-align: top;
}
.callout[data-callout="infobox"] td:first-child {
  color: var(--text-muted);
  white-space: nowrap;
  width: 1%;
}
/* Ritratto (se reso come immagine): incorniciato e centrato, non a tutta pagina. */
.callout[data-callout="infobox"] img {
  display: block;
  margin: 0.2em auto 0.5em;
  max-width: 220px;
  max-height: 260px;
  width: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--background-modifier-border);
}

/* Tabelle dentro i callout (relazioni/scheda/condizioni): più compatte. */
.callout th, .callout td { padding: 3px 8px; }
.callout table { font-size: var(--font-ui-small); }

/* Pannello Vista: lieve feedback hover per dare profondità alle card. */
.gdr-card { transition: border-left-width 80ms ease; }
.gdr-card:hover { border-left-width: 5px; }

/* === Layout nota: A=infobox sidebar · B=accento categoria · E=tipografia ===== */

/* B — accento di categoria: l'infobox eredita --gdr-accent (impostato dalle regole
   per-categoria generate sotto, su [!infobox|<categoria>]); default = bordo neutro. */
.callout[data-callout="infobox"] {
  --gdr-accent: var(--background-modifier-border);
  border-top: 3px solid var(--gdr-accent);
}
.callout[data-callout="infobox"] > .callout-title { color: var(--gdr-accent); }

/* A — NB: la sidebar flottante con testo che avvolge NON è affidabile in Obsidian:
   in lettura il renderer virtualizza i blocchi (ognuno è una `.markdown-preview-section`
   posizionata), così float/wrap fra blocchi si rompe. L'infobox resta dunque una card
   a tutta larghezza (pulita, robusta), con l'identità data dall'accento di categoria
   (B) e dalla cornice; niente layout fragile. */

/* E — titolo nota: più respiro + filetto sottile (aria da voce di wiki). */
.markdown-rendered h1 { margin-bottom: 0.4rem; padding-bottom: 0.2rem; border-bottom: 1px solid var(--background-modifier-border); }
/* Header delle tab (Tab Panels): più scandito e leggibile. */
.block-language-tabs .tabs-header { gap: 0.2em; }
/* Callout di classificazione (famiglia): discreto, non compete con l'infobox. */
.callout[data-callout="info"] { font-size: var(--font-ui-small); }
"""


# Accento-colore per categoria (B): ogni gruppo tematico → un colore-tema Obsidian
# (theme-safe, chiaro/scuro). L'infobox di [!infobox|<categoria>] eredita --gdr-accent.
# Presentazione, non dato: vive qui, non in YAML. Categoria non mappata → bordo neutro.
CATEGORY_ACCENTS = {
    "green":  ["luogo", "regno", "bioma", "ecosistema", "risorsa"],          # mondo fisico / natura / economia
    "red":    ["fazione", "culto"],                                          # potere / fede organizzata
    "pink":   ["cultura", "lingua"],                                         # società / popoli
    "orange": ["personaggio", "creatura"],                                   # persone & creature
    "purple": ["cosmologia", "dominio", "legge_fondamentale",                # metafisica & magia
               "entita_primordiale", "piano", "divinita", "sistema_magico"],
    "cyan":   ["epoca", "evento", "mito", "profezia"],                       # tempo / storia / mito
    "blue":   ["classe", "sottoclasse", "specie", "background", "talento",   # regole & scheda 5e
               "incantesimo", "regola", "oggetto", "bastione"],
    "yellow": ["incontro", "insidia", "sessione"],                          # al tavolo / gioco
}


def category_accent_css() -> str:
    """Regole CSS per-categoria (B): impostano --gdr-accent sull'infobox in base al
    metadato del callout ([!infobox|<categoria>] → data-callout-metadata)."""
    lines = ["", "/* B — accento per categoria (generato da CATEGORY_ACCENTS). */"]
    for color, cats in CATEGORY_ACCENTS.items():
        for cat in cats:
            lines.append(
                f'.callout[data-callout="infobox"][data-callout-metadata="{cat}"]'
                f' {{ --gdr-accent: var(--color-{color}); }}')
    return "\n".join(lines) + "\n"


def write_workspace_chrome(obsidian: Path) -> None:
    """Pulizia dell'esploratore: snippet CSS che nasconde le z.* + esclusione da
    ricerca/grafo/suggerimenti (userIgnoreFilters). Tutto non distruttivo. Il CSS è
    il base statico + le regole d'accento per-categoria generate (B)."""
    write_text(obsidian / "snippets" / "gdr.css", HIDE_FOLDERS_SNIPPET + category_accent_css())
    union_list_key(obsidian / "appearance.json", "enabledCssSnippets", ["gdr"])
    union_list_key(obsidian / "app.json", "userIgnoreFilters", [f"{d}/" for d in HIDDEN_DIRS])


# Impostazioni core consigliate, iniettate non distruttivamente così la config è
# riproducibile dal vault generato (non dipende da settaggi manuali).
# propertiesInDocument 'hidden': nasconde il pannello Proprietà nelle note — GDR
# si edita via Meta Bind nel corpo, le proprietà grezze sarebbero ridondanti.
# Cartella unica per i file media dell'utente (ritratti, mappe, immagini): è anche
# la destinazione degli allegati di Obsidian, così trascinare un'immagine la deposita
# qui invece di sparpagliarla. Non è una categoria: scaffoldata a parte + icona.
MEDIA_FOLDER = "Media"
MEDIA_ICON = "🖼️"
# defaultViewMode "preview": le note si aprono in Lettura, dove il contenuto
# dinamico (tabs/Dataview/Meta Bind/dice) RENDE e gli INPUT/BUTTON sono già
# interattivi — così la prima impressione non è un muro di ```fence grezze. Si
# passa alla scrittura con Ctrl/Cmd-E. (Merge non distruttivo: l'utente può
# cambiarlo; un rebuild esplicito lo ripristina.)
APP_SETTINGS = {
    "propertiesInDocument": "hidden",
    "attachmentFolderPath": MEDIA_FOLDER,
    "defaultViewMode": "preview",
}
# Plugin core usati dalla pipeline: bookmarks legge il bookmarks.json generato;
# bases rende le viste-indice native (.base) generate in INDEX_DIR/.
CORE_PLUGINS = ("bookmarks", "bases")


def write_core_settings(obsidian: Path) -> None:
    """Default core consigliati: nasconde le Proprietà nelle note, apre le note in
    Lettura (contenuto dinamico già reso) e abilita i plugin core usati.
    Non distruttivo (merge; preserva il resto della config)."""
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


def write_folder_notes(obsidian: Path) -> None:
    """Folder Notes: la nota omonima dentro ogni cartella (Mondi/<X>/<X>.md) è la
    sua nota-cartella (auto-indice generato da folder_index_pages). Allinea le
    chiavi-chiave alla convenzione; merge non distruttivo (preserva il resto)."""
    merge_plugin_config(obsidian, "folder-notes", {
        "folderNoteType": ".md",
        "storageLocation": "insideFolder",
        "folderNoteName": "{{folder_name}}",
        "hideFolderNote": True,
    })


def write_tab_panels(obsidian: Path) -> None:
    """Tab Panels: la CACHE è DISABILITATA — è incompatibile con Meta Bind. Il suo
    layer di caching (IndexedDB) scatena eventi `metadataCache.changed` con una cache
    transitoriamente `undefined`: i gestori `onCacheChanged` di Meta Bind e del core di
    Obsidian crashano leggendo `.frontmatter` (TypeError ripetuto in console). Dato che
    OGNI nota-entità ha input Meta Bind DENTRO le tab, il conflitto è strutturale →
    teniamo la cache off. Costo: i [[wikilink]] scritti a mano nel CORPO di una tab non
    finiscono in backlink/Outline (ma le relazioni tipizzate stanno nel frontmatter, già
    indicizzate; e in Lettura i link restano cliccabili). Set esplicito a False per
    sovrascrivere config precedenti che l'avevano abilitata. Merge non distruttivo."""
    merge_plugin_config(obsidian, "tab-panels", {"enableCaching": False})


def write_calendarium(obsidian: Path) -> None:
    """Calendarium ('tempo del mondo'): abilita lo scan automatico degli eventi
    dalle note (frontmatter `fc-date`/`fc-calendar` + tag inline `#cronologia`),
    così quando si attiva un calendario gli eventi datati vi compaiono soli. La
    DEFINIZIONE del calendario (mesi/ere/lune) è contenuto per-mondo: si crea una
    volta in-app dai preset di Calendarium (opt-in), non la cabla la pipeline."""
    # NB parseDates=False (CRITICO): nel plugin questo flag è "usa il NOME DEL FILE
    # come data" (main.js: new Parser(cal, getData().parseDates) -> useFilenameForEvents).
    # Con True, ogni nota SENZA fc-date prova a interpretare il proprio basename come
    # data -> "valid year: NaN" a raffica (×ogni nota SRD). Off: le note con fc-date
    # compaiono lo stesso (la data si legge da fc-date), le altre vengono ignorate.
    merge_plugin_config(obsidian, "calendarium", {
        "autoParse": True,
        "parseDates": False,
        "eventFrontmatter": True,
        "inlineEventsTag": "#cronologia",
    })


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
    # generatori homebrew: catalogo da generatori.yaml + iniezione dei nomi-oggetto
    # REALI dell'SRD nel generatore `tesoro` (per fascia/rarità). Vivono qui, non in
    # YAML, così il bottino cita item veri/CC-BY senza ricopiarli a mano.
    generatori = load_yaml("generatori.yaml") if (SOURCE / "YAML" / "generatori.yaml").is_file() else {}
    if isinstance(generatori.get("tesoro"), dict):
        generatori["tesoro"]["_srd"] = srd_loot_pool()
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
        # condizioni: le 15 condizioni 5.5e (compatte) per views.renderCondizioni
        # (quick-ref al tavolo: scheda PG + incontro). Dalle note SRD del glossario.
        "condizioni": srd_condizioni(),
        # maestrie: le 8 proprietà di maestria delle armi 2024 (quick-ref al tavolo,
        # views.renderMaestrie). Da system.yaml (il SRD 5.2.1 non le mappa per-arma).
        "maestrie": core.get("maestrie_armi", []),
        # gs_baseline: statistiche-base per GS (mediane dei mostri SRD di pari GS),
        # per lo scaffolder di statblock delle creature homebrew
        # (meta_actions.scaffold_statblock): un boss con solo `gs` diventa giocabile.
        "gs_baseline": gs_baselines(),
        # astrologia: catalogo tema natale (segni/arcani/elementi) per views.renderTemaNatale
        # (profilo personalità dei personaggi, soprattutto PNG). Da astrologia.yaml (opzionale).
        "astrologia": load_yaml("astrologia.yaml") if (SOURCE / "YAML" / "astrologia.yaml").is_file() else {},
        # generatori: catalogo stili/affissi per il generatore homebrew di nomi/spunti
        # (genera.js: nomi persona/toponimi/fazioni in italiano, a tema). Da generatori.yaml,
        # con i nomi-oggetto SRD iniettati in tesoro._srd (vedi sopra).
        "generatori": generatori,
        "creation": core.get("creation", {}),
        "templates": templates,
    }
    # YAML -> JSON che gli script JS leggono a runtime via app.vault.adapter.read.
    write_json(VAULT / "z.automazioni" / "data" / "core.json", payload)
    # Opzioni del rules-engine PG (SRD + pg_rules.yaml) per crea_personaggio.js.
    write_json(VAULT / "z.automazioni" / "data" / "personaggio.json", build_personaggio_options(core))
    # Gli script Templater (.js CommonJS) e il guscio JS Engine (.mjs ESM) sono
    # autonomi (niente require/bundling): copia 1:1. I `_*.js` sono sorgenti di
    # riferimento condivise (es. _comparators.js, sincronizzato via check) — non
    # runtime: non si copiano nel vault, come i partial Jinja `_*.j2`.
    for source in sorted(JS_DIR.glob("*.js")) + sorted(JS_DIR.glob("*.mjs")):
        if source.name.startswith("_"):
            continue
        shutil.copy2(source, VAULT / "z.automazioni" / source.name)
    for template in templates:
        if not (JS_DIR / f"crea_{template['id']}.js").is_file():
            write_text(VAULT / "z.automazioni" / f"crea_{template['id']}.js", crea_wrapper_js(template))


# Categorie senza nota-cartella auto-indice: 'mondo' (la sua cartella è la radice
# Mondi/) e 'nota' (Inbox, scratch). Tutte le altre hanno una sottocartella propria.
FOLDER_NOTE_SKIP = {"mondo", "nota"}


def folder_index_pages(core: dict[str, Any], plugins: dict[str, Any]) -> list[dict[str, Any]]:
    """Per ogni categoria con una sottocartella sotto Mondi/, una 'nota-cartella'
    (convenzione Folder Notes: nota omonima dentro la cartella) che fa da indice
    auto della categoria. Riusa index.md.j2 sintetizzando un `page` minimale; la
    nota appare cliccando la cartella nell'esploratore. Ritorna [{target, page}]."""
    folders = core.get("folders", {})
    icons = plugins.get("folder_icons") or {}
    out: list[dict[str, Any]] = []
    for cat, meta in core.get("categories", {}).items():
        if cat in FOLDER_NOTE_SKIP:
            continue
        folder = folders.get(meta.get("folder", cat)) or folders.get(cat)
        if not folder or "/" not in folder:
            continue  # solo le categorie con sottocartella dedicata
        basename = folder.split("/")[-1]
        icon = icons.get(cat, "")
        out.append({
            "target": f"{folder}/{basename}.md",
            "page": {
                "id": f"cartella_{cat}",
                "file": basename,
                "title": f"{icon} {basename}".strip(),
                "category": cat,
                "intro": "Tutte le voci di questa categoria. Clicca la cartella per tornare qui.",
                "sort": "file.name asc",
                "columns": [{"field": "tipo", "label": "Tipo"}, {"field": "mondo", "label": "Mondo"}],
            },
        })
    return out


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
                             ("THIRD-PARTY-LICENSES.md", "third_party_licenses.md.j2"),
                             ("Crea il tuo mondo.md", "crea_il_tuo_mondo.md.j2"),
                             (f"{INDEX_DIR}/Ponte Mondo-Sistema.md", "ponte.md.j2"),
                             (f"{INDEX_DIR}/Fronti.md", "fronti.md.j2"),
                             (f"{INDEX_DIR}/Rete del mondo.md", "rete.md.j2"),
                             (f"{INDEX_DIR}/Economia.md", "economia.md.j2"),
                             (f"{INDEX_DIR}/Geografia.md", "geografia.md.j2"),
                             (f"{INDEX_DIR}/Occhi del giocatore.md", "occhi_giocatore.md.j2"),
                             (f"{INDEX_DIR}/Guida al combattimento.md", "guida_combattimento.md.j2")):
        text = env.get_template(jinja_name).render(core=core, plugins=plugins, templates=templates, pages=pages)
        write_text(VAULT / name, text)
        rendered[name] = text

    index_template = env.get_template("index.md.j2")
    for page in pages:
        rel = f"{INDEX_DIR}/{page['file']}.md"
        text = index_template.render(core=core, plugins=plugins, templates=templates, page=page)
        write_text(VAULT / rel, text)
        rendered[rel] = text

    # Note-cartella (Folder Notes): un auto-indice per ogni categoria, dentro la
    # sua cartella Mondi/<X>/, reso con lo stesso index.md.j2.
    for fp in folder_index_pages(core, plugins):
        text = index_template.render(core=core, plugins=plugins, templates=templates, page=fp["page"])
        write_text(VAULT / fp["target"], text)
        rendered[fp["target"]] = text
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
    icons[MEDIA_FOLDER] = MEDIA_ICON  # cartella media (non categoria)
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
    file in Dev/Source/statblocks/), abilita il Dice Roller negli statblock e
    autoParse (registra le creature nel bestiario → `monster:` risolve). NON
    cambia il layout di default (lo scegli tu in FS). Union per id: preserva
    default e layout esistenti dell'utente."""
    fs_dir = obsidian / "plugins" / "obsidian-5e-statblocks"
    if fs_dir.is_dir():
        fs_data = read_json(fs_dir / "data.json")
        if isinstance(fs_data, dict):
            layouts = fs_data.get("layouts") if isinstance(fs_data.get("layouts"), list) else []
            known = {l.get("id") for l in layouts if isinstance(l, dict)}
            changed = False
            # Dice Roller: rende cliccabili attacchi/danni negli statblock (mostri
            # SRD + creature). La chiave reale di Fantasy Statblocks è `useDice`
            # (default true); `diceRolling` è legacy/no-op ma la teniamo per sicurezza.
            for key in ("useDice", "diceRolling"):
                if fs_data.get(key) is not True:
                    fs_data[key] = True
                    changed = True
            # autoParse ("Parse Frontmatter in Notes"): registra nel bestiario le
            # note con `statblock: inline` (mostri SRD + creature) → i riferimenti
            # `monster:` risolvono (tab 5e del template creatura, blocchi encounter).
            if fs_data.get("autoParse") is not True:
                fs_data["autoParse"] = True
                changed = True
            for fs_layout in load_statblock_layouts():
                if fs_layout.get("id") not in known:
                    layouts.append(fs_layout)
                    known.add(fs_layout.get("id"))
                    changed = True
            if changed:
                fs_data["layouts"] = layouts
                write_json(fs_dir / "data.json", fs_data)


def initiative_statuses(core: dict[str, Any]) -> list[dict[str, Any]]:
    """Le 15 condizioni 5.5e (core.condizioni) nel formato status di Initiative
    Tracker: {name, id, description}. Così sono APPLICABILI in combattimento dal
    tracker (non solo quick-ref). id = nome (convenzione di IT)."""
    out: list[dict[str, Any]] = []
    for c in core.get("condizioni", []) or []:
        nome = str(c.get("nome", "")).strip()
        if not nome:
            continue
        eff = "; ".join(
            str(e.get("descrizione", "")).strip()
            for e in (c.get("effetti") or []) if isinstance(e, dict) and e.get("descrizione"))
        desc = str(c.get("descrizione", "")).strip()
        full = (desc + (" — " + eff if eff else "")).strip() or nome
        out.append({"name": nome, "id": nome, "description": full})
    return out


def write_initiative_tracker(obsidian: Path, core: dict[str, Any]) -> None:
    """Initiative Tracker: inietta le condizioni 5.5e come STATUS (applicabili in
    combattimento) e un PARTY di default 'Gruppo' (vuoto: aggiungi i tuoi PG una
    volta) così `players: true`/party risolve. Non distruttivo: riempie solo le
    chiavi assenti, preservando statuses/party personalizzati dall'utente."""
    it_dir = obsidian / "plugins" / "initiative-tracker"
    if not it_dir.is_dir():
        return
    cur = read_json(it_dir / "data.json")
    cur = cur if isinstance(cur, dict) else {}
    updates: dict[str, Any] = {}
    if not cur.get("statuses"):
        statuses = initiative_statuses(core)
        if statuses:
            # + i due status specifici del tracker (non sono condizioni SRD): la
            # concentrazione e la reazione-usata (azzerata a ogni round).
            updates["statuses"] = statuses + [
                {"name": "Concentrazione", "id": "Concentrazione",
                 "description": "Mantiene un incantesimo a concentrazione: TS Costituzione (CD 10 o metà danni) quando subisce danni, o lo perde."},
                {"name": "Reazione usata", "id": "Reazione usata", "resetOnRound": True,
                 "description": "Ha già usato la reazione in questo round."},
            ]
    if not cur.get("parties"):
        updates["parties"] = [{"name": "Gruppo", "players": []}]
        updates["defaultParty"] = "Gruppo"
    if updates:
        merge_plugin_config(obsidian, "initiative-tracker", updates)


def write_bookmarks(obsidian: Path, pages: list[dict[str, Any]]) -> None:
    """Bookmarks (core): le poche pagine di riferimento a un clic (Home, hub, SRD
    se generata, Base per pagina). Non distruttivo: aggiunge solo le voci mancanti,
    preservando i bookmark dell'utente. Va dopo build_srd (referenzia SRD/Indice)."""
    bookmark_targets = [("LEGGIMI.md", "👋 LEGGIMI"), ("Home.md", "🏠 Home"),
                        *((f"{INDEX_DIR}/{p['file']}.md", p["title"]) for p in pages)]
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
    write_initiative_tracker(obsidian, core)
    write_folder_notes(obsidian)
    write_tab_panels(obsidian)
    write_calendarium(obsidian)
    write_bookmarks(obsidian, pages)
    # Pulizia esploratore: nasconde le cartelle z.* + le esclude da ricerca/grafo.
    write_workspace_chrome(obsidian)
    # Default core consigliati (proprietà nascoste, plugin core) — config riproducibile.
    write_core_settings(obsidian)
    # Homepage: apre Home all'avvio (solo se non già configurato).
    write_homepage(obsidian)


# --- Mondo-esempio (demo precaricata) ---------------------------------------
# Cartella riservata del mondo dimostrativo: prefisso fisso, MAI toccato altrove
# (un utente crea i propri mondi nelle cartelle di categoria, non qui). Il writer
# la riscrive a ogni build; l'utente la cancella in un clic per partire da vuoto.
EXAMPLE_FOLDER_PREFIX = "Mondi/_Esempio — "


def pressione_label(pressione: Any) -> str:
    """Etichetta della pressione (come la macro tavolo): Crisi/Tensione/Calma."""
    try:
        p = int(pressione)
    except (TypeError, ValueError):
        return ""
    return "🔴 Crisi" if p >= 7 else "🟠 Tensione" if p >= 4 else "🟢 Calma"


def example_carattere_block(fm: dict[str, Any], category: str, core: dict[str, Any]) -> list[str]:
    """Blocco «Carattere» degli assi tematici per una nota-esempio: un callout
    read-only con `valore · etichetta` per ogni asse valorizzato nel frontmatter
    (dalle etichette in core.assi_tematici) + il radar (js-engine, come la macro
    grafico_assi: rende dal frontmatter con JS Engine). Vuoto se la categoria non
    ha assi o ne ha <3 valorizzati. Sul sito-giocatori callout e fence js-engine
    sono rimossi (il Carattere è lettura da DM)."""
    assi = (core.get("assi_tematici", {}) or {}).get(category) or []
    righe: list[str] = []
    for a in assi:
        val = fm.get(a["id"])
        if val is None:
            continue
        valori = a.get("valori", {}) or {}
        voce = valori.get(val)
        if voce is None:
            try:
                voce = valori.get(int(val))
            except (TypeError, ValueError):
                voce = None
        etichetta = (voce or {}).get("etichetta", "")
        righe.append(f"> **{a.get('nome', a['id'])}** — {val} · {etichetta}")
    if len(righe) < 3:
        return []
    return ["## Carattere", "", "> [!abstract] Carattere", *righe, "",
            "```js-engine",
            f'return (await engine.importJs("z.automazioni/boot.mjs"))'
            f'.radar(engine, app, "{category}", component);',
            "```", ""]


def example_note_text(note: dict[str, Any], world: str, core: dict[str, Any]) -> str:
    """Una nota del mondo-esempio: frontmatter pre-popolato + corpo READ-ONLY in
    Markdown/Dataview puro (infobox, lore, superficie giocabile, collegamenti).
    Assi tematici → callout Carattere + radar (js-engine). Le dashboard la trovano
    per `categoria`."""
    fm: dict[str, Any] = {
        "nome": note["nome"],
        "categoria": note["categoria"],
        "tipo": note.get("tipo", ""),
        "mondo": f"[[{world}]]",
        "stato": note.get("stato", "pronto"),
    }
    fm.update(note.get("fm", {}) or {})
    for key in ("uso_al_tavolo", "gancio", "prossima_mossa"):
        if note.get(key):
            fm[key] = note[key]
    if note.get("pressione") is not None:
        fm["pressione"] = note["pressione"]
    fm["tags"] = ["gdr/esempio"]
    front = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False)

    lines = [f"---\n{front}---", "", f"# {note['nome']}", ""]
    # Infobox (callout CSS): tabella-fatti d'identità. Il metadato = categoria →
    # accento-colore per categoria (gdr.css), come nelle note da template.
    lines.append(f"> [!infobox|{note.get('categoria', '')}] {note['nome']}")
    lines.append("> | | |")
    lines.append("> |:--|:--|")
    lines.append(f"> | **Mondo** | [[{world}]] |")
    for label, value in note.get("fatti", []) or []:
        lines.append(f"> | **{label}** | {value} |")
    lines.append("")
    if note.get("lore"):
        lines += [note["lore"].strip(), ""]
    # Rivelazione PER-SEZIONE: callout `[!rivela|tier]` — verità che emergono col
    # procedere della campagna. Player-facing ma gated dal build del sito (compare
    # al `--reveal` >= tier); in Obsidian è un callout pieghevole. Dalla lista `rivela`.
    for r in note.get("rivela", []) or []:
        tier = r.get("tier", "incontrato")
        titolo = str(r.get("titolo", "")).strip()
        testo = str(r.get("testo", "") or "").strip()
        lines.append(f"> [!rivela|{tier}]-" + (f" {titolo}" if titolo else ""))
        if testo:
            lines.append(f"> {testo}")
        lines.append("")
    # Mappa (campo `mappa`): embed dell'immagine collegata, come views.renderMap
    # (`![[..]]` rende SEMPRE, senza plugin). L'asset vive in Media/ (copiato a build
    # da copy_example_media). Sul sito-giocatori l'embed diventa `<img>` (zoommap è
    # solo-Obsidian). Target derivato dal wikilink del campo.
    mappa = fm.get("mappa")
    if mappa:
        target = str(mappa).strip()
        if target.startswith("[["):
            target = target[2:].split("]]", 1)[0]
        target = target.split("|", 1)[0].strip()
        if target:
            lines += ["## Mappa", "", f"![[{target}]]", ""]
    # Carattere (assi tematici): callout read-only + radar (js-engine), come la
    # macro carattere/grafico_assi. Solo per le categorie con assi valorizzati.
    lines += example_carattere_block(fm, note.get("categoria", ""), core)
    # Superficie giocabile (IL differenziatore), come la macro tavolo().
    if note.get("uso_al_tavolo"):
        lines += [f"> [!tavolo] Uso al tavolo\n> {note['uso_al_tavolo'].strip()}", ""]
    if note.get("gancio"):
        lines += [f"> [!gancio]- Gancio\n> {note['gancio'].strip()}", ""]
    if note.get("pressione") is not None:
        etichetta = pressione_label(note["pressione"])
        blocco = [f"> [!warning] Pressione {note['pressione']} · {etichetta}"]
        if note.get("prossima_mossa"):
            blocco.append(f"> **Prossima mossa**: {note['prossima_mossa'].strip()}")
        clock_dim = (note.get("fm", {}) or {}).get("clock_dim")
        if clock_dim:
            clock = (note.get("fm", {}) or {}).get("clock", 0)
            conseg = (note.get("fm", {}) or {}).get("conseguenza", "")
            blocco.append(f"> **Clock**: {clock}/{clock_dim} → {conseg}")
        lines += ["\n".join(blocco), ""]
    # Cronologia (mondo-che-cambia): la linea di vita dell'entità attraverso le
    # epoche, come la macro cronologia()/renderTappe (split sul primo '|').
    tappe = (note.get("fm", {}) or {}).get("tappe") or []
    if tappe:
        crono = ["> [!abstract]- 📜 Cronologia (come cambia attraverso le epoche)"]
        for riga in tappe:
            quando, _, stato = str(riga).partition("|")
            crono.append(f"> - **{quando.strip()}**" + (f" — {stato.strip()}" if stato.strip() else ""))
        lines += ["\n".join(crono), ""]
    # Collegamenti (Dataview): note del mondo legate a questa, in entrambe le
    # direzioni del grafo. Scoped a Mondi/ (esclude le 1300+ note SRD).
    lines += ["## Collegamenti", "```dataview",
              "list from \"Mondi\"",
              "where contains(file.outlinks, this.file.link) or contains(this.file.outlinks, file.link)",
              "```"]
    return "\n".join(lines)


def example_world_notes(manifest: dict[str, Any], core: dict[str, Any]) -> list[tuple[str, str]]:
    """Le note di un mondo-esempio come [(relpath, testo)]. Salta le note di
    categoria sconosciuta (robustezza). Tutte sotto un'unica cartella riservata."""
    world = manifest["mondo"]
    folder = f"{EXAMPLE_FOLDER_PREFIX}{world}"
    categories = core.get("categories", {})
    out: list[tuple[str, str]] = []
    for note in manifest.get("note", []) or []:
        if note.get("categoria") not in categories or not note.get("nome"):
            continue
        out.append((f"{folder}/{note['nome']}.md", example_note_text(note, world, core)))
    return out


def onboarding_note_text(manifest: dict[str, Any]) -> str:
    """Nota guidata "Inizia da qui" (UX-1, momento-aha): in 3 passi mostra IL WEDGE —
    scrivi lore (pressione/prossima mossa) su una nota → la superficie giocabile (il
    cruscotto Fronti) si popola da sé. Read-only; il BUTTON è Meta Bind (rende in
    Lettura), non Templater. `visibilita: dm` → fuori dal sito dei giocatori."""
    world = manifest["mondo"]
    # Luogo rappresentativo: quello che PREME di più (pressione max fra i luoghi con
    # pressione E prossima mossa) — il miglior esempio di "la lore accende la superficie
    # giocabile". Fallback robusto se nessuno qualifica.
    candidati = [n for n in manifest.get("note", []) or []
                 if n.get("categoria") == "luogo" and n.get("pressione") is not None
                 and n.get("prossima_mossa")]
    rep = max(candidati, key=lambda n: int(n.get("pressione") or 0)) if candidati else None
    if rep:
        passo1 = (f"Apri **[[{rep['nome']}]]**. Oltre alla prosa ha dei campi *da tavolo*: "
                  f"una **Pressione {rep['pressione']}** e una **Prossima mossa**. Non sono "
                  f"decorazione — dicono che questo luogo *preme* sulla storia.")
    else:
        passo1 = ("Apri una nota di luogo del mondo-esempio: ha campi *da tavolo* "
                  "(Pressione, Prossima mossa) oltre alla prosa.")
    fm = {"nome": "Inizia da qui", "visibilita": "dm", "tags": ["gdr/esempio"]}
    front = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False)
    lines = [
        f"---\n{front}---", "",
        f"# 👋 Inizia da qui — {world}", "",
        "> [!tip] 3 minuti per capire cos'ha di speciale questo vault",
        "> Non è uno schedario di lore: è un **mondo che si calcola**. Quando scrivi la lore di",
        "> una nota, la *superficie giocabile* (cosa preme al tavolo) si accende **da sola**.",
        "> Seguiamolo in 3 passi, sul mondo-esempio già pronto.", "",
        "## 1 · Guarda una nota di mondo",
        passo1, "",
        "## 2 · Guarda dove quel segnale riemerge **da solo**",
        "Apri il cruscotto **[[Fronti]]** (callout *⚡ Stato del Mondo* in cima). Non l'hai",
        "compilato tu: è **calcolato dal grafo**. Il luogo di prima — e gli altri fronti —",
        "compaiono lì **ordinati per imminenza** (riempimento del clock + spinte dalle note",
        "collegate). Hai scritto lore in *una* nota → il cruscotto di prep-sessione si è",
        "popolato da sé. **Questo è il punto: il mondo si calcola.**", "",
        "## 3 · Provalo tu (30 secondi)",
        "> [!example] Crea il tuo primo luogo",
        "> `BUTTON[crea-luogo]`",
        ">",
        "> Nel wizard scegli un **mondo**, poi compila **Pressione** (prova 6-7) e una",
        "> **Prossima mossa**. Riapri **[[Fronti]]**: il tuo luogo è ora fra i fronti, in",
        "> classifica. Niente database da gestire — la tua lore *è* il motore.", "",
        "---",
        "> [!info] E poi?",
        "> - Esplora gli indici dalla **[[Home]]**: 🗺️ [[Atlante]], ⏳ [[Fronti]], 💰 [[Economia]], 🧭 [[Geografia]].",
        f"> - Vedi il mondo **a colpo d'occhio**: apri il **[[{world} — Board.canvas|🗺 World Board]]** (Obsidian Canvas) — ogni card una nota, ogni linea una relazione.",
        "> - Crea fazioni, divinità, eventi: ognuno aggiunge spinte al grafo (alleati/rivali, rotte, clock).",
        f"> - Per partire da un mondo **vuoto**, cancella la cartella `_Esempio — {world}`.",
        "> - Guida completa: **[[LEGGIMI]]**.",
    ]
    return "\n".join(lines)


def copy_example_media() -> int:
    """Copia gli asset (mappe/immagini) dei mondi-esempio da Dev/Source/esempio/Media/
    nella cartella allegati del vault (`Media/`). Gli embed `![[file]]` delle note
    li risolvono per nome. Ritorna il n. di file copiati."""
    src_dir = ESEMPIO_DIR / "Media"
    if not src_dir.is_dir():
        return 0
    dest_dir = VAULT / MEDIA_FOLDER
    dest_dir.mkdir(parents=True, exist_ok=True)
    copied = 0
    for f in sorted(src_dir.iterdir()):
        if f.is_file() and not f.name.startswith("."):
            shutil.copy2(f, dest_dir / f.name)
            copied += 1
    return copied


# Colore-categoria → preset JSON Canvas (1 rosso, 2 arancio, 3 giallo, 4 verde,
# 5 ciano, 6 viola). Riusa i gruppi tematici di CATEGORY_ACCENTS (presentazione).
_CANVAS_PRESET = {"green": "4", "red": "1", "pink": "6", "orange": "2",
                  "purple": "6", "cyan": "5", "blue": "5", "yellow": "3"}


def _canvas_color(category: str) -> str:
    for color, cats in CATEGORY_ACCENTS.items():
        if category in cats:
            return _CANVAS_PRESET.get(color, "")
    return ""


def _link_names(value: Any) -> list[str]:
    """Nomi-nota estratti da un valore-relazione (wikilink, lista, stringa)."""
    names: list[str] = []
    for item in (value if isinstance(value, list) else [value]):
        if not item:
            continue
        s = str(item).strip()
        if s.startswith("[[") and s.endswith("]]"):
            inner = s[2:-2].split("|")[0].strip()
            if inner:
                names.append(inner)
        elif "[[" not in s:
            names.append(s)
    return names


def world_board_canvas(manifest: dict[str, Any], core: dict[str, Any]) -> dict[str, Any]:
    """«World Board» (Obsidian Canvas) di un mondo-esempio: una card per entità,
    in colonne raggruppate per categoria, e gli archi delle relazioni tipizzate
    (dedotti dal grafo). Vista a colpo d'occhio del mondo — alternativa visiva alla
    dashboard Rete. Ritorna il dict JSON Canvas 1.0."""
    world = manifest["mondo"]
    folder = f"{EXAMPLE_FOLDER_PREFIX}{world}"
    categories = core.get("categories", {})
    relazioni = core.get("relazioni", {})
    notes = [n for n in manifest.get("note", []) or []
             if n.get("categoria") in categories and n.get("nome")]

    # Raggruppa per categoria, in un ordine di lettura stabile (ordine di prima
    # apparizione nel manifest → deterministico per i test).
    cats_in_order: list[str] = []
    by_cat: dict[str, list[dict[str, Any]]] = {}
    for n in notes:
        c = n["categoria"]
        if c not in by_cat:
            by_cat[c] = []
            cats_in_order.append(c)
        by_cat[c].append(n)

    NODE_W, NODE_H, COL_GAP, ROW_GAP, TOP = 280, 90, 150, 50, 40
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    node_by_name: dict[str, str] = {}

    # Header (text node) in alto a sinistra.
    nodes.append({"id": "header", "type": "text", "x": -20, "y": -150,
                  "width": NODE_W + 40, "height": 80,
                  "text": f"# 🗺 {world} — World Board\nIl mondo a colpo d'occhio: ogni card è una nota, ogni linea una relazione."})

    for col, cat in enumerate(cats_in_order):
        items = by_cat[cat]
        col_x = col * (NODE_W + COL_GAP)
        # Gruppo (sfondo) della colonna-categoria.
        nodes.append({"id": f"grp-{cat}", "type": "group", "label": cat.capitalize(),
                      "x": col_x - 20, "y": TOP - 60,
                      "width": NODE_W + 40,
                      "height": len(items) * (NODE_H + ROW_GAP) + 70})
        for i, n in enumerate(items):
            nid = f"n{len(node_by_name)}"
            node_by_name[n["nome"]] = nid
            node: dict[str, Any] = {
                "id": nid, "type": "file",
                "file": f"{folder}/{n['nome']}.md",
                "x": col_x, "y": TOP + i * (NODE_H + ROW_GAP),
                "width": NODE_W, "height": NODE_H,
            }
            color = _canvas_color(cat)
            if color:
                node["color"] = color
            nodes.append(node)

    # Archi: relazioni tipizzate fra entità del mondo (una per coppia non orientata).
    seen_pairs: set[frozenset] = set()
    for n in notes:
        src = node_by_name[n["nome"]]
        fm = n.get("fm", {}) or {}
        for rel in relazioni.get(n["categoria"], []) or []:
            for target in _link_names(fm.get(rel.get("field"))):
                tgt = node_by_name.get(target)
                if not tgt or tgt == src:
                    continue
                pair = frozenset((src, tgt))
                if pair in seen_pairs:
                    continue
                seen_pairs.add(pair)
                edges.append({"id": f"e{len(edges)}", "fromNode": src,
                              "toNode": tgt, "label": rel.get("label", rel.get("field", ""))})
    return {"nodes": nodes, "edges": edges}


def write_example_world(core: dict[str, Any]) -> int:
    """Genera i mondi-esempio (Dev/Source/esempio/*.yaml) in cartelle riservate
    `Mondi/_Esempio — <Mondo>/`. Riscrittura pulita: azzera SOLO la propria cartella
    (namespace riservato, mai contenuti utente). Ritorna il n. di note scritte."""
    written = 0
    for manifest in load_example_manifests():
        folder = VAULT / f"{EXAMPLE_FOLDER_PREFIX}{manifest['mondo']}"
        if folder.is_dir():
            shutil.rmtree(folder)
        for rel, text in example_world_notes(manifest, core):
            write_text(VAULT / rel, text)
            written += 1
        # Nota guidata "Inizia da qui" (UX-1): vive e muore con l'esempio; rende il
        # wedge nei primi minuti (lore → superficie giocabile calcolata).
        write_text(folder / "Inizia da qui.md", onboarding_note_text(manifest))
        written += 1
        # World Board (Obsidian Canvas): il mondo a colpo d'occhio (card per nota +
        # archi delle relazioni). Vista visiva alternativa alla dashboard Rete.
        board = world_board_canvas(manifest, core)
        write_text(folder / f"{manifest['mondo']} — Board.canvas",
                   json.dumps(board, ensure_ascii=False, indent=2))
    # Asset condivisi (mappe/immagini) delle note-esempio nella cartella allegati.
    media = copy_example_media()
    if media:
        print(f"Mondo-esempio: {media} asset copiati in {MEDIA_FOLDER}/.")
    return written


def scaffold_folders(core: dict[str, Any]) -> None:
    """Scaffolding delle cartelle contenuti (idempotente): mostra la struttura
    senza mai sovrascrivere note esistenti."""
    for folder in core.get("folders", {}).values():
        (VAULT / folder).mkdir(parents=True, exist_ok=True)
    # Cartella media utente (ritratti/mappe/immagini): destinazione degli allegati.
    (VAULT / MEDIA_FOLDER).mkdir(parents=True, exist_ok=True)


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
    # Mondo-esempio (demo precaricata): al primo avvio le dashboard non sono vuote.
    # Cartella riservata `Mondi/_Esempio — <Mondo>/`, cancellabile in un clic.
    example_count = write_example_world(core)
    if example_count:
        print(f"Mondo-esempio: {example_count} note generate in Mondi/_Esempio — */.")
    return rendered


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera il vault Obsidian GDR in dist/GDR-vault da sorgenti YAML/Jinja/JS.")
    parser.add_argument("--clean", action="store_true", help="Rimuove solo gli artefatti generati (non i contenuti/plugin).")
    parser.add_argument("--check", action="store_true", help="Valida YAML/Jinja senza scrivere output.")
    parser.add_argument("--site", action="store_true", help="Genera il sito statico dei giocatori (spoiler-free, read-only) in dist/GDR-site dal vault.")
    parser.add_argument("--reveal", choices=["pubblico", "incontrato", "segreto", "tutto"],
                        default="pubblico",
                        help="Livello di rivelazione del sito-giocatori: include le note col campo `rivelazione` fino a quel tier (default: pubblico).")
    args = parser.parse_args()

    if args.clean:
        clean()
        print("Artefatti generati rimossi.")
        return 0
    if args.check:
        return check()
    if args.site:
        if not (VAULT / "Mondi").is_dir():
            print("Nessun contenuto in Mondi/: esegui prima `npm run build`.")
            return 1
        pages = build_site(load_core(), VAULT, SITE_OUT, reveal=args.reveal)
        print(f"Sito giocatori: {pages} pagine in {SITE_OUT.relative_to(ROOT)}/ "
              f"(rivelazione: {args.reveal}) — apri index.html o pubblica la cartella.")
        return 0

    clean()
    rendered = build()

    rel = VAULT.relative_to(ROOT)
    js_runtime = len([p for p in JS_DIR.glob('*.js') if not p.name.startswith('_')]) + len(list(JS_DIR.glob('*.mjs')))
    print(f"Build OK: {len(rendered)} note generate, {js_runtime} JS runtime.")
    print(f"Vault: {rel}/  — apri questa cartella in Obsidian.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
