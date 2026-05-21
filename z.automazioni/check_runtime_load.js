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
    "renderPlayerView",
    "renderPostSessionCommandCenter",
    "renderPropagationTargets",
    "renderSessionAnchorCards",
    "renderSessionMapCards",
    "renderSessionMaterialCards",
    "renderTableCockpit",
    "renderWorldImpact"
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
