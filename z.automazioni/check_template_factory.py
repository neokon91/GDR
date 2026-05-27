#!/usr/bin/env python3

from __future__ import annotations

import sys
import re
from pathlib import Path

sys.dont_write_bytecode = True

from template_factory_utils import (
    FACTORY,
    MODULES,
    ROOT,
    build_jinja_env,
    collect_field_names,
    known_frontmatter_fields,
    load_modules,
    plugin_key,
    render_context,
    resolved_blueprints,
    validate_rendered,
)
from template_factory_contract_checks import (
    validate_release_boundary_contract,
    validate_taxonomy_depth_contracts,
    validate_worldbuilding_depth_axes,
)
from template_factory_profile_checks import (
    validate_frontmatter_profiles,
    validate_profile_symmetry,
    validate_runtime_profiles,
)
from template_factory_surface_checks import validate_plugin_surface_contracts, validate_workflow_quick_actions


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
    "bacheche",
    "frontmatter_profiles",
    "runtime_profiles",
    "entity_depth",
    "worldbuilding_depth_axes",
    "demo_contract",
    "release_boundary",
    "taxonomy_depth",
    "dnd55_options",
    "link_targets",
    "tag_rules",
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

    playable_required = {"gancio", "uso_al_tavolo", "scelta", "posta", "rischi", "prossima_mossa"}
    playable_fields = set(sections.get("giocabilita", {}).get("fields", []) or [])
    for field in sorted(playable_required - playable_fields):
        fail(f"sections.giocabilita: campo worldbuilding giocabile mancante ({field})", errors)


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


def validate_pg_mechanical_preview(modules: dict[str, dict], errors: list[str]) -> None:
    blueprints = resolved_blueprints(modules)
    blueprint = blueprints.get("pg")
    if not blueprint:
        fail("pg: blueprint mancante", errors)
        return

    env = build_jinja_env()
    template_ref = Path(str(blueprint["jinja_template"])).name
    text = env.get_template(template_ref).render(**render_context("pg", blueprint, modules))
    if "undefined" in text:
        fail("pg: output renderizzato contiene 'undefined'", errors)
    if "tab: Scheda" not in text:
        fail("pg: tab Scheda mancante", errors)
    if "INPUT[number:caratteristiche.forza.stat]" not in text:
        fail("pg: INPUT caratteristiche mancante", errors)
    if "VIEW[floor(({" not in text:
        fail("pg: VIEW modificatori mancante", errors)
    if "punti_ferita.attuali" not in text:
        fail("pg: slider punti ferita mancante", errors)


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


def validate_entity_depth_contracts(modules: dict[str, dict], errors: list[str]) -> None:
    families = modules["entity_depth"].get("families", {})
    contracts = modules["entity_depth"].get("contracts", {}) or {}
    playability_gate = contracts.get("playability_gate", {}) or {}
    playability_groups = playability_gate.get("field_groups", {}) or {}
    min_playability_groups = int(playability_gate.get("min_groups_present", 0) or 0)
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

    if min_playability_groups <= 0:
        fail("entity_depth.contracts.playability_gate: min_groups_present deve essere positivo", errors)
    if not isinstance(playability_groups, dict) or not playability_groups:
        fail("entity_depth.contracts.playability_gate: field_groups mancante", errors)

    for group_id, group in playability_groups.items():
        fields = group.get("fields", []) if isinstance(group, dict) else []
        if not fields:
            fail(f"entity_depth.contracts.playability_gate.{group_id}: fields mancante", errors)
            continue
        if not group.get("reason"):
            fail(f"entity_depth.contracts.playability_gate.{group_id}: reason mancante", errors)
        for field in fields:
            if str(field) not in known_fields:
                fail(f"entity_depth.contracts.playability_gate.{group_id}: campo non catalogato ({field})", errors)

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
        required_fields = {str(field) for field in family.get("required_frontmatter_fields", []) or []}
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

        present_groups = []
        for group_id, group in playability_groups.items():
            group_fields = {str(field) for field in (group.get("fields", []) if isinstance(group, dict) else [])}
            if required_fields & profile_fields & group_fields:
                present_groups.append(str(group_id))

        if len(present_groups) < min_playability_groups:
            fail(
                f"entity_depth.{family_id}: contratto giocabilita debole "
                f"({len(present_groups)}/{min_playability_groups} gruppi: {', '.join(present_groups) or 'nessuno'})",
                errors,
            )


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


def validate_link_target_contracts(modules: dict[str, dict], errors: list[str]) -> None:
    link_targets = modules["link_targets"]
    fields = link_targets.get("fields", {})
    if not isinstance(fields, dict) or not fields:
        fail("link_targets: nessun campo definito", errors)
        return

    known_fields = collect_field_names(modules["fields_core"])
    for field_id, field in fields.items():
        if field_id not in known_fields:
            fail(f"link_targets.{field_id}: campo non presente in fields_core", errors)
        target = str((field or {}).get("target", ""))
        if target not in {"note_or_section_or_block", "section", "block"}:
            fail(f"link_targets.{field_id}: target non supportato ({target})", errors)

    syntax = link_targets.get("syntax", {})
    samples = {
        "note": "[[Mondi/Luoghi/Porto Di Prova]]",
        "section": "[[Mondi/Sessioni/2026-05-28 - La Campana Nella Nebbia#Apertura]]",
        "block": "[[Risorse/Tabelle/Tabelle#^complicazioni]]",
    }
    for syntax_id, sample in samples.items():
        pattern = syntax.get(syntax_id)
        if not pattern:
            fail(f"link_targets.syntax.{syntax_id}: pattern mancante", errors)
            continue
        try:
            if not re.fullmatch(str(pattern), sample):
                fail(f"link_targets.syntax.{syntax_id}: pattern non valida il campione {sample}", errors)
        except re.error as exc:
            fail(f"link_targets.syntax.{syntax_id}: regex non valida ({exc})", errors)


def allowed_tag_values(modules: dict[str, dict]) -> set[str]:
    allowed: set[str] = set()
    for tags in modules["tag_rules"].get("allowed_tags", {}).values():
        if isinstance(tags, list):
            allowed.update(str(tag) for tag in tags)
    return allowed


def validate_tag_rules(modules: dict[str, dict], errors: list[str]) -> None:
    tag_rules = modules["tag_rules"]
    if tag_rules.get("language") != "it":
        fail("tag_rules: language deve essere it", errors)
    allowed = allowed_tag_values(modules)
    if not allowed:
        fail("tag_rules: nessun tag consentito", errors)
        return

    for tag in sorted(allowed):
        if tag.startswith("#"):
            fail(f"tag_rules: tag senza cancelletto richiesto ({tag})", errors)
        if not re.fullmatch(r"[a-z0-9][a-z0-9/-]*", tag):
            fail(f"tag_rules: tag non semplice o non minuscolo ({tag})", errors)


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
        validate_workflow_quick_actions(modules, errors)
    if not errors:
        validate_entity_depth_contracts(modules, errors)
    if not errors:
        validate_worldbuilding_depth_axes(modules, errors)
    if not errors:
        validate_release_boundary_contract(modules, errors)
    if not errors:
        validate_taxonomy_depth_contracts(modules, errors)
    if not errors:
        validate_dnd55_options(modules, errors)
    if not errors:
        validate_link_target_contracts(modules, errors)
    if not errors:
        validate_tag_rules(modules, errors)
    if not errors:
        validate_rendering(modules, errors)
    if not errors:
        validate_pg_mechanical_preview(modules, errors)

    if errors:
        print("Errori TemplateFactory:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"TemplateFactory OK: {len(modules)} moduli, {len(modules['template_blueprints']['blueprints'])} blueprint.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
