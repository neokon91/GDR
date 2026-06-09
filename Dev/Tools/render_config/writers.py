"""Writer della config .obsidian (settings core/app/homepage + un writer per plugin) e orchestratore write_obsidian_config."""
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

from ._io import merge_json, merge_plugin_config, union_list
from .model_cfg import fileclass_note, load_statblock_layouts, meta_bind_config
from .presentation import write_workspace_chrome




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


def write_hexmaker(obsidian: Path, core: dict[str, Any]) -> None:
    """Hexmap World Creator (hexcrawl): punta le cartelle del plugin alle ENTITÀ del
    vault, così gli esagoni linkano i nostri Luoghi/Fazioni/Missioni/Tabelle/Regni —
    UNA fonte di verità, niente store paralleli. Le note-esagono vanno in Mondi/Esagoni.
    Merge NON distruttivo (mappe/stato dell'utente preservati): solo le chiavi-cartella
    sono di proprietà della pipeline. Si applica solo se il plugin è installato."""
    folders = core.get("folders", {}) or {}
    luoghi = folders.get("luogo", "Mondi/Luoghi")
    merge_plugin_config(obsidian, "hexmaker", {
        "worldFolder": "Mondi",
        "hexFolder": "Mondi/Esagoni",
        "townsFolder": luoghi,
        "dungeonsFolder": luoghi,
        "featuresFolder": luoghi,
        "factionsFolder": folders.get("fazione", "Mondi/Fazioni"),
        "questsFolder": folders.get("missione", "Mondi/Missioni"),
        "tablesFolder": folders.get("tabella", "Mondi/Tabelle"),
        "regionsFolder": folders.get("regno", "Mondi/Regni"),
    })


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
    cambia il layout di default (lo scegli tu in FS). I NOSTRI layout vendorizzati
    sono aggiornati per id (così le correzioni — es. nuove regole diceParsing —
    raggiungono i vault già esistenti); gli ALTRI layout dell'utente e la scelta
    del default restano intatti."""
    fs_dir = obsidian / "plugins" / "obsidian-5e-statblocks"
    if fs_dir.is_dir():
        fs_data = read_json(fs_dir / "data.json")
        if isinstance(fs_data, dict):
            layouts = fs_data.get("layouts") if isinstance(fs_data.get("layouts"), list) else []
            by_id = {l.get("id"): i for i, l in enumerate(layouts) if isinstance(l, dict)}
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
            # I NOSTRI layout vendorizzati sono AUTORITATIVI: se ne esiste già uno con
            # lo stesso id (build precedente), lo AGGIORNIAMO in posto — così le nuove
            # regole diceParsing raggiungono i vault esistenti; se è nuovo lo aggiungiamo.
            # La posizione nell'array e fs_data["default"] non cambiano (default intatto).
            src_layouts = load_statblock_layouts()
            for fs_layout in src_layouts:
                lid = fs_layout.get("id")
                if lid in by_id:
                    if layouts[by_id[lid]] != fs_layout:
                        layouts[by_id[lid]] = fs_layout
                        changed = True
                else:
                    by_id[lid] = len(layouts)
                    layouts.append(fs_layout)
                    changed = True
            # Backfill diceParsing sui layout SENZA quella chiave (es. un layout
            # 2024 legacy/dell'utente come "GDR — 5.5e (2024)"). FS rende i dadi con
            # `layout.diceParsing ?? regole_default`: un layout privo di diceParsing
            # ricade sulle regole DEFAULT, che sono in INGLESE («+N to hit») → in
            # italiano («+N, portata») il tiro PER COLPIRE non diventa cliccabile
            # (il danno «N (XdY)» sì, perché la regola di default lo riconosce).
            # Diamo a ogni layout privo di regole le NOSTRE (danno + tiro per colpire
            # italiani). Un diceParsing esplicitamente vuoto [] è rispettato.
            dice_rules = next((l.get("diceParsing") for l in src_layouts if l.get("diceParsing")), None)
            if dice_rules:
                for l in layouts:
                    if isinstance(l, dict) and "diceParsing" not in l:
                        l["diceParsing"] = [dict(r) for r in dice_rules]
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
                        ("Manuale.md", "📖 Manuale"),
                        *((f"{INDEX_DIR}/{p['file']}.md", p["title"]) for p in pages)]
    if (VAULT / "SRD" / "Indice.md").is_file():
        bookmark_targets.append(("SRD/Indice.md", "📚 SRD"))
    # Hub no-code trasversale (querabile per non-tecnici): filtra/ordina tutto il mondo.
    bookmark_targets.append((f"{INDEX_DIR}/Esplora.base", "🔎 Esplora il mondo"))
    bookmark_targets += [(f"{INDEX_DIR}/{p['file']}.base", f"{p['title']} · Base") for p in pages]
    bookmarks = read_json(obsidian / "bookmarks.json")
    bookmarks = bookmarks if isinstance(bookmarks, dict) else {}
    items = bookmarks.get("items") if isinstance(bookmarks.get("items"), list) else []
    # Auto-pulizia: togli i bookmark-file MORTI (target inesistente) — gli indici sono
    # migrati dalla radice a Indici/, e i bookmark vecchi alla radice (es. «Atlante.md»)
    # restavano come doppioni. Preserva i bookmark dell'utente a file VERI e i non-file
    # (cartelle/ricerche/heading). Gira dopo build+SRD: i target generati esistono già.
    before = len(items)
    items = [it for it in items if not (
        isinstance(it, dict) and it.get("type") == "file"
        and not (VAULT / str(it.get("path", ""))).is_file())]
    pruned = before - len(items)
    known = {it.get("path") for it in items if isinstance(it, dict)}
    added = 0
    for path, title in bookmark_targets:
        if path not in known:
            items.append({"type": "file", "path": path, "title": title})
            added += 1
    if added or pruned:
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
    # Azioni-import come COMANDI palette (oltre al bottone nel tab Mappa): l'utente le lancia
    # da Cmd+P anche su note vecchie o quando il tab Mappa è nell'overflow → "Templater: …
    # Importa mappa…". Data-driven: ogni button la cui azione inizia con "importa".
    import_hotkeys = [f"z.modelli/azioni/{b['label']}.md" for b in plugins.get("buttons", [])
                      if str(b.get("action", "")).startswith("importa")]
    merge_plugin_config(obsidian, "templater-obsidian", {
        "templates_folder": "z.modelli",
        "user_scripts_folder": "z.automazioni",
        "enabled_templates_hotkeys": import_hotkeys,
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
    write_hexmaker(obsidian, core)
    write_bookmarks(obsidian, pages)
    # Pulizia esploratore: nasconde le cartelle z.* + le esclude da ricerca/grafo.
    write_workspace_chrome(obsidian, plugins)
    # Default core consigliati (proprietà nascoste, plugin core) — config riproducibile.
    write_core_settings(obsidian)
    # Homepage: apre Home all'avvio (solo se non già configurato).
    write_homepage(obsidian)
