#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

from render_metadata_surfaces import render_all as render_metadata_targets
from render_template_factory import materialized_targets
from template_factory_utils import ROOT, load_modules, load_yaml, resolved_blueprints

sys.dont_write_bytecode = True

MATRIX = ROOT / "Dev" / "Source" / "YAML" / "json" / "plugin_matrix.yaml"
CONTRACTS = ROOT / "Dev" / "Source" / "YAML" / "canonical" / "plugin_contracts.yaml"
BINDINGS = ROOT / "Dev" / "Source" / "YAML" / "canonical" / "plugin_bindings.yaml"
MANUAL_ACCEPTANCE = ROOT / "Dev" / "Source" / "YAML" / "quality" / "manual_acceptance.yaml"
OBSIDIAN_CONFIG = ROOT / "Dev" / "Source" / "YAML" / "json" / "obsidian_config.yaml"
METABIND_CONFIG = ROOT / "Dev" / "Source" / "YAML" / "json" / "metabind_config.yaml"
SOURCE_PIPELINE = ROOT / "Dev" / "Source" / "YAML" / "pipeline" / "source_pipeline.yaml"
RELEASE_BOUNDARY = ROOT / "Dev" / "Source" / "YAML" / "quality" / "release_boundary.yaml"
PLUGIN_MATRIX_JSON = ROOT / "Dev" / "plugin_matrix.json"


def rel_path(path: Path) -> str:
    return str(path.relative_to(ROOT))


def read_json(path: Path, fallback: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return fallback


def read_text_rel(target: Any, fallback: str = "") -> str:
    path = ROOT / str(target or "")
    return path.read_text(encoding="utf-8") if path.exists() and path.is_file() else fallback


def as_string_list(value: Any) -> list[str]:
    return [str(item).strip() for item in value if str(item).strip()] if isinstance(value, list) else []


def as_bool(value: Any, fallback: bool = False) -> bool:
    return value if isinstance(value, bool) else fallback


def load_policy(matrix_source: dict[str, Any], errors: list[str]) -> dict[str, Any]:
    policy = matrix_source.get("audit_policy") if isinstance(matrix_source.get("audit_policy"), dict) else {}
    required_tiers = set(as_string_list(policy.get("required_tiers")))
    optional_allowed = set(as_string_list(policy.get("optional_allowed")))
    support_light_allowed = set(as_string_list(policy.get("support_light_allowed")))
    maintenance_allowed = set(as_string_list(policy.get("maintenance_allowed")))
    minimum_gates_by_tier = policy.get("minimum_gates_by_tier") if isinstance(policy.get("minimum_gates_by_tier"), dict) else {}
    release_enabled = policy.get("release_enabled") if isinstance(policy.get("release_enabled"), dict) else {}
    require_resolved_surfaces = set(as_string_list(release_enabled.get("require_resolved_surfaces")))

    if not required_tiers:
        errors.append(f"{rel_path(MATRIX)}: audit_policy.required_tiers vuoto")
    if not minimum_gates_by_tier:
        errors.append(f"{rel_path(MATRIX)}: audit_policy.minimum_gates_by_tier vuoto")
    if not optional_allowed:
        errors.append(f"{rel_path(MATRIX)}: audit_policy.optional_allowed vuoto")
    if not maintenance_allowed:
        errors.append(f"{rel_path(MATRIX)}: audit_policy.maintenance_allowed vuoto")
    if not require_resolved_surfaces:
        errors.append(f"{rel_path(MATRIX)}: audit_policy.release_enabled.require_resolved_surfaces vuoto")

    return {
        "required_tiers": required_tiers,
        "optional_allowed": optional_allowed,
        "support_light_allowed": support_light_allowed,
        "maintenance_allowed": maintenance_allowed,
        "minimum_gates_by_tier": minimum_gates_by_tier,
        "release_enabled": {
            "require_contract": as_bool(release_enabled.get("require_contract"), True),
            "require_binding": as_bool(release_enabled.get("require_binding"), True),
            "require_runtime_probe": as_bool(release_enabled.get("require_runtime_probe"), True),
            "require_resolved_surfaces": require_resolved_surfaces,
        },
    }


def declared_community_plugins(errors: list[str]) -> list[str]:
    source = load_yaml(OBSIDIAN_CONFIG)
    record = next(
        (
            item
            for item in source.get("configs", []) or []
            if isinstance(item, dict) and item.get("target") == ".obsidian/community-plugins.json"
        ),
        None,
    )
    if record is None:
        errors.append(f"{rel_path(OBSIDIAN_CONFIG)}: target .obsidian/community-plugins.json mancante")
        return []
    plugins = as_string_list(record.get("data"))
    if not plugins:
        errors.append(f"{rel_path(OBSIDIAN_CONFIG)}: community-plugins.json dichiarato senza plugin")
    return plugins


def generated_obsidian_config_targets(errors: list[str]) -> set[str]:
    targets: set[str] = set()
    obsidian_config = load_yaml(OBSIDIAN_CONFIG)
    for record in obsidian_config.get("configs", []) or []:
        if not isinstance(record, dict):
            continue
        target = str(record.get("target") or "").replace("\\", "/").strip()
        if target:
            targets.add(target)
    metabind_config = load_yaml(METABIND_CONFIG)
    metabind_target = str(metabind_config.get("target") or "").replace("\\", "/").strip()
    if metabind_target:
        targets.add(metabind_target)
    if not targets:
        errors.append(f"{rel_path(OBSIDIAN_CONFIG)}/{rel_path(METABIND_CONFIG)}: nessun target Obsidian generato dichiarato")
    return targets


def pipeline_output_targets(errors: list[str]) -> set[str]:
    targets: set[str] = set()
    pipeline = load_yaml(SOURCE_PIPELINE)
    steps = pipeline.get("steps") if isinstance(pipeline.get("steps"), dict) else {}
    for step in steps.values():
        if not isinstance(step, dict):
            continue
        for output in step.get("outputs", []) or []:
            target = str(output or "").replace("\\", "/").strip()
            if not target or target == "memoria" or re.search(r"[*?\[\]]", target):
                continue
            targets.add(target)
            targets.add(re.sub(r"\.(md|json|base|canvas)$", "", target))
    if not targets:
        errors.append(f"{rel_path(SOURCE_PIPELINE)}: nessun output materiale dichiarato")
    return targets


def target_exists(target: Any, generated_targets: set[str], virtual_user_paths: set[str]) -> bool:
    clean = str(target or "").strip()
    if not clean:
        return False
    if re.match(r"^https?:", clean):
        return True
    candidates = [
        clean,
        f"{clean}.md",
        f"{clean}.base",
        f"{clean}.canvas",
        f"{clean}.excalidraw.md",
    ]
    return any(
        (ROOT / candidate).exists()
        or candidate in generated_targets
        or candidate in virtual_user_paths
        or re.sub(r"\.md$", "", candidate) in virtual_user_paths
        for candidate in candidates
    )


def load_generated_targets(errors: list[str]) -> set[str]:
    targets: set[str] = set()
    for target in generated_obsidian_config_targets(errors):
        targets.add(target)
        targets.add(re.sub(r"\.(json|md|base|canvas)$", "", target))
    targets.update(pipeline_output_targets(errors))

    try:
        modules = load_modules()
        for name, blueprint in resolved_blueprints(modules).items():
            for target in materialized_targets(name, blueprint):
                rel_target = str(target.relative_to(ROOT)).replace("\\", "/")
                targets.add(rel_target)
                targets.add(re.sub(r"\.md$", "", rel_target))
    except Exception:
        # Il generation contract segnala gia problemi sui target generati.
        pass

    try:
        outputs, metadata_errors = render_metadata_targets()
        if not metadata_errors:
            for rel_target in outputs.keys():
                targets.add(rel_target)
                targets.add(re.sub(r"\.(md|base)$", "", rel_target))
    except Exception:
        # Il generation contract segnala gia problemi sui target metadata generati.
        pass

    return targets


def materialized_user_files(boundary: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        item
        for item in boundary.get("materialized_user_files", []) or []
        if isinstance(item, dict)
    ]


def load_virtual_user_paths(boundary: dict[str, Any]) -> set[str]:
    paths: set[str] = set()
    for file in materialized_user_files(boundary):
        file_rel = str(file.get("path") or "").replace("\\", "/")
        if not file_rel:
            continue
        paths.add(file_rel)
        paths.add(re.sub(r"\.md$", "", file_rel))
        current_dir = Path(file_rel).parent.as_posix()
        while current_dir and current_dir != ".":
            paths.add(current_dir)
            current_dir = Path(current_dir).parent.as_posix()
    return paths


def plugin_tier(entry: dict[str, Any]) -> str:
    return str(entry.get("class") or "").split(None, 1)[0].lower()


def release_plugin_profile(release_boundary: dict[str, Any]) -> dict[str, Any]:
    matrix = read_json(PLUGIN_MATRIX_JSON, [])
    profile = release_boundary.get("release_plugin_profile")
    if not isinstance(matrix, list) or not matrix:
        raise ValueError("Dev/plugin_matrix.json non dichiara plugin per il profilo release")
    if not isinstance(profile, dict) or not profile:
        raise ValueError("release_boundary.release_plugin_profile non dichiarato")

    matrix_ids = {entry.get("id") for entry in matrix if isinstance(entry, dict)}
    enabled_classes = set(as_string_list(profile.get("enabled_classes")))
    enabled_optional_plugins = set(as_string_list(profile.get("enabled_optional_plugins")))
    excluded_classes = set(as_string_list(profile.get("excluded_classes")))
    excluded_plugins = set(as_string_list(profile.get("excluded_plugins")))
    excluded_plugins.update(as_string_list(profile.get("excluded_optional_plugins")))
    declared_ids = [*enabled_optional_plugins, *excluded_plugins]
    unknown_ids = [plugin_id for plugin_id in declared_ids if plugin_id not in matrix_ids]
    if not enabled_classes and not enabled_optional_plugins:
        raise ValueError("release_plugin_profile non abilita classi o plugin")
    if unknown_ids:
        raise ValueError(f"release_plugin_profile contiene plugin non presenti nella matrice: {', '.join(unknown_ids)}")

    enabled_plugins = [
        entry.get("id")
        for entry in matrix
        if isinstance(entry, dict)
        and plugin_tier(entry) not in excluded_classes
        and entry.get("id") not in excluded_plugins
        and (plugin_tier(entry) in enabled_classes or entry.get("id") in enabled_optional_plugins)
    ]
    if not enabled_plugins:
        raise ValueError("release_plugin_profile produce una lista plugin vuota")

    return {
        "enabled_plugins": enabled_plugins,
        "enabled_plugin_set": set(enabled_plugins),
        "excluded_plugins": excluded_plugins,
        "matrix": matrix,
    }


def tier_for(entry: dict[str, Any], required_tiers: set[str]) -> str:
    head = plugin_tier(entry)
    return head if head in required_tiers else ""


def has_binding_substance(binding: dict[str, Any]) -> bool:
    return any(
        bool(binding.get(key))
        for key in [
            "responsibility",
            "use_for",
            "fields",
            "codeblock",
            "inline_syntax",
            "config_path",
            "output_targets",
            "required_frontmatter",
        ]
    )


def main() -> int:
    errors: list[str] = []
    matrix_source = load_yaml(MATRIX)
    matrix = matrix_source.get("plugins", []) or []
    contracts = load_yaml(CONTRACTS).get("plugins", []) or []
    bindings = load_yaml(BINDINGS).get("bindings", {}) or {}
    manual_acceptance = load_yaml(MANUAL_ACCEPTANCE)
    release_boundary = load_yaml(RELEASE_BOUNDARY)
    policy = load_policy(matrix_source, errors)
    community = declared_community_plugins(errors)
    generated_targets = load_generated_targets(errors)
    virtual_user_paths = load_virtual_user_paths(release_boundary)
    try:
        release_profile = release_plugin_profile(release_boundary)
        release_enabled_plugins = release_profile["enabled_plugin_set"]
    except ValueError as error:
        errors.append(str(error))
        release_enabled_plugins = set()

    declared_plugins = {
        str(entry.get("id") or "").strip()
        for entry in matrix
        if isinstance(entry, dict) and str(entry.get("id") or "").strip()
    }
    runtime_probe_ids = {
        str(probe.get("id") or "").strip()
        for probe in manual_acceptance.get("plugin_runtime_probes", []) or []
        if isinstance(probe, dict) and str(probe.get("id") or "").strip()
    }

    matrix_by_id = {
        str(entry.get("id") or "").strip(): entry
        for entry in matrix
        if isinstance(entry, dict) and str(entry.get("id") or "").strip()
    }
    contract_by_id = {
        str(entry.get("id") or "").strip(): entry
        for entry in contracts
        if isinstance(entry, dict) and str(entry.get("id") or "").strip()
    }
    binding_by_plugin_id = {
        str(binding.get("plugin_id")): {"name": name, "binding": binding}
        for name, binding in bindings.items()
        if isinstance(binding, dict) and binding.get("plugin_id")
    }

    counts = {"core": 0, "supporto": 0, "opzionale": 0, "manutenzione": 0}

    for plugin_id in community:
        entry = matrix_by_id.get(plugin_id)
        contract = contract_by_id.get(plugin_id)
        binding_record = binding_by_plugin_id.get(plugin_id)

        if not entry:
            errors.append(f"{plugin_id}: plugin dichiarato senza plugin_matrix")
            continue
        tier = tier_for(entry, policy["required_tiers"])
        if not tier:
            errors.append(f"{plugin_id}: classe plugin non classificata ({entry.get('class')})")
            continue
        counts[tier] = counts.get(tier, 0) + 1

        is_release_enabled = plugin_id in release_enabled_plugins
        release_enabled_policy = policy["release_enabled"]
        if contract is None and (not is_release_enabled or release_enabled_policy["require_contract"]):
            errors.append(f"{plugin_id}: manca plugin_contracts")
        if binding_record is None and (not is_release_enabled or release_enabled_policy["require_binding"]):
            errors.append(f"{plugin_id}: manca plugin_bindings.plugin_id")
        if contract and not str(contract.get("version") or "").strip():
            errors.append(f"{plugin_id}: plugin_contracts senza versione dichiarativa")

        required_surfaces = (
            release_enabled_policy["require_resolved_surfaces"]
            if is_release_enabled
            else {"guide", "operational", "smoke"}
        )
        if "guide" in required_surfaces and not target_exists(entry.get("guide"), generated_targets, virtual_user_paths):
            errors.append(f"{plugin_id}: guide non risolta ({entry.get('guide')})")
        if "operational" in required_surfaces and not target_exists(entry.get("operational"), generated_targets, virtual_user_paths):
            errors.append(f"{plugin_id}: superficie operativa non risolta ({entry.get('operational')})")
        if "smoke" in required_surfaces and not target_exists(entry.get("smoke"), generated_targets, virtual_user_paths):
            errors.append(f"{plugin_id}: smoke non risolto ({entry.get('smoke')})")

        if binding_record and not has_binding_substance(binding_record["binding"]):
            errors.append(f"{plugin_id}: binding tecnico senza responsabilita, uso, sintassi o config")
        binding = binding_record["binding"] if binding_record else {}
        if binding.get("config_path") and not target_exists(binding.get("config_path"), generated_targets, virtual_user_paths):
            errors.append(f"{plugin_id}: config_path dichiarato ma mancante ({binding.get('config_path')})")

        gates = contract.get("gates", []) if isinstance(contract, dict) else []
        minimum_gates = int(policy["minimum_gates_by_tier"].get(tier, 0) or 0)
        if minimum_gates > 0 and len(gates) < minimum_gates and plugin_id not in policy["support_light_allowed"]:
            errors.append(f"{plugin_id}: plugin {tier} con meno di {minimum_gates} gate di verifica")
        if tier == "opzionale" and plugin_id not in policy["optional_allowed"]:
            errors.append(f"{plugin_id}: plugin opzionale non approvato esplicitamente")
        if tier == "manutenzione" and plugin_id not in policy["maintenance_allowed"]:
            errors.append(f"{plugin_id}: plugin manutenzione non approvato esplicitamente")
        if is_release_enabled and release_enabled_policy["require_runtime_probe"] and plugin_id not in runtime_probe_ids:
            errors.append(f"{plugin_id}: plugin incluso in release senza plugin_runtime_probes in {rel_path(MANUAL_ACCEPTANCE)}")

        searchable_text = "\n".join(
            [
                read_text_rel(entry.get("guide")),
                read_text_rel(entry.get("operational")),
                read_text_rel(rel_path(MATRIX)),
                read_text_rel(rel_path(CONTRACTS)),
                read_text_rel(rel_path(BINDINGS)),
            ]
        )
        if str(entry.get("name") or "") not in searchable_text and plugin_id not in searchable_text:
            errors.append(f"{plugin_id}: documentazione/superficie non cita nome o id plugin")

    for plugin_id in matrix_by_id.keys():
        if plugin_id not in community:
            errors.append(f"{plugin_id}: plugin in matrice ma non dichiarato in {rel_path(OBSIDIAN_CONFIG)}")

    for plugin_id in community:
        if plugin_id not in declared_plugins:
            errors.append(f"{plugin_id}: plugin in {rel_path(OBSIDIAN_CONFIG)} ma non in plugin_matrix")

    for plugin_id in runtime_probe_ids:
        if plugin_id not in release_enabled_plugins:
            errors.append(f"{plugin_id}: plugin_runtime_probes presente ma plugin non incluso nel profilo release")

    if errors:
        print("Plugin usage audit non valido:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(
        "Plugin usage audit OK: "
        f"{len(community)} plugin ({counts['core']} core, {counts['supporto']} supporto, "
        f"{counts['opzionale']} opzionale, {counts['manutenzione']} manutenzione)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
