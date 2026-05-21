#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const OUT = path.join(DIST, "vault-gdr-clean");
const ZIP = path.join(DIST, "vault-gdr-clean.zip");
const REQUIRED = [
    "Inizia Qui.md",
    "LEGGIMI.md",
    "VERSION.md",
    "Hub/Vista Giocatori.md",
    "Hub/Durante il Gioco.md",
    "Risorse/Setup Guidato.md",
    "z.engine/session_views.js",
    "z.engine/session_continuity.js",
    "z.engine/session_dnd.js",
    "z.engine/session_maps.js",
    "z.engine/session_player.js"
];
const FORBIDDEN_ROOTS = ["Dev", ".github", "dist", "node_modules"];

function existsRel(root, relPath) {
    return fs.existsSync(path.join(root, relPath));
}

function fail(errors, message) {
    errors.push(message);
}

function validateOutput(errors) {
    if (!fs.existsSync(OUT)) {
        fail(errors, "release artifact mancante: dist/vault-gdr-clean");
        return;
    }

    for (const relPath of REQUIRED) {
        if (!existsRel(OUT, relPath)) fail(errors, `file release richiesto mancante: ${relPath}`);
    }

    for (const relPath of FORBIDDEN_ROOTS) {
        if (existsRel(OUT, relPath)) fail(errors, `percorso vietato nella release: ${relPath}`);
    }

    const bridge = fs.readFileSync(path.join(OUT, "z.engine/session_views.js"), "utf8");
    if (!bridge.includes("session_continuity.js")) {
        fail(errors, "session_views.js della release non carica session_continuity.js");
    }
}

function validateZip(errors) {
    if (!fs.existsSync(ZIP)) return;

    try {
        execFileSync("unzip", ["-tq", ZIP], { cwd: ROOT, stdio: "ignore" });
    } catch {
        fail(errors, "zip release non valido: unzip -tq fallito");
    }
}

const errors = [];

try {
    execFileSync("node", ["z.automazioni/release_clean.js"], { cwd: ROOT, stdio: "inherit" });
    validateOutput(errors);
    validateZip(errors);
} finally {
    fs.rmSync(DIST, { recursive: true, force: true });
}

if (errors.length) {
    console.error("Release artifact non valido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Release artifact OK: cartella temporanea, bridge runtime e zip verificati.");
