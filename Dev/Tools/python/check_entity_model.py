#!/usr/bin/env python3

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

from template_factory_utils import ROOT, load_yaml

sys.dont_write_bytecode = True

SOURCE = ROOT / "Dev" / "Source" / "YAML" / "canonical" / "entity_model.yaml"
FIELDS_CORE = ROOT / "Dev" / "Source" / "YAML" / "canonical" / "fields_core.yaml"
VALIDATION_CONTRACT = ROOT / "Dev" / "Source" / "YAML" / "canonical" / "validation_contract.yaml"
FRONTMATTER_PROFILES = ROOT / "Dev" / "Source" / "YAML" / "canonical" / "frontmatter_profiles.yaml"
REPLACED_NOTE = ROOT / "Risorse" / "Modello Entità.md"


def rel_path(path: Path) -> str:
    return str(path.relative_to(ROOT))


def as_array(value: Any) -> list[str]:
    return [str(item) for item in value if item] if isinstance(value, list) else []


def require_string(errors: list[str], value: Any, path: str) -> str:
    text = str(value or "").strip()
    if not text:
        errors.append(f"{rel_path(SOURCE)}: {path} deve essere stringa non vuota")
    return text


def require_list(errors: list[str], value: Any, path: str) -> list[str]:
    items = as_array(value)
    if not items:
        errors.append(f"{rel_path(SOURCE)}: {path} deve essere lista non vuota")
    return items


def field_catalog(fields_core: dict[str, Any], frontmatter_profiles: dict[str, Any]) -> set[str]:
    fields: set[str] = set()
    for group in (fields_core.get("fields") or {}).values():
        if not isinstance(group, list):
            continue
        for field in group:
            if isinstance(field, dict) and field.get("name"):
                fields.add(str(field["name"]))

    field_catalog_source = frontmatter_profiles.get("field_catalog") or {}
    for field in field_catalog_source.get("domain_fields", []) or []:
        fields.add(str(field))
    for value in (field_catalog_source.get("plugin_fields") or {}).values():
        for field in value or []:
            fields.add(str(field))

    for profile in (frontmatter_profiles.get("profiles") or {}).values():
        if not isinstance(profile, dict):
            continue
        for field in profile.get("required_fields", []) or []:
            fields.add(str(field))
        sample_values = profile.get("sample_values", []) or []
        if isinstance(sample_values, list):
            for field in sample_values:
                fields.add(str(field))
        for field in profile.get("fields", []) or []:
            if isinstance(field, dict):
                if field.get("key"):
                    fields.add(str(field["key"]))
                if field.get("value"):
                    fields.add(str(field["value"]))
    return fields


def category_values(fields_core: dict[str, Any]) -> set[str]:
    for group in (fields_core.get("fields") or {}).values():
        if not isinstance(group, list):
            continue
        for field in group:
            if isinstance(field, dict) and field.get("name") == "categoria":
                return set(as_array(field.get("values")))
    return set()


def validate_fields(errors: list[str], fields: list[str], known_fields: set[str], path: str) -> None:
    for field in fields:
        if field not in known_fields:
            errors.append(f"{rel_path(SOURCE)}: {path} usa campo non catalogato ({field})")


def validate_removed_markdown_note(errors: list[str]) -> None:
    if REPLACED_NOTE.exists():
        errors.append(f"{rel_path(REPLACED_NOTE)}: la nota lunga deve essere rimossa; usare {rel_path(SOURCE)}")


def main() -> int:
    errors: list[str] = []
    model = load_yaml(SOURCE)
    fields_core = load_yaml(FIELDS_CORE)
    validation = load_yaml(VALIDATION_CONTRACT)
    frontmatter_profiles = load_yaml(FRONTMATTER_PROFILES)
    categories = model.get("categories") or {}
    known_categories = category_values(fields_core)
    known_fields = field_catalog(fields_core, frontmatter_profiles)
    validation_required = validation.get("required_fields_by_category") or {}
    type_exempt = set(as_array((validation.get("category_validation") or {}).get("type_exempt_categories")))
    required_exempt = set(as_array((validation.get("category_validation") or {}).get("required_field_exempt_categories")))
    allowed_types = validation.get("allowed_types_by_category") or {}

    if model.get("id") != "entity_model":
        errors.append(f"{rel_path(SOURCE)}: id non valido")
    require_string(errors, model.get("purpose"), "purpose")
    require_string(errors, model.get("version"), "version")
    require_list(errors, (model.get("policy") or {}).get("structured_note_when"), "policy.structured_note_when")
    require_list(errors, (model.get("policy") or {}).get("folder_when"), "policy.folder_when")
    require_list(errors, (model.get("common_fields") or {}).get("required"), "common_fields.required")
    validate_fields(errors, as_array((model.get("common_fields") or {}).get("required")), known_fields, "common_fields.required")
    validate_removed_markdown_note(errors)

    if not isinstance(categories, dict) or not categories:
        errors.append(f"{rel_path(SOURCE)}: categories deve essere mappa non vuota")
        categories = {}

    for category in validation_required.keys():
        if category not in categories:
            errors.append(f"{rel_path(SOURCE)}: categories non copre required_fields_by_category.{category}")
    for category in known_categories:
        if category not in categories:
            errors.append(f"{rel_path(SOURCE)}: categories non copre categoria fields_core ({category})")

    for category_id, category_value in categories.items():
        category = category_value if isinstance(category_value, dict) else {}
        if category_id not in known_categories:
            errors.append(f"{rel_path(SOURCE)}: categoria non dichiarata in fields_core ({category_id})")
        require_string(errors, category.get("label"), f"categories.{category_id}.label")
        require_string(errors, category.get("folder"), f"categories.{category_id}.folder")
        priority = require_string(errors, category.get("priority"), f"categories.{category_id}.priority")
        if priority not in {"essential", "useful", "defer"}:
            errors.append(f"{rel_path(SOURCE)}: categories.{category_id}.priority non valida ({category.get('priority')})")
        require_string(errors, category.get("purpose"), f"categories.{category_id}.purpose")
        require_list(errors, category.get("create_when"), f"categories.{category_id}.create_when")
        required_fields = require_list(errors, category.get("required_fields"), f"categories.{category_id}.required_fields")
        if "categoria" not in required_fields:
            errors.append(f"{rel_path(SOURCE)}: categories.{category_id}.required_fields deve includere categoria")
        validate_fields(errors, required_fields, known_fields, f"categories.{category_id}.required_fields")
        validate_fields(errors, as_array(category.get("useful_fields")), known_fields, f"categories.{category_id}.useful_fields")

        if category_id not in required_exempt:
            for field in validation_required.get(category_id, []) or []:
                if str(field) not in required_fields:
                    errors.append(
                        f"{rel_path(SOURCE)}: categories.{category_id}.required_fields non include "
                        f"campo richiesto da validation_contract ({field})"
                    )

        listed_types = as_array(category.get("types"))
        if category_id not in type_exempt:
            if not listed_types:
                errors.append(f"{rel_path(SOURCE)}: categories.{category_id}.types deve essere lista non vuota")
            allowed = set(as_array(allowed_types.get(category_id)))
            if not allowed:
                errors.append(f"{rel_path(VALIDATION_CONTRACT)}: allowed_types_by_category.{category_id} mancante")
            for listed_type in listed_types:
                if listed_type not in allowed:
                    errors.append(f"{rel_path(SOURCE)}: categories.{category_id}.types contiene tipo non ammesso ({listed_type})")

    if errors:
        print("Entity model non valido:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Entity model OK: {len(categories)} categorie verificate contro fields_core e validation_contract.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
