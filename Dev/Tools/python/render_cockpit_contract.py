#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Callable

import yaml

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[3]
BASES_SOURCE = "Dev/Source/YAML/render/bases_views.yaml"
FILECLASS_SOURCE = "Dev/Source/YAML/canonical/frontmatter_profiles.yaml"
RUNTIME_EXPORTS = "Dev/Source/YAML/json/runtime_exports.yaml"
RUNTIME_PROFILES = "Dev/Source/YAML/canonical/runtime_profiles.yaml"
REGION_PLAYABILITY_CONTRACT = "Dev/Source/YAML/canonical/region_playability_contract.yaml"
REGION_TO_SESSION_CONTRACT = "Dev/Source/YAML/canonical/region_to_session_contract.yaml"


class Context:
    def __init__(self, source: str) -> None:
        self.source = source
        self.errors: list[str] = []
        self._yaml_cache: dict[str, dict[str, Any]] = {}

    def fail(self, message: str) -> None:
        self.errors.append(message)

    def load_yaml(self, rel_path: str) -> dict[str, Any]:
        if rel_path in self._yaml_cache:
            return self._yaml_cache[rel_path]
        path = ROOT / rel_path
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        if not isinstance(data, dict):
            self.fail(f"{rel_path}: root YAML non valida")
            data = {}
        self._yaml_cache[rel_path] = data
        return data


def exists_rel(rel_path: str) -> bool:
    return (ROOT / rel_path).exists()


def read_text_rel(rel_path: str, default: str = "") -> str:
    path = ROOT / rel_path
    return path.read_text(encoding="utf-8") if path.exists() else default


def required_text(ctx: Context, value: Any, label: str) -> str:
    text = str(value if value is not None else "").strip()
    if not text:
        ctx.fail(f"{ctx.source}: {label} vuoto o mancante")
    return text


def required_string_array(ctx: Context, value: Any, label: str) -> list[str]:
    items = [str(item).strip() for item in value] if isinstance(value, list) else []
    items = [item for item in items if item]
    if not items:
        ctx.fail(f"{ctx.source}: {label} deve essere lista non vuota")
    return items


def required_list(ctx: Context, value: Any, label: str) -> list[Any]:
    items = [item for item in value if item] if isinstance(value, list) else []
    if not items:
        ctx.fail(f"{ctx.source}: {label} deve essere lista non vuota")
    return items


def base_targets(ctx: Context) -> set[str]:
    source = ctx.load_yaml(BASES_SOURCE)
    targets: set[str] = set()
    for view in (source.get("views") or {}).values():
        if isinstance(view, dict) and view.get("file"):
            targets.add(str(view["file"]))
    generated = ((source.get("generated_bases") or {}).get("files") or {})
    for view in generated.values():
        if isinstance(view, dict) and view.get("file"):
            targets.add(str(view["file"]))
    return targets


def fileclass_targets(ctx: Context) -> set[str]:
    source = ctx.load_yaml(FILECLASS_SOURCE)
    targets: set[str] = set()
    for item in (source.get("fileclasses") or {}).values():
        if isinstance(item, dict) and item.get("file"):
            targets.add(str(item["file"]))
    return targets


def validate_surface_target(
    ctx: Context,
    surface: dict[str, Any],
    known_bases: set[str],
    known_fileclasses: set[str],
) -> str:
    surface_id = surface.get("id")
    target = required_text(ctx, surface.get("target"), f"surfaces.{surface_id}.target")
    if target.startswith("z.bases/"):
        if target not in known_bases:
            ctx.fail(f"{ctx.source}: Base non dichiarata in {BASES_SOURCE} ({target})")
        if surface.get("generated_release") is not True:
            ctx.fail(f"{ctx.source}: {target} deve dichiarare generated_release: true")
        return target
    if target.startswith("z.fileclass/"):
        if target not in known_fileclasses:
            ctx.fail(f"{ctx.source}: FileClass non dichiarata in {FILECLASS_SOURCE} ({target})")
        if surface.get("generated_release") is not True:
            ctx.fail(f"{ctx.source}: {target} deve dichiarare generated_release: true")
        return target
    if not exists_rel(target):
        ctx.fail(f"{ctx.source}: target superficie mancante ({target})")
    return target


def runtime_exports_declare_module(ctx: Context, module_path: str | None) -> bool:
    if not module_path:
        return False
    source = ctx.load_yaml(RUNTIME_EXPORTS)
    for group in (source.get("runtime_modules") or {}).values():
        if isinstance(group, list):
            for entry in group:
                if isinstance(entry, dict) and entry.get("path") == module_path:
                    return True
    return False


def validate_dashboard(ctx: Context, contract: dict[str, Any], config: dict[str, Any]) -> dict[str, Any]:
    dashboard = contract.get("dashboard") or {}
    page = required_text(ctx, dashboard.get("page"), "dashboard.page")
    workflow = required_text(ctx, dashboard.get("workflow"), "dashboard.workflow")
    runtime_views = required_string_array(ctx, dashboard.get("required_runtime_views"), "dashboard.required_runtime_views")
    sections = required_string_array(ctx, dashboard.get("required_visible_sections"), "dashboard.required_visible_sections")
    text = read_text_rel(page)
    runtime = read_text_rel("z.engine/session_views.js")
    runtime_module = config.get("runtime_module")
    module_text = read_text_rel(runtime_module) if runtime_module else ""
    exported_by_render_bridge = (
        bool(runtime_module)
        and runtime_exports_declare_module(ctx, runtime_module)
        and "renderExports(...Object.values(runtimeViews))" in runtime
    )

    if not text:
        ctx.fail(f"{ctx.source}: dashboard page mancante ({page})")
    else:
        deck = f'renderWorkflowCommandDeck(dv, "{workflow}", {{ mode: "simple" }})'
        if deck not in text:
            ctx.fail(f"{page}: deck workflow {workflow} non usa mode simple")
        if config.get("extra_page_checks"):
            extra_page_checks(ctx, page, text, config["extra_page_checks"])
        for section in sections:
            if not re.search(rf"^##\s+{re.escape(section)}\s*$", text, flags=re.MULTILINE):
                ctx.fail(f"{page}: sezione richiesta mancante ({section})")
        for view in runtime_views:
            if not re.search(rf"gdr\.{re.escape(view)}\(", text):
                ctx.fail(f"{page}: runtime view non usata ({view})")
            if config.get("bridge_only"):
                if not re.search(rf"\b{re.escape(view)}\b", runtime):
                    ctx.fail(f"z.engine/session_views.js: runtime view mancante ({view})")
            elif not exported_by_render_bridge:
                namespace = str(config.get("runtime_namespace") or "")
                pattern = rf"\b{re.escape(view)}:\s+{re.escape(namespace)}\.{re.escape(view)}\b"
                if not re.search(pattern, runtime):
                    export_label = str(config.get("export_label") or "cockpit")
                    ctx.fail(f"z.engine/session_views.js: export {export_label} non collegato ({view})")
            if runtime_module:
                if config.get("module_view_pattern") == "function":
                    module_pattern = rf"function\s+{re.escape(view)}\b"
                else:
                    module_pattern = rf"\b{re.escape(view)}\b"
                if not re.search(module_pattern, module_text):
                    ctx.fail(f"{runtime_module}: funzione runtime mancante ({view})")

    return {
        "page": page,
        "workflow": workflow,
        "required_runtime_views": runtime_views,
        "required_visible_sections": sections,
    }


def extra_page_checks(ctx: Context, page: str, text: str, checks: dict[str, Any]) -> None:
    if checks.get("no_tabs") and "````tabs" in text:
        ctx.fail(f"{page}: non deve usare tabs inline dopo la migrazione cockpit")
    if checks.get("no_inline_dataview") and (re.search(r"dv\.pages\(", text) or re.search(r"^```dataview\s*$", text, re.MULTILINE)):
        ctx.fail(f"{page}: contiene ancora query Dataview inline invece di runtime dedicato")
    max_lines = checks.get("max_lines")
    if isinstance(max_lines, int) and len(text.splitlines()) > max_lines:
        ctx.fail(f"{page}: superficie troppo lunga per {checks['max_lines_label']}")


def validate_panels(ctx: Context, contract: dict[str, Any], runtime_views: list[str]) -> dict[str, Any]:
    panels = contract.get("panels") or {}
    normalized: dict[str, Any] = {}
    for panel_id, panel in panels.items():
        panel_data = panel if isinstance(panel, dict) else {}
        runtime_view = required_text(ctx, panel_data.get("runtime_view"), f"panels.{panel_id}.runtime_view")
        if runtime_view not in runtime_views:
            ctx.fail(f"{ctx.source}: panels.{panel_id} usa runtime non richiesto dal dashboard ({runtime_view})")
        normalized[str(panel_id)] = {
            "runtime_view": runtime_view,
            "promise": required_text(ctx, panel_data.get("promise"), f"panels.{panel_id}.promise"),
            "answers": required_string_array(ctx, panel_data.get("answers"), f"panels.{panel_id}.answers"),
        }
    if not normalized:
        ctx.fail(f"{ctx.source}: panels vuoto")
    return normalized


def validate_queues(ctx: Context, contract: dict[str, Any], config: dict[str, Any]) -> list[dict[str, Any]]:
    expected = set(config.get("expected_queues") or [])
    missing_label = str(config.get("missing_queue_label") or "coda mancante")
    queues: list[dict[str, Any]] = []
    for index, queue in enumerate(required_list(ctx, contract.get("queues"), "queues")):
        queue_data = queue if isinstance(queue, dict) else {}
        queue_id = required_text(ctx, queue_data.get("id"), f"queues[{index}].id")
        queues.append(
            {
                "id": queue_id,
                "label": required_text(ctx, queue_data.get("label"), f"queues[{index}].label"),
                "table_columns": required_string_array(ctx, queue_data.get("table_columns"), f"queues[{index}].table_columns"),
            }
        )
    for queue_id in expected:
        if not any(queue["id"] == queue_id for queue in queues):
            ctx.fail(f"{ctx.source}: {missing_label} ({queue_id})")
    return queues


def validate_surfaces(ctx: Context, contract: dict[str, Any]) -> list[dict[str, Any]]:
    known_bases = base_targets(ctx)
    known_fileclasses = fileclass_targets(ctx)
    ids: set[str] = set()
    surfaces: list[dict[str, Any]] = []
    for index, surface in enumerate(required_list(ctx, contract.get("surfaces"), "surfaces")):
        surface_data = surface if isinstance(surface, dict) else {}
        surface_id = required_text(ctx, surface_data.get("id"), f"surfaces[{index}].id")
        if surface_id in ids:
            ctx.fail(f"{ctx.source}: surfaces id duplicato ({surface_id})")
        ids.add(surface_id)
        surfaces.append(
            {
                "id": surface_id,
                "label": required_text(ctx, surface_data.get("label"), f"surfaces.{surface_id}.label"),
                "plugin": required_text(ctx, surface_data.get("plugin"), f"surfaces.{surface_id}.plugin"),
                "target": validate_surface_target(ctx, surface_data, known_bases, known_fileclasses),
                "generated_release": surface_data.get("generated_release") is True,
                "badge": required_text(ctx, surface_data.get("badge"), f"surfaces.{surface_id}.badge"),
                "role": required_text(ctx, surface_data.get("role"), f"surfaces.{surface_id}.role"),
                "action": required_text(ctx, surface_data.get("action"), f"surfaces.{surface_id}.action"),
                "why": required_text(ctx, surface_data.get("why"), f"surfaces.{surface_id}.why"),
            }
        )
    return surfaces


def validate_object_list(ctx: Context, value: Any, label: str, fields: list[str]) -> list[dict[str, str]]:
    normalized: list[dict[str, str]] = []
    for index, item in enumerate(required_list(ctx, value, label)):
        item_data = item if isinstance(item, dict) else {}
        item_id = required_text(ctx, item_data.get("id"), f"{label}[{index}].id")
        entry = {"id": item_id}
        for field in fields:
            entry[field] = required_text(ctx, item_data.get(field), f"{label}.{item_id}.{field}")
        normalized.append(entry)
    return normalized


def validate_generated_roots_stay_untracked(ctx: Context, roots: list[str] | None = None) -> None:
    checked_roots = roots or ["z.bases", "z.fileclass"]
    result = subprocess.run(
        ["git", "ls-files", *checked_roots],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    tracked = result.stdout.strip()
    if tracked:
        ctx.fail(f"Root generate tracciate nel sorgente: {tracked}")


def validate_base_view_requirements(ctx: Context, requirements: list[dict[str, Any]] | None) -> None:
    if not requirements:
        return
    bases = ctx.load_yaml(BASES_SOURCE)
    for requirement in requirements:
        view_id = requirement["view"]
        view = (bases.get("views") or {}).get(view_id) or {}
        for field in requirement.get("required_fields") or []:
            if field not in (view.get("required_fields") or []):
                ctx.fail(f"{BASES_SOURCE}: {view_id} deve richiedere {field}")
        for flag, expected in (requirement.get("flags") or {}).items():
            if view.get(flag) != expected:
                ctx.fail(f"{BASES_SOURCE}: {view_id} deve dichiarare {flag}: {str(expected).lower()}")


def dm_guide_payload(ctx: Context, contract: dict[str, Any]) -> dict[str, Any]:
    phases = []
    ids: set[str] = set()
    for index, phase in enumerate(required_list(ctx, contract.get("phases"), "phases")):
        phase_data = phase if isinstance(phase, dict) else {}
        phase_id = required_text(ctx, phase_data.get("id"), f"phases[{index}].id")
        if phase_id in ids:
            ctx.fail(f"{ctx.source}: phases id duplicato ({phase_id})")
        ids.add(phase_id)
        surface = required_text(ctx, phase_data.get("surface"), f"phases.{phase_id}.surface")
        if not exists_rel(surface):
            ctx.fail(f"{ctx.source}: phase {phase_id} punta a superficie mancante ({surface})")
        phases.append(
            {
                "id": phase_id,
                "label": required_text(ctx, phase_data.get("label"), f"phases.{phase_id}.label"),
                "surface": surface,
                "action": required_text(ctx, phase_data.get("action"), f"phases.{phase_id}.action"),
                "done_when": required_text(ctx, phase_data.get("done_when"), f"phases.{phase_id}.done_when"),
            }
        )
    return {
        "phases": phases,
        "rules": validate_object_list(ctx, contract.get("rules"), "rules", ["label", "action", "why"]),
    }


def validate_dm_guide_contracts(ctx: Context, contract: dict[str, Any]) -> None:
    required = [
        "dashboard_uses_runtime_views",
        "page_must_not_use_inline_dataview_queries",
        "guide_must_not_duplicate_cockpit_manuals",
        "surfaces_must_resolve_to_source_or_generated_release_target",
    ]
    contracts = contract.get("contracts") or {}
    for key in required:
        if contracts.get(key) is not True:
            ctx.fail(f"{ctx.source}: contracts.{key} deve essere true")


def generated_drafts_payload(ctx: Context, contract: dict[str, Any]) -> dict[str, Any]:
    runtime_profiles = ctx.load_yaml(RUNTIME_PROFILES)
    registry = (((runtime_profiles.get("runtime_contracts") or {}).get("path_registry") or {}).get("paths") or {})
    targets = contract.get("generated_targets") or {}
    fallback_path_key = required_text(ctx, targets.get("fallback_path_key"), "generated_targets.fallback_path_key")
    fallback_folder = str((registry.get(fallback_path_key) or {}).get("folder") or "").strip()
    if not fallback_folder:
        ctx.fail(f"{RUNTIME_PROFILES}: path_registry.{fallback_path_key} mancante per generated_targets fallback")

    seen: set[str] = set()
    rules = []
    for index, rule in enumerate(required_list(ctx, targets.get("rules"), "generated_targets.rules")):
        rule_data = rule if isinstance(rule, dict) else {}
        rule_id = required_text(ctx, rule_data.get("id"), f"generated_targets.rules[{index}].id")
        if rule_id in seen:
            ctx.fail(f"{ctx.source}: generated_targets.rules id duplicato ({rule_id})")
        seen.add(rule_id)
        category = str(rule_data.get("category") or "").strip()
        type_name = str(rule_data.get("type") or "").strip()
        if not category and not type_name:
            ctx.fail(f"{ctx.source}: generated_targets.rules.{rule_id} richiede category o type")
        if category and type_name:
            ctx.fail(f"{ctx.source}: generated_targets.rules.{rule_id} deve usare category oppure type, non entrambi")
        path_key = required_text(ctx, rule_data.get("path_key"), f"generated_targets.rules.{rule_id}.path_key")
        folder = str((registry.get(path_key) or {}).get("folder") or "").strip()
        if not folder:
            ctx.fail(f"{RUNTIME_PROFILES}: path_registry.{path_key} mancante per generated_targets.rules.{rule_id}")
        entry = {"id": rule_id}
        if category:
            entry["category"] = category
        if type_name:
            entry["type"] = type_name
        entry["path_key"] = path_key
        entry["folder"] = folder
        rules.append(entry)

    return {
        "generated_targets": {
            "fallback_path_key": fallback_path_key,
            "fallback_folder": fallback_folder,
            "rules": rules,
        }
    }


def import_maps_payload(ctx: Context, contract: dict[str, Any]) -> dict[str, Any]:
    scripts = json.loads(read_text_rel("package.json", "{}")).get("scripts") or {}
    ids: set[str] = set()
    sources = []
    for index, source in enumerate(required_list(ctx, contract.get("sources"), "sources")):
        source_data = source if isinstance(source, dict) else {}
        source_id = required_text(ctx, source_data.get("id"), f"sources[{index}].id")
        if source_id in ids:
            ctx.fail(f"{ctx.source}: sources id duplicato ({source_id})")
        ids.add(source_id)
        npm_script = required_text(ctx, source_data.get("npm_script"), f"sources.{source_id}.npm_script")
        if npm_script not in scripts:
            ctx.fail(f"{ctx.source}: sources.{source_id}.npm_script non esiste in package.json ({npm_script})")
        dry_run_command = required_text(ctx, source_data.get("dry_run_command"), f"sources.{source_id}.dry_run_command")
        import_command = required_text(ctx, source_data.get("import_command"), f"sources.{source_id}.import_command")
        if f"npm run {npm_script}" not in dry_run_command:
            ctx.fail(f"{ctx.source}: sources.{source_id}.dry_run_command non usa npm run {npm_script}")
        if "--dry-run" not in dry_run_command:
            ctx.fail(f"{ctx.source}: sources.{source_id}.dry_run_command deve includere --dry-run")
        if f"npm run {npm_script}" not in import_command:
            ctx.fail(f"{ctx.source}: sources.{source_id}.import_command non usa npm run {npm_script}")
        sources.append(
            {
                "id": source_id,
                "label": required_text(ctx, source_data.get("label"), f"sources.{source_id}.label"),
                "npm_script": npm_script,
                "source_key": required_text(ctx, source_data.get("source_key"), f"sources.{source_id}.source_key"),
                "accepts": required_string_array(ctx, source_data.get("accepts"), f"sources.{source_id}.accepts"),
                "dry_run_command": dry_run_command,
                "import_command": import_command,
                "writes_to": required_text(ctx, source_data.get("writes_to"), f"sources.{source_id}.writes_to"),
                "guardrail": required_text(ctx, source_data.get("guardrail"), f"sources.{source_id}.guardrail"),
            }
        )
    return {"sources": sources}


def quality_report_payload(ctx: Context, _contract: dict[str, Any]) -> dict[str, Any]:
    region_playability = ctx.load_yaml(REGION_PLAYABILITY_CONTRACT)
    region_to_session = ctx.load_yaml(REGION_TO_SESSION_CONTRACT)
    if region_playability.get("id") != "region_playability_contract":
        ctx.fail(f"{REGION_PLAYABILITY_CONTRACT}: id non valido")
    if region_to_session.get("id") != "region_to_session_contract":
        ctx.fail(f"{REGION_TO_SESSION_CONTRACT}: id non valido")
    return {
        "region_playability_contract": {
            "source": REGION_PLAYABILITY_CONTRACT,
            "version": str(region_playability.get("version") or ""),
            "region_playability": region_playability.get("region_playability") or {},
            "validation_model": region_playability.get("validation_model") or {},
        },
        "region_to_session_contract": {
            "source": REGION_TO_SESSION_CONTRACT,
            "version": str(region_to_session.get("version") or ""),
            "region_to_session": region_to_session.get("region_to_session") or {},
            "validation_model": region_to_session.get("validation_model") or {},
        },
    }


def media_scene_payload(ctx: Context, contract: dict[str, Any]) -> dict[str, Any]:
    return {
        "patterns": validate_object_list(ctx, contract.get("patterns"), "patterns", ["label", "example", "use_when"])
    }


PayloadHook = Callable[[Context, dict[str, Any]], dict[str, Any]]
ContractHook = Callable[[Context, dict[str, Any]], None]


def base_config(
    cockpit_id: str,
    *,
    out: str,
    runtime_module: str | None = None,
    runtime_namespace: str | None = None,
    export_label: str,
    expected_queues: list[str] | None = None,
    missing_queue_label: str | None = None,
    module_view_pattern: str | None = None,
    bridge_only: bool = False,
    extra_page_checks: dict[str, Any] | None = None,
    base_view_requirements: list[dict[str, Any]] | None = None,
    skip_queues: bool = False,
    before_queues_payload: PayloadHook | None = None,
    after_queues_payload: PayloadHook | None = None,
    extra_contract_checks: ContractHook | None = None,
    generated_roots: list[str] | None = None,
    title: str,
    stale: str,
    ok: str,
    render: str,
) -> dict[str, Any]:
    return {
        "source": f"Dev/Source/YAML/json/{cockpit_id}.yaml",
        "id": cockpit_id,
        "out": out,
        "runtime_module": runtime_module,
        "runtime_namespace": runtime_namespace,
        "export_label": export_label,
        "generated_by": f"render_{cockpit_id}",
        "expected_queues": expected_queues or [],
        "missing_queue_label": missing_queue_label,
        "module_view_pattern": module_view_pattern,
        "bridge_only": bridge_only,
        "extra_page_checks": extra_page_checks,
        "base_view_requirements": base_view_requirements,
        "skip_queues": skip_queues,
        "before_queues_payload": before_queues_payload,
        "after_queues_payload": after_queues_payload,
        "extra_contract_checks": extra_contract_checks,
        "generated_roots": generated_roots,
        "error_title": title,
        "stale_message": stale,
        "ok_message": ok,
        "render_message": render,
    }


MAP_BASE_REQUIREMENT = [{"view": "atlas_maps", "required_fields": ["coordinates"], "flags": {"map_view": True}}]
COMPACT_IMPORT_CHECKS = {
    "no_tabs": True,
    "no_inline_dataview": True,
    "max_lines": 140,
    "max_lines_label": "un cockpit import compatto",
}
COMPACT_DM_CHECKS = {
    "no_tabs": True,
    "no_inline_dataview": True,
    "max_lines": 140,
    "max_lines_label": "una bussola DM compatta",
}
COMPACT_MEDIA_CHECKS = {
    "no_tabs": True,
    "no_inline_dataview": True,
    "max_lines": 140,
    "max_lines_label": "un cockpit media compatto",
}
NO_INLINE_MAP_CHECKS = {"no_tabs": True, "no_inline_dataview": True}


COCKPITS: dict[str, dict[str, Any]] = {
    "dm_dashboard_cockpit": base_config(
        "dm_dashboard_cockpit",
        out="z.automazioni/data/runtime/dm_dashboard_cockpit.json",
        runtime_module="z.engine/session_dm_dashboard.js",
        runtime_namespace="dmDashboardViews",
        export_label="DM Dashboard",
        expected_queues=["sessions", "pressures", "materials", "inbox"],
        missing_queue_label="coda DM Dashboard mancante",
        title="Contratto DM Dashboard cockpit non valido:",
        stale="Contratto DM Dashboard non aggiornato: eseguire npm run sync:sources",
        ok="DM Dashboard cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="DM Dashboard cockpit renderizzato: z.automazioni/data/runtime/dm_dashboard_cockpit.json",
    ),
    "dm_guide_cockpit": base_config(
        "dm_guide_cockpit",
        out="z.automazioni/data/runtime/dm_guide_cockpit.json",
        runtime_module="z.engine/session_dm_guide.js",
        runtime_namespace="dmGuideViews",
        export_label="Guida DM",
        module_view_pattern="function",
        extra_page_checks=COMPACT_DM_CHECKS,
        skip_queues=True,
        before_queues_payload=dm_guide_payload,
        extra_contract_checks=validate_dm_guide_contracts,
        generated_roots=["z.bases", "z.fileclass", "z.automazioni/data/runtime"],
        title="Contratto Guida DM cockpit non valido:",
        stale="Contratto Guida DM non aggiornato: eseguire npm run sync:sources",
        ok="Guida DM cockpit OK: {phases} fasi, {rules} regole e {surfaces} superfici verificate.",
        render="Generato z.automazioni/data/runtime/dm_guide_cockpit.json",
    ),
    "vault_control_cockpit": base_config(
        "vault_control_cockpit",
        out="z.automazioni/data/runtime/vault_control_cockpit.json",
        runtime_module="z.engine/session_vault_control.js",
        runtime_namespace="vaultControlViews",
        export_label="Controllo Vault",
        expected_queues=["attention", "maps", "table_ready", "campaign_open"],
        missing_queue_label="coda Controllo Vault mancante",
        title="Contratto Controllo Vault cockpit non valido:",
        stale="Contratto Controllo Vault non aggiornato: eseguire npm run sync:sources",
        ok="Controllo Vault cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Controllo Vault cockpit renderizzato: z.automazioni/data/runtime/vault_control_cockpit.json",
    ),
    "quality_report_cockpit": base_config(
        "quality_report_cockpit",
        out="z.automazioni/data/runtime/quality_report_cockpit.json",
        runtime_module="z.engine/session_quality_report.js",
        runtime_namespace="qualityReportViews",
        export_label="Quality Report",
        expected_queues=["operational_gaps", "public_risks", "public_missing_text", "screenshot_ready"],
        after_queues_payload=quality_report_payload,
        missing_queue_label="coda Quality Report mancante",
        title="Contratto Quality Report cockpit non valido:",
        stale="Contratto Quality Report non aggiornato: eseguire npm run sync:sources",
        ok="Quality Report cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Quality Report cockpit renderizzato: z.automazioni/data/runtime/quality_report_cockpit.json",
    ),
    "generated_drafts_cockpit": base_config(
        "generated_drafts_cockpit",
        out="z.automazioni/data/runtime/generated_drafts_cockpit.json",
        runtime_module="z.engine/session_generated_drafts.js",
        runtime_namespace="generatedDraftsViews",
        export_label="Smistamento Bozze",
        expected_queues=["draft_queue", "ready_to_link", "unanchored", "destinations", "resolved"],
        after_queues_payload=generated_drafts_payload,
        missing_queue_label="coda Smistamento Bozze mancante",
        title="Contratto Smistamento Bozze cockpit non valido:",
        stale="Contratto Smistamento Bozze non aggiornato: eseguire npm run sync:sources",
        ok="Smistamento Bozze cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Smistamento Bozze cockpit renderizzato: z.automazioni/data/runtime/generated_drafts_cockpit.json",
    ),
    "world_bible_cockpit": base_config(
        "world_bible_cockpit",
        out="z.automazioni/data/runtime/world_bible_cockpit.json",
        runtime_module="z.engine/session_world_bible.js",
        runtime_namespace="worldBibleViews",
        export_label="Bibbia del Mondo",
        expected_queues=["world_identity", "article_gaps", "public_safety", "playable_gaps"],
        missing_queue_label="coda Bibbia del Mondo mancante",
        title="Contratto Bibbia del Mondo cockpit non valido:",
        stale="Contratto Bibbia del Mondo non aggiornato: eseguire npm run sync:sources",
        ok="Bibbia del Mondo cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Bibbia del Mondo cockpit renderizzato: z.automazioni/data/runtime/world_bible_cockpit.json",
    ),
    "compendium_cockpit": base_config(
        "compendium_cockpit",
        out="z.automazioni/data/runtime/compendium_cockpit.json",
        runtime_module="z.engine/session_compendium.js",
        runtime_namespace="compendiumViews",
        export_label="Compendium",
        expected_queues=["archive", "without_use", "open_gaps", "history_links", "pressure", "map_links"],
        missing_queue_label="coda Compendium mancante",
        title="Contratto Compendium cockpit non valido:",
        stale="Contratto Compendium non aggiornato: eseguire npm run sync:sources",
        ok="Compendium cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Compendium cockpit renderizzato: z.automazioni/data/runtime/compendium_cockpit.json",
    ),
    "worldbuilding_cockpit": base_config(
        "worldbuilding_cockpit",
        out="z.automazioni/data/runtime/worldbuilding_cockpit.json",
        bridge_only=True,
        export_label="Worldbuilder",
        title="Contratto Worldbuilder cockpit non valido:",
        stale="Contratto Worldbuilder cockpit non aggiornato: eseguire npm run sync:sources",
        ok="Worldbuilder cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Worldbuilder cockpit renderizzato: z.automazioni/data/runtime/worldbuilding_cockpit.json",
    ),
    "atlas_cockpit": base_config(
        "atlas_cockpit",
        out="z.automazioni/data/runtime/atlas_cockpit.json",
        runtime_module="z.engine/session_atlas.js",
        runtime_namespace="atlasViews",
        export_label="atlas",
        module_view_pattern="function",
        base_view_requirements=MAP_BASE_REQUIREMENT,
        title="Contratto Atlante cockpit non valido:",
        stale="Contratto Atlante cockpit non aggiornato: eseguire npm run sync:sources",
        ok="Atlante cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Atlante cockpit renderizzato: z.automazioni/data/runtime/atlas_cockpit.json",
    ),
    "maps_cockpit": base_config(
        "maps_cockpit",
        out="z.automazioni/data/runtime/maps_cockpit.json",
        runtime_module="z.engine/session_maps.js",
        runtime_namespace="mapViews",
        export_label="mappe",
        module_view_pattern="function",
        extra_page_checks=NO_INLINE_MAP_CHECKS,
        base_view_requirements=MAP_BASE_REQUIREMENT,
        title="Contratto Mappe cockpit non valido:",
        stale="Contratto Mappe cockpit non aggiornato: eseguire npm run sync:sources",
        ok="Mappe cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Mappe cockpit renderizzato: z.automazioni/data/runtime/maps_cockpit.json",
    ),
    "import_maps_cockpit": base_config(
        "import_maps_cockpit",
        out="z.automazioni/data/runtime/map_import_cockpit.json",
        runtime_module="z.engine/session_import_maps.js",
        runtime_namespace="importMapViews",
        export_label="import mappe",
        module_view_pattern="function",
        extra_page_checks=COMPACT_IMPORT_CHECKS,
        before_queues_payload=import_maps_payload,
        generated_roots=["z.bases", "z.fileclass", "z.automazioni/data/runtime"],
        title="Contratto Importare Mappe cockpit non valido:",
        stale="Contratto Importare Mappe cockpit non aggiornato: eseguire npm run sync:sources",
        ok="Importare Mappe cockpit OK: {sources} sorgenti e {surfaces} superfici verificate.",
        render="Generato z.automazioni/data/runtime/map_import_cockpit.json",
    ),
    "worldbuilding_control_cockpit": base_config(
        "worldbuilding_control_cockpit",
        out="z.automazioni/data/runtime/worldbuilding_control_cockpit.json",
        runtime_module="z.engine/session_worldbuilding_control.js",
        runtime_namespace="worldbuildingControlViews",
        export_label="Controllo Worldbuilding",
        expected_queues=["depth", "connections", "canon", "playability", "player_safe", "ready_unused"],
        missing_queue_label="coda audit mancante",
        title="Contratto Controllo Worldbuilding cockpit non valido:",
        stale="Contratto Controllo Worldbuilding non aggiornato: eseguire npm run sync:sources",
        ok="Controllo Worldbuilding cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Controllo Worldbuilding cockpit renderizzato: z.automazioni/data/runtime/worldbuilding_control_cockpit.json",
    ),
    "canon_control_cockpit": base_config(
        "canon_control_cockpit",
        out="z.automazioni/data/runtime/canon_control_cockpit.json",
        runtime_module="z.engine/session_canon_control.js",
        runtime_namespace="canonControlViews",
        export_label="Controllo Canone",
        expected_queues=["truth", "rumors", "contradictions", "provenance", "retcons", "decisions"],
        missing_queue_label="coda canone mancante",
        title="Contratto Controllo Canone cockpit non valido:",
        stale="Contratto Controllo Canone non aggiornato: eseguire npm run sync:sources",
        ok="Controllo Canone cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Controllo Canone cockpit renderizzato: z.automazioni/data/runtime/canon_control_cockpit.json",
    ),
    "living_world_cockpit": base_config(
        "living_world_cockpit",
        out="z.automazioni/data/runtime/living_world_cockpit.json",
        runtime_module="z.engine/session_living_world.js",
        runtime_namespace="livingWorldViews",
        export_label="Motore Mondo Vivo",
        expected_queues=["continuity", "targets", "closable", "gaps", "powers", "economy", "history", "public_canon"],
        missing_queue_label="coda mondo vivo mancante",
        title="Contratto Motore Mondo Vivo cockpit non valido:",
        stale="Contratto Motore Mondo Vivo non aggiornato: eseguire npm run sync:sources",
        ok="Motore Mondo Vivo cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Motore Mondo Vivo cockpit renderizzato: z.automazioni/data/runtime/living_world_cockpit.json",
    ),
    "economy_cockpit": base_config(
        "economy_cockpit",
        out="z.automazioni/data/runtime/economy_cockpit.json",
        runtime_module="z.engine/session_economy.js",
        runtime_namespace="economyViews",
        export_label="Economia E Rotte",
        expected_queues=["routes", "resources", "markets", "controllers", "dependencies", "unpropagated", "gaps"],
        missing_queue_label="coda economia mancante",
        title="Contratto Economia E Rotte cockpit non valido:",
        stale="Contratto Economia E Rotte non aggiornato: eseguire npm run sync:sources",
        ok="Economia E Rotte cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Economia E Rotte cockpit renderizzato: z.automazioni/data/runtime/economy_cockpit.json",
    ),
    "lore_cockpit": base_config(
        "lore_cockpit",
        out="z.automazioni/data/runtime/lore_cockpit.json",
        runtime_module="z.engine/session_lore.js",
        runtime_namespace="loreViews",
        export_label="Lore Hub",
        expected_queues=["signals", "canon_decisions", "mysteries", "history", "cultures", "powers", "maps", "materials"],
        missing_queue_label="coda lore mancante",
        title="Contratto Lore Hub cockpit non valido:",
        stale="Contratto Lore Hub non aggiornato: eseguire npm run sync:sources",
        ok="Lore Hub cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Lore Hub cockpit renderizzato: z.automazioni/data/runtime/lore_cockpit.json",
    ),
    "lore_review_cockpit": base_config(
        "lore_review_cockpit",
        out="z.automazioni/data/runtime/lore_review_cockpit.json",
        runtime_module="z.engine/session_lore_review.js",
        runtime_namespace="loreReviewViews",
        export_label="Revisione Lore",
        expected_queues=["completion", "playability", "anchors", "mysteries", "history", "pressures"],
        missing_queue_label="coda Revisione Lore mancante",
        title="Contratto Revisione Lore cockpit non valido:",
        stale="Contratto Revisione Lore non aggiornato: eseguire npm run sync:sources",
        ok="Revisione Lore cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Revisione Lore cockpit renderizzato: z.automazioni/data/runtime/lore_review_cockpit.json",
    ),
    "geopolitical_cockpit": base_config(
        "geopolitical_cockpit",
        out="z.automazioni/data/runtime/geopolitical_cockpit.json",
        runtime_module="z.engine/session_geopolitical.js",
        runtime_namespace="geopoliticalViews",
        export_label="Geopolitical Dashboard",
        expected_queues=["territories", "relations", "borders", "resources", "economic_nodes", "gaps"],
        missing_queue_label="coda geopolitica mancante",
        title="Contratto Geopolitical Dashboard cockpit non valido:",
        stale="Contratto Geopolitical Dashboard non aggiornato: eseguire npm run sync:sources",
        ok="Geopolitical Dashboard cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Geopolitical Dashboard cockpit renderizzato: z.automazioni/data/runtime/geopolitical_cockpit.json",
    ),
    "campaign_builder_cockpit": base_config(
        "campaign_builder_cockpit",
        out="z.automazioni/data/runtime/campaign_builder_cockpit.json",
        runtime_module="z.engine/session_campaign_builder.js",
        runtime_namespace="campaignBuilderViews",
        export_label="Campagna da Ambientazione",
        expected_queues=["opportunities", "fronts", "campaigns", "sessions", "gaps"],
        missing_queue_label="coda Campagna da Ambientazione mancante",
        title="Contratto Campagna da Ambientazione cockpit non valido:",
        stale="Contratto Campagna da Ambientazione non aggiornato: eseguire npm run sync:sources",
        ok="Campagna da Ambientazione cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Campagna da Ambientazione cockpit renderizzato: z.automazioni/data/runtime/campaign_builder_cockpit.json",
    ),
    "offscreen_cockpit": base_config(
        "offscreen_cockpit",
        out="z.automazioni/data/runtime/offscreen_cockpit.json",
        runtime_module="z.engine/session_offscreen.js",
        runtime_namespace="offscreenViews",
        export_label="Cosa Succede Fuori Scena",
        expected_queues=["actors", "clocks", "consequences", "secrets", "bridge"],
        missing_queue_label="coda fuori scena mancante",
        title="Contratto Cosa Succede Fuori Scena cockpit non valido:",
        stale="Contratto Cosa Succede Fuori Scena non aggiornato: eseguire npm run sync:sources",
        ok="Cosa Succede Fuori Scena cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Cosa Succede Fuori Scena cockpit renderizzato: z.automazioni/data/runtime/offscreen_cockpit.json",
    ),
    "preparation_cockpit": base_config(
        "preparation_cockpit",
        out="z.automazioni/data/runtime/preparation_cockpit.json",
        runtime_module="z.engine/session_preparation.js",
        runtime_namespace="preparationViews",
        export_label="Preparazione Sessione",
        expected_queues=["candidate_sessions", "anchors", "missions", "pressures", "people", "encounters", "handouts", "maps"],
        missing_queue_label="coda Preparazione mancante",
        title="Contratto Preparazione Sessione cockpit non valido:",
        stale="Contratto Preparazione Sessione non aggiornato: eseguire npm run sync:sources",
        ok="Preparazione Sessione cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Preparazione Sessione cockpit renderizzato: z.automazioni/data/runtime/preparation_cockpit.json",
    ),
    "table_materials_cockpit": base_config(
        "table_materials_cockpit",
        out="z.automazioni/data/runtime/table_materials_cockpit.json",
        runtime_module="z.engine/session_table_materials.js",
        runtime_namespace="tableMaterialsViews",
        export_label="Materiali al Tavolo",
        expected_queues=["session_materials", "handouts", "objects", "encounters", "creatures", "maps_media"],
        missing_queue_label="coda Materiali al Tavolo mancante",
        title="Contratto Materiali al Tavolo cockpit non valido:",
        stale="Contratto Materiali al Tavolo non aggiornato: eseguire npm run sync:sources",
        ok="Materiali al Tavolo cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Materiali al Tavolo cockpit renderizzato: z.automazioni/data/runtime/table_materials_cockpit.json",
    ),
    "media_scene_cockpit": base_config(
        "media_scene_cockpit",
        out="z.automazioni/data/runtime/media_scene_cockpit.json",
        runtime_module="z.engine/session_media_scene.js",
        runtime_namespace="mediaSceneViews",
        export_label="media scene",
        module_view_pattern="function",
        extra_page_checks=COMPACT_MEDIA_CHECKS,
        after_queues_payload=media_scene_payload,
        generated_roots=["z.bases", "z.fileclass", "z.automazioni/data/runtime"],
        title="Contratto Media Scene cockpit non valido:",
        stale="Contratto Media Scene cockpit non aggiornato: eseguire npm run sync:sources",
        ok="Media Scene cockpit OK: {queues} code e {surfaces} superfici verificate.",
        render="Generato z.automazioni/data/runtime/media_scene_cockpit.json",
    ),
    "live_table_cockpit": base_config(
        "live_table_cockpit",
        out="z.automazioni/data/runtime/live_table_cockpit.json",
        runtime_module="z.engine/session_live_table.js",
        runtime_namespace="liveTableViews",
        export_label="Durante il Gioco",
        expected_queues=["live_notes", "pressures", "people", "materials", "post_bridge"],
        missing_queue_label="coda tavolo live mancante",
        title="Contratto Durante il Gioco cockpit non valido:",
        stale="Contratto Durante il Gioco non aggiornato: eseguire npm run sync:sources",
        ok="Durante il Gioco cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Durante il Gioco cockpit renderizzato: z.automazioni/data/runtime/live_table_cockpit.json",
    ),
    "post_session_cockpit": base_config(
        "post_session_cockpit",
        out="z.automazioni/data/runtime/post_session_cockpit.json",
        runtime_module="z.engine/session_post_session.js",
        runtime_namespace="postSessionViews",
        export_label="Post Sessione",
        expected_queues=["live_notes", "canon_decisions", "recaps", "consequences", "impacted", "next_session"],
        missing_queue_label="coda Post Sessione mancante",
        title="Contratto Post Sessione cockpit non valido:",
        stale="Contratto Post Sessione non aggiornato: eseguire npm run sync:sources",
        ok="Post Sessione cockpit OK: {surfaces} superfici e {queues} code verificate.",
        render="Post Sessione cockpit renderizzato: z.automazioni/data/runtime/post_session_cockpit.json",
    ),
}


def build_payload(ctx: Context, config: dict[str, Any]) -> dict[str, Any]:
    contract = ctx.load_yaml(config["source"])
    if contract.get("id") != config["id"]:
        ctx.fail(f"{config['source']}: id non valido")

    dashboard = validate_dashboard(ctx, contract, config)
    panels = validate_panels(ctx, contract, dashboard["required_runtime_views"])
    before_payload = config["before_queues_payload"](ctx, contract) if config.get("before_queues_payload") else {}
    queues = [] if config.get("skip_queues") else validate_queues(ctx, contract, config)
    after_payload = config["after_queues_payload"](ctx, contract) if config.get("after_queues_payload") else {}
    surfaces = validate_surfaces(ctx, contract)
    validate_base_view_requirements(ctx, config.get("base_view_requirements"))
    if config.get("extra_contract_checks"):
        config["extra_contract_checks"](ctx, contract)
    validate_generated_roots_stay_untracked(ctx, config.get("generated_roots"))

    payload: dict[str, Any] = {
        "generated_by": config["generated_by"],
        "source": config["source"],
        "version": str(contract.get("version") or ""),
        "purpose": str(contract.get("purpose") or ""),
        "dashboard": dashboard,
        "panels": panels,
        **before_payload,
    }
    if not config.get("skip_queues"):
        payload["queues"] = queues
    payload.update(after_payload)
    payload["surfaces"] = surfaces
    return payload


def count_for_message(payload: dict[str, Any], key: str) -> int:
    value = payload.get(key)
    return len(value) if isinstance(value, list) else 0


def format_message(template: str, payload: dict[str, Any]) -> str:
    return template.format(
        surfaces=count_for_message(payload, "surfaces"),
        queues=count_for_message(payload, "queues"),
        phases=count_for_message(payload, "phases"),
        rules=count_for_message(payload, "rules"),
        sources=count_for_message(payload, "sources"),
    )


def rendered_json(payload: dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False, indent=2) + "\n"


def write_or_check(payload: dict[str, Any], config: dict[str, Any], check_only: bool) -> int:
    output = ROOT / config["out"]
    rendered = rendered_json(payload)
    if check_only:
        current = output.read_text(encoding="utf-8") if output.exists() else ""
        if current != rendered:
            print(format_message(config["stale_message"], payload), file=sys.stderr)
            return 1
        print(format_message(config["ok_message"], payload))
        return 0
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(rendered, encoding="utf-8")
    print(format_message(config["render_message"], payload))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Renderizza o verifica i contratti cockpit runtime da YAML.")
    parser.add_argument("cockpit_id", choices=sorted(COCKPITS))
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    config = COCKPITS[args.cockpit_id]
    ctx = Context(config["source"])
    payload = build_payload(ctx, config)
    if ctx.errors:
        print(config["error_title"], file=sys.stderr)
        for error in ctx.errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    return write_or_check(payload, config, args.check)


if __name__ == "__main__":
    raise SystemExit(main())
