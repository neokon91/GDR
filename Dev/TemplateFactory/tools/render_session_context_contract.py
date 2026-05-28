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


def blueprint_route_options(template_blueprints: dict[str, Any], helper_name: str) -> list[dict[str, str]]:
    routes: list[dict[str, str]] = []
    entry_pattern = re.compile(rf"tp\.user\.{re.escape(helper_name)}\s*\(\s*tp\s*,\s*\{{([^}}]*)\}}\s*\)")
    pair_pattern = re.compile(r"([A-Za-z_][A-Za-z0-9_]*)\s*:\s*['\"]([^'\"]+)['\"]")
    blueprints = template_blueprints.get("blueprints")
    if not isinstance(blueprints, dict):
        return routes

    for spec in blueprints.values():
        if not isinstance(spec, dict):
            continue
        entry = str(spec.get("templater_entry") or "")
        match = entry_pattern.search(entry)
        if not match:
            continue
        route = {
            key: value.strip()
            for key, value in pair_pattern.findall(match.group(1))
            if value.strip()
        }
        if route:
            routes.append(route)
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


def validate_condition_map(errors: list[str], source: str, value: Any, key: str) -> dict[str, str]:
    allowed_fields = {"kind", "family", "folder", "category", "subtype", "frontmatterCategory"}
    if value in (None, ""):
        return {}
    if not isinstance(value, dict):
        fail(errors, f"{source}: {key} deve essere mappa")
        return {}

    result: dict[str, str] = {}
    for field, raw in value.items():
        field_id = str(field or "").strip()
        if field_id not in allowed_fields:
            fail(errors, f"{source}: {key} usa campo route non supportato ({field_id})")
            continue
        text = str(raw or "").strip()
        if not text:
            fail(errors, f"{source}: {key}.{field_id} mancante")
            continue
        result[field_id] = text
    return result


def condition_satisfied(route: dict[str, str], conditions: dict[str, str], mode: str) -> bool:
    for key, expected in conditions.items():
        value = str(route.get(key, ""))
        target = str(expected)
        if mode == "contains":
            if target not in value:
                return False
        elif value != target:
            return False
    return True


def rule_reachable(rule: dict[str, Any], routes: list[dict[str, str]]) -> bool:
    for route in routes:
        if "match" in rule and not condition_satisfied(route, rule["match"], "match"):
            continue
        if "contains" in rule and not condition_satisfied(route, rule["contains"], "contains"):
            continue
        return True
    return False


def validate_world_taxonomy(
    contracts: dict[str, Any],
    template_blueprints: dict[str, Any],
    path_registry: dict[str, str],
    entity_model: dict[str, Any],
    template_router: dict[str, Any],
    errors: list[str],
) -> dict[str, Any]:
    source = f"{RUNTIME_PROFILES.relative_to(ROOT)}: runtime_contracts.world_taxonomy"
    taxonomy = contracts.get("world_taxonomy")
    if not isinstance(taxonomy, dict) or not taxonomy:
        fail(errors, f"{source} deve essere mappa non vuota")
        return {}

    raw_kinds = taxonomy.get("kinds")
    if not isinstance(raw_kinds, dict) or not raw_kinds:
        fail(errors, f"{source}.kinds deve essere mappa non vuota")
        raw_kinds = {}

    creative_routes = set(template_router.get("creative_routes") or [])
    declared_kinds = {str(kind).strip() for kind in raw_kinds}
    for missing in sorted(creative_routes - declared_kinds):
        fail(errors, f"{source}.kinds non copre creative_route ({missing})")
    for extra in sorted(declared_kinds - creative_routes):
        fail(errors, f"{source}.kinds dichiara kind non usato dal router ({extra})")

    categories = entity_model.get("categories") if isinstance(entity_model.get("categories"), dict) else {}
    kinds: dict[str, Any] = {}
    taxonomy_routes: dict[str, list[dict[str, str]]] = {}
    for kind_id, kind in raw_kinds.items():
        kind_key = str(kind_id or "").strip()
        if not kind_key or any(char.isspace() for char in kind_key):
            fail(errors, f"{source}.kinds contiene key non valida ({kind_id})")
            continue
        if not isinstance(kind, dict):
            fail(errors, f"{source}.kinds.{kind_key} deve essere mappa")
            continue

        label = require_text(errors, source, kind.get("label"), f"kinds.{kind_key}.label")
        default_folder = require_text(errors, source, kind.get("default_folder"), f"kinds.{kind_key}.default_folder")
        if default_folder and default_folder not in path_registry:
            fail(errors, f"{source}.kinds.{kind_key}.default_folder non dichiarato in path_registry ({default_folder})")

        raw_families = kind.get("families")
        if not isinstance(raw_families, list) or not raw_families:
            fail(errors, f"{source}.kinds.{kind_key}.families deve essere lista non vuota")
            raw_families = []

        families: list[dict[str, Any]] = []
        family_ids: set[str] = set()
        for family_index, family in enumerate(raw_families):
            if not isinstance(family, dict):
                fail(errors, f"{source}.kinds.{kind_key}.families[{family_index}] deve essere mappa")
                continue
            family_id = require_text(errors, source, family.get("id"), f"kinds.{kind_key}.families[{family_index}].id")
            if family_id in family_ids:
                fail(errors, f"{source}.kinds.{kind_key}.families id duplicato ({family_id})")
            family_ids.add(family_id)
            family_label = require_text(errors, source, family.get("label"), f"kinds.{kind_key}.families.{family_id}.label")
            folder = require_text(errors, source, family.get("folder"), f"kinds.{kind_key}.families.{family_id}.folder")
            if folder and folder not in path_registry:
                fail(errors, f"{source}.kinds.{kind_key}.families.{family_id}.folder non dichiarato in path_registry ({folder})")
            category = require_text(errors, source, family.get("category"), f"kinds.{kind_key}.families.{family_id}.category")
            if category and category not in categories:
                fail(errors, f"{source}.kinds.{kind_key}.families.{family_id}.category non dichiarata in entity_model ({category})")

            raw_items = family.get("items")
            if not isinstance(raw_items, list) or not raw_items:
                fail(errors, f"{source}.kinds.{kind_key}.families.{family_id}.items deve essere lista non vuota")
                raw_items = []

            items: list[list[str]] = []
            item_ids: set[str] = set()
            for item_index, item in enumerate(raw_items):
                if not isinstance(item, dict):
                    fail(errors, f"{source}.kinds.{kind_key}.families.{family_id}.items[{item_index}] deve essere mappa")
                    continue
                item_id = require_text(errors, source, item.get("id"), f"kinds.{kind_key}.families.{family_id}.items[{item_index}].id")
                item_label = require_text(errors, source, item.get("label"), f"kinds.{kind_key}.families.{family_id}.items.{item_id}.label")
                if item_id in item_ids:
                    fail(errors, f"{source}.kinds.{kind_key}.families.{family_id}.items id duplicato ({item_id})")
                item_ids.add(item_id)
                items.append([item_id, item_label])

            families.append({
                "id": family_id,
                "label": family_label,
                "folder": folder,
                "category": category,
                "items": items,
            })
            for item_id, _item_label in items:
                taxonomy_routes.setdefault(kind_key, []).append({
                    "kind": kind_key,
                    "family": family_id,
                    "folder": folder,
                    "category": family_id,
                    "subtype": item_id,
                    "frontmatterCategory": category,
                })

        kinds[kind_key] = {
            "label": label,
            "defaultFolder": default_folder,
            "families": families,
        }

    allowed_templates = template_targets(template_blueprints)
    raw_template_routes = taxonomy.get("template_routes")
    if not isinstance(raw_template_routes, dict) or not raw_template_routes:
        fail(errors, f"{source}.template_routes deve essere mappa non vuota")
        raw_template_routes = {}

    default_template = normalize_template_ref(raw_template_routes.get("default_template"))
    if not default_template:
        fail(errors, f"{source}.template_routes.default_template mancante")
    elif default_template not in allowed_templates:
        fail(errors, f"{source}.template_routes.default_template non dichiarato in template_blueprints ({default_template})")

    raw_by_kind = raw_template_routes.get("by_kind")
    if not isinstance(raw_by_kind, dict) or not raw_by_kind:
        fail(errors, f"{source}.template_routes.by_kind deve essere mappa non vuota")
        raw_by_kind = {}
    for missing in sorted(creative_routes - set(raw_by_kind)):
        fail(errors, f"{source}.template_routes.by_kind non copre creative_route ({missing})")
    for extra in sorted(set(raw_by_kind) - creative_routes):
        fail(errors, f"{source}.template_routes.by_kind dichiara kind non usato dal router ({extra})")

    by_kind: dict[str, Any] = {}
    for kind_id, route_spec in raw_by_kind.items():
        kind_key = str(kind_id or "").strip()
        if not isinstance(route_spec, dict):
            fail(errors, f"{source}.template_routes.by_kind.{kind_key} deve essere mappa")
            continue
        kind_default = normalize_template_ref(route_spec.get("default_template"))
        if not kind_default:
            fail(errors, f"{source}.template_routes.by_kind.{kind_key}.default_template mancante")
        elif kind_default not in allowed_templates:
            fail(errors, f"{source}.template_routes.by_kind.{kind_key}.default_template non dichiarato in template_blueprints ({kind_default})")

        rules: list[dict[str, Any]] = []
        raw_rules = route_spec.get("rules") or []
        if not isinstance(raw_rules, list):
            fail(errors, f"{source}.template_routes.by_kind.{kind_key}.rules deve essere lista")
            raw_rules = []
        rule_ids: set[str] = set()
        for rule_index, rule in enumerate(raw_rules):
            if not isinstance(rule, dict):
                fail(errors, f"{source}.template_routes.by_kind.{kind_key}.rules[{rule_index}] deve essere mappa")
                continue
            rule_id = require_text(errors, source, rule.get("id"), f"template_routes.by_kind.{kind_key}.rules[{rule_index}].id")
            if rule_id in rule_ids:
                fail(errors, f"{source}.template_routes.by_kind.{kind_key}.rules id duplicato ({rule_id})")
            rule_ids.add(rule_id)

            template = normalize_template_ref(rule.get("template"))
            if not template:
                fail(errors, f"{source}.template_routes.by_kind.{kind_key}.rules.{rule_id}.template mancante")
            elif template not in allowed_templates:
                fail(errors, f"{source}.template_routes.by_kind.{kind_key}.rules.{rule_id}.template non dichiarato in template_blueprints ({template})")

            match = validate_condition_map(errors, source, rule.get("match"), f"template_routes.by_kind.{kind_key}.rules.{rule_id}.match")
            contains = validate_condition_map(errors, source, rule.get("contains"), f"template_routes.by_kind.{kind_key}.rules.{rule_id}.contains")
            if not match and not contains:
                fail(errors, f"{source}.template_routes.by_kind.{kind_key}.rules.{rule_id} richiede match o contains")
            rules.append({
                "id": rule_id,
                **({"match": match} if match else {}),
                **({"contains": contains} if contains else {}),
                "template": template,
            })

        by_kind[kind_key] = {
            "default_template": kind_default,
            "rules": rules,
        }

    direct_luogo_routes = [
        {"kind": "luogo", **route}
        for route in blueprint_route_options(template_blueprints, "luogo")
    ]
    reachable_routes = {
        kind_id: [*routes, *(direct_luogo_routes if kind_id == "luogo" else [])]
        for kind_id, routes in taxonomy_routes.items()
    }
    for kind_id, route_spec in by_kind.items():
        routes = reachable_routes.get(kind_id, [])
        for rule in route_spec.get("rules") or []:
            if not rule_reachable(rule, routes):
                fail(errors, f"{source}.template_routes.by_kind.{kind_id}.rules.{rule['id']} non raggiungibile dalla tassonomia YAML o dai blueprint")

    return {
        "kinds": kinds,
        "template_routes": {
            "default_template": default_template,
            "by_kind": by_kind,
        },
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
    world_taxonomy = validate_world_taxonomy(
        contracts,
        template_blueprints,
        path_registry,
        entity_model,
        template_router,
        errors,
    )

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
        "world_taxonomy": world_taxonomy,
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
        f"{len(contract['template_router']['prompt_routes']) + len(contract['template_router']['delegated_routes']) + len(contract['template_router']['creative_routes'])} route template, "
        f"{len(contract['world_taxonomy']['kinds'])} tassonomie worldbuilding."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
