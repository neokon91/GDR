#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { readJson, readTextRel, repoPath, walk } = require("./node_utils");

const ROOT = process.cwd();
const errors = [];
const warnings = [];
const IGNORED_DIRS = new Set([".git", "node_modules", "dist"]);
const REQUIRED_META_BIND_INPUTS = [
    "mondo",
    "campagne",
    "canonico",
    "stato base",
    "stato canonico",
    "stato",
    "pressione",
    "prossima_mossa",
    "connessioni",
    "player_safe",
    "entita_impattate",
    "propaga_a",
    "sessioni",
    "luoghi",
    "fazioni",
    "missioni",
    "tracciati"
];
const FORBIDDEN_CALENDAR_MARKERS = [
    "Harptos",
    "Faer",
    "Forgotten Realms",
    "Greyhawk",
    "Galifar",
    "Barovia",
    "Brumafonda",
    "Terre della Soglia"
];

function fail(message) {
    errors.push(message);
}

function warn(message) {
    warnings.push(message);
}

function existsRel(relPath) {
    return fs.existsSync(repoPath(ROOT, relPath));
}

function resolveObsidianTarget(target) {
    if (!target) return false;
    const candidates = [target, `${target}.md`, `${target}.base`, `${target}.canvas`, `${target}.excalidraw`];
    if (candidates.some(existsRel)) return true;

    const normalized = target.replace(/\\/g, "/");
    const basename = path.basename(normalized);
    return walk(ROOT, {
        ignoredDirs: IGNORED_DIRS,
        predicate: file => {
            const relPath = path.relative(ROOT, file).replace(/\\/g, "/");
            if (!/\.(md|base|canvas|excalidraw)$/i.test(relPath)) return false;
            return path.basename(relPath, path.extname(relPath)) === basename;
        }
    }).length > 0;
}

function readJsonRel(relPath, fallback) {
    return readJson(repoPath(ROOT, relPath), fallback, error => fail(`${relPath}: JSON non valido (${error.message})`));
}

function markdownFiles() {
    return walk(ROOT, {
        ignoredDirs: IGNORED_DIRS,
        predicate: file => file.endsWith(".md")
    }).map(file => path.relative(ROOT, file).replace(/\\/g, "/"));
}

function unquotedDataviewJsBlocks(text) {
    const blocks = [];
    const lines = text.split(/\r?\n/);
    let active = false;
    let start = 0;
    let buffer = [];

    lines.forEach((line, index) => {
        const trimmed = line.trimStart();
        const quoted = trimmed.startsWith(">");
        const unquoted = quoted ? trimmed.replace(/^>\s?/, "") : line;

        if (!active && !quoted && /^```dataviewjs\s*$/.test(unquoted.trim())) {
            active = true;
            start = index + 1;
            buffer = [];
            return;
        }

        if (active && !quoted && /^```\s*$/.test(unquoted.trim())) {
            blocks.push({ start, code: buffer.join("\n") });
            active = false;
            return;
        }

        if (active) buffer.push(line);
    });

    return blocks;
}

function validateCommunityPlugins() {
    const communityPlugins = readJsonRel(".obsidian/community-plugins.json", []);
    const pluginMatrix = readJsonRel("Dev/plugin_matrix.json", []);
    const profileText = readTextRel(ROOT, "Risorse/Profili Plugin.md", "");
    const matrixIds = new Set(Array.isArray(pluginMatrix) ? pluginMatrix.map(entry => entry.id) : []);

    for (const plugin of communityPlugins) {
        const dir = `.obsidian/plugins/${plugin}`;
        const manifestPath = `${dir}/manifest.json`;
        const mainPath = `${dir}/main.js`;
        if (!existsRel(manifestPath)) fail(`${plugin}: manifest plugin mancante`);
        if (!existsRel(mainPath)) fail(`${plugin}: main.js plugin mancante`);
        if (!matrixIds.has(plugin)) fail(`${plugin}: assente da Dev/plugin_matrix.json`);
        if (!profileText.includes(plugin)) fail(`${plugin}: assente da Risorse/Profili Plugin.md`);

        const manifest = readJsonRel(manifestPath, {});
        if (!manifest.id || manifest.id !== plugin) fail(`${plugin}: manifest.id non coincide con community-plugins.json`);
        if (!manifest.name || !manifest.version) fail(`${plugin}: manifest senza name/version`);
    }
}

function validateCorePlugins() {
    const corePlugins = readJsonRel(".obsidian/core-plugins.json", {});
    const profileText = readTextRel(ROOT, "Risorse/Profili Plugin.md", "");
    for (const [plugin, enabled] of Object.entries(corePlugins)) {
        if (enabled && !profileText.includes(`\`${plugin}\``)) {
            fail(`core plugin ${plugin}: assente da Risorse/Profili Plugin.md`);
        }
    }
}

function validateCriticalConfigs() {
    const dataview = readJsonRel(".obsidian/plugins/dataview/data.json", {});
    if (dataview.enableDataviewJs !== true) fail("Dataview: enableDataviewJs deve essere true");
    if (dataview.enableInlineDataviewJs !== true) fail("Dataview: enableInlineDataviewJs deve essere true");
    if (dataview.warnOnEmptyResult !== true) fail("Dataview: warnOnEmptyResult deve restare true");

    const templater = readJsonRel(".obsidian/plugins/templater-obsidian/data.json", {});
    if (templater.templates_folder !== "z.modelli") fail("Templater: templates_folder deve essere z.modelli");
    if (templater.user_scripts_folder !== "z.automazioni") fail("Templater: user_scripts_folder deve essere z.automazioni");
    if (templater.enable_system_commands !== false) fail("Templater: enable_system_commands deve restare false");
    if (templater.trigger_on_file_creation !== false) fail("Templater: trigger_on_file_creation deve restare false");

    const metaBind = readJsonRel(".obsidian/plugins/obsidian-meta-bind-plugin/data.json", {});
    if (metaBind.enableJs !== true) fail("Meta Bind: enableJs deve essere true");
    const inputNames = new Set((metaBind.inputFieldTemplates ?? []).map(input => input.name));
    for (const name of REQUIRED_META_BIND_INPUTS) {
        if (!inputNames.has(name)) fail(`Meta Bind: input template mancante (${name})`);
    }

    const buttonIds = new Set((metaBind.buttonTemplates ?? []).map(button => button.id));
    for (const button of metaBind.buttonTemplates ?? []) {
        for (const action of button.actions ?? []) {
            if ((action.type === "templaterCreateNote" || action.type === "runTemplaterFile") && action.templateFile && !existsRel(action.templateFile)) {
                fail(`Meta Bind: ${button.id} punta a template mancante ${action.templateFile}`);
            }
            if (action.type === "open") {
                const target = String(action.link ?? "").match(/\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/)?.[1];
                if (target && !resolveObsidianTarget(target)) {
                    fail(`Meta Bind: ${button.id} apre target mancante ${target}`);
                }
            }
        }
    }

    for (const fileRel of markdownFiles()) {
        if (fileRel.startsWith("Dev/TemplateFactory/examples/")) continue;
        const text = readTextRel(ROOT, fileRel, "");
        for (const match of text.matchAll(/`BUTTON\[([^\]\n]+)\]`/g)) {
            if (match[1].includes("...")) continue;
            if (!buttonIds.has(match[1])) fail(`${fileRel}: BUTTON senza template Meta Bind (${match[1]})`);
        }
    }

    const metadataMenu = readJsonRel(".obsidian/plugins/metadata-menu/data.json", {});
    if (metadataMenu.classFilesPath !== "z.fileclass/") fail("Metadata Menu: classFilesPath deve essere z.fileclass/");

    const homepage = readJsonRel(".obsidian/plugins/homepage/data.json", {});
    const mainHomepage = homepage.homepages?.["Main Homepage"];
    if (mainHomepage?.value !== "Inizia Qui" || mainHomepage?.openOnStartup !== true) {
        fail("Homepage: apertura iniziale non punta a Inizia Qui");
    }

    const tasks = readJsonRel(".obsidian/plugins/obsidian-tasks-plugin/data.json", {});
    if (tasks.globalFilter !== "#task") fail("Tasks: globalFilter deve restare #task");
}

function validateCalendarConfig() {
    const relPath = ".obsidian/plugins/calendarium/data.json";
    const text = readTextRel(ROOT, relPath, "");
    const calendarium = readJsonRel(relPath, {});
    if (!Array.isArray(calendarium.calendars) || calendarium.calendars.length !== 1) {
        fail("Calendarium: la release deve includere un solo calendario neutro predefinito");
    }
    const calendar = calendarium.calendars?.[0] ?? {};
    if (calendar.name !== "Calendario Del Mondo" || calendarium.defaultCalendar !== calendar.id) {
        fail("Calendarium: calendario neutro non impostato come default");
    }
    for (const marker of FORBIDDEN_CALENDAR_MARKERS) {
        if (text.includes(marker)) fail(`Calendarium: riferimento non neutro vietato (${marker})`);
    }
}

function validateDataviewJsSyntax() {
    for (const fileRel of markdownFiles()) {
        if (fileRel.startsWith("z.modelli/")) continue;
        if (fileRel.startsWith("Dev/TemplateFactory/examples/")) continue;
        const text = readTextRel(ROOT, fileRel, "");
        for (const block of unquotedDataviewJsBlocks(text)) {
            try {
                new Function("dv", "app", "input", `return (async () => {\n${block.code}\n})()`);
            } catch (error) {
                fail(`${fileRel}:${block.start}: dataviewjs non compilabile (${error.message})`);
            }
        }
    }
}

function validateDocsAgainstRuntime() {
    const docs = [
        "Risorse/Profili Plugin.md",
        "Risorse/Primo Avvio Strumenti.md",
        "Risorse/Setup Guidato.md",
        "Risorse/Se Qualcosa Non Funziona.md",
        "Dev/Plugin Technical Reference.md"
    ].map(fileRel => [fileRel, readTextRel(ROOT, fileRel, "")]);

    for (const [fileRel, text] of docs) {
        if (!text) fail(`documentazione plugin mancante: ${fileRel}`);
        if (/abilita solo ciò che usi|abilita solo cio che usi/i.test(text)) {
            fail(`${fileRel}: non deve suggerire di disabilitare plugin inclusi nel percorso base`);
        }
    }

    const profile = readTextRel(ROOT, "Risorse/Profili Plugin.md", "");
    for (const marker of ["Gia Incluso Nella Release", "Plugin Core Obsidian", "Plugin Community Integrati", "Non Disattivare Subito"]) {
        if (!profile.includes(marker)) fail(`Risorse/Profili Plugin.md: sezione release mancante (${marker})`);
    }
}

validateCommunityPlugins();
validateCorePlugins();
validateCriticalConfigs();
validateCalendarConfig();
validateDataviewJsSyntax();
validateDocsAgainstRuntime();

for (const message of warnings) console.warn(`WARN ${message}`);
if (errors.length) {
    console.error("Plugin runtime non coerente:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Plugin runtime OK: core, community, configurazioni critiche, calendario neutro e DataviewJS verificati.");
