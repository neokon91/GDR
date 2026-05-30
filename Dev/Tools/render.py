#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path
from typing import Any

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "Dev" / "Source"
YAML_DIR = SOURCE / "YAML"
JINJA_DIR = SOURCE / "Jinja"
JS_DIR = SOURCE / "JS"

GENERATED = [
    ROOT / ".obsidian",
    ROOT / "z.automazioni",
    ROOT / "z.modelli",
    ROOT / "Dev" / "Build",
    ROOT / "dist",
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
    for path in GENERATED:
        if path.exists():
            if path.is_dir():
                shutil.rmtree(path)
            else:
                path.unlink()


def meta_bind_config(plugins: dict[str, Any]) -> dict[str, Any]:
    buttons = []
    for button in plugins.get("buttons", []):
        if "template" in button:
            buttons.append({
                "id": button["id"],
                "label": button["label"],
                "style": "primary",
                "actions": [{
                    "type": "templaterCreateNote",
                    "templateFile": button["template"],
                    "folderPath": button["folder"],
                    "openNote": True,
                }],
            })
        else:
            target = f"z.modelli/azioni/{button['label']}.md"
            buttons.append({
                "id": button["id"],
                "label": button["label"],
                "style": "destructive" if button["id"] == "archivia-nota" else "primary",
                "actions": [{"type": "runTemplaterFile", "templateFile": target}],
            })

    return {
        "enableJs": True,
        "inputFieldTemplates": [
            {"name": name, "declaration": declaration}
            for name, declaration in sorted((plugins.get("metabind_inputs") or {}).items())
        ],
        "buttonTemplates": buttons,
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
    write_json(ROOT / ".obsidian" / "plugins" / "obsidian-meta-bind-plugin" / "data.json", meta_bind_config(plugins))

    return rendered


def check() -> int:
    errors: list[str] = []
    core = load_yaml("core.yaml")
    template_data = load_yaml("templates.yaml")
    categories = core.get("categories", {})

    for template in template_data.get("templates", []):
        if template.get("category") not in categories and template.get("category") not in {"personaggio", "creatura", "incontro", "oggetto", "regola", "sessione", "nota"}:
            errors.append(f"{template.get('id')}: categoria non dichiarata ({template.get('category')})")
        if not (JINJA_DIR / str(template.get("jinja", ""))).exists():
            errors.append(f"{template.get('id')}: Jinja mancante ({template.get('jinja')})")

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
