#!/usr/bin/env python3

from __future__ import annotations

import sys
import re
from pathlib import Path

import yaml

sys.dont_write_bytecode = True

from template_factory_utils import (
    FACTORY,
    MODULES,
    ROOT,
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
    "frontmatter_profiles",
    "runtime_profiles",
    "entity_depth",
    "taxonomy_depth",
    "dnd55_options",
    "workflows",
}
CRITICAL_RENDERED_GENERATORS = {
    "mappa": "z.automazioni/mappa.js",
    "luogo": "z.automazioni/luogo.js",
    "sessione": "z.automazioni/sessione.js",
    "incontro": "z.automazioni/incontro.js",
    "png": "z.automazioni/png.js",
    "creatura": "z.automazioni/creatura.js",
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


def validate_critical_rendered_generators(modules: dict[str, dict], errors: list[str]) -> None:
    frontmatter_profiles = modules["frontmatter_profiles"].get("profiles", {})
    runtime_profiles = modules["runtime_profiles"].get("profiles", {})

    for profile_id, rel_path in sorted(CRITICAL_RENDERED_GENERATORS.items()):
        if profile_id not in frontmatter_profiles:
            fail(f"M5.0: profilo frontmatter critico mancante ({profile_id})", errors)
        if profile_id not in runtime_profiles:
            fail(f"M5.0: profilo runtime critico mancante ({profile_id})", errors)

        path = ROOT / rel_path
        if not path.exists():
            fail(f"M5.0: generatore critico mancante ({rel_path})", errors)
            continue

        source = path.read_text(encoding="utf-8")
        if f'renderFrontmatter("{profile_id}"' not in source:
            fail(f"M5.0: {rel_path} non usa renderFrontmatter(\"{profile_id}\")", errors)
        if "return `---" in source:
            fail(f"M5.0: {rel_path} contiene ancora frontmatter inline", errors)


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


def known_frontmatter_fields(modules: dict[str, dict]) -> set[str]:
    frontmatter = modules["frontmatter_profiles"]
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
    return field_names | plugin_fields | declared_plugin_fields | domain_fields


def metabind_input_field(input_body: str) -> str:
    body = input_body.strip()
    if not body:
        return ""
    if ":" in body:
        return body.rsplit(":", 1)[-1].strip()
    return ""


def validate_plugin_surface_contracts(modules: dict[str, dict], errors: list[str]) -> None:
    """Keep generated plugin-native surfaces declared in YAML, not hidden in Jinja."""
    jinja_text_by_path = {
        path: path.read_text(encoding="utf-8")
        for path in sorted((FACTORY / "jinja").glob("*.j2"))
    }
    all_text = "\n".join(jinja_text_by_path.values())

    known_fields = known_frontmatter_fields(modules)
    button_ids = {
        str(button.get("id"))
        for button in modules["metabind_buttons"].get("buttons", {}).values()
        if button.get("id")
    }
    callout_types = {
        str(callout.get("type"))
        for callout in modules["callouts"].get("callouts", {}).values()
        if callout.get("type")
    }
    runtime_views = {
        str(block.get("runtime_view"))
        for block in modules["dataview_blocks"].get("blocks", {}).values()
        if block.get("runtime_view")
    }
    for block in modules["dataview_blocks"].get("blocks", {}).values():
        code = str(block.get("code", ""))
        for match in re.finditer(r"gdr\.([A-Za-z0-9_]+)\(", code):
            runtime_views.add(match.group(1))
    base_files = {
        str(view.get("file"))
        for view in modules["bases_views"].get("views", {}).values()
        if view.get("file")
    }

    for path, text in jinja_text_by_path.items():
        rel_path = path.relative_to(ROOT)
        for match in re.finditer(r"INPUT\[([^\]]+)\]", text):
            field = metabind_input_field(match.group(1))
            if field and field not in known_fields:
                fail(f"{rel_path}: Meta Bind INPUT non dichiarato nei campi YAML ({field})", errors)

        for match in re.finditer(r"BUTTON\[([^\]]+)\]", text):
            button_id = match.group(1).strip()
            if button_id not in button_ids:
                fail(f"{rel_path}: Meta Bind BUTTON non dichiarato in metabind_buttons.yaml ({button_id})", errors)

        for match in re.finditer(r"(?m)^> \[!([^\]\-]+)[^\]]*\]", text):
            callout_type = match.group(1).strip()
            if callout_type not in callout_types:
                fail(f"{rel_path}: callout non dichiarato in callouts.yaml ({callout_type})", errors)

        for match in re.finditer(r"gdr\.([A-Za-z0-9_]+)\(", text):
            view = match.group(1)
            if view not in runtime_views:
                fail(f"{rel_path}: runtime DataviewJS non dichiarato in dataview_blocks.yaml ({view})", errors)

        for match in re.finditer(r"\[\[(z\.bases/[^]|#]+\.base)", text):
            base = match.group(1)
            if base not in base_files:
                fail(f"{rel_path}: Base linkata non dichiarata in bases_views.yaml ({base})", errors)

    if "````tabs" in all_text and "tabs" not in modules:
        fail("TemplateFactory: Tabs usato dai Jinja ma modulo tabs mancante", errors)


def validate_entity_depth_contracts(modules: dict[str, dict], errors: list[str]) -> None:
    families = modules["entity_depth"].get("families", {})
    if not families:
        fail("entity_depth: nessuna famiglia definita", errors)
        return

    frontmatter_profiles = modules["frontmatter_profiles"].get("profiles", {})
    runtime_profiles = modules["runtime_profiles"].get("profiles", {})
    known_fields = known_frontmatter_fields(modules)
    sections = modules["sections"].get("sections", {})
    layouts = modules["tabs"].get("layouts", {})
    bindings = modules["plugin_bindings"]
    plugin_bindings = bindings.get("bindings", {})

    for family_id, family in families.items():
        frontmatter_profile = str(family.get("frontmatter_profile", ""))
        runtime_profile = str(family.get("runtime_profile", ""))
        if frontmatter_profile not in frontmatter_profiles:
            fail(f"entity_depth.{family_id}: frontmatter_profile mancante ({frontmatter_profile})", errors)
            continue
        if runtime_profile not in runtime_profiles:
            fail(f"entity_depth.{family_id}: runtime_profile mancante ({runtime_profile})", errors)
            continue

        profile_fields = {
            str(field.get("key"))
            for field in frontmatter_profiles[frontmatter_profile].get("fields", [])
            if isinstance(field, dict) and field.get("key")
        }
        runtime_prompts = set((runtime_profiles[runtime_profile].get("prompts", {}) or {}).keys())

        for field in family.get("required_frontmatter_fields", []) or []:
            field = str(field)
            if field not in known_fields:
                fail(f"entity_depth.{family_id}: campo frontmatter non catalogato ({field})", errors)
            if field not in profile_fields:
                fail(f"entity_depth.{family_id}: campo non esposto dal profilo {frontmatter_profile} ({field})", errors)

        for prompt in family.get("required_runtime_prompts", []) or []:
            prompt = str(prompt)
            if prompt not in runtime_prompts:
                fail(f"entity_depth.{family_id}: prompt runtime mancante in {runtime_profile} ({prompt})", errors)

        for section in family.get("required_sections", []) or []:
            section = str(section)
            if section not in sections:
                fail(f"entity_depth.{family_id}: sezione richiesta mancante ({section})", errors)

        for layout in family.get("required_tabs", []) or []:
            layout = str(layout)
            if layout not in layouts:
                fail(f"entity_depth.{family_id}: layout tabs richiesto mancante ({layout})", errors)

        for plugin in family.get("plugin_surfaces", []) or []:
            plugin = str(plugin)
            key = plugin_key(plugin, bindings)
            if key not in plugin_bindings:
                fail(f"entity_depth.{family_id}: plugin surface non dichiarata ({plugin})", errors)


def validate_taxonomy_depth_contracts(modules: dict[str, dict], errors: list[str]) -> None:
    families = modules["taxonomy_depth"].get("families", {})
    if not families:
        fail("taxonomy_depth: nessuna famiglia definita", errors)
        return

    frontmatter_profiles = modules["frontmatter_profiles"].get("profiles", {})
    runtime_profiles = modules["runtime_profiles"].get("profiles", {})
    known_fields = known_frontmatter_fields(modules)
    sections = modules["sections"].get("sections", {})
    layouts = modules["tabs"].get("layouts", {})
    bindings = modules["plugin_bindings"]
    plugin_bindings = bindings.get("bindings", {})
    dnd55_option_groups = set(modules["dnd55_options"].get("groups", {}))

    for family_id, family in families.items():
        for folder in family.get("source_folders", []) or []:
            if not (ROOT / str(folder)).exists():
                fail(f"taxonomy_depth.{family_id}: cartella sorgente mancante ({folder})", errors)

        for section in family.get("required_sections", []) or []:
            section = str(section)
            if section not in sections:
                fail(f"taxonomy_depth.{family_id}: sezione richiesta mancante ({section})", errors)

        for layout in family.get("required_tabs", []) or []:
            layout = str(layout)
            if layout not in layouts:
                fail(f"taxonomy_depth.{family_id}: layout tabs richiesto mancante ({layout})", errors)

        for plugin in family.get("plugin_surfaces", []) or []:
            plugin = str(plugin)
            key = plugin_key(plugin, bindings)
            if key not in plugin_bindings:
                fail(f"taxonomy_depth.{family_id}: plugin surface non dichiarata ({plugin})", errors)

        profile_contracts = family.get("profile_contracts", {}) or {}
        if not profile_contracts:
            fail(f"taxonomy_depth.{family_id}: nessun profile_contract dichiarato", errors)
            continue

        for profile_id, contract in profile_contracts.items():
            profile_id = str(profile_id)
            if profile_id not in frontmatter_profiles:
                fail(f"taxonomy_depth.{family_id}: profilo frontmatter mancante ({profile_id})", errors)
                continue
            if profile_id not in runtime_profiles:
                fail(f"taxonomy_depth.{family_id}: profilo runtime mancante ({profile_id})", errors)
                continue

            profile_fields = {
                str(field.get("key"))
                for field in frontmatter_profiles[profile_id].get("fields", [])
                if isinstance(field, dict) and field.get("key")
            }
            for field in contract.get("required_frontmatter_fields", []) or []:
                field = str(field)
                if field not in known_fields:
                    fail(f"taxonomy_depth.{family_id}.{profile_id}: campo non catalogato ({field})", errors)
                if field not in profile_fields:
                    fail(f"taxonomy_depth.{family_id}.{profile_id}: campo non esposto dal profilo ({field})", errors)

            for option_group in contract.get("option_groups", []) or []:
                option_group = str(option_group)
                if option_group not in dnd55_option_groups:
                    fail(f"taxonomy_depth.{family_id}.{profile_id}: option_group D&D 5.5 mancante ({option_group})", errors)


def validate_dnd55_options(modules: dict[str, dict], errors: list[str]) -> None:
    options = modules["dnd55_options"]
    if options.get("language") != "it":
        fail("dnd55_options: language deve essere it", errors)

    groups = options.get("groups", {})
    if not isinstance(groups, dict) or not groups:
        fail("dnd55_options: nessun gruppo valori definito", errors)
        return

    required_groups = {
        "livelli_incantesimo",
        "scuole_magia",
        "tempi_lancio",
        "componenti_incantesimo",
        "gittate_incantesimo",
        "durate_incantesimo",
        "classi",
        "specie",
        "background",
        "tipi_creatura",
        "taglie",
        "allineamenti",
        "rarita",
        "azioni",
        "caratteristiche",
        "tiri_salvezza",
        "grado_sfida",
        "difficolta_cd",
        "dadi_danno",
        "tipi_danno",
        "condizioni",
        "categorie_equipaggiamento",
        "proprieta_armi",
    }
    for group in sorted(required_groups - set(groups)):
        fail(f"dnd55_options: gruppo obbligatorio mancante ({group})", errors)

    for group_id, group in groups.items():
        if not isinstance(group, dict):
            fail(f"dnd55_options.{group_id}: gruppo non oggetto", errors)
            continue
        if not group.get("field"):
            fail(f"dnd55_options.{group_id}: field mancante", errors)
        values = group.get("values", [])
        if not isinstance(values, list) or not values:
            fail(f"dnd55_options.{group_id}: values mancante o vuoto", errors)
            continue
        seen: set[str] = set()
        for index, value in enumerate(values):
            if not isinstance(value, dict):
                fail(f"dnd55_options.{group_id}[{index}]: valore non oggetto", errors)
                continue
            value_id = str(value.get("id", ""))
            label = str(value.get("label", ""))
            if not value_id or not label:
                fail(f"dnd55_options.{group_id}[{index}]: richiede id e label", errors)
            if value_id in seen:
                fail(f"dnd55_options.{group_id}: id duplicato ({value_id})", errors)
            seen.add(value_id)
            if label.lower() in {"action", "bonus action", "reaction", "tiny", "small", "medium", "large"}:
                fail(f"dnd55_options.{group_id}[{index}]: label non localizzata in italiano ({label})", errors)


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
        validate_runtime_profiles(modules, errors)
    if not errors:
        validate_profile_symmetry(modules, errors)
    if not errors:
        validate_frontmatter_profiles(modules, errors)
    if not errors:
        validate_critical_rendered_generators(modules, errors)
    if not errors:
        validate_plugin_surface_contracts(modules, errors)
    if not errors:
        validate_entity_depth_contracts(modules, errors)
    if not errors:
        validate_taxonomy_depth_contracts(modules, errors)
    if not errors:
        validate_dnd55_options(modules, errors)
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
