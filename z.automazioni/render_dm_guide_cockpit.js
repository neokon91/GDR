#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { existsRel, readTextRel, repoPath } = require("./node_utils");

const ROOT = process.cwd();
const SOURCE = "Dev/TemplateFactory/modules/dm_guide_cockpit.yaml";
const BASES_SOURCE = "Dev/TemplateFactory/modules/bases_views.yaml";
const FILECLASS_SOURCE = "Dev/TemplateFactory/modules/frontmatter_profiles.yaml";
const RUNTIME_MODULE = "z.engine/session_dm_guide.js";
const OUT = "z.automazioni/data/runtime/dm_guide_cockpit.json";
const CHECK_ONLY = process.argv.includes("--check");
const errors = [];

function fail(message) {
    errors.push(message);
}

function loadYaml(relPath) {
    const script = [
        "import json, sys, yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");
    const stdout = execFileSync("python3", ["-c", script, repoPath(ROOT, relPath)], {
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024
    });
    return JSON.parse(stdout);
}

function requiredText(value, label) {
    const text = String(value ?? "").trim();
    if (!text) fail(`${SOURCE}: ${label} vuoto o mancante`);
    return text;
}

function requiredStringArray(value, label) {
    const items = Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : [];
    if (!items.length) fail(`${SOURCE}: ${label} deve essere lista non vuota`);
    return items;
}

function requiredList(value, label) {
    const items = Array.isArray(value) ? value.filter(Boolean) : [];
    if (!items.length) fail(`${SOURCE}: ${label} deve essere lista non vuota`);
    return items;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function baseTargets() {
    const source = loadYaml(BASES_SOURCE);
    const targets = new Set();
    for (const view of Object.values(source.views ?? {})) {
        if (view?.file) targets.add(String(view.file));
    }
    for (const view of Object.values(source.generated_bases?.files ?? {})) {
        if (view?.file) targets.add(String(view.file));
    }
    return targets;
}

function fileClassTargets() {
    const source = loadYaml(FILECLASS_SOURCE);
    return new Set(Object.values(source.fileclasses ?? {}).map(item => String(item?.file ?? "")).filter(Boolean));
}

function validateSurfaceTarget(surface, knownBases, knownFileClasses) {
    const target = requiredText(surface.target, `surfaces.${surface.id}.target`);
    if (target.startsWith("z.bases/")) {
        if (!knownBases.has(target)) fail(`${SOURCE}: Base non dichiarata in ${BASES_SOURCE} (${target})`);
        if (surface.generated_release !== true) fail(`${SOURCE}: ${target} deve dichiarare generated_release: true`);
        return target;
    }
    if (target.startsWith("z.fileclass/")) {
        if (!knownFileClasses.has(target)) fail(`${SOURCE}: FileClass non dichiarata in ${FILECLASS_SOURCE} (${target})`);
        if (surface.generated_release !== true) fail(`${SOURCE}: ${target} deve dichiarare generated_release: true`);
        return target;
    }
    if (!existsRel(ROOT, target)) fail(`${SOURCE}: target superficie mancante (${target})`);
    return target;
}

function validateDashboard(contract) {
    const dashboard = contract.dashboard ?? {};
    const page = requiredText(dashboard.page, "dashboard.page");
    const workflow = requiredText(dashboard.workflow, "dashboard.workflow");
    const runtimeViews = requiredStringArray(dashboard.required_runtime_views, "dashboard.required_runtime_views");
    const sections = requiredStringArray(dashboard.required_visible_sections, "dashboard.required_visible_sections");
    const text = readTextRel(ROOT, page, "");
    const runtime = readTextRel(ROOT, "z.engine/session_views.js", "");
    const moduleText = readTextRel(ROOT, RUNTIME_MODULE, "");

    if (!text) {
        fail(`${SOURCE}: dashboard page mancante (${page})`);
    } else {
        if (!text.includes(`renderWorkflowCommandDeck(dv, "${workflow}", { mode: "simple" })`)) {
            fail(`${page}: deck workflow ${workflow} non usa mode simple`);
        }
        if (text.includes("````tabs")) {
            fail(`${page}: non deve usare tabs inline dopo la migrazione cockpit`);
        }
        if (/dv\.pages\(/.test(text) || /^```dataview\s*$/m.test(text)) {
            fail(`${page}: contiene ancora query Dataview inline invece di runtime dedicato`);
        }
        if (text.split(/\r?\n/).length > 95) {
            fail(`${page}: superficie troppo lunga per una bussola DM compatta`);
        }
        for (const section of sections) {
            if (!new RegExp(`^##\\s+${escapeRegExp(section)}\\s*$`, "m").test(text)) {
                fail(`${page}: sezione richiesta mancante (${section})`);
            }
        }
        for (const view of runtimeViews) {
            if (!new RegExp(`gdr\\.${view}\\(`).test(text)) {
                fail(`${page}: runtime view non usata (${view})`);
            }
            if (!new RegExp(`\\b${view}:\\s+dmGuideViews\\.${view}\\b`).test(runtime)) {
                fail(`z.engine/session_views.js: export Guida DM non collegato (${view})`);
            }
            if (!new RegExp(`function\\s+${escapeRegExp(view)}\\b`).test(moduleText)) {
                fail(`${RUNTIME_MODULE}: funzione runtime mancante (${view})`);
            }
        }
    }

    return { page, workflow, required_runtime_views: runtimeViews, required_visible_sections: sections };
}

function validatePanels(contract, runtimeViews) {
    const panels = contract.panels ?? {};
    const normalized = {};
    for (const [id, panel] of Object.entries(panels)) {
        const runtimeView = requiredText(panel?.runtime_view, `panels.${id}.runtime_view`);
        if (!runtimeViews.includes(runtimeView)) fail(`${SOURCE}: panels.${id} usa runtime non richiesto dal dashboard (${runtimeView})`);
        normalized[id] = {
            runtime_view: runtimeView,
            promise: requiredText(panel?.promise, `panels.${id}.promise`),
            answers: requiredStringArray(panel?.answers, `panels.${id}.answers`)
        };
    }
    if (!Object.keys(normalized).length) fail(`${SOURCE}: panels vuoto`);
    return normalized;
}

function validatePhases(contract) {
    const ids = new Set();
    return requiredList(contract.phases, "phases").map((phase, index) => {
        const id = requiredText(phase.id, `phases[${index}].id`);
        if (ids.has(id)) fail(`${SOURCE}: phases id duplicato (${id})`);
        ids.add(id);
        const surface = requiredText(phase.surface, `phases.${id}.surface`);
        if (!existsRel(ROOT, surface)) fail(`${SOURCE}: phase ${id} punta a superficie mancante (${surface})`);
        return {
            id,
            label: requiredText(phase.label, `phases.${id}.label`),
            surface,
            action: requiredText(phase.action, `phases.${id}.action`),
            done_when: requiredText(phase.done_when, `phases.${id}.done_when`)
        };
    });
}

function validateRules(contract) {
    const ids = new Set();
    return requiredList(contract.rules, "rules").map((rule, index) => {
        const id = requiredText(rule.id, `rules[${index}].id`);
        if (ids.has(id)) fail(`${SOURCE}: rules id duplicato (${id})`);
        ids.add(id);
        return {
            id,
            label: requiredText(rule.label, `rules.${id}.label`),
            action: requiredText(rule.action, `rules.${id}.action`),
            why: requiredText(rule.why, `rules.${id}.why`)
        };
    });
}

function validateSurfaces(contract) {
    const knownBases = baseTargets();
    const knownFileClasses = fileClassTargets();
    const ids = new Set();

    return requiredList(contract.surfaces, "surfaces").map((surface, index) => {
        const id = requiredText(surface.id, `surfaces[${index}].id`);
        if (ids.has(id)) fail(`${SOURCE}: surfaces id duplicato (${id})`);
        ids.add(id);
        return {
            id,
            label: requiredText(surface.label, `surfaces.${id}.label`),
            plugin: requiredText(surface.plugin, `surfaces.${id}.plugin`),
            target: validateSurfaceTarget(surface, knownBases, knownFileClasses),
            generated_release: surface.generated_release === true,
            badge: requiredText(surface.badge, `surfaces.${id}.badge`),
            role: requiredText(surface.role, `surfaces.${id}.role`),
            action: requiredText(surface.action, `surfaces.${id}.action`),
            why: requiredText(surface.why, `surfaces.${id}.why`)
        };
    });
}

function validateContracts(contract) {
    const required = [
        "dashboard_uses_runtime_views",
        "page_must_not_use_inline_dataview_queries",
        "guide_must_not_duplicate_cockpit_manuals",
        "surfaces_must_resolve_to_source_or_generated_release_target"
    ];
    for (const key of required) {
        if (contract.contracts?.[key] !== true) fail(`${SOURCE}: contracts.${key} deve essere true`);
    }
}

function validateGeneratedRootsStayUntracked() {
    const tracked = execFileSync("git", ["ls-files", "z.bases", "z.fileclass", "z.automazioni/data/runtime"], {
        cwd: ROOT,
        encoding: "utf8"
    }).trim();
    if (tracked) fail(`Root generate tracciate nel sorgente: ${tracked}`);
}

function buildPayload() {
    const contract = loadYaml(SOURCE);
    if (contract.id !== "dm_guide_cockpit") fail(`${SOURCE}: id non valido`);

    const dashboard = validateDashboard(contract);
    const panels = validatePanels(contract, dashboard.required_runtime_views);
    const phases = validatePhases(contract);
    const rules = validateRules(contract);
    const surfaces = validateSurfaces(contract);
    validateContracts(contract);
    validateGeneratedRootsStayUntracked();

    return {
        generated_by: "render_dm_guide_cockpit",
        source: SOURCE,
        version: String(contract.version ?? ""),
        purpose: String(contract.purpose ?? ""),
        dashboard,
        panels,
        phases,
        rules,
        surfaces
    };
}

function main() {
    const payload = buildPayload();

    if (errors.length) {
        console.error("Contratto Guida DM cockpit non valido:");
        for (const error of errors) console.error(`- ${error}`);
        process.exit(1);
    }

    const rendered = `${JSON.stringify(payload, null, 2)}\n`;
    const outPath = repoPath(ROOT, OUT);

    if (CHECK_ONLY) {
        const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
        if (current !== rendered) {
            console.error("Contratto Guida DM non aggiornato: eseguire npm run sync:sources");
            process.exit(1);
        }
        console.log(`Guida DM cockpit OK: ${payload.phases.length} fasi, ${payload.rules.length} regole e ${payload.surfaces.length} superfici verificate.`);
        return;
    }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, rendered);
    console.log(`Generato ${OUT}`);
}

main();
