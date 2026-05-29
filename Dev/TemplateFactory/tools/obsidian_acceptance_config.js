const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { loadReleaseBoundary } = require("./release_boundary_utils");
const { releasePluginProfile } = require("./release_plugin_profile");

const LIVE_ACCEPTANCE_FILE = "Dev/TemplateFactory/modules/live_acceptance.yaml";

function loadYamlModule(root, relPath) {
    const script = [
        "import json, sys, yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");
    const stdout = execFileSync("python3", ["-c", script, path.join(root, relPath)], {
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024
    });
    return JSON.parse(stdout);
}

function createLiveAcceptanceConfig(root) {
    const liveAcceptance = loadYamlModule(root, LIVE_ACCEPTANCE_FILE);
    const releasePluginIds = releasePluginProfile(root, loadReleaseBoundary(root)).enabledPlugins;

    function configValue(pathText) {
        return String(pathText).split(".").reduce((value, key) => value?.[key], liveAcceptance);
    }

    function requiredConfigArray(pathText, itemType = "string") {
        const values = configValue(pathText) ?? [];
        const normalized = Array.isArray(values)
            ? values
                .map(value => itemType === "string" ? String(value) : value)
                .filter(value => itemType === "string" ? Boolean(value) : Boolean(value && typeof value === "object" && !Array.isArray(value)))
            : [];
        if (!normalized.length) {
            throw new Error(`${LIVE_ACCEPTANCE_FILE}: ${pathText} vuoto o mancante`);
        }
        return normalized;
    }

    function requiredConfigObject(pathText) {
        const value = configValue(pathText);
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            throw new Error(`${LIVE_ACCEPTANCE_FILE}: ${pathText} deve essere mappa`);
        }
        return value;
    }

    const firstRunPages = requiredConfigArray("first_run_pages");
    const uxSurfaceChecks = requiredConfigObject("ux_surface_checks");
    const pluginRuntimeProbes = requiredConfigArray("plugin_runtime_probes", "object");
    const workflowSmoke = requiredConfigObject("workflow_smoke");
    const cycleSmoke = requiredConfigObject("cycle_smoke");

    function validateLiveAcceptanceContract() {
        const errors = [];
        const workflow = workflowSmoke;
        const cycle = cycleSmoke;
        const ux = uxSurfaceChecks;
        const probeIds = new Set();
        for (const key of ["forbidden_visible_text", "forbidden_visible_regex", "forbidden_visible_selectors", "required_visible_text_by_page"]) {
            if (!Array.isArray(ux[key]) || !ux[key].length) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: ux_surface_checks.${key} deve essere lista non vuota`);
            }
        }
        for (const [index, pattern] of (ux.forbidden_visible_regex ?? []).entries()) {
            try {
                new RegExp(String(pattern));
            } catch (error) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: ux_surface_checks.forbidden_visible_regex[${index}] non valida (${error.message})`);
            }
        }
        for (const [index, rule] of (ux.forbidden_visible_selectors ?? []).entries()) {
            if (!String(rule?.selector ?? "").trim()) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: ux_surface_checks.forbidden_visible_selectors[${index}].selector vuoto`);
            }
            if (!String(rule?.description ?? "").trim()) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: ux_surface_checks.forbidden_visible_selectors[${index}].description vuoto`);
            }
        }
        const uxPages = new Set();
        for (const [index, rule] of (ux.required_visible_text_by_page ?? []).entries()) {
            const page = String(rule?.page ?? "").trim();
            if (!page) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: ux_surface_checks.required_visible_text_by_page[${index}].page vuoto`);
                continue;
            }
            uxPages.add(page);
            for (const key of ["all", "any"]) {
                if (!Array.isArray(rule[key]) || !rule[key].map(String).filter(Boolean).length) {
                    errors.push(`${LIVE_ACCEPTANCE_FILE}: ux_surface_checks.required_visible_text_by_page.${page}.${key} deve essere lista non vuota`);
                }
            }
        }
        for (const page of firstRunPages) {
            if (!uxPages.has(page)) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: ux_surface_checks.required_visible_text_by_page non copre pagina first-run ${page}`);
            }
        }
        for (const [index, rule] of (ux.required_clickable_buttons_by_page ?? []).entries()) {
            const page = String(rule?.page ?? "").trim();
            if (!page) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: ux_surface_checks.required_clickable_buttons_by_page[${index}].page vuoto`);
                continue;
            }
            if (!firstRunPages.includes(page)) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: ux_surface_checks.required_clickable_buttons_by_page.${page} non e una pagina first-run`);
            }
            const all = Array.isArray(rule.all) ? rule.all.map(String).filter(Boolean) : [];
            const any = Array.isArray(rule.any) ? rule.any.map(String).filter(Boolean) : [];
            if (!all.length && !any.length) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: ux_surface_checks.required_clickable_buttons_by_page.${page} deve dichiarare all o any`);
            }
        }
        for (const [index, probe] of pluginRuntimeProbes.entries()) {
            const id = String(probe.id ?? "").trim();
            if (!id) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: plugin_runtime_probes[${index}].id vuoto o mancante`);
                continue;
            }
            if (probeIds.has(id)) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: plugin_runtime_probes duplicato ${id}`);
            }
            probeIds.add(id);
            const hasSubstance = Boolean(
                probe.commands_any?.length ||
                probe.api_checks?.length ||
                probe.config_checks?.length ||
                probe.source_checks?.length ||
                probe.file_checks?.length
            );
            if (!hasSubstance) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: plugin_runtime_probes.${id} senza probe verificabile`);
            }
        }
        for (const pluginId of releasePluginIds) {
            if (!probeIds.has(pluginId)) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: plugin_runtime_probes non copre plugin release ${pluginId}`);
            }
        }
        const requiredWorkflowStrings = [
            "setup_page",
            "button_id",
            "button_label",
            "template_file",
            "helper_script",
            "user_script",
            "temp_note",
            "expected_world_path",
            "expected_world_name"
        ];
        for (const key of requiredWorkflowStrings) {
            if (!String(workflow[key] ?? "").trim()) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: workflow_smoke.${key} vuoto o mancante`);
            }
        }
        for (const key of ["prompt_answers", "suggester_answers"]) {
            const value = workflow[key];
            if (!value || typeof value !== "object" || Array.isArray(value) || !Object.keys(value).length) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: workflow_smoke.${key} deve essere mappa non vuota`);
            }
        }
        for (const key of ["expected_files", "expected_world_contains", "verify_pages_after_workflow", "persistence_pages"]) {
            if (!Array.isArray(workflow[key]) || !workflow[key].length) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: workflow_smoke.${key} deve essere lista non vuota`);
            }
        }
        for (const relPath of [workflow.helper_script, workflow.user_script, workflow.template_file]) {
            const sourcePath = path.join(root, String(relPath ?? ""));
            if (relPath && !fs.existsSync(sourcePath) && relPath !== workflow.template_file) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: file sorgente mancante ${relPath}`);
            }
        }
        if (!firstRunPages.includes(workflow.setup_page)) {
            errors.push(`${LIVE_ACCEPTANCE_FILE}: workflow_smoke.setup_page deve essere incluso in first_run_pages`);
        }
        if (!workflow.expected_files?.includes?.(workflow.expected_world_path)) {
            errors.push(`${LIVE_ACCEPTANCE_FILE}: workflow_smoke.expected_files deve includere expected_world_path`);
        }

        const requiredCycleStrings = [
            "setup_page",
            "table_page",
            "post_session_page",
            "session_button_id",
            "session_button_label",
            "session_template_file",
            "session_user_script",
            "post_session_button_id",
            "post_session_button_label",
            "post_session_template_file",
            "post_session_user_script",
            "post_session_action",
            "temp_note",
            "expected_session_path",
            "expected_session_name"
        ];
        for (const key of requiredCycleStrings) {
            if (!String(cycle[key] ?? "").trim()) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: cycle_smoke.${key} vuoto o mancante`);
            }
        }
        for (const key of [
            "prompt_answers",
            "suggester_answers",
            "prepare_frontmatter",
            "live_frontmatter",
            "expected_session_frontmatter",
            "expected_session_list_contains"
        ]) {
            const value = cycle[key];
            if (!value || typeof value !== "object" || Array.isArray(value) || !Object.keys(value).length) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: cycle_smoke.${key} deve essere mappa non vuota`);
            }
        }
        for (const key of ["expected_session_contains", "verify_pages_after_cycle", "persistence_pages"]) {
            if (!Array.isArray(cycle[key]) || !cycle[key].length) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: cycle_smoke.${key} deve essere lista non vuota`);
            }
        }
        for (const relPath of [cycle.session_user_script, cycle.post_session_user_script]) {
            const sourcePath = path.join(root, String(relPath ?? ""));
            if (relPath && !fs.existsSync(sourcePath)) {
                errors.push(`${LIVE_ACCEPTANCE_FILE}: file sorgente mancante ${relPath}`);
            }
        }
        if (!cycle.persistence_pages?.includes?.(cycle.expected_session_path)) {
            errors.push(`${LIVE_ACCEPTANCE_FILE}: cycle_smoke.persistence_pages deve includere expected_session_path`);
        }
        return errors;
    }

    return {
        LIVE_ACCEPTANCE_FILE,
        FIRST_RUN_PAGES: firstRunPages,
        UX_SURFACE_CHECKS: uxSurfaceChecks,
        PLUGIN_RUNTIME_PROBES: pluginRuntimeProbes,
        WORKFLOW_SMOKE: workflowSmoke,
        CYCLE_SMOKE: cycleSmoke,
        validateLiveAcceptanceContract
    };
}

module.exports = {
    createLiveAcceptanceConfig
};
