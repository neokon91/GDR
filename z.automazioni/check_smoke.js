#!/usr/bin/env node

const { readTextRel } = require("./node_utils");

const ROOT = process.cwd();
const errors = [];
const TECHNICAL_JARGON = ["Plugin coinvolti", "Meta Bind", "Dataview", "Templater", "workflow", "runtime", "plugin", "entry point"];

function userVisibleText(text) {
    let inFence = false;
    let fence = "";
    const withoutCode = text.split(/\r?\n/).filter(line => {
        const match = line.match(/^(`{3,})/);
        if (match && (!inFence || match[1].length >= fence.length)) {
            inFence = !inFence;
            fence = inFence ? match[1] : "";
            return false;
        }
        return !inFence;
    }).join("\n");

    return withoutCode
        .replace(/<!-- workflow:quick_actions:start [^>]+ -->[\s\S]*?<!-- workflow:quick_actions:end [^>]+ -->/g, "")
        .replace(/<!--[\s\S]*?-->/g, "");
}

function assertNoTechnicalJargon(label, relPath) {
    const visible = userVisibleText(readTextRel(ROOT, relPath));
    for (const jargon of TECHNICAL_JARGON) {
        if (visible.includes(jargon)) {
            errors.push(`Smoke statico: ${label} espone gergo tecnico (${jargon})`);
        }
    }
}

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
if (!startHere.includes("renderOnboardingReadiness")) {
    errors.push("Smoke statico: Inizia Qui non contiene renderOnboardingReadiness");
}
assertNoTechnicalJargon("Inizia Qui", "Inizia Qui.md");
for (const [label, relPath] of [
    ["DM Dashboard", "Hub/1. DM Dashboard.md"],
    ["Worldbuilder Dashboard", "Hub/Worldbuilder Dashboard.md"],
    ["Campagna da Ambientazione", "Hub/Campagna da Ambientazione.md"],
    ["Preparazione Sessione", "Risorse/Preparazione Sessione.md"],
    ["Durante il Gioco", "Hub/Durante il Gioco.md"],
    ["Cosa Succede Fuori Scena", "Hub/Cosa Succede Fuori Scena.md"],
    ["Post Sessione Guidato", "Risorse/Post Sessione Guidato.md"]
]) {
    assertNoTechnicalJargon(label, relPath);
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
