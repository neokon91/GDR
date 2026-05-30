#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path
from typing import Any

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

# Cattura gli id usati nei Jinja come field('id') / field("id").
FIELD_REF_RE = re.compile(r"""field\(\s*['"]([a-z0-9_]+)['"]""")

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "Dev" / "Source"
YAML_DIR = SOURCE / "YAML"
JINJA_DIR = SOURCE / "Jinja"
JS_DIR = SOURCE / "JS"
SAMPLES_DIR = SOURCE / "Samples"

# Unico target di output: il vault Obsidian vivo. Si apre questa cartella in
# Obsidian e si rilancia `build` per vedere i cambiamenti dal vivo. Il repo di
# sviluppo (ROOT) resta pulito: nessun artefatto generato fuori da qui.
VAULT = ROOT / "dist" / "GDR-vault"

# Sottocartelle interamente generate: sicure da azzerare a ogni build.
GENERATED_DIRS = ("z.modelli", "z.automazioni", "z.classi")

# Note generate alla radice del vault (non contenuti utente).
GENERATED_NOTES = ("Home.md", "LEGGIMI.md")


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


def load_pages() -> list[dict[str, Any]]:
    """Pagine-indice (hub per dominio). Assenti = lista vuota (opzionali)."""
    path = YAML_DIR / "pages.yaml"
    if not path.is_file():
        return []
    return (yaml.safe_load(path.read_text(encoding="utf-8")) or {}).get("pages", []) or []


def generated_note_names() -> list[str]:
    """Note generate alla radice: Home/LEGGIMI + una per ogni pagina-indice.
    Derivata da pages.yaml cosi' clean() le rimuove tutte senza nomi hard-coded."""
    return [*GENERATED_NOTES, *(f"{p['file']}.md" for p in load_pages())]


def clean() -> None:
    """Rimuove solo gli artefatti puramente generati (z.modelli, z.automazioni,
    z.classi, Home/LEGGIMI, pagine-indice). NON tocca .obsidian (config e plugin
    installati dall'utente) ne' i contenuti. Pulisce anche residui legacy in ROOT."""
    notes = generated_note_names()
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


def read_json(path: Path) -> Any:
    if path.is_file():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            return None
    return None


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


def template_folder(core: dict[str, Any], category: str) -> str:
    folders = core.get("folders", {})
    folder_key = (core.get("categories", {}).get(category) or {}).get("folder", category)
    return folders.get(folder_key) or folders.get(category) or "Inbox"


def creation_buttons(core: dict[str, Any], templates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Un bottone 'Crea <Titolo>' per ogni template, derivato da templates.yaml."""
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


def build() -> dict[str, str]:
    core = load_yaml("core.yaml")
    plugins = load_yaml("plugins.yaml")
    template_data = load_yaml("templates.yaml")
    templates = template_data.get("templates", [])
    actions = template_data.get("actions", [])

    payload = {
        "folders": core.get("folders", {}),
        "fields": core.get("fields", {}),
        "categories": core.get("categories", {}),
        "states": core.get("states", []),
        "creation": core.get("creation", {}),
        "templates": templates,
    }

    # YAML -> JSON che gli script JS leggono a runtime via app.vault.adapter.read.
    write_json(VAULT / "z.automazioni" / "data" / "core.json", payload)
    # Gli script Templater sono autonomi (niente require/bundling): copia 1:1.
    for source in sorted(JS_DIR.glob("*.js")):
        shutil.copy2(source, VAULT / "z.automazioni" / source.name)

    env = Environment(
        loader=FileSystemLoader(str(JINJA_DIR)),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )

    rendered: dict[str, str] = {}
    for template in templates:
        jinja = env.get_template(template["jinja"])
        text = jinja.render(core=core, plugins=plugins, template=template)
        write_text(VAULT / template["target"], text)
        rendered[template["target"]] = text

    action_template = env.get_template("action.md.j2")
    for action in actions:
        text = action_template.render(action=action)
        write_text(VAULT / action["target"], text)
        rendered[action["target"]] = text

    # Config .obsidian: merge non distruttivo. Le impostazioni e i plugin
    # installati dall'utente sono preservati; si aggiornano solo le chiavi che
    # la pipeline possiede (cartelle Templater, dataviewjs, pulsanti Meta Bind).
    obsidian = VAULT / ".obsidian"
    union_list(obsidian / "community-plugins.json", [p["id"] for p in plugins.get("plugins", [])])
    merge_plugin_config(obsidian, "templater-obsidian", {
        "templates_folder": "z.modelli",
        "user_scripts_folder": "z.automazioni",
    })
    merge_plugin_config(obsidian, "dataview", {"enableDataviewJs": True})
    merge_plugin_config(obsidian, "obsidian-meta-bind-plugin", meta_bind_config(plugins, core, templates))

    # Metadata Menu: uno fileClass per categoria (schema campi tipizzati).
    for category in core.get("categories", {}):
        write_text(VAULT / "z.classi" / f"{category}.md", fileclass_note(core, category))
    merge_plugin_config(obsidian, "metadata-menu", {"classFilesPath": "z.classi/"})

    # Iconize: icona (emoji) per cartella di categoria. Chiavi top-level
    # percorso->emoji nel data.json (emojiStyle native); 'settings' preservato.
    folders = core.get("folders", {})
    icons = {folders[key]: emoji for key, emoji in (plugins.get("folder_icons") or {}).items() if key in folders}
    if icons:
        merge_plugin_config(obsidian, "obsidian-icon-folder", icons)

    # Callout Manager: callout GDR custom (id/color/icon) in callouts.custom,
    # preservando settings/detection. Degradano a callout standard se assenti.
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

    pages = load_pages()
    for name, jinja_name in (("Home.md", "home.md.j2"), ("LEGGIMI.md", "leggimi.md.j2")):
        text = env.get_template(jinja_name).render(core=core, plugins=plugins, templates=templates, pages=pages)
        write_text(VAULT / name, text)
        rendered[name] = text

    # Pagine-indice per dominio (hub navigabili), una per voce di pages.yaml.
    index_template = env.get_template("index.md.j2")
    for page in pages:
        text = index_template.render(core=core, plugins=plugins, templates=templates, page=page)
        write_text(VAULT / f"{page['file']}.md", text)
        rendered[f"{page['file']}.md"] = text

    # Bookmarks (core): le poche pagine di riferimento a un clic. Non distruttivo:
    # aggiunge solo le voci mancanti, preservando i bookmark dell'utente.
    bookmark_targets = [("Home.md", "🏠 Home"), *((f"{p['file']}.md", p["title"]) for p in pages)]
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

    # Scaffolding delle cartelle contenuti (idempotente): mostra la struttura
    # senza mai sovrascrivere note esistenti.
    for folder in core.get("folders", {}).values():
        (VAULT / folder).mkdir(parents=True, exist_ok=True)

    return rendered


def seed_samples() -> int:
    """Copia i contenuti di esempio nel vault, senza sovrascrivere note gia'
    presenti (non distrugge il lavoro dell'utente)."""
    if not SAMPLES_DIR.exists():
        return 0
    copied = 0
    for sample in sorted(SAMPLES_DIR.rglob("*.md")):
        dest = VAULT / sample.relative_to(SAMPLES_DIR)
        if dest.exists():
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(sample, dest)
        copied += 1
    return copied


def check() -> int:
    errors: list[str] = []
    core = load_yaml("core.yaml")
    plugins = load_yaml("plugins.yaml")
    template_data = load_yaml("templates.yaml")
    categories = core.get("categories", {})
    folders = core.get("folders", {})
    fields = core.get("fields", {})
    metabind = plugins.get("metabind_inputs") or {}

    # Le categorie dei template devono essere dichiarate e avere una cartella
    # risolvibile (i bottoni 'Crea ...' creano la nota in quella cartella).
    for template in template_data.get("templates", []):
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


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera il vault Obsidian GDR in dist/GDR-vault da sorgenti YAML/Jinja/JS.")
    parser.add_argument("--clean", action="store_true", help="Rimuove solo gli artefatti generati (non i contenuti/plugin).")
    parser.add_argument("--check", action="store_true", help="Valida YAML/Jinja senza scrivere output.")
    parser.add_argument("--seed", action="store_true", help="Copia i contenuti di esempio (senza sovrascrivere note esistenti).")
    args = parser.parse_args()

    if args.clean:
        clean()
        print("Artefatti generati rimossi.")
        return 0
    if args.check:
        return check()

    first_run = not VAULT.exists()
    clean()
    rendered = build()
    seeded = seed_samples() if (args.seed or first_run) else 0

    rel = VAULT.relative_to(ROOT)
    print(f"Build OK: {len(rendered)} note generate, {len(list(JS_DIR.glob('*.js')))} JS runtime.")
    if seeded:
        print(f"Esempi copiati: {seeded}.")
    print(f"Vault: {rel}/  — apri questa cartella in Obsidian.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
