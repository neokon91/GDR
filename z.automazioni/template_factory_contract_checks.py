from __future__ import annotations

import yaml

from template_factory_utils import ROOT, known_frontmatter_fields, plugin_key, resolved_blueprints


def fail(message: str, errors: list[str]) -> None:
    errors.append(message)


def validate_worldbuilding_depth_axes(modules: dict[str, dict], errors: list[str]) -> None:
    """Valida gli assi opzionali: devono aiutare il DM, non diventare un secondo schema obbligatorio."""
    module = modules["worldbuilding_depth_axes"]
    profiles = module.get("profiles", {})
    rules = module.get("rules", {}) or {}
    rights = module.get("rights", {}) or {}
    min_axes = int(rules.get("min_axes_per_profile", 3))
    max_axes = int(rules.get("max_axes_per_profile", 5))
    scale = rules.get("scale", {}) or {}
    scale_min = int(scale.get("min", 1))
    scale_max = int(scale.get("max", 5))
    known_entity_profiles = set(modules["entity_depth"].get("families", {}))
    known_frontmatter_profiles = set(modules["frontmatter_profiles"].get("profiles", {}))
    known_taxonomy_profiles = {
        str(profile_id)
        for family in modules["taxonomy_depth"].get("families", {}).values()
        for profile_id in (family.get("profile_contracts", {}) or {})
    }
    # I target possono essere profili base o blueprint specifici come luogo_tempio/fazione_gilda.
    known_blueprints = set(resolved_blueprints(modules))
    known_profiles = known_entity_profiles | known_frontmatter_profiles | known_taxonomy_profiles | known_blueprints

    # Gli assi sono una idea originale dell'autore: il blocco diritti e parte del contratto.
    if rights.get("status") != "idea_originale_riservata":
        fail("worldbuilding_depth_axes: status diritti non esplicito o non riservato", errors)
    if rights.get("license") != "non_inclusa_nella_licenza_generale_del_vault":
        fail("worldbuilding_depth_axes: licenza assi non separata dalla licenza generale", errors)
    if not rights.get("owner") or not rights.get("note"):
        fail("worldbuilding_depth_axes: owner/note diritti mancanti", errors)
    if rules.get("optional") is not True:
        fail("worldbuilding_depth_axes: gli assi devono restare opzionali", errors)
    if scale_min != 1 or scale_max != 5:
        fail("worldbuilding_depth_axes: la scala deve restare 1-5", errors)
    if not profiles:
        fail("worldbuilding_depth_axes: nessun profilo definito", errors)
        return

    for profile_id, profile in profiles.items():
        axes = profile.get("axes", {}) or {}
        if len(axes) < min_axes or len(axes) > max_axes:
            fail(f"worldbuilding_depth_axes.{profile_id}: usare {min_axes}-{max_axes} assi, non {len(axes)}", errors)
        if not profile.get("intent"):
            fail(f"worldbuilding_depth_axes.{profile_id}: intent mancante", errors)
        if not profile.get("source"):
            fail(f"worldbuilding_depth_axes.{profile_id}: source FantasyWorld mancante", errors)

        for target in profile.get("recommended_for", []) or []:
            if str(target) not in known_profiles:
                fail(f"worldbuilding_depth_axes.{profile_id}: recommended_for non mappato nel vault ({target})", errors)

        for axis_id, axis in axes.items():
            for key in ("label", "question", "low", "mid", "high", "table_use"):
                if not axis.get(key):
                    fail(f"worldbuilding_depth_axes.{profile_id}.{axis_id}: chiave mancante {key}", errors)


def validate_release_boundary_contract(modules: dict[str, dict], errors: list[str]) -> None:
    """Valida il confine release: il packaging deve restare guidato da YAML, non da hardcoding JS."""
    boundary = modules["release_boundary"]
    required_lists = [
        "required_files",
        "forbidden_roots",
        "forbidden_paths",
        "forbidden_text_markers",
        "required_plugins",
        "forbidden_automation_prefixes",
        "bridge_runtime_modules",
        "leggimi_markers",
    ]

    for key in required_lists:
        values = boundary.get(key)
        if not isinstance(values, list) or not values:
            fail(f"release_boundary.{key}: lista mancante o vuota", errors)

    for rel_path in boundary.get("required_files", []) or []:
        if str(rel_path) == "LEGGIMI.md":
            continue
        if not (ROOT / str(rel_path)).exists():
            fail(f"release_boundary.required_files: file sorgente mancante ({rel_path})", errors)

    forbidden_roots = set(str(path) for path in boundary.get("forbidden_roots", []) or [])
    for root in ("Dev", "dist", "node_modules"):
        if root not in forbidden_roots:
            fail(f"release_boundary.forbidden_roots: root obbligatoria mancante ({root})", errors)

    forbidden_paths = set(str(path) for path in boundary.get("forbidden_paths", []) or [])
    for rel_path in (
        "Dev/TemplateFactory/modules/worldbuilding_depth_axes.yaml",
        "Dev/TemplateFactory/modules/demo_contract.yaml",
    ):
        if rel_path not in forbidden_paths:
            fail(f"release_boundary.forbidden_paths: modulo dev/riservato non vietato ({rel_path})", errors)

    markers = set(str(marker) for marker in boundary.get("forbidden_text_markers", []) or [])
    rights = modules["worldbuilding_depth_axes"].get("rights", {}) or {}
    for marker in (rights.get("status"), rights.get("license"), "source_lab: /Users/andrea/Desktop/projects/FantasyWorld"):
        if marker and str(marker) not in markers:
            fail(f"release_boundary.forbidden_text_markers: marker diritti/lab mancante ({marker})", errors)

    community_plugins_path = ROOT / ".obsidian" / "community-plugins.json"
    community_plugins = set(yaml.safe_load(community_plugins_path.read_text(encoding="utf-8")) or [])
    for plugin in boundary.get("required_plugins", []) or []:
        if str(plugin) not in community_plugins:
            fail(f"release_boundary.required_plugins: plugin non abilitato nel vault ({plugin})", errors)


def validate_taxonomy_depth_contracts(modules: dict[str, dict], errors: list[str]) -> None:
    """Valida le famiglie tassonomiche: SRD e worldbuilding devono restare collegati a profili reali."""
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
