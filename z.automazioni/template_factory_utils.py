from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined


ROOT = Path.cwd()
FACTORY = ROOT / "Dev" / "TemplateFactory"
MODULES = FACTORY / "modules"
JINJA = FACTORY / "jinja"
EXAMPLES = FACTORY / "examples"
GENERATED = EXAMPLES / "generated"


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path}: YAML root non e un oggetto")
    return data


def load_modules() -> dict[str, dict[str, Any]]:
    modules: dict[str, dict[str, Any]] = {}
    for path in sorted(MODULES.glob("*.yaml")):
        data = load_yaml(path)
        modules[str(data.get("id", path.stem))] = data
    return modules


def build_jinja_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(JINJA)),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
    )


def display_path(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def templater_function(entry: str) -> str:
    match = re.search(r"tp\.user\.([A-Za-z0-9_]+)\(", entry)
    return match.group(1) if match else "world_entity"


def load_context(name: str) -> dict[str, Any]:
    path = EXAMPLES / f"{name}.context.yaml"
    return load_yaml(path) if path.exists() else {}


def resolved_blueprints(modules: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
    template_blueprints = modules["template_blueprints"]
    profiles = template_blueprints.get("blueprint_profiles", {})
    resolved: dict[str, dict[str, Any]] = {}

    for name, blueprint in template_blueprints.get("blueprints", {}).items():
        profile_name = blueprint.get("profile")
        profile = profiles.get(profile_name, {}) if profile_name else {}
        if profile_name and not profile:
            raise ValueError(f"blueprint {name}: profilo non definito {profile_name}")
        resolved[name] = {**profile, **blueprint}

    return resolved


def render_context(name: str, blueprint: dict[str, Any], modules: dict[str, dict[str, Any]]) -> dict[str, Any]:
    entry = str(blueprint.get("templater_entry", ""))
    context = {
        "blueprint_id": name,
        "blueprint": blueprint,
        "templater_entry": entry,
        "templater_function": templater_function(entry),
        "label": name.replace("_", " ").title(),
        "monster": "Creatura",
        "modules": modules,
    }
    context.update(load_context(name))
    return context


def validate_rendered(name: str, rendered: str) -> list[str]:
    errors: list[str] = []
    stripped = rendered.lstrip()
    templater_tags = re.findall(r"<%[\s\S]*?%>", rendered)

    if not stripped.startswith("<% await tp.user."):
        errors.append(f"{name}: output senza entry Templater iniziale")
    if "<%*" in rendered:
        errors.append(f"{name}: output contiene blocco Templater multilinea")
    if len(templater_tags) != 1:
        errors.append(f"{name}: output contiene {len(templater_tags)} tag Templater invece di 1")
    if "Fallback" not in rendered and "fallback" not in rendered:
        errors.append(f"{name}: output senza fallback Markdown esplicito")

    return errors
