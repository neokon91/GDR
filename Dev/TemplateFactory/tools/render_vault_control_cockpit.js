#!/usr/bin/env node

const { runStandardCockpitRenderer } = require("./cockpit_renderer_utils");

const OUT = "z.automazioni/data/runtime/vault_control_cockpit.json";

runStandardCockpitRenderer({
    source: "Dev/TemplateFactory/modules/vault_control_cockpit.yaml",
    id: "vault_control_cockpit",
    runtimeModule: "z.engine/session_vault_control.js",
    runtimeNamespace: "vaultControlViews",
    exportLabel: "Controllo Vault",
    out: OUT,
    generatedBy: "render_vault_control_cockpit",
    expectedQueues: ["attention", "maps", "table_ready", "campaign_open"],
    missingQueueLabel: "coda Controllo Vault mancante",
    errorTitle: "Contratto Controllo Vault cockpit non valido:",
    staleMessage: "Contratto Controllo Vault non aggiornato: eseguire npm run sync:sources",
    okMessage: payload => `Controllo Vault cockpit OK: ${payload.surfaces.length} superfici e ${payload.queues.length} code verificate.`,
    renderMessage: `Controllo Vault cockpit renderizzato: ${OUT}`
});
