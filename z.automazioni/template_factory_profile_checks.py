from __future__ import annotations

import re
from pathlib import Path

import yaml

from template_factory_utils import ROOT, collect_field_names


def fail(message: str, errors: list[str]) -> None:
    errors.append(message)


def validate_runtime_profiles(modules: dict[str, dict], errors: list[str]) -> None:
    profiles = modules["runtime_profiles"].get("profiles", {})
    if not profiles:
        fail("runtime_profiles: nessun profilo definito", errors)
        return

    for profile_id, profile in profiles.items():
        if not profile.get("name_prompt"):
            fail(f"runtime_profiles.{profile_id}: name_prompt mancante", errors)
        if "prompts" not in profile or not isinstance(profile.get("prompts"), dict):
            fail(f"runtime_profiles.{profile_id}: prompts mancante o non oggetto", errors)

        for option_group in (
            "type_options",
            "biome_options",
            "rarity_options",
            "status_options",
            "size_options",
            "alignment_options",
            "level_options",
            "school_options",
            "casting_time_options",
            "component_options",
            "range_options",
            "duration_options",
            "class_options",
            "species_options",
            "background_options",
            "difficulty_options",
            "damage_options",
            "condition_options",
        ):
            options = profile.get(option_group, [])
            if options and not isinstance(options, list):
                fail(f"runtime_profiles.{profile_id}.{option_group}: deve essere una lista", errors)
                continue
            for index, option in enumerate(options):
                if not isinstance(option, dict) or not option.get("label") or not option.get("id"):
                    fail(f"runtime_profiles.{profile_id}.{option_group}[{index}]: richiede label e id", errors)

        if profile.get("type_options") and not profile.get("type_prompt"):
            fail(f"runtime_profiles.{profile_id}: type_prompt mancante con type_options presenti", errors)

        option_sources = profile.get("option_sources", {}) or {}
        if option_sources and not isinstance(option_sources, dict):
            fail(f"runtime_profiles.{profile_id}: option_sources deve essere un oggetto", errors)
            continue
        dnd55_groups = modules.get("dnd55_options", {}).get("groups", {})
        for source_key, source_ref in option_sources.items():
            source_ref = str(source_ref)
            if not source_ref.startswith("dnd55_options."):
                fail(f"runtime_profiles.{profile_id}.{source_key}: option_source non supportata ({source_ref})", errors)
                continue
            group_id = source_ref.split(".", 1)[1]
            if group_id not in dnd55_groups:
                fail(f"runtime_profiles.{profile_id}.{source_key}: gruppo dnd55_options mancante ({group_id})", errors)


def validate_profile_symmetry(modules: dict[str, dict], errors: list[str]) -> None:
    runtime_profiles = set(modules["runtime_profiles"].get("profiles", {}))
    frontmatter_profiles = set(modules["frontmatter_profiles"].get("profiles", {}))

    for profile in sorted(runtime_profiles - frontmatter_profiles):
        fail(f"runtime_profiles.{profile}: profilo frontmatter mancante", errors)
    for profile in sorted(frontmatter_profiles - runtime_profiles):
        fail(f"frontmatter_profiles.{profile}: profilo runtime mancante", errors)


def validate_frontmatter_profiles(modules: dict[str, dict], errors: list[str]) -> None:
    frontmatter = modules["frontmatter_profiles"]
    profiles = frontmatter.get("profiles", {})
    if not profiles:
        fail("frontmatter_profiles: nessun profilo definito", errors)
        return
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
    known_fields = field_names | plugin_fields | declared_plugin_fields | domain_fields

    for profile_id, profile in profiles.items():
        fields = profile.get("fields", [])
        if not isinstance(fields, list) or not fields:
            fail(f"frontmatter_profiles.{profile_id}: fields mancante o vuoto", errors)
            continue
        sample_values = set(profile.get("sample_values", []) or [])

        seen: set[str] = set()
        for index, field in enumerate(fields):
            if not isinstance(field, dict) or not field.get("key"):
                fail(f"frontmatter_profiles.{profile_id}.fields[{index}]: key mancante", errors)
                continue

            key = str(field["key"])
            if key in seen:
                fail(f"frontmatter_profiles.{profile_id}: campo duplicato {key}", errors)
            seen.add(key)

            if "value" not in field and "default" not in field:
                fail(f"frontmatter_profiles.{profile_id}.{key}: richiede value o default", errors)
            if key not in known_fields:
                fail(f"frontmatter_profiles.{profile_id}.{key}: campo non presente in fields_core/plugin/domain catalog", errors)
            if field.get("plugin") and key not in declared_plugin_fields and key not in plugin_fields:
                fail(f"frontmatter_profiles.{profile_id}.{key}: plugin field non dichiarato ({field.get('plugin')})", errors)
            if field.get("value") and field["value"] in sample_values:
                sample_values.remove(field["value"])

        for missing in sorted(sample_values):
            fail(f"frontmatter_profiles.{profile_id}: sample value non usato ({missing})", errors)

        validate_frontmatter_sample(profile_id, profile, errors)
        validate_frontmatter_integrations(profile_id, profile, seen, errors)

    validate_frontmatter_migration_backlog(frontmatter, errors)


def validate_frontmatter_migration_backlog(frontmatter: dict, errors: list[str]) -> None:
    backlog = {str(path) for path in frontmatter.get("migration_backlog", []) or []}
    inline_generators: set[str] = set()

    for path in sorted((ROOT / "z.automazioni").glob("*.js")):
        rel_path = str(path.relative_to(ROOT))
        source = path.read_text(encoding="utf-8")
        if "return `---" in source and "renderFrontmatter(" not in source:
            inline_generators.add(rel_path)

    for missing in sorted(inline_generators - backlog):
        fail(f"frontmatter_profiles: generatore inline non censito nel migration_backlog ({missing})", errors)

    for stale in sorted(backlog - inline_generators):
        fail(f"frontmatter_profiles: migration_backlog obsoleto o gia migrato ({stale})", errors)


def yaml_document(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if text.startswith("---\n"):
        end = text.find("\n---", 4)
        if end != -1:
            text = text[4:end]
    data = yaml.safe_load(text) or {}
    return data if isinstance(data, dict) else {}


def fileclass_fields(path: Path) -> set[str]:
    data = yaml_document(path)
    fields = {str(field) for field in data.get("fieldsOrder", []) or []}
    for field in data.get("fields", []) or []:
        if isinstance(field, dict) and field.get("name"):
            fields.add(str(field["name"]))
    return fields


def base_fields(path: Path) -> set[str]:
    data = yaml_document(path)
    fields: set[str] = set()

    for key in (data.get("properties", {}) or {}):
        key = str(key)
        if key.startswith("formula."):
            continue
        fields.add(key.removeprefix("note."))

    for view in data.get("views", []) or []:
        if not isinstance(view, dict):
            continue
        for field in view.get("order", []) or []:
            field = str(field)
            if not field.startswith("formula."):
                fields.add(field.removeprefix("note."))

    return fields


def validate_frontmatter_integrations(profile_id: str, profile: dict, profile_fields: set[str], errors: list[str]) -> None:
    integrations = profile.get("integrations", {}) or {}
    required_fields = set(integrations.get("required_fields", []) or [])

    for field in sorted(required_fields - profile_fields):
        fail(f"frontmatter_profiles.{profile_id}: required_field non presente nel profilo ({field})", errors)

    fileclass = integrations.get("fileclass")
    if fileclass:
        path = ROOT / str(fileclass)
        if not path.exists():
            fail(f"frontmatter_profiles.{profile_id}: fileClass mancante {fileclass}", errors)
        else:
            available = fileclass_fields(path)
            for field in sorted(required_fields - available):
                fail(f"frontmatter_profiles.{profile_id}: {fileclass} non espone required_field {field}", errors)

    for base in integrations.get("bases", []) or []:
        path = ROOT / str(base)
        if not path.exists():
            fail(f"frontmatter_profiles.{profile_id}: Base mancante {base}", errors)
            continue
        available = base_fields(path)
        for field in sorted(required_fields - available):
            fail(f"frontmatter_profiles.{profile_id}: {base} non espone required_field {field}", errors)


def render_frontmatter_sample(profile: dict) -> str:
    sample_values = {key: f"sample_{key}" for key in profile.get("sample_values", []) or []}
    lines = []
    for field in profile.get("fields", []) or []:
        value_key = field.get("value")
        value = sample_values.get(value_key, field.get("default", ""))
        if isinstance(value, list):
            rendered = "[]"
        elif isinstance(value, bool):
            rendered = "true" if value else "false"
        else:
            rendered = str(value)
        lines.append(f"{field.get('key')}: {rendered}")
    return "---\n" + "\n".join(lines) + "\n---\n"


def validate_frontmatter_sample(profile_id: str, profile: dict, errors: list[str]) -> None:
    rendered = render_frontmatter_sample(profile)
    match = re.match(r"^---\n([\s\S]*?)\n---\n?$", rendered)
    if not match:
        fail(f"frontmatter_profiles.{profile_id}: sample frontmatter senza delimitatori validi", errors)
        return
    try:
        parsed = yaml.safe_load(match.group(1)) or {}
    except yaml.YAMLError as exc:
        fail(f"frontmatter_profiles.{profile_id}: sample frontmatter YAML non valido ({exc})", errors)
        return
    if not isinstance(parsed, dict):
        fail(f"frontmatter_profiles.{profile_id}: sample frontmatter non produce un oggetto YAML", errors)
