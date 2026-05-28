#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/quality_report_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/quality_report_cockpit.yaml",
    id: "quality_report_cockpit",
    runtimeModule: "z.engine/session_quality_report.js",
    runtimeNamespace: "qualityReportViews",
    exportLabel: "Quality Report",
    out: OUT,
    generatedBy: "render_quality_report_cockpit",
    expectedQueues: ["operational_gaps", "public_risks", "public_missing_text", "screenshot_ready"],
    missingQueueLabel: "coda Quality Report mancante",
    errorTitle: "Contratto Quality Report cockpit non valido:",
    staleMessage: "Contratto Quality Report non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Quality Report cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Quality Report cockpit renderizzato: ${OUT}`
});
