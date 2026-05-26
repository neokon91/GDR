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
const FORBIDDEN_RELEASE_PATHS = [
    "docs",
    "Dev/TemplateFactory/modules/worldbuilding_depth_axes.yaml",
    "Dev/TemplateFactory/modules/demo_contract.yaml",
    "Mondi/[Demo] Regno di Prova.md",
    "Mondi/Brumafonda Demo.md",
    "Campagne/Sale Sotto La Nebbia/Sale Sotto La Nebbia.md"
];
const FORBIDDEN_RELEASE_TEXT = [
    "idea_originale_riservata",
    "non_inclusa_nella_licenza_generale_del_vault",
    "source_lab: /Users/andrea/Desktop/projects/FantasyWorld",
    "assi_tematici_fazione",
    "assi_tematici_magia"
];
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

function walkFiles(root, files = []) {
    if (!fs.existsSync(root)) return files;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        const fullPath = path.join(root, entry.name);
        if (entry.isDirectory()) {
            walkFiles(fullPath, files);
        } else if (entry.isFile()) {
            files.push(fullPath);
        }
    }
    return files;
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
    for (const relPath of FORBIDDEN_RELEASE_PATHS) {
        if (existsRel(OUT, relPath)) fail(errors, `materiale dev/riservato vietato nella release: ${relPath}`);
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

    // Protegge la release da materiale riservato o da percorsi locali del laboratorio FantasyWorld.
    for (const file of walkFiles(OUT)) {
        if (!file.endsWith(".md") && !file.endsWith(".yaml") && !file.endsWith(".json") && !file.endsWith(".js")) continue;
        const relPath = path.relative(OUT, file).replace(/\\/g, "/");
        const text = fs.readFileSync(file, "utf8");
        for (const marker of FORBIDDEN_RELEASE_TEXT) {
            if (text.includes(marker)) {
                fail(errors, `${relPath}: marker riservato/dev-only nella release (${marker})`);
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
