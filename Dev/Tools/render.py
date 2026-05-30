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
GENERATED_DIRS = ("z.modelli", "z.automazioni")

# File generati dentro .obsidian: la cartella ospita anche config utente e i
# plugin installati, quindi si toccano solo questi file, mai il resto.
OBSIDIAN_GENERATED = (
    ".obsidian/community-plugins.json",
    ".obsidian/plugins/templater-obsidian/data.json",
    ".obsidian/plugins/dataview/data.json",
    ".obsidian/plugins/obsidian-meta-bind-plugin/data.json",
)

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


def clean() -> None:
    """Rimuove solo gli artefatti generati. Non tocca i contenuti utente, i
    plugin installati o la config di Obsidian. Ripulisce sia il vault sia
    eventuali residui legacy nel repo di sviluppo (ROOT)."""
    for base in (VAULT, ROOT):
        for name in GENERATED_DIRS:
            path = base / name
            if path.is_dir():
                shutil.rmtree(path)
        for rel in OBSIDIAN_GENERATED + GENERATED_NOTES:
            path = base / rel
            if path.is_file():
                path.unlink()
    legacy_build = ROOT / "Dev" / "Build"
    if legacy_build.is_dir():
        shutil.rmtree(legacy_build)


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

    write_json(VAULT / "z.automazioni" / "data" / "core.json", payload)

    # I sorgenti JS restano gestiti in Dev/Source/JS e vengono copiati nel vault.
    for source in sorted(JS_DIR.glob("*.js")):
        shutil.copy2(source, VAULT / "z.automazioni" / source.name)

    env = Environment(
        loader=FileSystemLoader(str(JINJA_DIR)),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
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

    write_json(VAULT / ".obsidian" / "community-plugins.json", [p["id"] for p in plugins.get("plugins", [])])
    write_json(VAULT / ".obsidian" / "plugins" / "templater-obsidian" / "data.json", {
        "templates_folder": "z.modelli",
        "user_scripts_folder": "z.automazioni",
        "enable_folder_templates": False,
        "syntax_highlighting": True,
    })
    write_json(VAULT / ".obsidian" / "plugins" / "dataview" / "data.json", {
        "enableDataviewJs": True,
        "renderNullAs": "",
    })
    write_json(VAULT / ".obsidian" / "plugins" / "obsidian-meta-bind-plugin" / "data.json", meta_bind_config(plugins, core, templates))

    for name, jinja_name in (("Home.md", "home.md.j2"), ("LEGGIMI.md", "leggimi.md.j2")):
        text = env.get_template(jinja_name).render(core=core, plugins=plugins, templates=templates)
        write_text(VAULT / name, text)
        rendered[name] = text

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
