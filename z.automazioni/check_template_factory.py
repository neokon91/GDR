#!/usr/bin/env python3

from __future__ import annotations

import sys
import re
from pathlib import Path

from template_factory_utils import (
    FACTORY,
    MODULES,
    build_jinja_env,
    load_modules,
    render_context,
    resolved_blueprints,
    validate_rendered,
)


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
    try:
        blueprints = resolved_blueprints(modules)
    except ValueError as exc:
        fail(str(exc), errors)
        return
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

        output = blueprint.get("output", {})
        if not output.get("folder"):
            fail(f"blueprint {name}: output.folder mancante", errors)
        if not output.get("files"):
            fail(f"blueprint {name}: output.files mancante", errors)

    for section_id, section in sections.items():
        for field in section.get("fields", []) or []:
            if field not in field_names:
                fail(f"sections.{section_id}: campo non presente in fields_core ({field})", errors)
        if "fallback" not in section:
            fail(f"sections.{section_id}: fallback Markdown mancante", errors)


def validate_rendering(modules: dict[str, dict], errors: list[str]) -> None:
    env = build_jinja_env()

    for name, blueprint in resolved_blueprints(modules).items():
        template_ref = Path(str(blueprint["jinja_template"])).name
        try:
            template = env.get_template(template_ref)
            rendered = template.render(**render_context(name, blueprint, modules))
        except Exception as exc:  # noqa: BLE001
            fail(f"blueprint {name}: render Jinja fallito ({exc})", errors)
            continue

        for error in validate_rendered(name, rendered):
            fail(f"blueprint {error}", errors)


def validate_generated_previews(modules: dict[str, dict], errors: list[str]) -> None:
    if not GENERATED.exists():
        return

    expected = {
        f"{name}.preview.md"
        for name in resolved_blueprints(modules)
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
    try:
        modules = load_modules()
    except Exception as exc:  # noqa: BLE001
        fail(f"TemplateFactory YAML non valido ({exc})", errors)
        modules = {}

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
