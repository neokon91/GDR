#!/usr/bin/env python3

from __future__ import annotations

import sys
from typing import Any

from template_factory_utils import ROOT, load_yaml

sys.dont_write_bytecode = True

CONTRACT_PATH = ROOT / "Dev" / "Source" / "YAML" / "canonical" / "validation_contract.yaml"
FIELDS_CORE_PATH = ROOT / "Dev" / "Source" / "YAML" / "canonical" / "fields_core.yaml"
FRONTMATTER_PROFILES_PATH = ROOT / "Dev" / "Source" / "YAML" / "canonical" / "frontmatter_profiles.yaml"
RUNTIME_PROFILES_PATH = ROOT / "Dev" / "Source" / "YAML" / "canonical" / "runtime_profiles.yaml"


def values_for_core_field(fields_core: dict[str, Any], field_name: str) -> set[str]:
    for group in (fields_core.get("fields") or {}).values():
        if not isinstance(group, list):
            continue
        for field in group:
            if isinstance(field, dict) and field.get("name") == field_name:
                return {str(value) for value in field.get("values", [])}
    return set()


def add_field(known_fields: set[str], value: Any) -> None:
    field = str(value or "").strip()
    if field:
        known_fields.add(field)


def known_frontmatter_fields(fields_core: dict[str, Any], frontmatter_profiles: dict[str, Any]) -> set[str]:
    known_fields: set[str] = set()
    for group in (fields_core.get("fields") or {}).values():
        if not isinstance(group, list):
            continue
        for field in group:
            if isinstance(field, dict):
                add_field(known_fields, field.get("name"))

    for value in (frontmatter_profiles.get("field_catalog") or {}).values():
        if isinstance(value, list):
            for field in value:
                add_field(known_fields, field)
            continue
        if isinstance(value, dict):
            for fields in value.values():
                if isinstance(fields, list):
                    for field in fields:
                        add_field(known_fields, field)

    for profile in (frontmatter_profiles.get("profiles") or {}).values():
        if not isinstance(profile, dict):
            continue
        for field in profile.get("required_fields", []) or []:
            add_field(known_fields, field)
        sample_values = profile.get("sample_values", []) or []
        if isinstance(sample_values, list):
            for field in sample_values:
                add_field(known_fields, field)
        for field in profile.get("fields", []) or []:
            if isinstance(field, dict):
                add_field(known_fields, field.get("key"))
                add_field(known_fields, field.get("value"))
    return known_fields


def require_non_empty_array(errors: list[str], value: Any, path: str) -> list[str]:
    if not isinstance(value, list) or not value:
        errors.append(f"{CONTRACT_PATH.relative_to(ROOT)}: {path} deve essere lista non vuota")
        return []
    normalized = [str(item) for item in value if str(item)]
    scalar_only = all(item is None or not isinstance(item, (dict, list, set, tuple)) for item in value)
    if scalar_only and len(set(normalized)) != len(normalized):
        errors.append(f"{CONTRACT_PATH.relative_to(ROOT)}: {path} contiene valori duplicati")
    return normalized


def require_non_empty_map(errors: list[str], value: Any, path: str) -> dict[str, Any]:
    if not isinstance(value, dict) or not value:
        errors.append(f"{CONTRACT_PATH.relative_to(ROOT)}: {path} deve essere mappa non vuota")
        return {}
    return value


def require_number_at_least(errors: list[str], value: Any, path: str, minimum: float) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = float("nan")
    if number != number or number < minimum:
        errors.append(f"{CONTRACT_PATH.relative_to(ROOT)}: {path} deve essere numero >= {minimum:g}")
    return number


def require_non_empty_string(errors: list[str], value: Any, path: str) -> str:
    text = str(value or "").strip()
    if not text:
        errors.append(f"{CONTRACT_PATH.relative_to(ROOT)}: {path} deve essere stringa non vuota")
    return text


def require_known_field(errors: list[str], known_fields: set[str], field: str, path: str) -> None:
    if field not in known_fields:
        errors.append(
            f"{CONTRACT_PATH.relative_to(ROOT)}: {path} usa campo non dichiarato in "
            f"fields_core/frontmatter_profiles ({field})"
        )


def require_known_field_array(errors: list[str], known_fields: set[str], value: Any, path: str) -> list[str]:
    fields = require_non_empty_array(errors, value, path)
    for field in fields:
        require_known_field(errors, known_fields, field, path)
    return fields


def require_known_field_groups(errors: list[str], known_fields: set[str], value: Any, path: str) -> list[list[str]]:
    if not isinstance(value, list) or not value:
        errors.append(f"{CONTRACT_PATH.relative_to(ROOT)}: {path} deve essere lista non vuota")
        return []
    return [
        require_known_field_array(errors, known_fields, group, f"{path}.{index}")
        for index, group in enumerate(value)
    ]


def validate_category_list(errors: list[str], categories: list[str], allowed_categories: set[str], path: str) -> None:
    for category in categories:
        if category not in allowed_categories:
            errors.append(
                f"{CONTRACT_PATH.relative_to(ROOT)}: {path} contiene categoria non dichiarata "
                f"in fields_core.yaml ({category})"
            )


def set_equals(left: set[str], right: set[str]) -> bool:
    return left == right


def main() -> int:
    errors: list[str] = []
    contract = load_yaml(CONTRACT_PATH)
    fields_core = load_yaml(FIELDS_CORE_PATH)
    frontmatter_profiles = load_yaml(FRONTMATTER_PROFILES_PATH)
    runtime_profiles = load_yaml(RUNTIME_PROFILES_PATH)
    allowed_categories = values_for_core_field(fields_core, "categoria")
    allowed_states = values_for_core_field(fields_core, "stato")
    known_fields = known_frontmatter_fields(fields_core, frontmatter_profiles)

    for key in ["live_entity_categories", "codex_categories"]:
        validate_category_list(errors, require_non_empty_array(errors, contract.get(key), key), allowed_categories, key)

    category_validation = require_non_empty_map(errors, contract.get("category_validation"), "category_validation")
    type_exempt_categories = set(
        require_non_empty_array(
            errors,
            category_validation.get("type_exempt_categories"),
            "category_validation.type_exempt_categories",
        )
    )
    required_field_exempt_categories = set(
        require_non_empty_array(
            errors,
            category_validation.get("required_field_exempt_categories"),
            "category_validation.required_field_exempt_categories",
        )
    )
    validate_category_list(
        errors,
        list(type_exempt_categories),
        allowed_categories,
        "category_validation.type_exempt_categories",
    )
    validate_category_list(
        errors,
        list(required_field_exempt_categories),
        allowed_categories,
        "category_validation.required_field_exempt_categories",
    )

    allowed_types_by_category = require_non_empty_map(
        errors,
        contract.get("allowed_types_by_category"),
        "allowed_types_by_category",
    )
    for category, types in allowed_types_by_category.items():
        if category not in allowed_categories:
            errors.append(
                f"{CONTRACT_PATH.relative_to(ROOT)}: allowed_types_by_category contiene categoria "
                f"non dichiarata in fields_core.yaml ({category})"
            )
        require_non_empty_array(errors, types, f"allowed_types_by_category.{category}")
        if category in type_exempt_categories:
            errors.append(
                f"{CONTRACT_PATH.relative_to(ROOT)}: {category} risulta sia in allowed_types_by_category "
                "sia in category_validation.type_exempt_categories"
            )
    for category in allowed_categories:
        if category not in allowed_types_by_category and category not in type_exempt_categories:
            errors.append(
                f"{CONTRACT_PATH.relative_to(ROOT)}: allowed_types_by_category non copre categoria "
                f"{category} e non la dichiara esente"
            )

    runtime_location_types = {
        str(option.get("id") or "")
        for option in (((runtime_profiles.get("profiles") or {}).get("luogo") or {}).get("type_options") or [])
        if isinstance(option, dict) and option.get("id")
    }
    if runtime_location_types:
        contract_location_types = {str(value) for value in allowed_types_by_category.get("luogo", [])}
        if not set_equals(runtime_location_types, contract_location_types):
            errors.append(
                f"{CONTRACT_PATH.relative_to(ROOT)}: allowed_types_by_category.luogo deve corrispondere "
                "a runtime_profiles.luogo.type_options"
            )

    required_fields_by_category = require_non_empty_map(
        errors,
        contract.get("required_fields_by_category"),
        "required_fields_by_category",
    )
    for category, fields in required_fields_by_category.items():
        if category not in allowed_categories:
            errors.append(
                f"{CONTRACT_PATH.relative_to(ROOT)}: required_fields_by_category contiene categoria "
                f"non dichiarata in fields_core.yaml ({category})"
            )
        require_known_field_array(errors, known_fields, fields, f"required_fields_by_category.{category}")
        if category in required_field_exempt_categories:
            errors.append(
                f"{CONTRACT_PATH.relative_to(ROOT)}: {category} risulta sia in required_fields_by_category "
                "sia in category_validation.required_field_exempt_categories"
            )
    for category in allowed_categories:
        if category not in required_fields_by_category and category not in required_field_exempt_categories:
            errors.append(
                f"{CONTRACT_PATH.relative_to(ROOT)}: required_fields_by_category non copre categoria "
                f"{category} e non la dichiara esente"
            )

    ready_requirements = require_non_empty_map(errors, contract.get("state_ready_requirements"), "state_ready_requirements")
    ready_states = require_non_empty_map(errors, ready_requirements.get("pronto"), "state_ready_requirements.pronto")
    allowed_ready_keys = set(allowed_categories)
    allowed_ready_keys.update(str(key) for key in allowed_types_by_category.keys())
    allowed_ready_keys.update(str(value) for values in allowed_types_by_category.values() for value in values)
    for category_or_type, requirement in ready_states.items():
        if category_or_type not in allowed_ready_keys:
            errors.append(
                f"{CONTRACT_PATH.relative_to(ROOT)}: state_ready_requirements.pronto contiene chiave "
                f"non riconducibile a categoria o tipo ({category_or_type})"
            )
        requirement_map = requirement if isinstance(requirement, dict) else {}
        require_known_field_array(
            errors,
            known_fields,
            requirement_map.get("any_of_fields"),
            f"state_ready_requirements.pronto.{category_or_type}.any_of_fields",
        )

    require_known_field_array(errors, known_fields, contract.get("private_frontmatter_fields"), "private_frontmatter_fields")
    require_non_empty_array(errors, contract.get("private_text_terms"), "private_text_terms")

    live_entity_policy = require_non_empty_map(errors, contract.get("live_entity_policy"), "live_entity_policy")
    require_known_field_array(
        errors,
        known_fields,
        live_entity_policy.get("require_any_of_fields"),
        "live_entity_policy.require_any_of_fields",
    )
    require_known_field_array(
        errors,
        known_fields,
        live_entity_policy.get("sheet_require_any_of_fields"),
        "live_entity_policy.sheet_require_any_of_fields",
    )

    codex_article_policy = require_non_empty_map(errors, contract.get("codex_article_policy"), "codex_article_policy")
    for key in [
        "identity_any_of_fields",
        "table_use_any_of_fields",
        "dm_layer_any_of_fields",
        "operational_link_fields",
    ]:
        require_known_field_array(errors, known_fields, codex_article_policy.get(key), f"codex_article_policy.{key}")

    session_playability_policy = require_non_empty_map(
        errors,
        contract.get("session_playability_policy"),
        "session_playability_policy",
    )
    for state in require_non_empty_array(
        errors,
        session_playability_policy.get("active_states"),
        "session_playability_policy.active_states",
    ):
        if state not in allowed_states:
            errors.append(
                f"{CONTRACT_PATH.relative_to(ROOT)}: session_playability_policy.active_states usa stato "
                f"non dichiarato in fields_core.yaml ({state})"
            )
    require_known_field_array(
        errors,
        known_fields,
        session_playability_policy.get("playable_any_of_fields"),
        "session_playability_policy.playable_any_of_fields",
    )
    min_world_anchors = require_number_at_least(
        errors,
        session_playability_policy.get("min_world_anchors"),
        "session_playability_policy.min_world_anchors",
        1,
    )
    world_anchor_groups = require_known_field_groups(
        errors,
        known_fields,
        session_playability_policy.get("world_anchor_groups"),
        "session_playability_policy.world_anchor_groups",
    )
    if world_anchor_groups and min_world_anchors > len(world_anchor_groups):
        errors.append(
            f"{CONTRACT_PATH.relative_to(ROOT)}: session_playability_policy.min_world_anchors "
            "supera i gruppi world_anchor_groups"
        )
    encounter_material_field = require_non_empty_string(
        errors,
        session_playability_policy.get("encounter_material_field"),
        "session_playability_policy.encounter_material_field",
    )
    if encounter_material_field:
        require_known_field(
            errors,
            known_fields,
            encounter_material_field,
            "session_playability_policy.encounter_material_field",
        )

    map_review_policy = require_non_empty_map(errors, contract.get("map_review_policy"), "map_review_policy")
    playable_map_uses = set(
        require_non_empty_array(errors, map_review_policy.get("playable_uses"), "map_review_policy.playable_uses")
    )
    require_non_empty_array(errors, map_review_policy.get("structured_uses"), "map_review_policy.structured_uses")
    for key in [
        "table_use_any_of_fields",
        "visibility_any_of_fields",
        "dm_private_any_of_fields",
        "ready_playable_link_any_of_fields",
        "ready_structural_link_any_of_fields",
    ]:
        require_known_field_array(errors, known_fields, map_review_policy.get(key), f"map_review_policy.{key}")
    zoom_use = require_non_empty_string(errors, map_review_policy.get("zoom_use"), "map_review_policy.zoom_use")
    if zoom_use and zoom_use not in playable_map_uses:
        errors.append(
            f"{CONTRACT_PATH.relative_to(ROOT)}: map_review_policy.zoom_use deve essere incluso "
            "in map_review_policy.playable_uses"
        )

    require_non_empty_array(errors, contract.get("playability_rules"), "playability_rules")
    playability_rules = contract.get("playability_rules") if isinstance(contract.get("playability_rules"), list) else []
    rule_ids: set[str] = set()
    for rule in playability_rules:
        rule_map = rule if isinstance(rule, dict) else {}
        rule_id = str(rule_map.get("id") or "")
        if not rule_id:
            errors.append(f"{CONTRACT_PATH.relative_to(ROOT)}: playability_rules contiene regola senza id")
            continue
        if rule_id in rule_ids:
            errors.append(f"{CONTRACT_PATH.relative_to(ROOT)}: playability_rules id duplicato ({rule_id})")
        rule_ids.add(rule_id)

        if not rule_map.get("warning"):
            errors.append(f"{CONTRACT_PATH.relative_to(ROOT)}: playability_rules.{rule_id} senza warning")
        if not rule_map.get("require_value") and not rule_map.get("require_any_of"):
            errors.append(
                f"{CONTRACT_PATH.relative_to(ROOT)}: playability_rules.{rule_id} "
                "senza require_value o require_any_of"
            )
        if rule_map.get("require_value"):
            require_known_field(errors, known_fields, str(rule_map.get("require_value")), f"playability_rules.{rule_id}.require_value")
        if rule_map.get("require_any_of"):
            require_known_field_array(errors, known_fields, rule_map.get("require_any_of"), f"playability_rules.{rule_id}.require_any_of")
        if rule_map.get("tipo_in"):
            require_non_empty_array(errors, rule_map.get("tipo_in"), f"playability_rules.{rule_id}.tipo_in")
        if rule_map.get("path_prefixes"):
            require_non_empty_array(errors, rule_map.get("path_prefixes"), f"playability_rules.{rule_id}.path_prefixes")
        if rule_map.get("when_value_present"):
            require_known_field(
                errors,
                known_fields,
                str(rule_map.get("when_value_present")),
                f"playability_rules.{rule_id}.when_value_present",
            )
        if rule_map.get("when_any_of_present"):
            require_known_field_array(
                errors,
                known_fields,
                rule_map.get("when_any_of_present"),
                f"playability_rules.{rule_id}.when_any_of_present",
            )
        if rule_map.get("any_field_equals"):
            require_non_empty_array(errors, rule_map.get("any_field_equals"), f"playability_rules.{rule_id}.any_field_equals")
        for condition in rule_map.get("any_field_equals", []) or []:
            condition_map = condition if isinstance(condition, dict) else {}
            require_known_field(
                errors,
                known_fields,
                str(condition_map.get("field") or ""),
                f"playability_rules.{rule_id}.any_field_equals.field",
            )
        if rule_map.get("number_field_gt"):
            condition_map = rule_map.get("number_field_gt") if isinstance(rule_map.get("number_field_gt"), dict) else {}
            require_known_field(
                errors,
                known_fields,
                str(condition_map.get("field") or ""),
                f"playability_rules.{rule_id}.number_field_gt.field",
            )
        if rule_map.get("number_field_gte"):
            condition_map = rule_map.get("number_field_gte") if isinstance(rule_map.get("number_field_gte"), dict) else {}
            require_known_field(
                errors,
                known_fields,
                str(condition_map.get("field") or ""),
                f"playability_rules.{rule_id}.number_field_gte.field",
            )
        if rule_map.get("categoria") and str(rule_map.get("categoria")) not in allowed_categories:
            errors.append(
                f"{CONTRACT_PATH.relative_to(ROOT)}: playability_rules.{rule_id} usa categoria "
                f"non dichiarata in fields_core.yaml ({rule_map.get('categoria')})"
            )

    if errors:
        print("Validation contract non valido:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(
        "Validation contract OK: "
        f"{len(allowed_types_by_category)} categorie tipo, "
        f"{len(required_fields_by_category)} categorie required, "
        f"{len(ready_states)} policy pronto, "
        f"{len(playability_rules)} regole giocabilita, policy live/sessione/mappe validate."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
