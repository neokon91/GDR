#!/usr/bin/env python3

from __future__ import annotations

import argparse
import difflib
import sys
from pathlib import Path
from typing import Any

import yaml

sys.dont_write_bytecode = True

from template_factory_utils import ROOT, collect_field_names, load_modules


PREVIEW_DIR = ROOT / "Dev" / "TemplateFactory" / "examples" / "generated" / "metadata_surfaces"
FILECLASS_SOURCE = "Dev/TemplateFactory/modules/frontmatter_profiles.yaml"
BASES_SOURCE = "Dev/TemplateFactory/modules/bases_views.yaml"
GENERATED_ROOTS = ("z.bases", "z.fileclass")


class MetadataDumper(yaml.SafeDumper):
    def increase_indent(self, flow: bool = False, indentless: bool = False) -> Any:
        return super().increase_indent(flow, False)


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def yaml_text(data: dict[str, Any]) -> str:
    return yaml.dump(data, Dumper=MetadataDumper, allow_unicode=True, sort_keys=False, width=1000)


def yaml_document_text(text: str) -> dict[str, Any]:
    if text.startswith("---\n"):
        end = text.find("\n---", 4)
        if end != -1:
            text = text[4:end]
    data = yaml.safe_load(text) or {}
    return data if isinstance(data, dict) else {}


def known_metadata_fields(modules: dict[str, dict[str, Any]]) -> set[str]:
    frontmatter = modules["frontmatter_profiles"]
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
    return collect_field_names(modules["fields_core"]) | plugin_fields | declared_plugin_fields | domain_fields


def fileclass_fields_from_doc(fileclass: dict[str, Any]) -> set[str]:
    fields = {str(field) for field in fileclass.get("fieldsOrder", []) or []}
    for field in fileclass.get("fields", []) or []:
        if isinstance(field, dict) and field.get("name"):
            fields.add(str(field["name"]))
    return fields


def base_fields_from_doc(base: dict[str, Any]) -> set[str]:
    fields: set[str] = set()
    for key in (base.get("properties", {}) or {}):
        key = str(key)
        if key.startswith("formula."):
            continue
        if key == "file.name":
            fields.add("nome")
        fields.add(key.removeprefix("note."))

    for view in base.get("views", []) or []:
        if not isinstance(view, dict):
            continue
        for field in view.get("order", []) or []:
            field = str(field)
            if not field.startswith("formula."):
                if field == "file.name":
                    fields.add("nome")
                fields.add(field.removeprefix("note."))
    return fields


def render_fileclass(fileclass_id: str, definition: dict[str, Any]) -> tuple[str, str, list[str]]:
    errors: list[str] = []
    target = str(definition.get("file", "")).replace("\\", "/")
    icon = str(definition.get("icon", "database"))
    source_fields = definition.get("fields", []) or []
    fields_order: list[str] = []
    fields: list[dict[str, Any]] = []

    if not target.startswith("z.fileclass/") or not target.endswith(".md"):
        errors.append(f"frontmatter_profiles.fileclasses.{fileclass_id}: target fileClass non valido ({target})")

    for index, field in enumerate(source_fields):
        if not isinstance(field, dict) or not field.get("name"):
            errors.append(f"frontmatter_profiles.fileclasses.{fileclass_id}.fields[{index}]: name mancante")
            continue
        name = str(field["name"])
        fields_order.append(name)
        fields.append({
            "name": name,
            "id": name,
            "type": str(field.get("type", "Input")),
            "options": field.get("options") if isinstance(field.get("options"), dict) else {},
        })

    frontmatter = {
        "icon": icon,
        "fieldsOrder": fields_order,
        "fields": fields,
    }
    body = str(definition.get("body", "")).strip()
    rendered = f"---\n{yaml_text(frontmatter)}---\n\n"
    if body:
        rendered += f"{body}\n"
    return target, rendered, errors


def render_fileclasses(modules: dict[str, dict[str, Any]]) -> tuple[dict[str, str], list[str]]:
    errors: list[str] = []
    outputs: dict[str, str] = {}
    frontmatter = modules["frontmatter_profiles"]
    profiles = frontmatter.get("profiles", {})
    definitions = frontmatter.get("fileclasses", {}) or {}
    known_fields = known_metadata_fields(modules)

    if not isinstance(definitions, dict) or not definitions:
        return {}, [f"{FILECLASS_SOURCE}: sezione fileclasses mancante"]

    for fileclass_id, definition in definitions.items():
        if not isinstance(definition, dict):
            errors.append(f"frontmatter_profiles.fileclasses.{fileclass_id}: definizione non valida")
            continue
        profile = definition.get("profile")
        if profile is not None and str(profile) not in profiles:
            errors.append(f"frontmatter_profiles.fileclasses.{fileclass_id}: profilo inesistente ({profile})")

        target, rendered, render_errors = render_fileclass(str(fileclass_id), definition)
        errors.extend(render_errors)
        if target in outputs:
            errors.append(f"{target}: fileClass generata duplicata")
        outputs[target] = rendered

        doc = yaml_document_text(rendered)
        fields = list(doc.get("fieldsOrder", []) or [])
        if not fields:
            errors.append(f"frontmatter_profiles.fileclasses.{fileclass_id}: fields vuoto")
        duplicates = sorted({field for field in fields if fields.count(field) > 1})
        for field in duplicates:
            errors.append(f"frontmatter_profiles.fileclasses.{fileclass_id}: campo duplicato {field}")
        for field in sorted(set(map(str, fields)) - known_fields):
            errors.append(f"frontmatter_profiles.fileclasses.{fileclass_id}: campo non dichiarato ({field})")

    return outputs, errors


def render_bases(modules: dict[str, dict[str, Any]]) -> tuple[dict[str, str], list[str]]:
    errors: list[str] = []
    outputs: dict[str, str] = {}
    bases = modules["bases_views"]
    generated = bases.get("generated_bases", {}) or {}
    generated_files = generated.get("files", {}) or {}
    declared_views = bases.get("views", {}) or {}

    if not isinstance(generated_files, dict) or not generated_files:
        return {}, [f"{BASES_SOURCE}: generated_bases.files mancante"]

    readme = str(generated.get("readme", "")).rstrip()
    if not readme:
        errors.append(f"{BASES_SOURCE}: generated_bases.readme mancante")
    outputs["z.bases/README.md"] = f"{readme}\n"

    for base_id, definition in generated_files.items():
        if not isinstance(definition, dict):
            errors.append(f"bases_views.generated_bases.files.{base_id}: definizione non valida")
            continue
        target = str(definition.get("file", "")).replace("\\", "/")
        content = definition.get("content", {}) or {}
        if not target.startswith("z.bases/") or not target.endswith(".base"):
            errors.append(f"bases_views.generated_bases.files.{base_id}: target Base non valido ({target})")
        if target in outputs:
            errors.append(f"{target}: Base generata duplicata")
        if not isinstance(content, dict) or not content:
            errors.append(f"bases_views.generated_bases.files.{base_id}: content mancante")
        outputs[target] = yaml_text(content)

    declared_by_file = {
        str(view.get("file", "")).replace("\\", "/"): (view_id, view)
        for view_id, view in declared_views.items()
        if isinstance(view, dict) and view.get("file")
    }
    generated_targets = set(outputs) - {"z.bases/README.md"}
    declared_targets = set(declared_by_file)
    for target in sorted(declared_targets - generated_targets):
        errors.append(f"{BASES_SOURCE}: Base dichiarata ma non generata ({target})")
    for target in sorted(generated_targets - declared_targets):
        errors.append(f"{BASES_SOURCE}: Base generata senza contratto views ({target})")

    for target in sorted(generated_targets & declared_targets):
        view_id, view = declared_by_file[target]
        base_doc = yaml.safe_load(outputs[target]) or {}
        available = base_fields_from_doc(base_doc)
        for field in sorted(set(view.get("required_fields", []) or []) - available):
            errors.append(f"bases_views.{view_id}: {target} non espone required_field {field}")

        if view.get("map_view"):
            base_views = base_doc.get("views", []) or []
            has_map = any(item.get("type") == "map" for item in base_views if isinstance(item, dict))
            has_table = any(item.get("type") == "table" for item in base_views if isinstance(item, dict))
            if not has_map:
                errors.append(f"bases_views.{view_id}: map_view senza vista map")
            if not has_table:
                errors.append(f"bases_views.{view_id}: map_view senza fallback table")

    return outputs, errors


def render_all(modules: dict[str, dict[str, Any]] | None = None) -> tuple[dict[str, str], list[str]]:
    modules = modules or load_modules()
    outputs: dict[str, str] = {}
    errors: list[str] = []

    for rendered, render_errors in (render_fileclasses(modules), render_bases(modules)):
        errors.extend(render_errors)
        for target, content in rendered.items():
            if target in outputs:
                errors.append(f"{target}: target metadata duplicato")
            if not content.strip():
                errors.append(f"{target}: render vuoto")
            outputs[target] = content

    return dict(sorted(outputs.items())), errors


def target_path(target_root: Path, rel_path: str) -> Path:
    return target_root / rel_path


def preview_path(rel_path: str) -> Path:
    return PREVIEW_DIR / rel_path


def check_outputs(outputs: dict[str, str]) -> list[str]:
    errors: list[str] = []
    for rel_path, expected in outputs.items():
        local_path = ROOT / rel_path
        local_root = ROOT / rel_path.split("/", 1)[0]
        if not local_path.exists():
            if local_root.exists():
                errors.append(f"{rel_path}: output mancante nella root generata locale")
            continue
        actual = local_path.read_text(encoding="utf-8")
        if actual != expected:
            diff_lines = list(difflib.unified_diff(
                actual.splitlines(),
                expected.splitlines(),
                fromfile=rel_path,
                tofile=f"{rel_path}.expected",
                lineterm="",
            ))
            errors.append(f"{rel_path}: output generato non aggiornato\n" + "\n".join(diff_lines[:60]))
    return errors


def write_outputs(outputs: dict[str, str], target_root: Path) -> None:
    for rel_path, content in outputs.items():
        path = target_path(target_root, rel_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")


def write_previews(outputs: dict[str, str]) -> None:
    for rel_path, content in outputs.items():
        path = preview_path(rel_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Renderizza fileClass e Bases dai moduli YAML sorgente.")
    parser.add_argument("--check", action="store_true", help="Verifica il contratto senza creare output sorgente.")
    parser.add_argument("--list-targets", action="store_true", help="Elenca i target generati relativi al repository.")
    parser.add_argument("--target-root", help="Materializza le superfici generate sotto una root esterna, di norma la release.")
    args = parser.parse_args()

    outputs, errors = render_all()

    if args.list_targets:
        for rel_path in outputs:
            print(rel_path)
        return 0 if not errors else 1

    if args.check:
        errors.extend(check_outputs(outputs))
        if errors:
            print("Errori metadata surfaces:", file=sys.stderr)
            for error in errors:
                print(f"- {error}", file=sys.stderr)
            return 1
        materialized = [root for root in GENERATED_ROOTS if (ROOT / root).exists()]
        mode = "root locali assenti, render verificato in memoria"
        if materialized:
            mode = f"root locali confrontate: {', '.join(materialized)}"
        print(f"Metadata surfaces OK: {len(outputs)} file, {mode}.")
        return 0

    if errors:
        print("Errori metadata surfaces:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    if args.target_root:
        target_root = Path(args.target_root).resolve()
        write_outputs(outputs, target_root)
        print(f"Metadata surfaces materializzate: {len(outputs)} file in {target_root}.")
        return 0

    write_previews(outputs)
    print(f"Metadata surfaces renderizzate: {len(outputs)} anteprime in {PREVIEW_DIR.relative_to(ROOT)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
