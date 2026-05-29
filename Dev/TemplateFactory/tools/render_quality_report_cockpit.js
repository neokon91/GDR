#!/usr/bin/env node

const { loadYaml, runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/quality_report_cockpit.json";
const REGION_PLAYABILITY_CONTRACT = "Dev/TemplateFactory/modules/region_playability_contract.yaml";
const REGION_TO_SESSION_CONTRACT = "Dev/TemplateFactory/modules/region_to_session_contract.yaml";

function regionPlayabilityPayload({ ctx }) {
    const regionPlayability = loadYaml(ctx, REGION_PLAYABILITY_CONTRACT);
    const regionToSession = loadYaml(ctx, REGION_TO_SESSION_CONTRACT);
    if (regionPlayability.id !== "region_playability_contract") {
        ctx.fail(`${REGION_PLAYABILITY_CONTRACT}: id non valido`);
    }
    if (regionToSession.id !== "region_to_session_contract") {
        ctx.fail(`${REGION_TO_SESSION_CONTRACT}: id non valido`);
    }
    return {
        region_playability_contract: {
            source: REGION_PLAYABILITY_CONTRACT,
            version: String(regionPlayability.version ?? ""),
            region_playability: regionPlayability.region_playability ?? {},
            validation_model: regionPlayability.validation_model ?? {}
        },
        region_to_session_contract: {
            source: REGION_TO_SESSION_CONTRACT,
            version: String(regionToSession.version ?? ""),
            region_to_session: regionToSession.region_to_session ?? {},
            validation_model: regionToSession.validation_model ?? {}
        }
    };
}

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/quality_report_cockpit.yaml",
    id: "quality_report_cockpit",
    runtimeModule: "z.engine/session_quality_report.js",
    runtimeNamespace: "qualityReportViews",
    exportLabel: "Quality Report",
    out: OUT,
    generatedBy: "render_quality_report_cockpit",
    expectedQueues: ["operational_gaps", "public_risks", "public_missing_text", "screenshot_ready"],
    afterQueuesPayload: regionPlayabilityPayload,
    missingQueueLabel: "coda Quality Report mancante",
    errorTitle: "Contratto Quality Report cockpit non valido:",
    staleMessage: "Contratto Quality Report non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Quality Report cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Quality Report cockpit renderizzato: ${OUT}`
});
