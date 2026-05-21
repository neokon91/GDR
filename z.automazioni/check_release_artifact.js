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
    "z.engine/session_player.js",
    "z.engine/session_runtime.js"
];
const FORBIDDEN_ROOTS = ["Dev", ".github", "dist", "node_modules"];
const REQUIRED_PLUGINS = [
    "dataview",
    "templater-obsidian",
    "obsidian-meta-bind-plugin",
    "js-engine"
];
const FORBIDDEN_AUTOMATION_PREFIXES = ["audit_", "check_", "render_"];

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
    for (const marker of ["session_continuity.js", "session_runtime.js", "session_dnd.js", "session_maps.js", "session_player.js"]) {
        if (!bridge.includes(marker)) fail(errors, `session_views.js della release non carica ${marker}`);
    }

    const readme = fs.readFileSync(path.join(OUT, "LEGGIMI.md"), "utf8");
    for (const marker of ["Apri questa cartella in Obsidian", "Vista Giocatori", "Quality Report"]) {
        if (!readme.includes(marker)) fail(errors, `LEGGIMI.md release incompleto (${marker})`);
    }

    const plugins = JSON.parse(fs.readFileSync(path.join(OUT, ".obsidian/community-plugins.json"), "utf8"));
    for (const plugin of REQUIRED_PLUGINS) {
        if (!plugins.includes(plugin)) fail(errors, `plugin richiesto non abilitato nella release: ${plugin}`);
    }

    const automationRoot = path.join(OUT, "z.automazioni");
    if (fs.existsSync(automationRoot)) {
        for (const entry of fs.readdirSync(automationRoot, { withFileTypes: true })) {
            if (!entry.isFile()) continue;
            if (FORBIDDEN_AUTOMATION_PREFIXES.some(prefix => entry.name.startsWith(prefix))) {
                fail(errors, `script tecnico vietato nella release: z.automazioni/${entry.name}`);
            }
        }
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
