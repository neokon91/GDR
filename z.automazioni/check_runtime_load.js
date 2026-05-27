#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const errors = [];
const REQUIRED_EXPORTS = [
    "renderActiveSessionBanner",
    "renderAtlasNow",
    "renderAtlasQueues",
    "renderAtlasReadiness",
    "renderAtlasSurfaceLinks",
    "renderCanonControlNow",
    "renderCanonControlQueues",
    "renderCanonControlReadiness",
    "renderCanonControlSurfaceLinks",
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
    "renderWorldbuilderNow",
    "renderWorldbuilderQueues",
    "renderWorldbuilderReadiness",
    "renderWorldbuilderSurfaceLinks",
    "renderWorldbuildingControlNow",
    "renderWorldbuildingControlQueues",
    "renderWorldbuildingControlReadiness",
    "renderWorldbuildingControlSurfaceLinks"
];
const REQUIRED_MODULES = [
    "z.engine/session_continuity.js",
    "z.engine/session_atlas.js",
    "z.engine/session_canon_control.js",
    "z.engine/session_dnd.js",
    "z.engine/session_maps.js",
    "z.engine/session_player.js",
    "z.engine/session_runtime.js",
    "z.engine/session_views.js",
    "z.engine/session_worldbuilding_control.js"
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
                map(mapper) {
                    return pageCollection(items.map(mapper));
                },
                forEach(callback) {
                    items.forEach(callback);
                },
                some(predicate) {
                    return items.some(predicate);
                },
                first() {
                    return items[0] ?? null;
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
                    file: { path: "Mondi/Mondo Demo.md", name: "Mondo Demo", link: "Mondi/Mondo Demo.md", folder: "Mondi", mtime: 6 },
                    categoria: "mondo",
                    stato: "pronto",
                    premessa: "Un arcipelago conteso.",
                    conflitto_centrale: "I fari sacri si spengono.",
                    fazioni_principali: ["Mondi/Fazioni/Consiglio.md"],
                    luoghi_iconici: ["Mondi/Luoghi/Luogo Pubblico.md"],
                    culture_fondative: ["Mondi/Culture/Naviganti.md"]
                },
                {
                    file: { path: "Mondi/Luoghi/Luogo Pubblico.md", name: "Luogo Pubblico", link: "Mondi/Luoghi/Luogo Pubblico.md", mtime: 3 },
                    categoria: "luogo",
                    stato: "pronto",
                    pubblico: true,
                    player_safe: "Luogo noto al party.",
                    mondo: "Mondi/Mondo Demo.md",
                    fazioni: ["Mondi/Fazioni/Consiglio.md"],
                    coordinates: [45, 9],
                    uso_al_tavolo: "Scena di trattativa."
                },
                {
                    file: { path: "Mondi/Fazioni/Consiglio.md", name: "Consiglio", link: "Mondi/Fazioni/Consiglio.md", folder: "Mondi/Fazioni", mtime: 5 },
                    categoria: "fazione",
                    stato: "in gioco",
                    mondo: "Mondi/Mondo Demo.md",
                    pressione: 6,
                    prossima_mossa: "Chiude il porto.",
                    luoghi: ["Mondi/Luoghi/Luogo Pubblico.md"],
                    missioni: ["Mondi/Missioni/Missione Pubblica.md"]
                },
                {
                    file: { path: "Mondi/Rotte/Strada del Sale.md", name: "Strada del Sale", link: "Mondi/Rotte/Strada del Sale.md", folder: "Mondi/Rotte", mtime: 7 },
                    categoria: "rotta",
                    stato: "contesa",
                    mondo: "Mondi/Mondo Demo.md",
                    partenza: "Mondi/Luoghi/Luogo Pubblico.md",
                    arrivo: "Mondi/Luoghi/Luogo Pubblico.md",
                    pressione: 5,
                    prossima_mossa: "Il pedaggio raddoppia."
                },
                {
                    file: { path: "Mondi/Missioni/Missione Pubblica.md", name: "Missione Pubblica", link: "Mondi/Missioni/Missione Pubblica.md", mtime: 2 },
                    categoria: "missione",
                    stato: "in corso",
                    pubblico: true,
                    player_safe: "Obiettivo chiaro.",
                    mondo: "Mondi/Mondo Demo.md",
                    fazioni: ["Mondi/Fazioni/Consiglio.md"],
                    luoghi: ["Mondi/Luoghi/Luogo Pubblico.md"],
                    pressione: 4,
                    prossima_mossa: "Il rivale arriva prima."
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
                    file: { path: "Mondi/Timeline/Caduta dei Fari.md", name: "Caduta dei Fari", link: "Mondi/Timeline/Caduta dei Fari.md", folder: "Mondi/Timeline", mtime: 8 },
                    categoria: "evento storico",
                    stato: "pronto",
                    mondo: "Mondi/Mondo Demo.md",
                    canonico: true,
                    stato_canonico: "canonico",
                    fonte: ""
                },
                {
                    file: { path: "Mondi/Timeline/Retcon del Faro.md", name: "Retcon del Faro", link: "Mondi/Timeline/Retcon del Faro.md", folder: "Mondi/Timeline", mtime: 9 },
                    categoria: "evento storico",
                    stato: "bozza",
                    mondo: "Mondi/Mondo Demo.md",
                    stato_canonico: "retcon",
                    retcon_di: ["Mondi/Timeline/Caduta dei Fari.md"]
                },
                {
                    file: { path: "Mondi/Segreti/Rumor del Faro.md", name: "Rumor del Faro", link: "Mondi/Segreti/Rumor del Faro.md", folder: "Mondi/Segreti", mtime: 10 },
                    categoria: "segreto",
                    stato: "bozza",
                    mondo: "Mondi/Mondo Demo.md",
                    stato_canonico: "rumor"
                },
                {
                    file: { path: "Inbox/Segnale del Faro.md", name: "Segnale del Faro", link: "Inbox/Segnale del Faro.md", folder: "Inbox", mtime: 11 },
                    categoria: "lore capture",
                    stato: "da smistare",
                    mondo: "Mondi/Mondo Demo.md"
                },
                {
                    file: { path: "Risorse/Mappe/Mappa Pubblica.md", name: "Mappa Pubblica", link: "Risorse/Mappe/Mappa Pubblica.md", mtime: 4 },
                    categoria: "mappa",
                    stato: "pronto",
                    pubblico: true,
                    player_safe: "Mappa condivisibile.",
                    uso: "tavolo",
                    mondo: "Mondi/Mondo Demo.md",
                    luogo: "Mondi/Luoghi/Luogo Pubblico.md",
                    coordinates: [45, 9]
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
                if (query.includes('"Mondi/Fazioni"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Fazioni/"));
                if (query.includes('"Mondi/Luoghi"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Luoghi/"));
                if (query.includes('"Mondi/Rotte"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Rotte/"));
                if (query.includes('"Mondi/Culture"') || query.includes('"Mondi/Lingue"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Culture/") || page.file.path.startsWith("Mondi/Lingue/"));
                if (query.includes('"Mondi/Storia"') || query.includes('"Mondi/Timeline"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Storia/") || page.file.path.startsWith("Mondi/Timeline/"));
                if (query.includes('"Mondi/Dispense"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Dispense/"));
                if (query.includes('"Risorse/Mappe"')) return demoPages.filter(page => page.file.path.startsWith("Risorse/Mappe/"));
                if (query.includes('"Mondi"') || query.includes('"Campagne"') || query.includes('"Inbox"')) {
                    return demoPages.filter(page => page.file.path.startsWith("Mondi/") || page.file.path.startsWith("Campagne/") || page.file.path.startsWith("Inbox/"));
                }
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
            views.renderAtlasNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Marker pronti"))) {
                errors.push("renderAtlasNow: output senza marker pronti");
            }
            views.renderAtlasReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Rotte"))) {
                errors.push("renderAtlasReadiness: output senza contatore rotte");
            }
            await views.renderAtlasQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Il pedaggio raddoppia"))) {
                errors.push("renderAtlasQueues: output senza coda rotte");
            }
            await views.renderAtlasSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Atlante con marker"))) {
                errors.push("renderAtlasSurfaceLinks: output senza superfici atlante");
            }
            views.renderCanonControlNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Sistema prima"))) {
                errors.push("renderCanonControlNow: output senza priorita canonica");
            }
            views.renderCanonControlReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Canonico"))) {
                errors.push("renderCanonControlReadiness: output senza metriche canone");
            }
            await views.renderCanonControlQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("verita senza fonte"))) {
                errors.push("renderCanonControlQueues: output senza coda provenienza");
            }
            await views.renderCanonControlSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Revisione lore"))) {
                errors.push("renderCanonControlSurfaceLinks: output senza superfici canone");
            }
            views.renderWorldbuilderNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Fai adesso"))) {
                errors.push("renderWorldbuilderNow: output senza decisione immediata");
            }
            views.renderWorldbuilderReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Player-safe"))) {
                errors.push("renderWorldbuilderReadiness: output senza contatore player-safe");
            }
            await views.renderWorldbuilderQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Chiude il porto"))) {
                errors.push("renderWorldbuilderQueues: output senza coda pressioni");
            }
            await views.renderWorldbuilderSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Codex editabile"))) {
                errors.push("renderWorldbuilderSurfaceLinks: output senza superfici operative");
            }
            views.renderWorldbuildingControlNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Ripara prima"))) {
                errors.push("renderWorldbuildingControlNow: output senza priorita di riparazione");
            }
            views.renderWorldbuildingControlReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Profondita"))) {
                errors.push("renderWorldbuildingControlReadiness: output senza metriche di profondita");
            }
            await views.renderWorldbuildingControlQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("mondo senza principi"))) {
                errors.push("renderWorldbuildingControlQueues: output senza coda di profondita");
            }
            await views.renderWorldbuildingControlSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Controllo canone"))) {
                errors.push("renderWorldbuildingControlSurfaceLinks: output senza superfici di controllo");
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
