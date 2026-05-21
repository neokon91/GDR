#!/usr/bin/env python3

from __future__ import annotations

import argparse
import difflib
import re
import sys
from pathlib import Path
from typing import Any

import yaml

sys.dont_write_bytecode = True

from template_factory_utils import ROOT, load_modules


OUT_DIR = ROOT / "Dev" / "TemplateFactory" / "examples" / "generated" / "metadata_surfaces"

FIELD_TYPE_MAP = {
    "boolean": "Boolean",
    "date": "Date",
    "list": "Multi",
    "number": "Number",
    "select": "Select",
    "text": "Input",
    "wikilink": "File",
    "wikilink_list": "MultiFile",
}


def yaml_document(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8")
    if text.startswith("---\n"):
        end = text.find("\n---", 4)
        if end != -1:
            text = text[4:end]
    data = yaml.safe_load(text) or {}
    return data if isinstance(data, dict) else {}


def field_catalog(modules: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
    catalog: dict[str, dict[str, Any]] = {}
    for fields in modules["fields_core"].get("fields", {}).values():
        if not isinstance(fields, list):
            continue
        for field in fields:
            if isinstance(field, dict) and field.get("name"):
                catalog[str(field["name"])] = field
    return catalog


def field_type(field_name: str, existing: dict[str, Any], catalog: dict[str, dict[str, Any]]) -> str:
    if existing.get("type"):
        return str(existing["type"])
    core_type = str(catalog.get(field_name, {}).get("type", "text"))
    return FIELD_TYPE_MAP.get(core_type, "Input")


def field_options(field_name: str, existing: dict[str, Any], catalog: dict[str, dict[str, Any]]) -> dict[str, Any]:
    if isinstance(existing.get("options"), dict) and existing["options"]:
        return existing["options"]
    values = catalog.get(field_name, {}).get("values", [])
    if values:
        return {
            "sourceType": "ValuesList",
            "valuesList": {str(index): value for index, value in enumerate(values)},
        }
    return {}


def existing_fields_by_name(fileclass: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        str(field["name"]): field
        for field in fileclass.get("fields", []) or []
        if isinstance(field, dict) and field.get("name")
    }


def profile_field_keys(profile: dict[str, Any]) -> list[str]:
    keys: list[str] = []
    for field in profile.get("fields", []) or []:
        if isinstance(field, dict) and field.get("key"):
            key = str(field["key"])
            if key not in keys:
                keys.append(key)
    return keys


def render_fileclass(profile_id: str, profile: dict[str, Any], catalog: dict[str, dict[str, Any]]) -> str:
    integration = profile.get("integrations", {}) or {}
    existing_path = ROOT / str(integration.get("fileclass", ""))
    existing_doc = yaml_document(existing_path)
    existing_fields = existing_fields_by_name(existing_doc)
    fields_order = profile_field_keys(profile)
    fields = []

    for field_name in fields_order:
        existing = existing_fields.get(field_name, {})
        fields.append({
            "name": field_name,
            "id": field_name,
            "type": field_type(field_name, existing, catalog),
            "options": field_options(field_name, existing, catalog),
        })

    frontmatter = {
        "icon": existing_doc.get("icon", "database"),
        "generated_from": "Dev/TemplateFactory/modules/frontmatter_profiles.yaml",
        "profile": profile_id,
        "target": str(integration.get("fileclass", "")),
        "fieldsOrder": fields_order,
        "fields": fields,
    }
    yaml_text = yaml.safe_dump(frontmatter, allow_unicode=True, sort_keys=False, width=1000).strip()
    return (
        f"---\n{yaml_text}\n---\n\n"
        f"# FileClass {profile_id}\n\n"
        "Anteprima generata da TemplateFactory. Il profilo YAML resta la sorgente leggibile; "
        "materializza solo dopo review del diff.\n"
    )


def render_base_contract(profile_id: str, profile: dict[str, Any], base_path: str) -> str:
    integration = profile.get("integrations", {}) or {}
    required_fields = integration.get("required_fields", []) or []
    fields = profile_field_keys(profile)
    payload = {
        "generated_from": "Dev/TemplateFactory/modules/frontmatter_profiles.yaml",
        "profile": profile_id,
        "target": base_path,
        "required_fields": required_fields,
        "profile_fields": fields,
    }
    return yaml.safe_dump(payload, allow_unicode=True, sort_keys=False, width=1000)


def preview_name(path: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "__", path)


def render_all(modules: dict[str, dict[str, Any]]) -> dict[Path, str]:
    catalog = field_catalog(modules)
    outputs: dict[Path, str] = {}

    for profile_id, profile in modules["frontmatter_profiles"].get("profiles", {}).items():
        integration = profile.get("integrations", {}) or {}
        fileclass = integration.get("fileclass")
        if fileclass:
            outputs[OUT_DIR / "fileclass" / preview_name(str(fileclass))] = render_fileclass(profile_id, profile, catalog)

        for base in integration.get("bases", []) or []:
            outputs[OUT_DIR / "bases" / f"{preview_name(str(base))}.yaml"] = render_base_contract(profile_id, profile, str(base))

    manifest_lines = [
        "# Metadata Surfaces",
        "",
        "Anteprime generate dai profili YAML. Servono a rendere leggibile il contratto tra frontmatter, fileClass e Bases prima di materializzare modifiche.",
        "",
        "## FileClass",
        "",
    ]
    for path in sorted(p for p in outputs if "/fileclass/" in str(p)):
        manifest_lines.append(f"- `{path.relative_to(ROOT)}`")
    manifest_lines.extend(["", "## Bases", ""])
    for path in sorted(p for p in outputs if "/bases/" in str(p)):
        manifest_lines.append(f"- `{path.relative_to(ROOT)}`")
    manifest_lines.append("")
    outputs[OUT_DIR / "README.md"] = "\n".join(manifest_lines)

    return outputs


def check_outputs(outputs: dict[Path, str]) -> list[str]:
    errors: list[str] = []
    for path, expected in sorted(outputs.items()):
        if not path.exists():
            errors.append(f"{path.relative_to(ROOT)}: anteprima mancante; eseguire npm run render:metadata")
            continue
        actual = path.read_text(encoding="utf-8")
        if actual != expected:
            diff = "\n".join(difflib.unified_diff(
                actual.splitlines(),
                expected.splitlines(),
                fromfile=str(path.relative_to(ROOT)),
                tofile=f"{path.relative_to(ROOT)}.expected",
                lineterm="",
            )[:40])
            errors.append(f"{path.relative_to(ROOT)}: anteprima non aggiornata\n{diff}")
    return errors


def write_outputs(outputs: dict[Path, str]) -> None:
    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Renderizza anteprime fileClass/Bases dai profili YAML.")
    parser.add_argument("--check", action="store_true", help="Verifica che le anteprime siano aggiornate.")
    args = parser.parse_args()

    modules = load_modules()
    outputs = render_all(modules)

    if args.check:
        errors = check_outputs(outputs)
        if errors:
            print("Errori metadata surfaces:", file=sys.stderr)
            for error in errors:
                print(f"- {error}", file=sys.stderr)
            return 1
        print(f"Metadata surfaces OK: {len(outputs)} anteprime aggiornate.")
        return 0

    write_outputs(outputs)
    print(f"Metadata surfaces renderizzate: {len(outputs)} file in {OUT_DIR.relative_to(ROOT)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
