from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined


ROOT = Path.cwd()
DEV = ROOT / "Dev"
SOURCE = DEV / "Source"
YAML_ROOT = SOURCE / "YAML"
MODULES = YAML_ROOT
JINJA = SOURCE / "Jinja"
ASSETS = SOURCE / "Assets"
EXAMPLES = DEV / "Examples"
GENERATED = DEV / "Build" / "template-previews"


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path}: YAML root non e un oggetto")
    return data


def load_modules() -> dict[str, dict[str, Any]]:
    modules: dict[str, dict[str, Any]] = {}
    for path in sorted(YAML_ROOT.glob("**/*.yaml")):
        data = load_yaml(path)
        module_id = str(data.get("id", path.stem))
        if module_id in modules:
            raise ValueError(f"{display_path(path)}: modulo YAML duplicato ({module_id})")
        modules[module_id] = data
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


def collect_field_names(fields_core: dict[str, Any]) -> set[str]:
    names: set[str] = set()
    for group in fields_core.get("fields", {}).values():
        if isinstance(group, list):
            for field in group:
                if isinstance(field, dict) and field.get("name"):
                    names.add(str(field["name"]))
    return names


def plugin_key(name: str, bindings: dict[str, Any]) -> str:
    return str(name)


def known_frontmatter_fields(modules: dict[str, dict[str, Any]]) -> set[str]:
    """Raccoglie i campi frontmatter ammessi da core, plugin e catalogo di dominio."""
    frontmatter = modules["frontmatter_profiles"]
    field_names = collect_field_names(modules["fields_core"])
    plugin_fields = {
        field
        for binding in modules["plugin_bindings"].get("bindings", {}).values()
        for field in binding.get("fields", []) or []
    }
    declared_plugin_fields = {
        field
        for fields in frontmatter.get("field_catalog", {}).get("plugin_fields", {}).values()
        for field in fields or []
    }
    domain_fields = set(frontmatter.get("field_catalog", {}).get("domain_fields", []) or [])
    return field_names | plugin_fields | declared_plugin_fields | domain_fields


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
    errors.extend(validate_tabs_blocks(name, rendered))
    errors.extend(validate_plugin_native_sheet(name, rendered))

    return errors


def validate_tabs_blocks(name: str, rendered: str) -> list[str]:
    """Controlla le tabs renderizzate: devono essere chiuse, leggibili e non vuote."""
    errors: list[str] = []
    lines = rendered.splitlines()
    index = 0

    while index < len(lines):
        line = lines[index]
        if line.strip() != "````tabs":
            index += 1
            continue

        start_line = index + 1
        index += 1
        block_lines: list[str] = []
        closed = False

        while index < len(lines):
            if lines[index].strip() == "````":
                closed = True
                break
            block_lines.append(lines[index])
            index += 1

        if not closed:
            errors.append(f"{name}: blocco tabs aperto a riga {start_line} non chiuso")
            break

        errors.extend(validate_single_tabs_block(name, start_line, block_lines))
        index += 1

    return errors


def validate_single_tabs_block(name: str, start_line: int, block_lines: list[str]) -> list[str]:
    """Valida un singolo blocco tabs senza interpretare il Markdown interno alle tab."""
    errors: list[str] = []
    tab_positions = [
        (offset, line.removeprefix("tab:").strip())
        for offset, line in enumerate(block_lines)
        if line.startswith("tab:")
    ]

    if not tab_positions:
        errors.append(f"{name}: blocco tabs a riga {start_line} senza tab dichiarate")
        return errors

    first_tab_offset = tab_positions[0][0]
    preamble = "\n".join(block_lines[:first_tab_offset]).strip()
    if preamble:
        errors.append(f"{name}: blocco tabs a riga {start_line} contiene testo prima della prima tab")

    seen: set[str] = set()
    for index, (offset, tab_name) in enumerate(tab_positions):
        if not tab_name:
            errors.append(f"{name}: tab senza nome nel blocco a riga {start_line}")
            continue
        if tab_name in seen:
            errors.append(f"{name}: tab duplicata nel blocco a riga {start_line} ({tab_name})")
        seen.add(tab_name)

        next_offset = tab_positions[index + 1][0] if index + 1 < len(tab_positions) else len(block_lines)
        body = "\n".join(block_lines[offset + 1:next_offset]).strip()
        if not body:
            errors.append(f"{name}: tab vuota nel blocco a riga {start_line} ({tab_name})")
        if "````tabs" in body:
            errors.append(f"{name}: tab annidata con quattro backtick nel blocco a riga {start_line} ({tab_name})")

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
        required_tabs = ("Prepara", "Ancore", "Tavolo", "Live", "Dopo")
        for tab in required_tabs:
            if f"tab: {tab}" not in rendered:
                errors.append(f"{name}: tab sessione giocabile mancante ({tab})")

        tab_chunks = re.split(r"(?m)^tab: ", rendered)
        for chunk in tab_chunks[1:]:
            tab_name, _, body = chunk.partition("\n")
            if not any(marker in body for marker in dynamic_markers) and "[[z.bases/" not in body:
                errors.append(f"{name}: tab senza funzione plugin reale ({tab_name.strip()})")

        required_runtime_views = (
            "renderPlayableOutline",
            "renderSessionAnchorCards",
            "renderSessionMaterialCards",
            "renderSessionLiveCards",
            "renderSessionPostCards",
        )
        for view in required_runtime_views:
            if view not in rendered:
                errors.append(f"{name}: vista DataviewJS giocabile mancante ({view})")

        required_plugins = ("```tasks", "[[z.bases/", "dice: 1d20")
        for marker in required_plugins:
            if marker not in rendered:
                errors.append(f"{name}: integrazione plugin giocabile mancante ({marker})")

    family_contracts = [
        (
            "luogo",
            name == "luogo" or name == "live_luogo" or name.startswith(("luogo_", "geografia_", "politica_")),
            "Territorio",
            ("renderPlayabilityFamilyCards", '"luogo"', "luogo_padre", "autorita"),
        ),
        (
            "fazione",
            name == "fazione" or name.startswith("fazione_") or name == "religione_culto",
            "Potere",
            ("renderPlayabilityFamilyCards", '"fazione"', "INPUT[pressione]", "luoghi_controllati"),
        ),
        (
            "png",
            name in {"png", "pg", "live_png", "personaggio_divinita"},
            "PNG",
            ("renderPlayabilityFamilyCards", '"png"', "motivazione", "segreti_rivelati"),
        ),
        (
            "relazione",
            name == "relazione",
            "Legame",
            ("renderPlayabilityFamilyCards", '"relazione"', "stato_relazione", "rottura", "rinforzo"),
        ),
        (
            "tracciato",
            name == "tracciato",
            "Clock",
            ("renderPlayabilityFamilyCards", '"tracciato"', "```tasks", "BUTTON[avanza-clock]"),
        ),
        (
            "continuita",
            name in {"conseguenza", "evento_storico"},
            "Continuita",
            ("renderPlayabilityFamilyCards", '"continuita"', "aggiornamenti_richiesti", "propagazione_stato"),
        ),
    ]

    for family, applies, tab, markers in family_contracts:
        if not applies:
            continue
        if f"tab: {tab}" not in rendered:
            errors.append(f"{name}: tab scheda giocabile {family} mancante ({tab})")
        for marker in markers:
            if marker not in rendered:
                errors.append(f"{name}: marker scheda giocabile {family} mancante ({marker})")

    return errors
