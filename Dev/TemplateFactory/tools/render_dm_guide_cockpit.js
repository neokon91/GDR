#!/usr/bin/env node

const {
    requiredList,
    requiredText,
    runStandardCockpitRenderer,
    validateObjectList
} = require("./cockpit_renderer_utils");
const { existsRel } = require("./node_utils");

const OUT = "z.automazioni/data/runtime/dm_guide_cockpit.json";

function validatePhases(ctx, contract) {
    const ids = new Set();
    return requiredList(ctx, contract.phases, "phases").map((phase, index) => {
        const id = requiredText(ctx, phase.id, `phases[${index}].id`);
        if (ids.has(id)) ctx.fail(`${ctx.source}: phases id duplicato (${id})`);
        ids.add(id);
        const surface = requiredText(ctx, phase.surface, `phases.${id}.surface`);
        if (!existsRel(ctx.root, surface)) ctx.fail(`${ctx.source}: phase ${id} punta a superficie mancante (${surface})`);
        return {
            id,
            label: requiredText(ctx, phase.label, `phases.${id}.label`),
            surface,
            action: requiredText(ctx, phase.action, `phases.${id}.action`),
            done_when: requiredText(ctx, phase.done_when, `phases.${id}.done_when`)
        };
    });
}

function validateContracts(ctx, contract) {
    const required = [
        "dashboard_uses_runtime_views",
        "page_must_not_use_inline_dataview_queries",
        "guide_must_not_duplicate_cockpit_manuals",
        "surfaces_must_resolve_to_source_or_generated_release_target"
    ];
    for (const key of required) {
        if (contract.contracts?.[key] !== true) ctx.fail(`${ctx.source}: contracts.${key} deve essere true`);
    }
}

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/dm_guide_cockpit.yaml",
    id: "dm_guide_cockpit",
    runtimeModule: "z.engine/session_dm_guide.js",
    runtimeNamespace: "dmGuideViews",
    exportLabel: "Guida DM",
    out: OUT,
    generatedBy: "render_dm_guide_cockpit",
    moduleViewPattern: view => new RegExp(`function\\s+${view}\\b`),
    extraPageChecks: ({ ctx, page, text }) => {
        if (text.includes("````tabs")) {
            ctx.fail(`${page}: non deve usare tabs inline dopo la migrazione cockpit`);
        }
        if (/dv\.pages\(/.test(text) || /^```dataview\s*$/m.test(text)) {
            ctx.fail(`${page}: contiene ancora query Dataview inline invece di runtime dedicato`);
        }
        if (text.split(/\r?\n/).length > 140) {
            ctx.fail(`${page}: superficie troppo lunga per una bussola DM compatta`);
        }
    },
    skipQueues: true,
    beforeQueuesPayload: ({ ctx, contract }) => ({
        phases: validatePhases(ctx, contract),
        rules: validateObjectList(ctx, contract.rules, "rules", ["label", "action", "why"])
    }),
    extraContractChecks: ({ ctx, contract }) => validateContracts(ctx, contract),
    generatedRoots: ["z.bases", "z.fileclass", "z.automazioni/data/runtime"],
    errorTitle: "Contratto Guida DM cockpit non valido:",
    staleMessage: "Contratto Guida DM non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Guida DM cockpit OK: ${payload.phases.length} fasi, ${payload.rules.length} regole e ${payload.surfaces.length} superfici verificate.`,
    renderMessage: `Generato ${OUT}`
});
