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
    "renderCampaignBuilderCampaignQueues",
    "renderCampaignBuilderNow",
    "renderCampaignBuilderOpportunityQueues",
    "renderCampaignBuilderReadiness",
    "renderCampaignBuilderSurfaceLinks",
    "renderCombatReadiness",
    "renderConsequenceCards",
    "renderContinuityQueue",
    "renderDnd55MaterialPipeline",
    "renderDmDashboardNow",
    "renderDmDashboardQueues",
    "renderDmDashboardReadiness",
    "renderDmDashboardSurfaceLinks",
    "renderEconomyDependencyQueues",
    "renderEconomyNow",
    "renderEconomyQueues",
    "renderEconomyReadiness",
    "renderEconomySurfaceLinks",
    "renderGeneratedDraftsDestinations",
    "renderGeneratedDraftsNow",
    "renderGeneratedDraftsQueues",
    "renderGeneratedDraftsReadiness",
    "renderGeneratedDraftsResolved",
    "renderGeneratedDraftsSurfaceLinks",
    "renderGeopoliticalNow",
    "renderGeopoliticalPressureQueues",
    "renderGeopoliticalQueues",
    "renderGeopoliticalReadiness",
    "renderGeopoliticalSurfaceLinks",
    "renderLiveCommandCenter",
    "renderLiveTableMaterials",
    "renderLiveTableNow",
    "renderLiveTableQueues",
    "renderLiveTableReadiness",
    "renderLiveTableSurfaceLinks",
    "renderLivingWorldNow",
    "renderLivingWorldPressureQueues",
    "renderLivingWorldQueues",
    "renderLivingWorldReadiness",
    "renderLivingWorldSurfaceLinks",
    "renderLoreNow",
    "renderLoreReadiness",
    "renderLoreReviewCompletionQueues",
    "renderLoreReviewNow",
    "renderLoreReviewReadiness",
    "renderLoreReviewSurfaceLinks",
    "renderLoreReviewTableQueues",
    "renderLoreSignalQueues",
    "renderLoreSurfaceLinks",
    "renderLoreWorldQueues",
    "renderM11ContinuityChain",
    "renderOffscreenNow",
    "renderOffscreenReactionQueues",
    "renderOffscreenReadiness",
    "renderOffscreenSurfaceLinks",
    "renderOffscreenTableBridge",
    "renderOnboardingReadiness",
    "renderPlayerView",
    "renderPluginTroubleshooting",
    "renderPreparationAnchorQueues",
    "renderPreparationMaterialQueues",
    "renderPreparationNow",
    "renderPreparationReadiness",
    "renderPreparationSurfaceLinks",
    "renderQualityReportCoverage",
    "renderQualityReportNow",
    "renderQualityReportOperationalGaps",
    "renderQualityReportPublicSafety",
    "renderQualityReportShowcase",
    "renderQualityReportSurfaceLinks",
    "renderTableMaterialsAssetQueues",
    "renderTableMaterialsDndPipeline",
    "renderTableMaterialsNow",
    "renderTableMaterialsReadiness",
    "renderTableMaterialsSessionQueues",
    "renderTableMaterialsSurfaceLinks",
    "renderPostSessionCommandCenter",
    "renderPostSessionClosureQueues",
    "renderPostSessionNow",
    "renderPostSessionPropagationQueues",
    "renderPostSessionReadiness",
    "renderPostSessionSurfaceLinks",
    "renderPropagationTargets",
    "renderSessionAnchorCards",
    "renderSessionMapCards",
    "renderSessionMaterialCards",
    "renderTableCockpit",
    "renderVaultControlCoherence",
    "renderVaultControlNow",
    "renderVaultControlQueues",
    "renderVaultControlReadiness",
    "renderVaultControlSurfaceLinks",
    "renderVaultReadiness",
    "renderWorkflowCommandDeck",
    "renderWorldBibleArticles",
    "renderWorldBibleGaps",
    "renderWorldBibleIdentity",
    "renderWorldBibleNow",
    "renderWorldBibleReadiness",
    "renderWorldBibleSurfaceLinks",
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
    "z.engine/session_campaign_builder.js",
    "z.engine/session_canon_control.js",
    "z.engine/session_dnd.js",
    "z.engine/session_dm_dashboard.js",
    "z.engine/session_economy.js",
    "z.engine/session_generated_drafts.js",
    "z.engine/session_geopolitical.js",
    "z.engine/session_maps.js",
    "z.engine/session_player.js",
    "z.engine/session_preparation.js",
    "z.engine/session_quality_report.js",
    "z.engine/session_table_materials.js",
    "z.engine/session_post_session.js",
    "z.engine/session_runtime.js",
    "z.engine/session_vault_control.js",
    "z.engine/session_views.js",
    "z.engine/session_world_bible.js",
    "z.engine/session_live_table.js",
    "z.engine/session_living_world.js",
    "z.engine/session_lore.js",
    "z.engine/session_lore_review.js",
    "z.engine/session_offscreen.js",
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
                    file: { path: "Mondi/Luoghi/Luogo Pubblico.md", name: "Luogo Pubblico", link: "Mondi/Luoghi/Luogo Pubblico.md", folder: "Mondi/Luoghi", mtime: 3 },
                    categoria: "luogo",
                    tipo: "regno",
                    stato: "pronto",
                    stabilita: "tesa",
                    pressione: 4,
                    pubblico: true,
                    player_safe: "Luogo noto al party.",
                    mondo: "Mondi/Mondo Demo.md",
                    fazioni: ["Mondi/Fazioni/Consiglio.md"],
                    legittimita: "consiglio portuale",
                    capitale: "Mondi/Luoghi/Luogo Pubblico.md",
                    governante: "Mondi/Fazioni/Consiglio.md",
                    confini: ["Mondi/Rotte/Strada del Sale.md"],
                    vassalli: [],
                    relazioni: ["Mondi/Relazioni/Patto del Faro.md"],
                    rivali: [],
                    risorse_strategiche: ["Mondi/Risorse/Sale Lunare.md"],
                    crisi_interne: ["Il porto chiude agli stranieri."],
                    pericolo: 3,
                    problemi: ["La milizia chiude gli accessi."],
                    segreti: ["Il faro e sotto assedio."],
                    tensione: "Il porto deve scegliere tra trattato e rivolta.",
                    coordinates: [45, 9],
                    uso_al_tavolo: "Scena di trattativa.",
                    prossima_mossa: "Il Consiglio militarizza il molo."
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
                    file: { path: "Mondi/Conflitti/Guerra del Faro.md", name: "Guerra del Faro", link: "Mondi/Conflitti/Guerra del Faro.md", folder: "Mondi/Conflitti", mtime: 24 },
                    categoria: "conflitto",
                    tipo: "guerra fredda",
                    stato: "attivo",
                    mondo: "Mondi/Mondo Demo.md",
                    pressione: 7,
                    posta: "controllo dei fari sacri",
                    fazioni: ["Mondi/Fazioni/Consiglio.md", "Mondi/Fazioni/Rivali.md"],
                    luoghi: ["Mondi/Luoghi/Luogo Pubblico.md"],
                    prossima_mossa: "La flotta rivale occupa il faro."
                },
                {
                    file: { path: "Mondi/Culture/Naviganti.md", name: "Naviganti", link: "Mondi/Culture/Naviganti.md", folder: "Mondi/Culture", mtime: 22 },
                    categoria: "cultura",
                    stato: "pronto",
                    mondo: "Mondi/Mondo Demo.md",
                    luoghi: ["Mondi/Luoghi/Luogo Pubblico.md"],
                    lingue: ["Mondi/Lingue/Canto dei Fari.md"],
                    religioni: ["Mondi/Religioni/Culto del Faro.md"],
                    tensioni: ["Il porto chiude agli stranieri."],
                    feste: ["Veglia del Sale"]
                },
                {
                    file: { path: "Mondi/Rotte/Strada del Sale.md", name: "Strada del Sale", link: "Mondi/Rotte/Strada del Sale.md", folder: "Mondi/Rotte", mtime: 7 },
                    categoria: "rotta",
                    stato: "contesa",
                    mondo: "Mondi/Mondo Demo.md",
                    partenza: "Mondi/Luoghi/Luogo Pubblico.md",
                    arrivo: "Mondi/Luoghi/Luogo Pubblico.md",
                    risorse_trasportate: ["Mondi/Risorse/Sale Lunare.md"],
                    fazioni_controllanti: ["Mondi/Fazioni/Consiglio.md"],
                    rischi: ["pedaggio"],
                    pressione: 5,
                    prossima_mossa: "Il pedaggio raddoppia."
                },
                {
                    file: { path: "Mondi/Risorse/Sale Lunare.md", name: "Sale Lunare", link: "Mondi/Risorse/Sale Lunare.md", folder: "Mondi/Risorse", mtime: 20 },
                    categoria: "risorsa",
                    stato: "pronto",
                    mondo: "Mondi/Mondo Demo.md",
                    luoghi: ["Mondi/Luoghi/Luogo Pubblico.md"],
                    fazioni_controllanti: ["Mondi/Fazioni/Consiglio.md"],
                    uso_narrativo: "Serve ai fari sacri.",
                    luoghi_dipendenti: ["Mondi/Luoghi/Luogo Pubblico.md"],
                    rotte: ["Mondi/Rotte/Strada del Sale.md"],
                    mercati: ["Mondi/Mercati/Mercato del Faro.md"],
                    conseguenze: ["I fari si spengono."]
                },
                {
                    file: { path: "Mondi/Mercati/Mercato del Faro.md", name: "Mercato del Faro", link: "Mondi/Mercati/Mercato del Faro.md", folder: "Mondi/Mercati", mtime: 21 },
                    categoria: "mercato",
                    stato: "pronto",
                    mondo: "Mondi/Mondo Demo.md",
                    luogo: "Mondi/Luoghi/Luogo Pubblico.md",
                    risorse: ["Mondi/Risorse/Sale Lunare.md"],
                    rotte: ["Mondi/Rotte/Strada del Sale.md"],
                    fazioni_controllanti: ["Mondi/Fazioni/Consiglio.md"],
                    rischi: ["embargo"],
                    prossima_mossa: "Il mercato chiude ai forestieri."
                },
                {
                    file: { path: "Mondi/Relazioni/Patto del Faro.md", name: "Patto del Faro", link: "Mondi/Relazioni/Patto del Faro.md", folder: "Mondi/Relazioni", mtime: 23 },
                    categoria: "relazione",
                    stato: "tesa",
                    mondo: "Mondi/Mondo Demo.md",
                    tipo: "trattato",
                    soggetti: ["Mondi/Fazioni/Consiglio.md", "Mondi/Fazioni/Rivali.md"],
                    intensita: "alta",
                    pressione: 6,
                    posta: "controllo del faro",
                    conseguenze: ["Embargo sul sale"],
                    prossima_mossa: "Il patto viene rotto al tramonto."
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
                    campagna: "Campagne/Campagna Faro.md",
                    pressione: 4,
                    progress_value: 4,
                    progress_max: 6,
                    scadenza_mondo: "prossima luna",
                    prossima_mossa: "Il rivale arriva prima."
                },
                {
                    file: { path: "Mondi/Tracciati/Allarme Porto.md", name: "Allarme Porto", link: "Mondi/Tracciati/Allarme Porto.md", folder: "Mondi/Tracciati", mtime: 13 },
                    categoria: "tracciato",
                    stato: "attivo",
                    mondo: "Mondi/Mondo Demo.md",
                    fazioni: ["Mondi/Fazioni/Consiglio.md"],
                    missioni: ["Mondi/Missioni/Missione Pubblica.md"],
                    pressione: 5,
                    progress_value: 3,
                    progress_max: 6,
                    prossima_mossa: "Le guardie bloccano il molo."
                },
                {
                    file: { path: "Mondi/Personaggi/Capitano Faro.md", name: "Capitano Faro", link: "Mondi/Personaggi/Capitano Faro.md", folder: "Mondi/Personaggi", mtime: 14 },
                    categoria: "personaggio",
                    tipo: "png",
                    stato: "in gioco",
                    mondo: "Mondi/Mondo Demo.md",
                    ruolo: "capitano della guardia",
                    luogo: "Mondi/Luoghi/Luogo Pubblico.md",
                    atteggiamento: "diffidente"
                },
                {
                    file: { path: "Mondi/Incontri/Assalto al Molo.md", name: "Assalto al Molo", link: "Mondi/Incontri/Assalto al Molo.md", folder: "Mondi/Incontri", mtime: 15 },
                    categoria: "incontro",
                    tipo: "combattimento",
                    stato: "pronto",
                    mondo: "Mondi/Mondo Demo.md",
                    luogo: "Mondi/Luoghi/Luogo Pubblico.md",
                    pericolo: 4,
                    creature: ["Mondi/Creature/Guardia del Porto.md"]
                },
                {
                    file: { path: "Mondi/Creature/Guardia del Porto.md", name: "Guardia del Porto", link: "Mondi/Creature/Guardia del Porto.md", folder: "Mondi/Creature", mtime: 16 },
                    categoria: "creatura",
                    tipo: "umanoide",
                    stato: "pronto",
                    mondo: "Mondi/Mondo Demo.md",
                    size: "Media",
                    cr: "1/2"
                },
                {
                    file: { path: "Mondi/Oggetti/Chiave del Faro.md", name: "Chiave del Faro", link: "Mondi/Oggetti/Chiave del Faro.md", folder: "Mondi/Oggetti", mtime: 17 },
                    categoria: "oggetto",
                    tipo: "chiave",
                    stato: "pronto",
                    mondo: "Mondi/Mondo Demo.md",
                    rarita: "comune",
                    luogo: "Mondi/Luoghi/Luogo Pubblico.md"
                },
                {
                    file: { path: "Mondi/Dispense/Lettera del Porto.md", name: "Lettera del Porto", link: "Mondi/Dispense/Lettera del Porto.md", folder: "Mondi/Dispense", mtime: 18 },
                    categoria: "dispensa",
                    tipo: "lettera",
                    stato: "pronto",
                    mondo: "Mondi/Mondo Demo.md",
                    luogo: "Mondi/Luoghi/Luogo Pubblico.md",
                    personaggi: ["Mondi/Personaggi/Capitano Faro.md"]
                },
                {
                    file: { path: "Mondi/Sessioni/Sessione Live.md", name: "Sessione Live", link: "Mondi/Sessioni/Sessione Live.md", folder: "Mondi/Sessioni", mtime: 19 },
                    categoria: "sessione",
                    stato: "pronto",
                    attiva: true,
                    pubblico: false,
                    data: "2026-05-27",
                    mondo: "Mondi/Mondo Demo.md",
                    campagna: "Campagne/Campagna Faro.md",
                    scena_corrente: "Banchina del porto.",
                    scelta: "Salvare il faro o inseguire il rivale.",
                    fazioni: ["Mondi/Fazioni/Consiglio.md"],
                    luoghi: ["Mondi/Luoghi/Luogo Pubblico.md"],
                    missioni: ["Mondi/Missioni/Missione Pubblica.md"],
                    tracciati: ["Mondi/Tracciati/Allarme Porto.md"],
                    personaggi: ["Mondi/Personaggi/Capitano Faro.md"],
                    incontri: ["Mondi/Incontri/Assalto al Molo.md"],
                    dispense: ["Mondi/Dispense/Lettera del Porto.md"],
                    oggetti: ["Mondi/Oggetti/Chiave del Faro.md"],
                    mappe: ["Risorse/Mappe/Mappa Pubblica.md"],
                    appunti_live: ["Inbox/Conseguenza del Faro.md"],
                    conseguenze: ["Il Consiglio cambia rotta."],
                    entita_impattate: ["Mondi/Fazioni/Consiglio.md"]
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
                    file: { path: "Inbox/Conseguenza del Faro.md", name: "Conseguenza del Faro", link: "Inbox/Conseguenza del Faro.md", folder: "Inbox", mtime: 12 },
                    categoria: "lore capture",
                    stato: "da smistare",
                    mondo: "Mondi/Mondo Demo.md",
                    conseguenze: ["Il Consiglio cambia rotta."],
                    entita_impattate: ["Mondi/Fazioni/Consiglio.md"],
                    propagazione_stato: "aperta",
                    prossima_mossa: "Aggiorna il Consiglio."
                },
                {
                    file: { path: "Inbox/Generati/Taverna Generata.md", name: "Taverna Generata", link: "Inbox/Generati/Taverna Generata.md", folder: "Inbox/Generati", mtime: 26, ctime: 26 },
                    plugin: "fantasy-content-generator",
                    categoria: "luogo",
                    tipo: "taverna",
                    stato: "bozza",
                    canonico: false,
                    generatore: "Fantasy Content Generator",
                    creato: "2026-05-27",
                    mondo: "Mondi/Mondo Demo.md",
                    luogo: "Mondi/Luoghi/Luogo Pubblico.md"
                },
                {
                    file: { path: "Mondi/Luoghi/Luogo Generato.md", name: "Luogo Generato", link: "Mondi/Luoghi/Luogo Generato.md", folder: "Mondi/Luoghi", mtime: 27 },
                    plugin: "fantasy-content-generator",
                    categoria: "luogo",
                    tipo: "taverna",
                    stato: "pronto",
                    canonico: true,
                    stato_canonico: "canonico",
                    origine_bozza: "Inbox/Generati/Taverna Generata.md",
                    smistato_il: "2026-05-27",
                    canonizzato_il: "2026-05-27",
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
                },
                {
                    file: { path: "Campagne/Campagna Faro.md", name: "Campagna Faro", link: "Campagne/Campagna Faro.md", folder: "Campagne", mtime: 25 },
                    categoria: "campagna",
                    tipo: "sandbox costiera",
                    stato: "attiva",
                    mondo: "Mondi/Mondo Demo.md",
                    profilo: "politica e viaggio",
                    promessa: "Decidere chi controllera i fari sacri.",
                    regione: "Mondi/Luoghi/Luogo Pubblico.md",
                    luogo_iniziale: "Mondi/Luoghi/Luogo Pubblico.md",
                    culture: ["Mondi/Culture/Naviganti.md"],
                    fazioni: ["Mondi/Fazioni/Consiglio.md"],
                    conflitti: ["Mondi/Conflitti/Guerra del Faro.md"],
                    conflitto_centrale: "Mondi/Conflitti/Guerra del Faro.md",
                    prossima_sessione: "Mondi/Sessioni/Sessione Live.md"
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
                if (query.includes('"Mondi/Conflitti"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Conflitti/"));
                if (query.includes('"Mondi/Tracciati"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Tracciati/"));
                if (query.includes('"Mondi/Incontri"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Incontri/"));
                if (query.includes('"Mondi/Creature"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Creature/"));
                if (query.includes('"Mondi/Oggetti"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Oggetti/"));
                if (query.includes('"Mondi/Luoghi"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Luoghi/"));
                if (query.includes('"Mondi/Rotte"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Rotte/"));
                if (query.includes('"Mondi/Risorse"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Risorse/"));
                if (query.includes('"Mondi/Mercati"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Mercati/"));
                if (query.includes('"Mondi/Relazioni"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Relazioni/"));
                if (query.includes('"Mondi/Religioni"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Religioni/"));
                if (query.includes('"Mondi/Segreti"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Segreti/"));
                if (query.includes('"Mondi/Compendium"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Compendium/"));
                if (query.includes('"Mondi/Culture"') || query.includes('"Mondi/Lingue"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Culture/") || page.file.path.startsWith("Mondi/Lingue/"));
                if (query.includes('"Mondi/Storia"') || query.includes('"Mondi/Timeline"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Storia/") || page.file.path.startsWith("Mondi/Timeline/"));
                if (query.includes('"Mondi/Dispense"')) return demoPages.filter(page => page.file.path.startsWith("Mondi/Dispense/"));
                if (query.includes('"Risorse/Mappe"')) return demoPages.filter(page => page.file.path.startsWith("Risorse/Mappe/"));
                if (query.includes('"Inbox/Generati"')) return demoPages.filter(page => page.file.path.startsWith("Inbox/Generati/"));
                if (query.trim() === '"Campagne"') return demoPages.filter(page => page.file.path.startsWith("Campagne/"));
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
                page(link) {
                    const key = String(link?.path ?? link ?? "");
                    return demoPages.find(page => page.file.path === key || page.file.link === key || page.file.name === key || page.file.name === key.replace(/\.md$/, "")) ?? null;
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
            views.renderDmDashboardNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Fai adesso"))) {
                errors.push("renderDmDashboardNow: output senza decisione immediata");
            }
            views.renderDmDashboardReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Sessioni"))) {
                errors.push("renderDmDashboardReadiness: output senza metriche sessioni");
            }
            await views.renderDmDashboardQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Il rivale arriva prima"))) {
                errors.push("renderDmDashboardQueues: output senza pressioni operative");
            }
            await views.renderDmDashboardSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Durante il Gioco"))) {
                errors.push("renderDmDashboardSurfaceLinks: output senza superfici DM");
            }
            await views.renderVaultControlNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Ripara prima"))) {
                errors.push("renderVaultControlNow: output senza priorita manutenzione");
            }
            await views.renderVaultControlReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Calendario"))) {
                errors.push("renderVaultControlReadiness: output senza metriche calendario");
            }
            await views.renderVaultControlQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Missione Pubblica"))) {
                errors.push("renderVaultControlQueues: output senza code operative");
            }
            await views.renderVaultControlCoherence(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Missione aperta senza committente"))) {
                errors.push("renderVaultControlCoherence: output senza audit pronti incompleti");
            }
            await views.renderVaultControlSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Quality report"))) {
                errors.push("renderVaultControlSurfaceLinks: output senza superfici manutenzione");
            }
            views.renderQualityReportNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Qualita prima"))) {
                errors.push("renderQualityReportNow: output senza priorita qualita");
            }
            views.renderQualityReportCoverage(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Mondi"))) {
                errors.push("renderQualityReportCoverage: output senza copertura mondi");
            }
            await views.renderQualityReportOperationalGaps(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Sessione Live"))) {
                errors.push("renderQualityReportOperationalGaps: output senza buchi operativi");
            }
            await views.renderQualityReportPublicSafety(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("pubblico: true con campi segreti"))) {
                errors.push("renderQualityReportPublicSafety: output senza rischi pubblici");
            }
            await views.renderQualityReportShowcase(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Mappa Pubblica"))) {
                errors.push("renderQualityReportShowcase: output senza materiale screenshot-ready");
            }
            await views.renderQualityReportSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Controllo vault"))) {
                errors.push("renderQualityReportSurfaceLinks: output senza superfici quality report");
            }
            views.renderGeneratedDraftsNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Bozza prima"))) {
                errors.push("renderGeneratedDraftsNow: output senza prossima bozza");
            }
            views.renderGeneratedDraftsReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Senza aggancio"))) {
                errors.push("renderGeneratedDraftsReadiness: output senza metriche bozze");
            }
            await views.renderGeneratedDraftsQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Taverna Generata"))) {
                errors.push("renderGeneratedDraftsQueues: output senza bozze generate");
            }
            await views.renderGeneratedDraftsDestinations(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Mondi/Luoghi"))) {
                errors.push("renderGeneratedDraftsDestinations: output senza destinazione suggerita");
            }
            await views.renderGeneratedDraftsResolved(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Luogo Generato"))) {
                errors.push("renderGeneratedDraftsResolved: output senza bozze smistate");
            }
            await views.renderGeneratedDraftsSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Controllo vault"))) {
                errors.push("renderGeneratedDraftsSurfaceLinks: output senza superfici smistamento");
            }
            views.renderWorldBibleNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Mondo prima"))) {
                errors.push("renderWorldBibleNow: output senza priorita Codex");
            }
            views.renderWorldBibleReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Player-safe"))) {
                errors.push("renderWorldBibleReadiness: output senza metriche player-safe");
            }
            views.renderWorldBibleIdentity(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Mondo Demo"))) {
                errors.push("renderWorldBibleIdentity: output senza identita mondo");
            }
            views.renderWorldBibleArticles(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Luogo Pubblico"))) {
                errors.push("renderWorldBibleArticles: output senza articoli Codex");
            }
            await views.renderWorldBibleGaps(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("tono"))) {
                errors.push("renderWorldBibleGaps: output senza buchi identita mondo");
            }
            await views.renderWorldBibleSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Vista giocatori"))) {
                errors.push("renderWorldBibleSurfaceLinks: output senza superfici Bibbia del Mondo");
            }
            views.renderPreparationNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Prepara prima"))) {
                errors.push("renderPreparationNow: output senza priorita di preparazione");
            }
            views.renderPreparationReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Cinque blocchi"))) {
                errors.push("renderPreparationReadiness: output senza metriche dei blocchi");
            }
            await views.renderPreparationAnchorQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Missione Pubblica"))) {
                errors.push("renderPreparationAnchorQueues: output senza missioni giocabili");
            }
            await views.renderPreparationMaterialQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Assalto al Molo"))) {
                errors.push("renderPreparationMaterialQueues: output senza incontri pronti");
            }
            await views.renderPreparationSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Durante il Gioco"))) {
                errors.push("renderPreparationSurfaceLinks: output senza superfici preparazione");
            }
            views.renderTableMaterialsNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Materiale prima"))) {
                errors.push("renderTableMaterialsNow: output senza priorita materiale");
            }
            views.renderTableMaterialsReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Dispense"))) {
                errors.push("renderTableMaterialsReadiness: output senza metriche dispense");
            }
            await views.renderTableMaterialsSessionQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Lettera del Porto"))) {
                errors.push("renderTableMaterialsSessionQueues: output senza dispense della sessione");
            }
            await views.renderTableMaterialsAssetQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Assalto al Molo"))) {
                errors.push("renderTableMaterialsAssetQueues: output senza incontri o mappe");
            }
            views.renderTableMaterialsDndPipeline(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Guardia del Porto"))) {
                errors.push("renderTableMaterialsDndPipeline: output senza creature collegate");
            }
            await views.renderTableMaterialsSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Iniziativa e combattimenti"))) {
                errors.push("renderTableMaterialsSurfaceLinks: output senza superfici materiali");
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
            views.renderLiveTableNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Gioca adesso"))) {
                errors.push("renderLiveTableNow: output senza priorita live");
            }
            views.renderLiveTableReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Mappe e media"))) {
                errors.push("renderLiveTableReadiness: output senza metriche live");
            }
            await views.renderLiveTableQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Chiude il porto"))) {
                errors.push("renderLiveTableQueues: output senza pressioni live");
            }
            await views.renderLiveTableMaterials(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Assalto al Molo"))) {
                errors.push("renderLiveTableMaterials: output senza materiali live");
            }
            await views.renderLiveTableSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Iniziativa e combattimenti"))) {
                errors.push("renderLiveTableSurfaceLinks: output senza superfici live");
            }
            views.renderPostSessionNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Chiudi prima"))) {
                errors.push("renderPostSessionNow: output senza priorita di chiusura");
            }
            views.renderPostSessionReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Appunti live"))) {
                errors.push("renderPostSessionReadiness: output senza metriche appunti");
            }
            await views.renderPostSessionClosureQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Conseguenza del Faro"))) {
                errors.push("renderPostSessionClosureQueues: output senza appunti live");
            }
            await views.renderPostSessionPropagationQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Missione Pubblica"))) {
                errors.push("renderPostSessionPropagationQueues: output senza bersagli impattati");
            }
            await views.renderPostSessionSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Vista Giocatori"))) {
                errors.push("renderPostSessionSurfaceLinks: output senza superfici post-sessione");
            }
            views.renderLivingWorldNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Cambia prima"))) {
                errors.push("renderLivingWorldNow: output senza priorita mondo vivo");
            }
            views.renderLivingWorldReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Propagazioni"))) {
                errors.push("renderLivingWorldReadiness: output senza metriche di propagazione");
            }
            await views.renderLivingWorldQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Aggiorna il Consiglio"))) {
                errors.push("renderLivingWorldQueues: output senza coda continuita");
            }
            await views.renderLivingWorldPressureQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Il pedaggio raddoppia"))) {
                errors.push("renderLivingWorldPressureQueues: output senza pressione economica");
            }
            await views.renderLivingWorldSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Poteri in movimento"))) {
                errors.push("renderLivingWorldSurfaceLinks: output senza superfici mondo vivo");
            }
            views.renderEconomyNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Muovi prima"))) {
                errors.push("renderEconomyNow: output senza priorita economica");
            }
            views.renderEconomyReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Rotte aperte"))) {
                errors.push("renderEconomyReadiness: output senza metriche rotte");
            }
            await views.renderEconomyQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Sale Lunare"))) {
                errors.push("renderEconomyQueues: output senza risorse economiche");
            }
            await views.renderEconomyDependencyQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("I fari si spengono"))) {
                errors.push("renderEconomyDependencyQueues: output senza code conseguenze");
            }
            await views.renderEconomySurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Geopolitica"))) {
                errors.push("renderEconomySurfaceLinks: output senza superfici economia");
            }
            views.renderGeopoliticalNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Muovi prima"))) {
                errors.push("renderGeopoliticalNow: output senza priorita geopolitica");
            }
            views.renderGeopoliticalReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Territori"))) {
                errors.push("renderGeopoliticalReadiness: output senza metriche territori");
            }
            await views.renderGeopoliticalQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Patto del Faro"))) {
                errors.push("renderGeopoliticalQueues: output senza relazioni diplomatiche");
            }
            await views.renderGeopoliticalPressureQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Sale Lunare"))) {
                errors.push("renderGeopoliticalPressureQueues: output senza risorse strategiche");
            }
            await views.renderGeopoliticalSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Luoghi operativi"))) {
                errors.push("renderGeopoliticalSurfaceLinks: output senza superfici geopolitiche");
            }
            views.renderCampaignBuilderNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Trasforma prima"))) {
                errors.push("renderCampaignBuilderNow: output senza priorita campagna");
            }
            views.renderCampaignBuilderReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Campagne"))) {
                errors.push("renderCampaignBuilderReadiness: output senza metriche campagne");
            }
            await views.renderCampaignBuilderOpportunityQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Guerra del Faro"))) {
                errors.push("renderCampaignBuilderOpportunityQueues: output senza opportunita da ambientazione");
            }
            await views.renderCampaignBuilderCampaignQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Campagna Faro"))) {
                errors.push("renderCampaignBuilderCampaignQueues: output senza campagne create");
            }
            await views.renderCampaignBuilderSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Preparazione sessione"))) {
                errors.push("renderCampaignBuilderSurfaceLinks: output senza superfici campagna");
            }
            views.renderLoreNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Segnale prima"))) {
                errors.push("renderLoreNow: output senza priorita lore");
            }
            views.renderLoreReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Misteri"))) {
                errors.push("renderLoreReadiness: output senza metriche misteri");
            }
            await views.renderLoreSignalQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Segnale del Faro"))) {
                errors.push("renderLoreSignalQueues: output senza segnali lore");
            }
            await views.renderLoreWorldQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Naviganti"))) {
                errors.push("renderLoreWorldQueues: output senza culture operative");
            }
            await views.renderLoreSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Controllo canone"))) {
                errors.push("renderLoreSurfaceLinks: output senza superfici lore");
            }
            views.renderLoreReviewNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Rivedi prima"))) {
                errors.push("renderLoreReviewNow: output senza priorita revisione lore");
            }
            views.renderLoreReviewReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Lore in revisione"))) {
                errors.push("renderLoreReviewReadiness: output senza metriche revisione lore");
            }
            await views.renderLoreReviewCompletionQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Segnale del Faro"))) {
                errors.push("renderLoreReviewCompletionQueues: output senza lore da completare");
            }
            await views.renderLoreReviewTableQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Rumor del Faro"))) {
                errors.push("renderLoreReviewTableQueues: output senza segreti o pressioni da rivedere");
            }
            await views.renderLoreReviewSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Motore Mondo Vivo"))) {
                errors.push("renderLoreReviewSurfaceLinks: output senza superfici revisione lore");
            }
            views.renderOffscreenNow(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Reagisce prima"))) {
                errors.push("renderOffscreenNow: output senza priorita fuori scena");
            }
            views.renderOffscreenReadiness(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Attori in moto"))) {
                errors.push("renderOffscreenReadiness: output senza metriche fuori scena");
            }
            await views.renderOffscreenReactionQueues(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Chiude il porto"))) {
                errors.push("renderOffscreenReactionQueues: output senza prossime mosse fuori scena");
            }
            await views.renderOffscreenTableBridge(dv);
            if (!rendered.some(node => node.tag === "table" && String(node.text).includes("Il rivale arriva prima"))) {
                errors.push("renderOffscreenTableBridge: output senza ponte al tavolo");
            }
            await views.renderOffscreenSurfaceLinks(dv);
            if (!rendered.some(node => String(node.innerHTML).includes("Preparazione sessione"))) {
                errors.push("renderOffscreenSurfaceLinks: output senza superfici fuori scena");
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
