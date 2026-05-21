#!/usr/bin/env node

const { readTextRel } = require("./node_utils");

const ROOT = process.cwd();
const errors = [];

const playerView = readTextRel(ROOT, "Hub/Vista Giocatori.md");
for (const marker of ["renderPlayerPortalStatus", "renderPlayerRecap", "renderPublicSafety"]) {
    if (!playerView.includes(marker)) {
        errors.push(`Smoke statico: Vista Giocatori non contiene ${marker}`);
    }
}

const startHere = readTextRel(ROOT, "Inizia Qui.md");
for (const marker of ["Crea Il Mondo", "Trasforma In Gioco", "Aggiorna Il Mondo"]) {
    if (!startHere.includes(marker)) {
        errors.push(`Smoke statico: Inizia Qui non contiene ${marker}`);
    }
}

const liveHub = readTextRel(ROOT, "Hub/Durante il Gioco.md");
for (const marker of ["renderTableCockpit", "renderM11ContinuityChain", "BUTTON[registra-scelta-mondo]"]) {
    if (!liveHub.includes(marker)) {
        errors.push(`Smoke statico: Durante il Gioco non contiene ${marker}`);
    }
}

const livingWorld = readTextRel(ROOT, "Hub/Motore Mondo Vivo.md");
for (const marker of ["renderContinuityQueue", "renderPropagationTargets", "renderClosableContinuity"]) {
    if (!livingWorld.includes(marker)) {
        errors.push(`Smoke statico: Motore Mondo Vivo non contiene ${marker}`);
    }
}

const offscreen = readTextRel(ROOT, "Hub/Cosa Succede Fuori Scena.md");
for (const marker of ["renderContinuityGaps", "renderPropagationTargets", "renderClosableContinuity"]) {
    if (!offscreen.includes(marker)) {
        errors.push(`Smoke statico: Cosa Succede Fuori Scena non contiene ${marker}`);
    }
}

const postSession = readTextRel(ROOT, "Risorse/Post Sessione Guidato.md");
for (const marker of ["renderM11ContinuityChain", "renderConsequenceCards", "BUTTON[registra-scelta-mondo]"]) {
    if (!postSession.includes(marker)) {
        errors.push(`Smoke statico: Post Sessione Guidato non contiene ${marker}`);
    }
}

if (errors.length) {
    console.error("Errori smoke statico:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Smoke statico OK: onboarding, vista giocatori, live e post-sessione verificati senza demo sorgente.");
