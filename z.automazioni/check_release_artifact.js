#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { repoPath } = require("./node_utils");

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const OUT = path.join(DIST, "vault-gdr-clean");
const ZIP = path.join(DIST, "vault-gdr-clean.zip");
const BOUNDARY = "Dev/TemplateFactory/modules/release_boundary.yaml";

function loadYaml(relPath) {
    const script = [
        "import json, sys, yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");
    const stdout = execFileSync("python3", ["-c", script, repoPath(ROOT, relPath)], {
        encoding: "utf8",
        maxBuffer: 1024 * 1024
    });
    return JSON.parse(stdout);
}

const releaseBoundary = loadYaml(BOUNDARY);

function existsRel(root, relPath) {
    return fs.existsSync(path.join(root, relPath));
}

function fail(errors, message) {
    errors.push(message);
}

function asArray(value) {
    return Array.isArray(value) ? value : [];
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

    for (const relPath of asArray(releaseBoundary.required_files)) {
        if (!existsRel(OUT, relPath)) fail(errors, `file release richiesto mancante: ${relPath}`);
    }

    for (const relPath of asArray(releaseBoundary.forbidden_roots)) {
        if (existsRel(OUT, relPath)) fail(errors, `percorso vietato nella release: ${relPath}`);
    }
    for (const relPath of asArray(releaseBoundary.forbidden_paths)) {
        if (existsRel(OUT, relPath)) fail(errors, `materiale dev/riservato vietato nella release: ${relPath}`);
    }

    const bridge = fs.readFileSync(path.join(OUT, "z.engine/session_views.js"), "utf8");
    for (const marker of asArray(releaseBoundary.bridge_runtime_modules)) {
        if (!bridge.includes(marker)) fail(errors, `session_views.js della release non carica ${marker}`);
    }

    const readme = fs.readFileSync(path.join(OUT, "LEGGIMI.md"), "utf8");
    for (const marker of asArray(releaseBoundary.leggimi_markers)) {
        if (!readme.includes(marker)) fail(errors, `LEGGIMI.md release incompleto (${marker})`);
    }

    const plugins = JSON.parse(fs.readFileSync(path.join(OUT, ".obsidian/community-plugins.json"), "utf8"));
    for (const plugin of asArray(releaseBoundary.required_plugins)) {
        if (!plugins.includes(plugin)) fail(errors, `plugin richiesto non abilitato nella release: ${plugin}`);
        if (!existsRel(OUT, `.obsidian/plugins/${plugin}/manifest.json`)) fail(errors, `manifest plugin richiesto mancante nella release: ${plugin}`);
        if (!existsRel(OUT, `.obsidian/plugins/${plugin}/main.js`)) fail(errors, `main plugin richiesto mancante nella release: ${plugin}`);
    }

    const homepage = JSON.parse(fs.readFileSync(path.join(OUT, ".obsidian/plugins/homepage/data.json"), "utf8")).homepages?.["Main Homepage"];
    if (homepage?.value !== "Inizia Qui" || homepage?.openOnStartup !== true) {
        fail(errors, "homepage release non apre Inizia Qui all'avvio");
    }
    const appearance = JSON.parse(fs.readFileSync(path.join(OUT, ".obsidian/appearance.json"), "utf8"));
    if (!appearance.enabledCssSnippets?.includes("gdr-vault")) {
        fail(errors, "snippet gdr-vault non abilitato nella release");
    }
    const templater = JSON.parse(fs.readFileSync(path.join(OUT, ".obsidian/plugins/templater-obsidian/data.json"), "utf8"));
    if (templater.templates_folder !== "z.modelli" || templater.user_scripts_folder !== "z.automazioni") {
        fail(errors, "Templater release non punta a z.modelli e z.automazioni");
    }
    const dataview = JSON.parse(fs.readFileSync(path.join(OUT, ".obsidian/plugins/dataview/data.json"), "utf8"));
    if (dataview.enableDataviewJs !== true) {
        fail(errors, "DataviewJS non abilitato nella release");
    }

    const automationRoot = path.join(OUT, "z.automazioni");
    if (fs.existsSync(automationRoot)) {
        for (const entry of fs.readdirSync(automationRoot, { withFileTypes: true })) {
            if (!entry.isFile()) continue;
            if (asArray(releaseBoundary.forbidden_automation_prefixes).some(prefix => entry.name.startsWith(prefix))) {
                fail(errors, `script tecnico vietato nella release: z.automazioni/${entry.name}`);
            }
        }
    }

    // Protegge la release da materiale riservato o da percorsi locali del laboratorio FantasyWorld.
    for (const file of walkFiles(OUT)) {
        if (!file.endsWith(".md") && !file.endsWith(".yaml") && !file.endsWith(".json") && !file.endsWith(".js")) continue;
        const relPath = path.relative(OUT, file).replace(/\\/g, "/");
        const text = fs.readFileSync(file, "utf8");
        for (const marker of asArray(releaseBoundary.forbidden_text_markers)) {
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
