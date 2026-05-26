#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const errors = [];
const REQUIRED_EXPORTS = [
    "renderActiveSessionBanner",
    "renderCombatReadiness",
    "renderConsequenceCards",
    "renderContinuityQueue",
    "renderDnd55MaterialPipeline",
    "renderLiveCommandCenter",
    "renderM11ContinuityChain",
    "renderOnboardingReadiness",
    "renderPlayerView",
    "renderPluginTroubleshooting",
    "renderPostSessionCommandCenter",
    "renderPropagationTargets",
    "renderSessionAnchorCards",
    "renderSessionMapCards",
    "renderSessionMaterialCards",
    "renderTableCockpit",
    "renderWorkflowCommandDeck",
    "renderWorldImpact",
    "renderWorldbuildingFreedom"
];
const REQUIRED_MODULES = [
    "z.engine/session_continuity.js",
    "z.engine/session_dnd.js",
    "z.engine/session_maps.js",
    "z.engine/session_player.js",
    "z.engine/session_runtime.js",
    "z.engine/session_views.js"
];

global.app = {
    plugins: {
        enabledPlugins: new Set([
            "dataview",
            "obsidian-meta-bind-plugin",
            "templater-obsidian",
            "obsidian-tasks-plugin"
        ])
    },
    vault: {
        adapter: {
            async read(relPath) {
                return fs.readFileSync(path.join(ROOT, relPath), "utf8");
            }
        }
    }
};

async function main() {
    for (const relPath of REQUIRED_MODULES) {
        if (!fs.existsSync(path.join(ROOT, relPath))) {
            errors.push(`runtime mancante: ${relPath}`);
        }
    }

    if (!errors.length) {
        const views = await eval(fs.readFileSync(path.join(ROOT, "z.engine/session_views.js"), "utf8"));
        for (const name of REQUIRED_EXPORTS) {
            if (typeof views[name] !== "function") {
                errors.push(`export runtime mancante o non funzione: ${name}`);
            }
        }
        if (!errors.length) {
            const rendered = [];
            const emptyPages = items => ({
                where(predicate) {
                    return emptyPages(items.filter(predicate));
                },
                array() {
                    return items;
                },
                get length() {
                    return items.length;
                }
            });
            const dv = {
                el(tag, text = "", options = {}) {
                    const node = { tag, text, options, innerHTML: "" };
                    rendered.push(node);
                    return node;
                },
                pages() {
                    return emptyPages([]);
                }
            };
            await views.renderWorkflowCommandDeck(dv, "gioca_live");
            if (!rendered.some(node => String(node.innerHTML).includes("BUTTON[registra-scelta-mondo]"))) {
                errors.push("renderWorkflowCommandDeck: output workflow gioca_live senza pulsanti operativi");
            }
            if (!rendered.some(node => String(node.innerHTML).includes("BUTTON[evento-live-z-modelli-live-evento-md]"))) {
                errors.push("renderWorkflowCommandDeck: output workflow gioca_live senza gruppi di cattura");
            }
            if (!rendered.some(node => String(node.innerHTML).includes("crea nota da z.modelli/Live Evento.md"))) {
                errors.push("renderWorkflowCommandDeck: output senza fallback Meta Bind da template configurato");
            }
            if (!rendered.some(node => String(node.innerHTML).includes("Plugin da attivare"))) {
                errors.push("renderWorkflowCommandDeck: output senza diagnosi plugin mancanti");
            }
            views.renderPluginTroubleshooting(dv, "dashboard_dm");
            if (!rendered.some(node => String(node.innerHTML).includes("Fallback manuale"))) {
                errors.push("renderPluginTroubleshooting: output senza fallback manuale");
            }
            await views.renderWorkflowCommandDeck(dv, "onboarding_utente", { mode: "simple" });
            if (!rendered.some(node => String(node.innerHTML).includes("Percorso"))) {
                errors.push("renderWorkflowCommandDeck: output semplice onboarding mancante");
            }
            if (rendered.some(node => String(node.innerHTML).includes("Plugin coinvolti"))) {
                errors.push("renderWorkflowCommandDeck: output semplice onboarding espone diagnostica plugin");
            }
            views.renderWorldbuildingFreedom(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Liberta di worldbuilding"))) {
                errors.push("renderWorldbuildingFreedom: output senza regia worldbuilding libero");
            }
        }
    }

    if (errors.length) {
        console.error("Runtime Obsidian non valido:");
        for (const error of errors) console.error(`- ${error}`);
        process.exit(1);
    }

    console.log(`Runtime Obsidian OK: ${REQUIRED_EXPORTS.length} export verificati.`);
}

main().catch(error => {
    console.error(error.stack || error.message);
    process.exit(1);
});
