#!/usr/bin/env node

const {
    loadYaml,
    requiredList,
    requiredText,
    runStandardCockpitRenderer
} = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/generated_drafts_cockpit.json";
const RUNTIME_PROFILES = "Dev/TemplateFactory/modules/runtime_profiles.yaml";

function pathRegistry(ctx) {
    const runtimeProfiles = loadYaml(ctx, RUNTIME_PROFILES);
    return runtimeProfiles.runtime_contracts?.path_registry?.paths ?? {};
}

function validateGeneratedTargets({ ctx, contract }) {
    const registry = pathRegistry(ctx);
    const targets = contract.generated_targets ?? {};
    const fallbackPathKey = requiredText(ctx, targets.fallback_path_key, "generated_targets.fallback_path_key");
    const fallbackSpec = registry[fallbackPathKey];
    const fallbackFolder = String(fallbackSpec?.folder ?? "").trim();
    if (!fallbackFolder) ctx.fail(`${RUNTIME_PROFILES}: path_registry.${fallbackPathKey} mancante per generated_targets fallback`);

    const seen = new Set();
    const rules = requiredList(ctx, targets.rules, "generated_targets.rules").map((rule, index) => {
        const id = requiredText(ctx, rule.id, `generated_targets.rules[${index}].id`);
        if (seen.has(id)) ctx.fail(`${ctx.source}: generated_targets.rules id duplicato (${id})`);
        seen.add(id);

        const category = String(rule.category ?? "").trim();
        const type = String(rule.type ?? "").trim();
        if (!category && !type) ctx.fail(`${ctx.source}: generated_targets.rules.${id} richiede category o type`);
        if (category && type) ctx.fail(`${ctx.source}: generated_targets.rules.${id} deve usare category oppure type, non entrambi`);

        const pathKey = requiredText(ctx, rule.path_key, `generated_targets.rules.${id}.path_key`);
        const pathSpec = registry[pathKey];
        const folder = String(pathSpec?.folder ?? "").trim();
        if (!folder) ctx.fail(`${RUNTIME_PROFILES}: path_registry.${pathKey} mancante per generated_targets.rules.${id}`);

        return {
            id,
            ...(category ? { category } : {}),
            ...(type ? { type } : {}),
            path_key: pathKey,
            folder
        };
    });

    return {
        generated_targets: {
            fallback_path_key: fallbackPathKey,
            fallback_folder: fallbackFolder,
            rules
        }
    };
}

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/generated_drafts_cockpit.yaml",
    id: "generated_drafts_cockpit",
    runtimeModule: "z.engine/session_generated_drafts.js",
    runtimeNamespace: "generatedDraftsViews",
    exportLabel: "Smistamento Bozze",
    out: OUT,
    generatedBy: "render_generated_drafts_cockpit",
    expectedQueues: ["draft_queue", "ready_to_link", "unanchored", "destinations", "resolved"],
    afterQueuesPayload: validateGeneratedTargets,
    missingQueueLabel: "coda Smistamento Bozze mancante",
    errorTitle: "Contratto Smistamento Bozze cockpit non valido:",
    staleMessage: "Contratto Smistamento Bozze non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Smistamento Bozze cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Smistamento Bozze cockpit renderizzato: ${OUT}`
});
