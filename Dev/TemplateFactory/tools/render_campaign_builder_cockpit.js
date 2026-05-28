#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/campaign_builder_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/campaign_builder_cockpit.yaml",
    id: "campaign_builder_cockpit",
    runtimeModule: "z.engine/session_campaign_builder.js",
    runtimeNamespace: "campaignBuilderViews",
    exportLabel: "Campagna da Ambientazione",
    out: OUT,
    generatedBy: "render_campaign_builder_cockpit",
    expectedQueues: ["opportunities", "fronts", "campaigns", "sessions", "gaps"],
    missingQueueLabel: "coda Campagna da Ambientazione mancante",
    errorTitle: "Contratto Campagna da Ambientazione cockpit non valido:",
    staleMessage: "Contratto Campagna da Ambientazione non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Campagna da Ambientazione cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Campagna da Ambientazione cockpit renderizzato: ${OUT}`
});
