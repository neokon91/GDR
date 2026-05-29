#!/usr/bin/env python3

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

from render_metadata_surfaces import render_all as render_metadata_targets
from template_factory_utils import ROOT, load_yaml

sys.dont_write_bytecode = True

CONTRACT = ROOT / "Dev" / "Source" / "YAML" / "quality" / "repo_quality_contract.yaml"
OBSIDIAN_CONFIG = ROOT / "Dev" / "Source" / "YAML" / "json" / "obsidian_config.yaml"
RELEASE_BOUNDARY = ROOT / "Dev" / "Source" / "YAML" / "quality" / "release_boundary.yaml"
DEV_README = ROOT / "Dev" / "README.md"
WORKFLOWS = ROOT / "Dev" / "Source" / "YAML" / "json" / "workflows.yaml"


def rel_path(path: Path) -> str:
    return str(path.relative_to(ROOT))


def config_data_by_target(config: dict[str, Any], target: str) -> Any:
    for item in config.get("configs", []) or []:
        if isinstance(item, dict) and item.get("target") == target:
            return item.get("data")
    return None


def require_non_empty_array(errors: list[str], value: Any, path_text: str) -> list[str]:
    if not isinstance(value, list) or not value:
        errors.append(f"{rel_path(CONTRACT)}: {path_text} deve essere lista non vuota")
        return []

    normalized = [str(item or "").strip() for item in value if str(item or "").strip()]
    if len(normalized) != len(value):
        errors.append(f"{rel_path(CONTRACT)}: {path_text} contiene valori vuoti")

    duplicates = sorted({item for item in normalized if normalized.count(item) > 1})
    if duplicates:
        errors.append(f"{rel_path(CONTRACT)}: {path_text} contiene duplicati ({', '.join(duplicates)})")
    return normalized


def require_section(errors: list[str], value: Any, path_text: str) -> dict[str, Any]:
    if not isinstance(value, dict) or not value:
        errors.append(f"{rel_path(CONTRACT)}: {path_text} deve essere mappa non vuota")
        return {}
    return value


def generated_root_set(release_boundary: dict[str, Any]) -> set[str]:
    return {
        str(root).replace("\\", "/").rstrip("/")
        for root in release_boundary.get("generated_release_roots", []) or []
    }


def metadata_target_set(errors: list[str]) -> set[str]:
    try:
        outputs, metadata_errors = render_metadata_targets()
    except Exception as error:
        errors.append(f"{rel_path(CONTRACT)}: impossibile leggere target metadata generati ({error})")
        return set()
    if metadata_errors:
        errors.append(f"{rel_path(CONTRACT)}: target metadata generati non validi ({'; '.join(metadata_errors[:5])})")
        return set()
    return {target.replace("\\", "/") for target in outputs.keys()}


def exists_rel_or_generated(rel_path_text: str, generated_roots: set[str], generated_metadata_targets: set[str]) -> bool:
    normalized = str(rel_path_text).replace("\\", "/")
    top = normalized.split("/", 1)[0]
    if (ROOT / normalized).exists():
        return True
    return top in generated_roots and normalized in generated_metadata_targets


def require_existing_files(
    errors: list[str],
    files: list[str],
    path_text: str,
    generated_roots: set[str],
    generated_metadata_targets: set[str],
) -> None:
    for file in files:
        if not exists_rel_or_generated(file, generated_roots, generated_metadata_targets):
            errors.append(f"{rel_path(CONTRACT)}: {path_text} punta a file mancante ({file})")


def validate_subset(errors: list[str], values: list[str], allowed_values: set[str], path_text: str, source_path: Path) -> None:
    for value in values:
        if value not in allowed_values:
            errors.append(f"{rel_path(CONTRACT)}: {path_text} contiene valore non dichiarato in {rel_path(source_path)} ({value})")


def main() -> int:
    errors: list[str] = []
    contract = load_yaml(CONTRACT)
    obsidian_config = load_yaml(OBSIDIAN_CONFIG)
    release_boundary = load_yaml(RELEASE_BOUNDARY)
    generated_roots = generated_root_set(release_boundary)
    generated_metadata_targets = metadata_target_set(errors)

    if contract.get("id") != "repo_quality_contract":
        errors.append(f"{rel_path(CONTRACT)}: id non valido")

    surfaces = require_section(errors, contract.get("required_surfaces"), "required_surfaces")
    markers = require_section(errors, contract.get("documentation_markers"), "documentation_markers")

    required_plugins = require_non_empty_array(errors, surfaces.get("plugins"), "required_surfaces.plugins")
    required_snippets = require_non_empty_array(errors, surfaces.get("snippets"), "required_surfaces.snippets")
    required_files = require_non_empty_array(errors, surfaces.get("files"), "required_surfaces.files")
    required_base_files = require_non_empty_array(errors, surfaces.get("base_files"), "required_surfaces.base_files")
    required_layer_files = require_non_empty_array(errors, surfaces.get("layer_files"), "required_surfaces.layer_files")
    metadata_menu_presets = require_non_empty_array(errors, surfaces.get("metadata_menu_presets"), "required_surfaces.metadata_menu_presets")
    dev_readme_markers = require_non_empty_array(errors, markers.get("dev_readme_architecture"), "documentation_markers.dev_readme_architecture")
    workflow_markers = require_non_empty_array(errors, markers.get("workflow_contract"), "documentation_markers.workflow_contract")

    require_existing_files(errors, required_snippets, "required_surfaces.snippets", generated_roots, generated_metadata_targets)
    require_existing_files(errors, required_files, "required_surfaces.files", generated_roots, generated_metadata_targets)
    require_existing_files(errors, required_base_files, "required_surfaces.base_files", generated_roots, generated_metadata_targets)
    require_existing_files(errors, required_layer_files, "required_surfaces.layer_files", generated_roots, generated_metadata_targets)

    declared_community_plugins = config_data_by_target(obsidian_config, ".obsidian/community-plugins.json") or []
    validate_subset(
        errors,
        required_plugins,
        {str(plugin) for plugin in declared_community_plugins} if isinstance(declared_community_plugins, list) else set(),
        "required_surfaces.plugins",
        OBSIDIAN_CONFIG,
    )
    validate_subset(
        errors,
        required_plugins,
        {str(plugin) for plugin in release_boundary.get("required_plugins", []) or []},
        "required_surfaces.plugins",
        RELEASE_BOUNDARY,
    )

    appearance = config_data_by_target(obsidian_config, ".obsidian/appearance.json") or {}
    enabled_snippets = {
        str(snippet)
        for snippet in (appearance.get("enabledCssSnippets", []) if isinstance(appearance, dict) else [])
    }
    for snippet in required_snippets:
        snippet_path = Path(snippet)
        if not snippet.startswith(".obsidian/snippets/") or snippet_path.suffix != ".css":
            errors.append(f"{rel_path(CONTRACT)}: required_surfaces.snippets contiene path non snippet CSS ({snippet})")
            continue
        snippet_name = snippet_path.stem
        if snippet_name not in enabled_snippets:
            errors.append(f"{rel_path(CONTRACT)}: snippet {snippet} non abilitato in {rel_path(OBSIDIAN_CONFIG)}")

    metadata_menu = config_data_by_target(obsidian_config, ".obsidian/plugins/metadata-menu/data.json") or {}
    declared_preset_names = {
        str(field.get("name") or "")
        for field in (metadata_menu.get("presetFields", []) if isinstance(metadata_menu, dict) else [])
        if isinstance(field, dict) and field.get("name")
    }
    validate_subset(
        errors,
        metadata_menu_presets,
        declared_preset_names,
        "required_surfaces.metadata_menu_presets",
        OBSIDIAN_CONFIG,
    )

    dev_readme_text = DEV_README.read_text(encoding="utf-8")
    for marker in dev_readme_markers:
        if marker not in dev_readme_text:
            errors.append(
                f"{rel_path(CONTRACT)}: documentation_markers.dev_readme_architecture "
                f"non verificato in Dev/README.md ({marker})"
            )

    workflows_text = WORKFLOWS.read_text(encoding="utf-8")
    for marker in workflow_markers:
        if marker not in workflows_text:
            errors.append(
                f"{rel_path(CONTRACT)}: documentation_markers.workflow_contract "
                f"non verificato in workflows.yaml ({marker})"
            )

    if errors:
        print("Contratto qualita repo non valido:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    total_files = len(required_files) + len(required_base_files) + len(required_layer_files)
    print(
        f"Repo quality contract OK: {total_files} file, "
        f"{len(required_plugins)} plugin minimi, {len(metadata_menu_presets)} preset Metadata Menu."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
