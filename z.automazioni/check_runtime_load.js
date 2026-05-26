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
    "renderVaultReadiness",
    "renderWorkflowCommandDeck",
    "renderWorldImpact",
    "renderWorldbuildingFreedom",
    "renderWorldbuildingStudio"
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
            const pageCollection = items => ({
                where(predicate) {
                    return pageCollection(items.filter(predicate));
                },
                sort(mapper, direction = "asc") {
                    const ordered = [...items].sort((a, b) => {
                        const left = mapper(a);
                        const right = mapper(b);
                        return left > right ? 1 : left < right ? -1 : 0;
                    });
                    return pageCollection(direction === "desc" ? ordered.reverse() : ordered);
                },
                limit(count) {
                    return pageCollection(items.slice(0, count));
                },
                array() {
                    return items;
                },
                get length() {
                    return items.length;
                }
            });
            const demoPages = [
                {
                    file: { path: "Mondi/Luoghi/Luogo Pubblico.md", name: "Luogo Pubblico", link: "Mondi/Luoghi/Luogo Pubblico.md", mtime: 3 },
                    categoria: "luogo",
                    stato: "pronto",
                    pubblico: true,
                    player_safe: "Luogo noto al party.",
                    segreto: "rivelazione DM"
                },
                {
                    file: { path: "Mondi/Missioni/Missione Pubblica.md", name: "Missione Pubblica", link: "Mondi/Missioni/Missione Pubblica.md", mtime: 2 },
                    categoria: "missione",
                    stato: "in corso",
                    pubblico: true,
                    player_safe: "Obiettivo chiaro."
                },
                {
                    file: { path: "Mondi/Sessioni/Sessione Giocata.md", name: "Sessione Giocata", link: "Mondi/Sessioni/Sessione Giocata.md", mtime: 1 },
                    categoria: "sessione",
                    stato: "giocata",
                    pubblico: true,
                    data: "2026-05-26",
                    recap_pubblico: "Recap pubblico pronto."
                },
                {
                    file: { path: "Risorse/Mappe/Mappa Pubblica.md", name: "Mappa Pubblica", link: "Risorse/Mappe/Mappa Pubblica.md", mtime: 4 },
                    categoria: "mappa",
                    stato: "pronto",
                    pubblico: true,
                    player_safe: "Mappa condivisibile.",
                    uso: "tavolo"
                }
            ];
            const pagesForSource = source => {
                const query = String(source ?? "");
                if (query.includes('"Mondi"') && query.includes('"Risorse/Mappe"')) {
                    return demoPages.filter(page => page.file.path.startsWith("Mondi/") || page.file.path.startsWith("Risorse/Mappe/"));
                }
                if (query.includes('"Mondi/Sessioni"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Sessioni/"));
                if (query.includes('"Mondi/Missioni"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Missioni/"));
                if (query.includes('"Mondi/Personaggi"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Personaggi/"));
                if (query.includes('"Mondi/Luoghi"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Luoghi/"));
                if (query.includes('"Mondi/Dispense"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Dispense/"));
                if (query.includes('"Risorse/Mappe"')) return demoPages.filter(page => page.file.path.startsWith("Risorse/Mappe/"));
                return [];
            };
            const dv = {
                array(items) {
                    return pageCollection(Array.isArray(items) ? items : items ? [items] : []);
                },
                el(tag, text = "", options = {}) {
                    const node = { tag, text, options, innerHTML: "" };
                    rendered.push(node);
                    return node;
                },
                header(level, text) {
                    rendered.push({ tag: `h${level}`, text, innerHTML: text });
                },
                pages(source) {
                    return pageCollection(pagesForSource(source));
                },
                paragraph(text) {
                    rendered.push({ tag: "p", text, innerHTML: text });
                },
                table(headers, rows) {
                    rendered.push({ tag: "table", headers, rows, text: rows.flat().join(" "), innerHTML: rows.flat().join(" ") });
                }
            };
            await views.renderWorkflowCommandDeck(dv, "gioca_live", { mode: "diagnostic" });
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
            await views.renderVaultReadiness(dv, "setup");
            if (!rendered.some(node => node.tag === "table" || String(node.text).includes("Pulsanti e creazione note"))) {
                errors.push("renderVaultReadiness: output setup non renderizzato");
            }
            views.renderWorldbuildingFreedom(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Liberta di worldbuilding"))) {
                errors.push("renderWorldbuildingFreedom: output senza regia worldbuilding libero");
            }
            views.renderWorldbuildingStudio(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Studio Worldbuilding"))) {
                errors.push("renderWorldbuildingStudio: output senza studio worldbuilding");
            }
            views.renderPlayerPortalStatus(dv);
            views.renderPublicSafety(dv);
            views.renderPlayerView(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Anti-segreti"))) {
                errors.push("Vista Giocatori: stato portale non renderizzato");
            }
            if (!rendered.some(node => String(node.innerHTML).includes("pubblico: true con campi segreti"))) {
                errors.push("Vista Giocatori: controllo sicurezza non segnala note pubbliche rischiose");
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
