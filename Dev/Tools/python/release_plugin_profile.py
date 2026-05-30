#!/usr/bin/env python3

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


ROOT = Path(__file__).resolve().parents[3]
PLUGIN_MATRIX = ROOT / "Dev" / "Source" / "YAML" / "json" / "plugin_matrix.yaml"


@dataclass(frozen=True)
class ReleasePluginProfile:
    enabled_plugins: list[str]
    enabled_plugin_set: set[str]
    excluded_plugins: set[str]
    matrix: list[dict[str, Any]]


def as_list(value: Any) -> list[str]:
    return [str(item) for item in value] if isinstance(value, list) else []


def plugin_tier(entry: dict[str, Any]) -> str:
    return str(entry.get("class") or "").split(maxsplit=1)[0].lower()


def read_plugin_matrix(root: Path = ROOT) -> list[dict[str, Any]]:
    source = root / "Dev" / "Source" / "YAML" / "json" / "plugin_matrix.yaml"
    data = yaml.safe_load(source.read_text(encoding="utf-8")) or {}
    plugins = data.get("plugins") or []
    return plugins if isinstance(plugins, list) else []


def release_plugin_profile(root: Path, release_boundary: dict[str, Any]) -> ReleasePluginProfile:
    matrix = read_plugin_matrix(root)
    profile = release_boundary.get("release_plugin_profile")
    if not matrix:
        raise RuntimeError("plugin_matrix.yaml non dichiara plugin per il profilo release")
    if not isinstance(profile, dict) or not profile:
        raise RuntimeError("release_boundary.release_plugin_profile non dichiarato")

    matrix_ids = {str(entry.get("id")) for entry in matrix if entry.get("id")}
    enabled_classes = set(as_list(profile.get("enabled_classes")))
    enabled_optional_plugins = set(as_list(profile.get("enabled_optional_plugins")))
    excluded_classes = set(as_list(profile.get("excluded_classes")))
    excluded_plugins = set(as_list(profile.get("excluded_plugins"))) | set(as_list(profile.get("excluded_optional_plugins")))
    declared_ids = [*enabled_optional_plugins, *excluded_plugins]
    unknown_ids = [plugin_id for plugin_id in declared_ids if plugin_id not in matrix_ids]

    if not enabled_classes and not enabled_optional_plugins:
        raise RuntimeError("release_plugin_profile non abilita classi o plugin")
    if unknown_ids:
        raise RuntimeError(f"release_plugin_profile contiene plugin non presenti nella matrice: {', '.join(unknown_ids)}")

    enabled_plugins = [
        str(entry.get("id"))
        for entry in matrix
        if entry.get("id")
        and plugin_tier(entry) not in excluded_classes
        and str(entry.get("id")) not in excluded_plugins
        and (plugin_tier(entry) in enabled_classes or str(entry.get("id")) in enabled_optional_plugins)
    ]
    if not enabled_plugins:
        raise RuntimeError("release_plugin_profile produce una lista plugin vuota")

    return ReleasePluginProfile(
        enabled_plugins=enabled_plugins,
        enabled_plugin_set=set(enabled_plugins),
        excluded_plugins=excluded_plugins,
        matrix=matrix,
    )
