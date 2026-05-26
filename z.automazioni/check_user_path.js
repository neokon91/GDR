#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { readJson, readTextRel, repoPath } = require("./node_utils");

const ROOT = process.cwd();
const errors = [];

const PRIMARY_PATH = [
    {
        workflow: "onboarding_utente",
        page: "Inizia Qui.md",
        label: "Inizia Qui",
        requiredButtons: [
            "nuovo-mondo-homebrew",
            "preparazione-sessione-risorse-preparazione-sessione",
            "gioca-hub-durante-il-gioco-durante-il-gioco",
            "fuori-scena-hub-cosa-succede-fuori-scena-cosa-succede-fuori-scena"
        ]
    },
    {
        workflow: "dashboard_dm",
        page: "Hub/1. DM Dashboard.md",
        label: "DM Dashboard",
        requiredButtons: [
            "durante-il-gioco-durante-il-gioco",
            "prossima-sessione-risorse-preparazione-sessione",
            "worldbuilder-worldbuilder-dashboard",
            "campagna-da-ambientazione-campagna-da-ambientazione"
        ]
    },
    {
        workflow: "espandi_mondo",
        page: "Hub/Worldbuilder Dashboard.md",
        label: "Worldbuilder Dashboard",
        requiredButtons: [
            "nuovo-mondo-homebrew",
            "wizard-nuova-entita-viva",
            "campagna-da-ambientazione-campagna-da-ambientazione"
        ]
    },
    {
        workflow: "campagna_ambientazione",
        page: "Hub/Campagna da Ambientazione.md",
        label: "Campagna da Ambientazione",
        requiredButtons: [
            "campagna-da-regione-z-modelli-dm-campagna-da-regione-md",
            "arco-da-conflitto-z-modelli-dm-arco-da-conflitto-md",
            "nuova-sessione-z-modelli-dm-sessione-md"
        ]
    },
    {
        workflow: "prepara_sessione",
        page: "Risorse/Preparazione Sessione.md",
        label: "Preparazione Sessione",
        requiredButtons: [
            "nuova-sessione-z-modelli-dm-sessione-md",
            "rendi-sessione-attiva",
            "durante-il-gioco-durante-il-gioco"
        ]
    },
    {
        workflow: "gioca_live",
        page: "Hub/Durante il Gioco.md",
        label: "Durante il Gioco",
        requiredButtons: [
            "wizard-appunto-live",
            "registra-scelta-mondo",
            "avanza-clock",
            "post-sessione-guidato-risorse-post-sessione-guidato"
        ]
    },
    {
        workflow: "post_sessione",
        page: "Risorse/Post Sessione Guidato.md",
        label: "Post Sessione Guidato",
        requiredButtons: [
            "wizard-fine-sessione",
            "applica-conseguenza",
            "propaga-a-entita",
            "fuori-scena-hub-cosa-succede-fuori-scena-cosa-succede-fuori-scena"
        ]
    },
    {
        workflow: "fuori_scena",
        page: "Hub/Cosa Succede Fuori Scena.md",
        label: "Cosa Succede Fuori Scena",
        requiredButtons: [
            "post-sessione-guidato-risorse-post-sessione-guidato",
            "motore-mondo-vivo-motore-mondo-vivo",
            "prossima-sessione-risorse-preparazione-sessione"
        ]
    },
    {
        workflow: "atlante_mondo",
        page: "Hub/Atlante del Mondo.md",
        label: "Atlante del Mondo",
        requiredButtons: [
            "nuova-cultura-z-modelli-worldbuilding-cultura-md",
            "nuovo-conflitto-z-modelli-worldbuilding-conflitto-md",
            "controllo-worldbuilding-controllo-worldbuilding"
        ]
    },
    {
        workflow: "controllo_worldbuilding",
        page: "Hub/Controllo Worldbuilding.md",
        label: "Controllo Worldbuilding",
        requiredButtons: [
            "atlante-atlante-del-mondo-2",
            "worldbuilding-profondo-risorse-worldbuilding-profondo-2",
            "economia-e-rotte-economia-e-rotte"
        ]
    },
    {
        workflow: "economia_rotte",
        page: "Hub/Economia E Rotte.md",
        label: "Economia E Rotte",
        requiredButtons: [
            "nuova-rotta-z-modelli-worldbuilding-rotta-md",
            "nuova-risorsa-z-modelli-worldbuilding-risorsa-md",
            "nuovo-mercato-z-modelli-worldbuilding-mercato-o-nodo-commerciale-md"
        ]
    },
    {
        workflow: "lore_hub",
        page: "Hub/Lore Hub.md",
        label: "Lore Hub",
        requiredButtons: [
            "atlante-atlante-del-mondo-2",
            "calendario-mondi-calendario",
            "lore-capture-z-modelli-lore-capture-md"
        ]
    }
];

const SIMPLE_CALLS = {
    onboarding_utente: /renderWorkflowCommandDeck\(dv,\s*"onboarding_utente",\s*\{\s*mode:\s*"simple"\s*\}\)/,
    dashboard_dm: /renderWorkflowCommandDeck\(dv,\s*"dashboard_dm",\s*\{\s*mode:\s*"simple"\s*\}\)/,
    espandi_mondo: /renderWorkflowCommandDeck\(dv,\s*"espandi_mondo",\s*\{\s*mode:\s*"simple"\s*\}\)/,
    campagna_ambientazione: /renderWorkflowCommandDeck\(dv,\s*"campagna_ambientazione",\s*\{\s*mode:\s*"simple"\s*\}\)/,
    prepara_sessione: /renderWorkflowCommandDeck\(dv,\s*"prepara_sessione",\s*\{\s*mode:\s*"simple"\s*\}\)/,
    gioca_live: /renderWorkflowCommandDeck\(dv,\s*"gioca_live",\s*\{\s*mode:\s*"simple"\s*\}\)/,
    post_sessione: /renderWorkflowCommandDeck\(dv,\s*"post_sessione",\s*\{\s*mode:\s*"simple"\s*\}\)/,
    fuori_scena: /renderWorkflowCommandDeck\(dv,\s*"fuori_scena",\s*\{\s*mode:\s*"simple"\s*\}\)/,
    atlante_mondo: /renderWorkflowCommandDeck\(dv,\s*"atlante_mondo",\s*\{\s*mode:\s*"simple"\s*\}\)/,
    controllo_worldbuilding: /renderWorkflowCommandDeck\(dv,\s*"controllo_worldbuilding",\s*\{\s*mode:\s*"simple"\s*\}\)/,
    economia_rotte: /renderWorkflowCommandDeck\(dv,\s*"economia_rotte",\s*\{\s*mode:\s*"simple"\s*\}\)/,
    lore_hub: /renderWorkflowCommandDeck\(dv,\s*"lore_hub",\s*\{\s*mode:\s*"simple"\s*\}\)/
};

function workflowBlock(text, workflowId) {
    const start = `<!-- workflow:quick_actions:start ${workflowId} -->`;
    const end = `<!-- workflow:quick_actions:end ${workflowId} -->`;
    const startIndex = text.indexOf(start);
    const endIndex = text.indexOf(end);
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) return "";
    return text.slice(startIndex, endIndex + end.length);
}

function main() {
    const workflows = readJson(repoPath(ROOT, "z.automazioni/data/workflows/quick_actions.json"), null)?.workflows ?? {};
    const metaBind = readJson(repoPath(ROOT, ".obsidian/plugins/obsidian-meta-bind-plugin/data.json"), {});
    const buttonIds = new Set((metaBind.buttonTemplates ?? []).map(button => String(button.id ?? "")));

    for (const step of PRIMARY_PATH) {
        const text = readTextRel(ROOT, step.page, null);
        const workflow = workflows[step.workflow];
        if (!text) {
            errors.push(`${step.label}: pagina mancante (${step.page})`);
            continue;
        }
        if (!workflow) {
            errors.push(`${step.label}: workflow mancante (${step.workflow})`);
            continue;
        }
        if (workflow.audience !== "user") {
            errors.push(`${step.label}: workflow non marcato audience=user`);
        }
        if (!SIMPLE_CALLS[step.workflow]?.test(text)) {
            errors.push(`${step.label}: deck runtime non usa mode simple`);
        }

        const block = workflowBlock(text, step.workflow);
        if (!block) {
            errors.push(`${step.label}: blocco quick_actions mancante`);
            continue;
        }
        if (block.includes("Plugin coinvolti")) {
            errors.push(`${step.label}: blocco utente espone diagnostica plugin`);
        }
        for (const button of step.requiredButtons) {
            if (!buttonIds.has(button)) {
                errors.push(`${step.label}: pulsante Meta Bind non configurato (${button})`);
            }
            if (!block.includes(`BUTTON[${button}]`)) {
                errors.push(`${step.label}: azione primaria non esposta (${button})`);
            }
        }
    }

    const releaseConfig = [
        ".obsidian/app.json",
        ".obsidian/core-plugins.json",
        ".obsidian/community-plugins.json",
        ".obsidian/plugins/obsidian-meta-bind-plugin/data.json",
        ".obsidian/plugins/templater-obsidian/data.json",
        ".obsidian/plugins/dataview/data.json"
    ];
    for (const relPath of releaseConfig) {
        if (!fs.existsSync(path.join(ROOT, relPath))) {
            errors.push(`Release utente: configurazione Obsidian mancante (${relPath})`);
        }
    }

    if (errors.length) {
        console.error("Percorso utente nuovo non valido:");
        for (const error of errors) console.error(`- ${error}`);
        process.exit(1);
    }

    console.log(`Percorso utente nuovo OK: ${PRIMARY_PATH.length} superfici primarie verificate.`);
}

main();
