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

    if name == "pg":
        schema = modules.get("pg_mechanics_schema", {})
        defaults = schema.get("render_defaults", {})
        if isinstance(defaults, dict):
            for key, value in defaults.items():
                context.setdefault(key, value)

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
    errors.extend(validate_plugin_native_sheet(name, rendered))

    return errors


def validate_plugin_native_sheet(name: str, rendered: str) -> list[str]:
    errors: list[str] = []
    is_long_sheet = len(rendered) > 1600 and not name.startswith(("azione_", "router_"))
    dynamic_markers = ("INPUT[", "BUTTON[", "```dataview", "```dataviewjs", "```tasks", "```meta-bind")

    if is_long_sheet:
        if "````tabs" not in rendered:
            errors.append(f"{name}: scheda lunga senza Tabs")
        if "> [!" not in rendered:
            errors.append(f"{name}: scheda lunga senza callout funzionali")
        if not any(marker in rendered for marker in dynamic_markers):
            errors.append(f"{name}: scheda lunga senza blocchi dinamici o controlli plugin")
        if "## Fallback Markdown" not in rendered:
            errors.append(f"{name}: scheda lunga senza fallback Markdown strutturato")

        callout_headers = list(re.finditer(r"(?m)^> \[![^\]]+\].*$", rendered))
        for index, match in enumerate(callout_headers):
            start = match.end()
            end = callout_headers[index + 1].start() if index + 1 < len(callout_headers) else len(rendered)
            body = rendered[start:end]
            has_body = any(
                line.startswith(">") and line[1:].strip()
                for line in body.splitlines()
            )
            if not has_body:
                errors.append(f"{name}: callout vuoto ({match.group(0).strip()})")

    if name == "session":
        required_tabs = ("Prepara", "Ancore", "Tavolo", "Mappa", "Live", "Dopo")
        for tab in required_tabs:
            if f"tab: {tab}" not in rendered:
                errors.append(f"{name}: tab M7 mancante ({tab})")

        tab_chunks = re.split(r"(?m)^tab: ", rendered)
        for chunk in tab_chunks[1:]:
            tab_name, _, body = chunk.partition("\n")
            if not any(marker in body for marker in dynamic_markers) and not any(
                link in body for link in ("[[z.bases/", ".excalidraw", "Canvas")
            ):
                errors.append(f"{name}: tab senza funzione plugin reale ({tab_name.strip()})")

        required_runtime_views = (
            "renderPlayableOutline",
            "renderSessionAnchorCards",
            "renderSessionMaterialCards",
            "renderSessionMapCards",
            "renderSessionLiveCards",
            "renderSessionPostCards",
        )
        for view in required_runtime_views:
            if view not in rendered:
                errors.append(f"{name}: vista DataviewJS M7 mancante ({view})")

        required_plugins = ("```tasks", "[[z.bases/", "Atlante Mappe.base", ".excalidraw", "Canvas", "dice: 1d20")
        for marker in required_plugins:
            if marker not in rendered:
                errors.append(f"{name}: integrazione plugin M7 mancante ({marker})")

    family_contracts = [
        (
            "luogo",
            name == "luogo" or name == "live_luogo" or name.startswith(("luogo_", "geografia_", "politica_")),
            "Territorio",
            ("renderM7FamilyCards", '"luogo"', "Atlante Mappe.base", ".excalidraw", "Canvas"),
        ),
        (
            "fazione",
            name == "fazione" or name.startswith("fazione_") or name == "religione_culto",
            "Potere",
            ("renderM7FamilyCards", '"fazione"', "INPUT[pressione]", "luoghi_controllati"),
        ),
        (
            "png",
            name in {"png", "pg", "live_png", "personaggio_divinita"},
            "PNG",
            ("renderM7FamilyCards", '"png"', "motivazione", "segreti_rivelati"),
        ),
        (
            "relazione",
            name == "relazione",
            "Legame",
            ("renderM7FamilyCards", '"relazione"', "stato_relazione", "rottura", "rinforzo"),
        ),
        (
            "tracciato",
            name == "tracciato",
            "Clock",
            ("renderM7FamilyCards", '"tracciato"', "```tasks", "BUTTON[avanza-clock]"),
        ),
        (
            "continuita",
            name in {"conseguenza", "evento_storico", "wizard_conseguenza"},
            "Continuita",
            ("renderM7FamilyCards", '"continuita"', "aggiornamenti_richiesti", "propagazione_stato"),
        ),
    ]

    for family, applies, tab, markers in family_contracts:
        if not applies:
            continue
        if f"tab: {tab}" not in rendered:
            errors.append(f"{name}: tab M7 {family} mancante ({tab})")
        for marker in markers:
            if marker not in rendered:
                errors.append(f"{name}: marker M7 {family} mancante ({marker})")

    return errors
