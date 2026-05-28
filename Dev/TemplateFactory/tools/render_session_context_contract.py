#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import yaml

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[3]
RUNTIME_PROFILES = ROOT / "Dev" / "TemplateFactory" / "modules" / "runtime_profiles.yaml"
FIELDS_CORE = ROOT / "Dev" / "TemplateFactory" / "modules" / "fields_core.yaml"
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


def validate_contract(runtime_profiles: dict[str, Any], fields_core: dict[str, Any], errors: list[str]) -> dict[str, Any]:
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
    contract = validate_contract(runtime_profiles, fields_core, errors)

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
        f"{len(contract['link_fields'])} campi link."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
