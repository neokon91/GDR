#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

import yaml

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[3]
RUNTIME_PROFILES = ROOT / "Dev" / "TemplateFactory" / "modules" / "runtime_profiles.yaml"
FIELDS_CORE = ROOT / "Dev" / "TemplateFactory" / "modules" / "fields_core.yaml"
ENTITY_MODEL = ROOT / "Dev" / "TemplateFactory" / "modules" / "entity_model.yaml"
RELEASE_BOUNDARY = ROOT / "Dev" / "TemplateFactory" / "modules" / "release_boundary.yaml"
RESOURCE_INDEXES = ROOT / "Dev" / "TemplateFactory" / "modules" / "resource_indexes.yaml"
RESOURCE_SUPPORT_PAGES = ROOT / "Dev" / "TemplateFactory" / "modules" / "resource_support_pages.yaml"
TEMPLATE_BLUEPRINTS = ROOT / "Dev" / "TemplateFactory" / "modules" / "template_blueprints.yaml"
TARGET = ROOT / "z.automazioni" / "data" / "runtime" / "session_context.json"


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def load_yaml(path: Path, errors: list[str]) -> dict[str, Any]:
    if not path.exists():
        fail(errors, f"{path.relative_to(ROOT)} mancante")
        return {}
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    if not isinstance(data, dict):
        fail(errors, f"{path.relative_to(ROOT)}: root YAML non valida")
        return {}
    return data


def field_catalog(fields_core: dict[str, Any]) -> dict[str, dict[str, Any]]:
    catalog: dict[str, dict[str, Any]] = {}
    for group in (fields_core.get("fields") or {}).values():
        if not isinstance(group, list):
            continue
        for field in group:
            if isinstance(field, dict) and field.get("name"):
                catalog[str(field["name"])] = field
    return catalog


def state_values(fields_core: dict[str, Any]) -> set[str]:
    for field in field_catalog(fields_core).values():
        if field.get("name") == "stato":
            return {str(value) for value in field.get("values") or []}
    return set()


def normalized_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def validate_non_empty_list(errors: list[str], data: dict[str, Any], key: str) -> list[str]:
    values = normalized_list(data.get(key))
    if not values:
        fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: runtime_contracts.session_context.{key} deve essere lista non vuota")
        return []
    if len(values) != len(set(values)):
        fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: runtime_contracts.session_context.{key} contiene duplicati")
    return values


def normalize_folder(value: Any) -> str:
    return str(value or "").replace("\\", "/").strip().rstrip("/")


def normalize_template_ref(value: Any) -> str:
    template = normalize_folder(value)
    return template[:-3] if template.endswith(".md") else template


def parent_folder(rel_path: Any) -> str:
    path = str(rel_path or "").replace("\\", "/").strip()
    if not path or "/" not in path:
        return ""
    return path.rsplit("/", 1)[0]


def declared_runtime_folders(
    release_boundary: dict[str, Any],
    resource_indexes: dict[str, Any],
    resource_support_pages: dict[str, Any],
) -> set[str]:
    folders: set[str] = set()

    for item in release_boundary.get("materialized_user_files") or []:
        if isinstance(item, dict):
            folder = parent_folder(item.get("path"))
            if folder:
                folders.add(folder)

    for module in (resource_indexes, resource_support_pages):
        for item in module.get("indexes") or module.get("pages") or []:
            if isinstance(item, dict):
                folder = parent_folder(item.get("path"))
                if folder:
                    folders.add(folder)

    return folders


def validate_path_registry(
    contracts: dict[str, Any],
    entity_model: dict[str, Any],
    release_boundary: dict[str, Any],
    resource_indexes: dict[str, Any],
    resource_support_pages: dict[str, Any],
    errors: list[str],
) -> dict[str, str]:
    path_contract = contracts.get("path_registry")
    if not isinstance(path_contract, dict) or not path_contract:
        fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: runtime_contracts.path_registry deve essere mappa non vuota")
        return {}

    paths = path_contract.get("paths")
    if not isinstance(paths, dict) or not paths:
        fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: runtime_contracts.path_registry.paths deve essere mappa non vuota")
        return {}

    categories = entity_model.get("categories") if isinstance(entity_model.get("categories"), dict) else {}
    known_folders = declared_runtime_folders(release_boundary, resource_indexes, resource_support_pages)
    registry: dict[str, str] = {}

    for key, spec in paths.items():
        key_text = str(key).strip()
        if key_text != str(key) or not key_text or any(char.isspace() for char in key_text):
            fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: path_registry.paths contiene key non valida ({key})")
            continue
        if not isinstance(spec, dict):
            fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: path_registry.paths.{key_text} deve essere mappa")
            continue

        folder = normalize_folder(spec.get("folder"))
        if not folder or folder.endswith(".md"):
            fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: path_registry.paths.{key_text}.folder non valido ({folder})")
            continue
        registry[key_text] = folder

        entity_category = str(spec.get("entity_category") or "").strip()
        if entity_category:
            category = categories.get(entity_category)
            if not isinstance(category, dict):
                fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: path_registry.paths.{key_text}.entity_category non dichiarata ({entity_category})")
                continue
            model_folder = normalize_folder(category.get("folder"))
            if folder != model_folder:
                fail(
                    errors,
                    f"{RUNTIME_PROFILES.relative_to(ROOT)}: path_registry.paths.{key_text}.folder "
                    f"non allineato a entity_model.{entity_category}.folder ({folder} != {model_folder})",
                )
        elif folder not in known_folders:
            fail(
                errors,
                f"{RUNTIME_PROFILES.relative_to(ROOT)}: path_registry.paths.{key_text}.folder "
                f"non dichiarato da release/resource contracts ({folder})",
            )

    return registry


def template_router_blueprint_routes(template_blueprints: dict[str, Any]) -> set[str]:
    routes: set[str] = set()
    route_pattern = re.compile(r"template_router\s*\(\s*tp\s*,\s*['\"]([^'\"]+)['\"]")
    blueprints = template_blueprints.get("blueprints")
    if not isinstance(blueprints, dict):
        return routes

    for spec in blueprints.values():
        if not isinstance(spec, dict):
            continue
        entry = str(spec.get("templater_entry") or "")
        match = route_pattern.search(entry)
        if match:
            routes.add(match.group(1).strip())
    return routes


def template_targets(template_blueprints: dict[str, Any]) -> set[str]:
    targets: set[str] = set()
    blueprints = template_blueprints.get("blueprints")
    if not isinstance(blueprints, dict):
        return targets

    for spec in blueprints.values():
        if not isinstance(spec, dict):
            continue

        for target in normalized_list(spec.get("comparison_targets")):
            targets.add(normalize_template_ref(target))

        output = spec.get("output")
        if not isinstance(output, dict):
            continue
        folder = normalize_folder(output.get("folder"))
        for filename in normalized_list(output.get("files")):
            targets.add(normalize_template_ref(f"{folder}/{filename}" if folder else filename))

    return targets


def require_text(errors: list[str], source: str, value: Any, key: str) -> str:
    text = str(value or "").strip()
    if not text:
        fail(errors, f"{source}: {key} mancante")
    return text


def validate_set_route(errors: list[str], source: str, value: Any, key: str) -> dict[str, str]:
    if value in (None, ""):
        return {}
    if not isinstance(value, dict):
        fail(errors, f"{source}: {key} deve essere mappa")
        return {}

    route: dict[str, str] = {}
    for route_key, route_value in value.items():
        key_text = str(route_key or "").strip()
        if not key_text or any(char.isspace() for char in key_text):
            fail(errors, f"{source}: {key} contiene chiave non valida ({route_key})")
            continue
        route[key_text] = "" if route_value is None else str(route_value).strip()
    return route


def validate_template_router(
    contracts: dict[str, Any],
    template_blueprints: dict[str, Any],
    errors: list[str],
) -> dict[str, Any]:
    source = f"{RUNTIME_PROFILES.relative_to(ROOT)}: runtime_contracts.template_router"
    router = contracts.get("template_router")
    if not isinstance(router, dict) or not router:
        fail(errors, f"{source} deve essere mappa non vuota")
        return {}

    declared_routes: set[str] = set()
    prompt_routes: list[dict[str, Any]] = []
    allowed_templates = template_targets(template_blueprints)
    expected_routes = template_router_blueprint_routes(template_blueprints)
    if not expected_routes:
        fail(errors, f"{TEMPLATE_BLUEPRINTS.relative_to(ROOT)}: nessuna route template_router dichiarata")

    raw_prompt_routes = router.get("prompt_routes")
    if not isinstance(raw_prompt_routes, list) or not raw_prompt_routes:
        fail(errors, f"{source}.prompt_routes deve essere lista non vuota")
        raw_prompt_routes = []

    for route_index, route in enumerate(raw_prompt_routes):
        if not isinstance(route, dict):
            fail(errors, f"{source}.prompt_routes[{route_index}] deve essere mappa")
            continue
        route_id = require_text(errors, source, route.get("id"), f"prompt_routes[{route_index}].id")
        if route_id in declared_routes:
            fail(errors, f"{source}: route duplicata ({route_id})")
        declared_routes.add(route_id)

        prompt = require_text(errors, source, route.get("prompt"), f"prompt_routes.{route_id}.prompt")
        raw_options = route.get("options")
        if not isinstance(raw_options, list) or not raw_options:
            fail(errors, f"{source}.prompt_routes.{route_id}.options deve essere lista non vuota")
            raw_options = []

        options: list[dict[str, Any]] = []
        option_ids: set[str] = set()
        for option_index, option in enumerate(raw_options):
            if not isinstance(option, dict):
                fail(errors, f"{source}.prompt_routes.{route_id}.options[{option_index}] deve essere mappa")
                continue
            label = require_text(errors, source, option.get("label"), f"prompt_routes.{route_id}.options[{option_index}].label")
            template = normalize_template_ref(option.get("template"))
            if not template:
                fail(errors, f"{source}.prompt_routes.{route_id}.options[{option_index}].template mancante")
            elif template not in allowed_templates:
                fail(errors, f"{source}.prompt_routes.{route_id}.options[{option_index}].template non dichiarato in template_blueprints ({template})")

            option_id = str(option.get("id") or "").strip()
            if option_id:
                if option_id in option_ids:
                    fail(errors, f"{source}.prompt_routes.{route_id}.options id duplicato ({option_id})")
                option_ids.add(option_id)

            normalized = {
                "label": label,
                "template": template,
            }
            if option_id:
                normalized["id"] = option_id
            set_route = validate_set_route(errors, source, option.get("set_route"), f"prompt_routes.{route_id}.options.{option_id or option_index}.set_route")
            if set_route:
                normalized["set_route"] = set_route
            options.append(normalized)

        prompt_routes.append({
            "id": route_id,
            "prompt": prompt,
            "options": options,
        })

    delegated_routes: list[dict[str, str]] = []
    raw_delegated_routes = router.get("delegated_routes") or []
    if not isinstance(raw_delegated_routes, list):
        fail(errors, f"{source}.delegated_routes deve essere lista")
        raw_delegated_routes = []
    for index, route in enumerate(raw_delegated_routes):
        if not isinstance(route, dict):
            fail(errors, f"{source}.delegated_routes[{index}] deve essere mappa")
            continue
        route_id = require_text(errors, source, route.get("id"), f"delegated_routes[{index}].id")
        handler = require_text(errors, source, route.get("handler"), f"delegated_routes.{route_id}.handler")
        if handler not in {"dm"}:
            fail(errors, f"{source}.delegated_routes.{route_id}.handler non supportato ({handler})")
        if route_id in declared_routes:
            fail(errors, f"{source}: route duplicata ({route_id})")
        declared_routes.add(route_id)
        delegated_routes.append({"id": route_id, "handler": handler})

    creative_routes = normalized_list(router.get("creative_routes"))
    if not creative_routes:
        fail(errors, f"{source}.creative_routes deve essere lista non vuota")
    for route_id in creative_routes:
        if route_id in declared_routes:
            fail(errors, f"{source}: route duplicata ({route_id})")
        declared_routes.add(route_id)

    if expected_routes:
        missing = sorted(expected_routes - declared_routes)
        extra = sorted(declared_routes - expected_routes)
        for route_id in missing:
            fail(errors, f"{source}: route usata da template_blueprints ma non dichiarata ({route_id})")
        for route_id in extra:
            fail(errors, f"{source}: route dichiarata senza blueprint router ({route_id})")

    return {
        "prompt_routes": prompt_routes,
        "delegated_routes": delegated_routes,
        "creative_routes": creative_routes,
    }


def validate_contract(
    runtime_profiles: dict[str, Any],
    fields_core: dict[str, Any],
    entity_model: dict[str, Any],
    release_boundary: dict[str, Any],
    resource_indexes: dict[str, Any],
    resource_support_pages: dict[str, Any],
    template_blueprints: dict[str, Any],
    errors: list[str],
) -> dict[str, Any]:
    contracts = runtime_profiles.get("runtime_contracts")
    if not isinstance(contracts, dict) or not contracts:
        fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: runtime_contracts deve essere mappa non vuota")
        return {}

    session_context = contracts.get("session_context")
    if not isinstance(session_context, dict) or not session_context:
        fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: runtime_contracts.session_context deve essere mappa non vuota")
        return {}

    active_states = validate_non_empty_list(errors, session_context, "active_states")
    play_states = validate_non_empty_list(errors, session_context, "play_states")
    closed_states = validate_non_empty_list(errors, session_context, "closed_states")
    link_fields = validate_non_empty_list(errors, session_context, "link_fields")
    path_registry = validate_path_registry(
        contracts,
        entity_model,
        release_boundary,
        resource_indexes,
        resource_support_pages,
        errors,
    )
    template_router = validate_template_router(contracts, template_blueprints, errors)

    allowed_states = state_values(fields_core)
    if not allowed_states:
        fail(errors, f"{FIELDS_CORE.relative_to(ROOT)}: campo stato senza valori")

    for key, states in {
        "active_states": active_states,
        "play_states": play_states,
        "closed_states": closed_states,
    }.items():
        for state in states:
            if state not in allowed_states:
                fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: {key} usa stato non dichiarato in fields_core.yaml ({state})")

    if not set(active_states).issubset(set(play_states)):
        fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: active_states deve essere sottoinsieme di play_states")
    if set(play_states) & set(closed_states):
        fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: play_states e closed_states non devono sovrapporsi")

    catalog = field_catalog(fields_core)
    for field in link_fields:
        field_def = catalog.get(field)
        if not field_def:
            fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: link_fields usa campo non dichiarato in fields_core.yaml ({field})")
            continue
        field_type = str(field_def.get("type") or "")
        if "link" not in field_type:
            fail(errors, f"{RUNTIME_PROFILES.relative_to(ROOT)}: link_fields.{field} non e campo link ({field_type})")

    return {
        "active_states": active_states,
        "play_states": play_states,
        "closed_states": closed_states,
        "link_fields": link_fields,
        "path_registry": path_registry,
        "template_router": template_router,
    }


def json_text(contract: dict[str, Any]) -> str:
    return json.dumps(contract, ensure_ascii=False, indent=2) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera il contratto runtime per il core sessione.")
    parser.add_argument("--check", action="store_true", help="Verifica senza scrivere.")
    args = parser.parse_args()

    errors: list[str] = []
    runtime_profiles = load_yaml(RUNTIME_PROFILES, errors)
    fields_core = load_yaml(FIELDS_CORE, errors)
    entity_model = load_yaml(ENTITY_MODEL, errors)
    release_boundary = load_yaml(RELEASE_BOUNDARY, errors)
    resource_indexes = load_yaml(RESOURCE_INDEXES, errors)
    resource_support_pages = load_yaml(RESOURCE_SUPPORT_PAGES, errors)
    template_blueprints = load_yaml(TEMPLATE_BLUEPRINTS, errors)
    contract = validate_contract(
        runtime_profiles,
        fields_core,
        entity_model,
        release_boundary,
        resource_indexes,
        resource_support_pages,
        template_blueprints,
        errors,
    )

    if not errors:
        expected = json_text(contract)
        if args.check:
            current = TARGET.read_text(encoding="utf-8") if TARGET.exists() else ""
            if current != expected:
                fail(errors, f"{TARGET.relative_to(ROOT)} non allineato a {RUNTIME_PROFILES.relative_to(ROOT)}")
        else:
            TARGET.parent.mkdir(parents=True, exist_ok=True)
            TARGET.write_text(expected, encoding="utf-8")

    if errors:
        print("Session context contract non valido:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(
        "Session context contract OK: "
        f"{len(contract['active_states'])} stati attivi, "
        f"{len(contract['play_states'])} stati gioco, "
        f"{len(contract['closed_states'])} stati chiusi, "
        f"{len(contract['link_fields'])} campi link, "
        f"{len(contract['path_registry'])} percorsi runtime, "
        f"{len(contract['template_router']['prompt_routes']) + len(contract['template_router']['delegated_routes']) + len(contract['template_router']['creative_routes'])} route template."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
