const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { existsRel, readTextRel, repoPath } = require("./node_utils");

const DEFAULT_BASES_SOURCE = "Dev/TemplateFactory/modules/bases_views.yaml";
const DEFAULT_FILECLASS_SOURCE = "Dev/TemplateFactory/modules/frontmatter_profiles.yaml";

function createContext(options) {
    const ctx = {
        root: options.root ?? process.cwd(),
        source: options.source,
        basesSource: options.basesSource ?? DEFAULT_BASES_SOURCE,
        fileClassSource: options.fileClassSource ?? DEFAULT_FILECLASS_SOURCE,
        errors: []
    };
    ctx.fail = message => ctx.errors.push(message);
    return ctx;
}

function loadYaml(ctx, relPath) {
    const script = [
        "import json, sys, yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");
    const stdout = execFileSync("python3", ["-c", script, repoPath(ctx.root, relPath)], {
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024
    });
    return JSON.parse(stdout);
}

function requiredText(ctx, value, label) {
    const text = String(value ?? "").trim();
    if (!text) ctx.fail(`${ctx.source}: ${label} vuoto o mancante`);
    return text;
}

function requiredStringArray(ctx, value, label) {
    const items = Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : [];
    if (!items.length) ctx.fail(`${ctx.source}: ${label} deve essere lista non vuota`);
    return items;
}

function requiredList(ctx, value, label) {
    const items = Array.isArray(value) ? value.filter(Boolean) : [];
    if (!items.length) ctx.fail(`${ctx.source}: ${label} deve essere lista non vuota`);
    return items;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function baseTargets(ctx) {
    const source = loadYaml(ctx, ctx.basesSource);
    const targets = new Set();
    for (const view of Object.values(source.views ?? {})) {
        if (view?.file) targets.add(String(view.file));
    }
    for (const view of Object.values(source.generated_bases?.files ?? {})) {
        if (view?.file) targets.add(String(view.file));
    }
    return targets;
}

function fileClassTargets(ctx) {
    const source = loadYaml(ctx, ctx.fileClassSource);
    return new Set(Object.values(source.fileclasses ?? {}).map(item => String(item?.file ?? "")).filter(Boolean));
}

function validateSurfaceTarget(ctx, surface, knownBases, knownFileClasses) {
    const target = requiredText(ctx, surface.target, `surfaces.${surface.id}.target`);
    if (target.startsWith("z.bases/")) {
        if (!knownBases.has(target)) ctx.fail(`${ctx.source}: Base non dichiarata in ${ctx.basesSource} (${target})`);
        if (surface.generated_release !== true) ctx.fail(`${ctx.source}: ${target} deve dichiarare generated_release: true`);
        return target;
    }
    if (target.startsWith("z.fileclass/")) {
        if (!knownFileClasses.has(target)) ctx.fail(`${ctx.source}: FileClass non dichiarata in ${ctx.fileClassSource} (${target})`);
        if (surface.generated_release !== true) ctx.fail(`${ctx.source}: ${target} deve dichiarare generated_release: true`);
        return target;
    }
    if (!existsRel(ctx.root, target)) ctx.fail(`${ctx.source}: target superficie mancante (${target})`);
    return target;
}

function runtimeExportsDeclareModule(ctx, modulePath) {
    if (!modulePath) return false;
    const source = loadYaml(ctx, "Dev/TemplateFactory/modules/runtime_exports.yaml");
    for (const group of Object.values(source.runtime_modules ?? {})) {
        if (Array.isArray(group) && group.some(entry => entry?.path === modulePath)) return true;
    }
    return false;
}

function validateDashboard(ctx, contract, options) {
    const dashboard = contract.dashboard ?? {};
    const page = requiredText(ctx, dashboard.page, "dashboard.page");
    const workflow = requiredText(ctx, dashboard.workflow, "dashboard.workflow");
    const runtimeViews = requiredStringArray(ctx, dashboard.required_runtime_views, "dashboard.required_runtime_views");
    const sections = requiredStringArray(ctx, dashboard.required_visible_sections, "dashboard.required_visible_sections");
    const text = readTextRel(ctx.root, page, "");
    const runtime = readTextRel(ctx.root, "z.engine/session_views.js", "");
    const moduleText = options.runtimeModule ? readTextRel(ctx.root, options.runtimeModule, "") : "";
    const exportLabel = options.exportLabel ?? "cockpit";
    const exportedByRenderBridge = options.runtimeModule
        ? runtimeExportsDeclareModule(ctx, options.runtimeModule) && runtime.includes("renderExports(...Object.values(runtimeViews))")
        : false;

    if (!text) {
        ctx.fail(`${ctx.source}: dashboard page mancante (${page})`);
    } else {
        if (!text.includes(`renderWorkflowCommandDeck(dv, "${workflow}", { mode: "simple" })`)) {
            ctx.fail(`${page}: deck workflow ${workflow} non usa mode simple`);
        }
        if (options.extraPageChecks) {
            options.extraPageChecks({ ctx, page, text, escapeRegExp });
        }
        for (const section of sections) {
            if (!new RegExp(`^##\\s+${escapeRegExp(section)}\\s*$`, "m").test(text)) {
                ctx.fail(`${page}: sezione richiesta mancante (${section})`);
            }
        }
        for (const view of runtimeViews) {
            if (!new RegExp(`gdr\\.${escapeRegExp(view)}\\(`).test(text)) {
                ctx.fail(`${page}: runtime view non usata (${view})`);
            }
            if (options.bridgeOnly) {
                if (!new RegExp(`\\b${escapeRegExp(view)}\\b`).test(runtime)) {
                    ctx.fail(`z.engine/session_views.js: runtime view mancante (${view})`);
                }
            } else if (!exportedByRenderBridge && !new RegExp(`\\b${escapeRegExp(view)}:\\s+${escapeRegExp(options.runtimeNamespace)}\\.${escapeRegExp(view)}\\b`).test(runtime)) {
                ctx.fail(`z.engine/session_views.js: export ${exportLabel} non collegato (${view})`);
            }
            if (options.runtimeModule) {
                const modulePattern = options.moduleViewPattern
                    ? options.moduleViewPattern(view)
                    : new RegExp(`\\b${escapeRegExp(view)}\\b`);
                if (!modulePattern.test(moduleText)) {
                    ctx.fail(`${options.runtimeModule}: funzione runtime mancante (${view})`);
                }
            }
        }
    }

    return { page, workflow, required_runtime_views: runtimeViews, required_visible_sections: sections };
}

function validatePanels(ctx, contract, runtimeViews) {
    const panels = contract.panels ?? {};
    const normalized = {};
    for (const [id, panel] of Object.entries(panels)) {
        const runtimeView = requiredText(ctx, panel?.runtime_view, `panels.${id}.runtime_view`);
        if (!runtimeViews.includes(runtimeView)) ctx.fail(`${ctx.source}: panels.${id} usa runtime non richiesto dal dashboard (${runtimeView})`);
        normalized[id] = {
            runtime_view: runtimeView,
            promise: requiredText(ctx, panel?.promise, `panels.${id}.promise`),
            answers: requiredStringArray(ctx, panel?.answers, `panels.${id}.answers`)
        };
    }
    if (!Object.keys(normalized).length) ctx.fail(`${ctx.source}: panels vuoto`);
    return normalized;
}

function validateQueues(ctx, contract, options = {}) {
    const expected = new Set(options.expected ?? []);
    const missingLabel = options.missingLabel ?? "coda mancante";
    const queues = requiredList(ctx, contract.queues, "queues").map((queue, index) => {
        const id = requiredText(ctx, queue.id, `queues[${index}].id`);
        return {
            id,
            label: requiredText(ctx, queue.label, `queues[${index}].label`),
            table_columns: requiredStringArray(ctx, queue.table_columns, `queues[${index}].table_columns`)
        };
    });
    for (const id of expected) {
        if (!queues.some(queue => queue.id === id)) ctx.fail(`${ctx.source}: ${missingLabel} (${id})`);
    }
    return queues;
}

function validateSurfaces(ctx, contract) {
    const knownBases = baseTargets(ctx);
    const knownFileClasses = fileClassTargets(ctx);
    const ids = new Set();

    return requiredList(ctx, contract.surfaces, "surfaces").map((surface, index) => {
        const id = requiredText(ctx, surface.id, `surfaces[${index}].id`);
        if (ids.has(id)) ctx.fail(`${ctx.source}: surfaces id duplicato (${id})`);
        ids.add(id);
        return {
            id,
            label: requiredText(ctx, surface.label, `surfaces.${id}.label`),
            plugin: requiredText(ctx, surface.plugin, `surfaces.${id}.plugin`),
            target: validateSurfaceTarget(ctx, surface, knownBases, knownFileClasses),
            generated_release: surface.generated_release === true,
            badge: requiredText(ctx, surface.badge, `surfaces.${id}.badge`),
            role: requiredText(ctx, surface.role, `surfaces.${id}.role`),
            action: requiredText(ctx, surface.action, `surfaces.${id}.action`),
            why: requiredText(ctx, surface.why, `surfaces.${id}.why`)
        };
    });
}

function validateObjectList(ctx, value, label, fields) {
    return requiredList(ctx, value, label).map((item, index) => {
        const id = requiredText(ctx, item.id, `${label}[${index}].id`);
        const normalized = { id };
        for (const field of fields) {
            normalized[field] = requiredText(ctx, item[field], `${label}.${id}.${field}`);
        }
        return normalized;
    });
}

function validateGeneratedRootsStayUntracked(ctx, roots = ["z.bases", "z.fileclass"]) {
    const tracked = execFileSync("git", ["ls-files", ...roots], {
        cwd: ctx.root,
        encoding: "utf8"
    }).trim();
    if (tracked) ctx.fail(`Root generate tracciate nel sorgente: ${tracked}`);
}

function validateBaseViewRequirements(ctx, requirements = []) {
    if (!requirements.length) return;
    const bases = loadYaml(ctx, ctx.basesSource);
    for (const requirement of requirements) {
        const viewId = requirement.view;
        const view = bases.views?.[viewId] ?? {};
        for (const field of requirement.requiredFields ?? []) {
            if (!Array.isArray(view.required_fields) || !view.required_fields.includes(field)) {
                ctx.fail(`${ctx.basesSource}: ${viewId} deve richiedere ${field}`);
            }
        }
        for (const [flag, expected] of Object.entries(requirement.flags ?? {})) {
            if (view[flag] !== expected) {
                ctx.fail(`${ctx.basesSource}: ${viewId} deve dichiarare ${flag}: ${expected}`);
            }
        }
    }
}

function exitOnErrors(ctx, title) {
    if (!ctx.errors.length) return;
    console.error(title);
    for (const error of ctx.errors) console.error(`- ${error}`);
    process.exit(1);
}

function writePayload(ctx, options) {
    const rendered = `${JSON.stringify(options.payload, null, 2)}\n`;
    const outPath = repoPath(ctx.root, options.out);

    if (options.checkOnly) {
        const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
        if (current !== rendered) {
            console.error(options.staleMessage);
            process.exit(1);
        }
        console.log(options.okMessage);
        return;
    }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, rendered, "utf8");
    console.log(options.renderMessage);
}

function resolveMessage(message, payload) {
    return typeof message === "function" ? message(payload) : message;
}

function buildStandardPayload(ctx, config) {
    const contract = loadYaml(ctx, config.source);
    if (contract.id !== config.id) ctx.fail(`${config.source}: id non valido`);

    const dashboard = validateDashboard(ctx, contract, {
        runtimeModule: config.runtimeModule,
        runtimeNamespace: config.runtimeNamespace,
        exportLabel: config.exportLabel,
        extraPageChecks: config.extraPageChecks,
        moduleViewPattern: config.moduleViewPattern,
        bridgeOnly: config.bridgeOnly
    });
    const panels = validatePanels(ctx, contract, dashboard.required_runtime_views);
    const beforeQueuesPayload = config.beforeQueuesPayload
        ? config.beforeQueuesPayload({ ctx, contract, dashboard, panels })
        : {};
    const queues = config.skipQueues
        ? []
        : validateQueues(ctx, contract, {
            expected: config.expectedQueues,
            missingLabel: config.missingQueueLabel
        });
    const afterQueuesPayload = config.afterQueuesPayload
        ? config.afterQueuesPayload({ ctx, contract, dashboard, panels, queues })
        : {};
    const surfaces = validateSurfaces(ctx, contract);
    validateBaseViewRequirements(ctx, config.baseViewRequirements);
    if (config.extraContractChecks) config.extraContractChecks({ ctx, contract, dashboard, panels, queues, surfaces });
    validateGeneratedRootsStayUntracked(ctx, config.generatedRoots);

    const payload = {
        generated_by: config.generatedBy,
        source: config.source,
        version: String(contract.version ?? ""),
        purpose: String(contract.purpose ?? ""),
        dashboard,
        panels,
        ...beforeQueuesPayload
    };
    if (!config.skipQueues) payload.queues = queues;
    Object.assign(payload, afterQueuesPayload);
    payload.surfaces = surfaces;
    return payload;
}

function runStandardCockpitRenderer(config) {
    const ctx = createContext({
        root: config.root,
        source: config.source,
        basesSource: config.basesSource,
        fileClassSource: config.fileClassSource
    });
    const payload = buildStandardPayload(ctx, config);
    exitOnErrors(ctx, config.errorTitle);
    writePayload(ctx, {
        payload,
        out: config.out,
        checkOnly: config.checkOnly ?? process.argv.includes("--check"),
        staleMessage: resolveMessage(config.staleMessage, payload),
        okMessage: resolveMessage(config.okMessage, payload),
        renderMessage: resolveMessage(config.renderMessage, payload)
    });
}

module.exports = {
    buildStandardPayload,
    createContext,
    exitOnErrors,
    loadYaml,
    requiredList,
    requiredStringArray,
    requiredText,
    validateDashboard,
    validateBaseViewRequirements,
    validateGeneratedRootsStayUntracked,
    validateObjectList,
    validatePanels,
    validateQueues,
    validateSurfaces,
    runStandardCockpitRenderer,
    writePayload
};
