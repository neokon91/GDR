#!/usr/bin/env node

const {
    requiredList,
    requiredStringArray,
    requiredText,
    runStandardCockpitRenderer
} = require("./cockpit_renderer_utils");
const { readTextRel } = require("./node_utils");

const OUT = "z.automazioni/data/runtime/map_import_cockpit.json";

function validateSources(ctx, contract) {
    const scripts = JSON.parse(readTextRel(ctx.root, "package.json", "{}")).scripts ?? {};
    const ids = new Set();
    return requiredList(ctx, contract.sources, "sources").map((source, index) => {
        const id = requiredText(ctx, source.id, `sources[${index}].id`);
        if (ids.has(id)) ctx.fail(`${ctx.source}: sources id duplicato (${id})`);
        ids.add(id);
        const npmScript = requiredText(ctx, source.npm_script, `sources.${id}.npm_script`);
        if (!scripts[npmScript]) ctx.fail(`${ctx.source}: sources.${id}.npm_script non esiste in package.json (${npmScript})`);
        const dryRunCommand = requiredText(ctx, source.dry_run_command, `sources.${id}.dry_run_command`);
        const importCommand = requiredText(ctx, source.import_command, `sources.${id}.import_command`);
        if (!dryRunCommand.includes(`npm run ${npmScript}`)) ctx.fail(`${ctx.source}: sources.${id}.dry_run_command non usa npm run ${npmScript}`);
        if (!dryRunCommand.includes("--dry-run")) ctx.fail(`${ctx.source}: sources.${id}.dry_run_command deve includere --dry-run`);
        if (!importCommand.includes(`npm run ${npmScript}`)) ctx.fail(`${ctx.source}: sources.${id}.import_command non usa npm run ${npmScript}`);
        return {
            id,
            label: requiredText(ctx, source.label, `sources.${id}.label`),
            npm_script: npmScript,
            source_key: requiredText(ctx, source.source_key, `sources.${id}.source_key`),
            accepts: requiredStringArray(ctx, source.accepts, `sources.${id}.accepts`),
            dry_run_command: dryRunCommand,
            import_command: importCommand,
            writes_to: requiredText(ctx, source.writes_to, `sources.${id}.writes_to`),
            guardrail: requiredText(ctx, source.guardrail, `sources.${id}.guardrail`)
        };
    });
}

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/import_maps_cockpit.yaml",
    id: "import_maps_cockpit",
    runtimeModule: "z.engine/session_import_maps.js",
    runtimeNamespace: "importMapViews",
    exportLabel: "import mappe",
    out: OUT,
    generatedBy: "render_import_maps_cockpit",
    moduleViewPattern: view => new RegExp(`function\\s+${view}\\b`),
    extraPageChecks: ({ ctx, page, text }) => {
        if (text.includes("````tabs")) {
            ctx.fail(`${page}: non deve usare tabs inline dopo la migrazione cockpit`);
        }
        if (/dv\.pages\(/.test(text) || /^```dataview\s*$/m.test(text)) {
            ctx.fail(`${page}: contiene ancora query Dataview inline invece di runtime dedicato`);
        }
        if (text.split(/\r?\n/).length > 140) {
            ctx.fail(`${page}: superficie troppo lunga per un cockpit import compatto`);
        }
    },
    beforeQueuesPayload: ({ ctx, contract }) => ({
        sources: validateSources(ctx, contract)
    }),
    generatedRoots: ["z.bases", "z.fileclass", "z.automazioni/data/runtime"],
    errorTitle: "Contratto Importare Mappe cockpit non valido:",
    staleMessage: "Contratto Importare Mappe cockpit non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Importare Mappe cockpit OK: ${payload.sources.length} sorgenti e ${payload.surfaces.length} superfici verificate.`,
    renderMessage: `Generato ${OUT}`
});
