#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path
from typing import Any

# Cattura gli id usati nei Jinja come field('id') / field("id").
FIELD_REF_RE = re.compile(r"""field\(\s*['"]([a-z0-9_]+)['"]""")

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "Dev" / "Source"
YAML_DIR = SOURCE / "YAML"
JINJA_DIR = SOURCE / "Jinja"
JS_DIR = SOURCE / "JS"

# Cartelle interamente generate dal build: sicure da rimuovere per intero.
GENERATED_DIRS = [
    ROOT / "z.automazioni",
    ROOT / "z.modelli",
    ROOT / "Dev" / "Build",
    ROOT / "dist",
]

# File generati dentro .obsidian: la cartella contiene anche configurazione
# utente (temi, hotkey, snippet, dati di altri plugin), quindi si rimuovono
# solo i singoli file prodotti dal build, mai l'intera directory.
OBSIDIAN_GENERATED_FILES = [
    ROOT / ".obsidian" / "community-plugins.json",
    ROOT / ".obsidian" / "plugins" / "templater-obsidian" / "data.json",
    ROOT / ".obsidian" / "plugins" / "dataview" / "data.json",
    ROOT / ".obsidian" / "plugins" / "obsidian-meta-bind-plugin" / "data.json",
]


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


def clean() -> None:
    for path in GENERATED_DIRS:
        if path.is_dir():
            shutil.rmtree(path)
        elif path.exists():
            path.unlink()
    for path in OBSIDIAN_GENERATED_FILES:
        if path.exists():
            path.unlink()


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
        "templates": templates,
    }

    write_json(ROOT / "z.automazioni" / "data" / "core.json", payload)

    (ROOT / "z.automazioni").mkdir(parents=True, exist_ok=True)
    for source in sorted(JS_DIR.glob("*.js")):
        shutil.copy2(source, ROOT / "z.automazioni" / source.name)

    env = Environment(
        loader=FileSystemLoader(str(JINJA_DIR)),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
    )

    rendered: dict[str, str] = {}
    for template in templates:
        jinja = env.get_template(template["jinja"])
        target = ROOT / template["target"]
        text = jinja.render(core=core, plugins=plugins, template=template)
        write_text(target, text)
        rendered[str(target.relative_to(ROOT))] = text

    action_template = env.get_template("action.md.j2")
    for action in actions:
        target = ROOT / action["target"]
        text = action_template.render(action=action)
        write_text(target, text)
        rendered[str(target.relative_to(ROOT))] = text

    write_json(ROOT / ".obsidian" / "community-plugins.json", [p["id"] for p in plugins.get("plugins", [])])
    write_json(ROOT / ".obsidian" / "plugins" / "templater-obsidian" / "data.json", {
        "templates_folder": "z.modelli",
        "user_scripts_folder": "z.automazioni",
        "enable_folder_templates": False,
        "syntax_highlighting": True,
    })
    write_json(ROOT / ".obsidian" / "plugins" / "dataview" / "data.json", {
        "enableDataviewJs": True,
        "renderNullAs": "",
    })
    write_json(ROOT / ".obsidian" / "plugins" / "obsidian-meta-bind-plugin" / "data.json", meta_bind_config(plugins, core, templates))

    return rendered


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

    # Ogni widget non-text del registro deve avere un template Meta Bind.
    for field_id, spec in fields.items():
        widget = (spec or {}).get("widget")
        if widget and widget != "text" and widget not in metabind:
            errors.append(f"campo {field_id}: widget '{widget}' assente da metabind_inputs")

    # Ogni field('<id>') usato nei Jinja deve esistere nel registro core.fields.
    # I partial (_*.j2) definiscono le macro, non le usano: vanno esclusi.
    for path in sorted(JINJA_DIR.glob("*.j2")):
        if path.name.startswith("_"):
            continue
        for field_id in FIELD_REF_RE.findall(path.read_text(encoding="utf-8")):
            if field_id not in fields:
                errors.append(f"{path.name}: campo '{field_id}' non nel registro core.fields")

    if errors:
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Renderer minimo YAML/Jinja/JS per Obsidian.")
    parser.add_argument("--clean", action="store_true", help="Rimuove solo output generati.")
    parser.add_argument("--check", action="store_true", help="Valida YAML/Jinja senza scrivere output.")
    args = parser.parse_args()

    if args.clean:
        clean()
        print("Output generati rimossi.")
        return 0
    if args.check:
        return check()

    clean()
    rendered = build()
    print(f"Build OK: {len(rendered)} template, {len(list(JS_DIR.glob('*.js')))} JS runtime.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
