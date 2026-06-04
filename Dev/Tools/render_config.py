#!/usr/bin/env python3
"""Scrittura della configurazione `.obsidian` (merge NON distruttivo, un writer per
plugin) e della presentazione (CSS/accento-colore per categoria). Estratto da
render.py per tenerlo orchestratore: qui vivono i writer dei plugin (Templater,
Meta Bind, Metadata Menu, Iconize, Callout Manager, Fantasy Statblocks, Initiative
Tracker, Folder Notes, Tab Panels, Calendarium, Bookmarks, Homepage, core), i
bottoni/fileClass derivati dal modello, le viste Bases e i colori-categoria
(CSS + preset Canvas). render.py re-esporta i nomi pubblici per i test/usi storici.

L'IO e il modello stanno in common.py; nessun import da render.py → nessun ciclo."""

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

/* Radar degli assi tematici (views.js: radarMarkdownFromValues / renderAxesCompare). */
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

/* === Ritocchi vetrina: callout differenzianti + tabelle dashboard ============ */

/* «Uso al tavolo» (la superficie giocabile = IL differenziatore): look da
   scheda-azione — sfondo + bordo-sinistro accentato, salta all'occhio. */
.callout[data-callout="tavolo"] {
  background: var(--background-secondary);
  border-left: 4px solid var(--callout-color, var(--color-red));
  border-radius: 6px;
}

/* Segreti (lettura DM): bordo tratteggiato = "non spoilerare". */
.callout[data-callout="segreto"] {
  border-left: 4px dashed var(--callout-color, var(--color-purple));
  background: var(--background-secondary);
}

/* Rivelazioni progressive (verità che emergono): bordo-sinistro accentato. */
.callout[data-callout="rivela"] {
  border-left: 4px solid var(--callout-color, var(--color-cyan));
}

/* Tabelle delle dashboard (Dataview/standalone): header marcato + zebra leggera +
   numeri tabulari → leggibili a colpo d'occhio (sono ciò che si vede di più all'inizio). */
.markdown-rendered table { font-variant-numeric: tabular-nums; }
.markdown-rendered table thead th {
  background: var(--background-secondary-alt);
  font-weight: 600;
}
.markdown-rendered .table-view-table tbody tr:nth-child(2n),
.block-language-dataview tbody tr:nth-child(2n) {
  background: var(--background-secondary);
}
/* L'infobox resta una scheda-fatti pulita (niente header/zebra): reset locale. */
.callout[data-callout="infobox"] thead th { background: none; font-weight: inherit; }
.callout[data-callout="infobox"] tbody tr { background: none; }
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


def callout_appearance_css(plugins: dict[str, Any]) -> str:
    """Aspetto dei callout GDR via CSS NATIVO Obsidian: `--callout-icon` (nome Lucide
    SENZA prefisso, l'unico formato che la variabile accetta) e `--callout-color`.
    Theme-safe, applicato al render, senza dipendere da Callout Manager. L'infobox
    prende il colore dall'accento-categoria (--gdr-accent), qui solo l'icona."""
    lines = ["", "/* Callout GDR: icona + colore nativi (da plugins.yaml:callouts). */"]
    for c in plugins.get("callouts", []) or []:
        decls = [f"--callout-icon: {c['icon']};"]
        if c["id"] != "infobox":
            decls.append(f"--callout-color: {c['color']};")
        lines.append(f'.callout[data-callout="{c["id"]}"] {{ {" ".join(decls)} }}')
    return "\n".join(lines) + "\n"


def write_workspace_chrome(obsidian: Path, plugins: dict[str, Any]) -> None:
    """Pulizia dell'esploratore: snippet CSS che nasconde le z.* + esclusione da
    ricerca/grafo/suggerimenti (userIgnoreFilters). Tutto non distruttivo. Il CSS è
    il base statico + accento per-categoria (B) + aspetto dei callout GDR."""
    write_text(obsidian / "snippets" / "gdr.css",
               HIDE_FOLDERS_SNIPPET + category_accent_css() + callout_appearance_css(plugins))
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
                # Callout Manager passa l'icona a setIcon → vuole il prefisso `lucide-`
                # (l'opposto della variabile CSS nativa). Riaggiungilo qui.
                custom.append({"id": callout["id"], "color": callout["color"],
                               "icon": f"lucide-{callout['icon']}"})
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
    write_workspace_chrome(obsidian, plugins)
    # Default core consigliati (proprietà nascoste, plugin core) — config riproducibile.
    write_core_settings(obsidian)
    # Homepage: apre Home all'avvio (solo se non già configurato).
    write_homepage(obsidian)


# --- Accento-colore per categoria → preset JSON Canvas ----------------------
# Colore-categoria → preset JSON Canvas (1 rosso, 2 arancio, 3 giallo, 4 verde,
# 5 ciano, 6 viola). Riusa i gruppi tematici di CATEGORY_ACCENTS (presentazione).
_CANVAS_PRESET = {"green": "4", "red": "1", "pink": "6", "orange": "2",
                  "purple": "6", "cyan": "5", "blue": "5", "yellow": "3"}


def _canvas_color(category: str) -> str:
    for color, cats in CATEGORY_ACCENTS.items():
        if category in cats:
            return _CANVAS_PRESET.get(color, "")
    return ""


def canvas_colors() -> dict[str, str]:
    """Mappa piatta categoria→preset-colore Canvas (1..6), derivata dalla STESSA
    sorgente di `_canvas_color` (CATEGORY_ACCENTS×_CANVAS_PRESET). Esportata in
    core.json così l'azione runtime `world_board` (JS) colora le card dei mondi
    dell'utente IDENTICA al World Board del mondo-esempio (build-time). Sorgente
    unica: il test di parità impone che JS e Python diano lo stesso canvas."""
    return {cat: _CANVAS_PRESET[color]
            for color, cats in CATEGORY_ACCENTS.items()
            for cat in cats if color in _CANVAS_PRESET}
