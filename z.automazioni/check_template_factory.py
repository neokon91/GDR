#!/usr/bin/env python3

from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined


ROOT = Path.cwd()
FACTORY = ROOT / "Dev" / "TemplateFactory"
MODULES = FACTORY / "modules"
JINJA = FACTORY / "jinja"
GENERATED = FACTORY / "examples" / "generated"
REQUIRED_MODULES = {
    "fields_core",
    "plugin_bindings",
    "template_blueprints",
    "sections",
    "callouts",
    "tabs",
    "dataview_blocks",
    "metabind_inputs",
    "metabind_buttons",
    "bases_views",
    "workflows",
}


def load_yaml(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path}: YAML root non e un oggetto")
    return data


def fail(message: str, errors: list[str]) -> None:
    errors.append(message)


def collect_field_names(fields_core: dict) -> set[str]:
    names: set[str] = set()
    for group in fields_core.get("fields", {}).values():
        if isinstance(group, list):
            for field in group:
                if isinstance(field, dict) and field.get("name"):
                    names.add(str(field["name"]))
    return names


def plugin_key(name: str, bindings: dict) -> str:
    aliases = bindings.get("aliases", {})
    return str(aliases.get(name, name))


def validate_modules(modules: dict[str, dict], errors: list[str]) -> None:
    missing = REQUIRED_MODULES - set(modules)
    for module in sorted(missing):
        fail(f"Modulo TemplateFactory mancante: {module}", errors)

    for module_id, data in modules.items():
        for key in ("id", "purpose", "version"):
            if key not in data:
                fail(f"{module_id}: chiave obbligatoria mancante {key}", errors)
        if data.get("id") != module_id:
            fail(f"{module_id}: id interno non allineato ({data.get('id')})", errors)


def validate_blueprints(modules: dict[str, dict], errors: list[str]) -> None:
    blueprints = modules["template_blueprints"].get("blueprints", {})
    sections = modules["sections"].get("sections", {})
    bindings = modules["plugin_bindings"]
    plugin_bindings = bindings.get("bindings", {})
    field_names = collect_field_names(modules["fields_core"])

    for name, blueprint in blueprints.items():
        template_ref = blueprint.get("jinja_template")
        if not template_ref:
            fail(f"blueprint {name}: jinja_template mancante", errors)
        else:
            template_path = (MODULES / template_ref).resolve()
            if not template_path.exists():
                fail(f"blueprint {name}: template Jinja mancante {template_ref}", errors)

        entry = str(blueprint.get("templater_entry", ""))
        if not re.fullmatch(r"<% await tp\.user\.[A-Za-z0-9_]+\(tp(?:, [^)]*)?\) %>", entry):
            fail(f"blueprint {name}: templater_entry non conforme ({entry})", errors)

        for required in blueprint.get("required_modules", []):
            if required not in modules:
                fail(f"blueprint {name}: required_module non esistente {required}", errors)

        for section in blueprint.get("sections", []):
            if section not in sections:
                fail(f"blueprint {name}: sezione non definita {section}", errors)

        for plugin in blueprint.get("plugin_features", []):
            key = plugin_key(str(plugin), bindings)
            if key not in plugin_bindings:
                fail(f"blueprint {name}: plugin_feature non definita {plugin}", errors)

    for section_id, section in sections.items():
        for field in section.get("fields", []) or []:
            if field not in field_names:
                fail(f"sections.{section_id}: campo non presente in fields_core ({field})", errors)
        if "fallback" not in section:
            fail(f"sections.{section_id}: fallback Markdown mancante", errors)


def validate_rendering(modules: dict[str, dict], errors: list[str]) -> None:
    env = Environment(
        loader=FileSystemLoader(str(JINJA)),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
    )

    for name, blueprint in modules["template_blueprints"].get("blueprints", {}).items():
        template_ref = Path(str(blueprint["jinja_template"])).name
        try:
            template = env.get_template(template_ref)
            rendered = template.render(
                templater_entry=blueprint.get("templater_entry", ""),
                templater_function=blueprint.get("templater_entry", "").split("tp.user.")[-1].split("(")[0],
                label=name.replace("_", " ").title(),
                monster="Creatura",
                modules=modules,
            )
        except Exception as exc:  # noqa: BLE001
            fail(f"blueprint {name}: render Jinja fallito ({exc})", errors)
            continue

        stripped = rendered.lstrip()
        if not stripped.startswith("<% await tp.user."):
            fail(f"blueprint {name}: output renderizzato senza entry Templater iniziale", errors)
        if "<%*" in rendered:
            fail(f"blueprint {name}: output renderizzato contiene blocco Templater multilinea", errors)
        templater_tags = re.findall(r"<%[\s\S]*?%>", rendered)
        if len(templater_tags) != 1:
            fail(f"blueprint {name}: output renderizzato contiene {len(templater_tags)} tag Templater invece di 1", errors)
        if "Fallback" not in rendered and "fallback" not in rendered:
            fail(f"blueprint {name}: output renderizzato senza fallback Markdown esplicito", errors)


def validate_generated_previews(modules: dict[str, dict], errors: list[str]) -> None:
    if not GENERATED.exists():
        return

    expected = {
        f"{name}.preview.md"
        for name in modules["template_blueprints"].get("blueprints", {})
    }
    actual = {path.name for path in GENERATED.glob("*.preview.md")}

    for missing in sorted(expected - actual):
        fail(f"preview TemplateFactory mancante: {missing}; eseguire npm run render:templates", errors)
    for extra in sorted(actual - expected):
        fail(f"preview TemplateFactory obsoleta: {extra}; eseguire npm run render:templates", errors)

    manifest = GENERATED / "manifest.json"
    if not manifest.exists():
        fail("manifest preview TemplateFactory mancante; eseguire npm run render:templates", errors)


def main() -> int:
    errors: list[str] = []
    modules: dict[str, dict] = {}

    for path in sorted(MODULES.glob("*.yaml")):
        try:
            data = load_yaml(path)
            module_id = str(data.get("id", path.stem))
            modules[module_id] = data
        except Exception as exc:  # noqa: BLE001
            fail(f"{path}: YAML non valido ({exc})", errors)

    if not errors:
        validate_modules(modules, errors)
    if not errors:
        validate_blueprints(modules, errors)
    if not errors:
        validate_rendering(modules, errors)
    if not errors:
        validate_generated_previews(modules, errors)

    if errors:
        print("Errori TemplateFactory:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"TemplateFactory OK: {len(modules)} moduli, {len(modules['template_blueprints']['blueprints'])} blueprint.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
