#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const OUT = path.join(ROOT, "dist", "vault-gdr-clean");
const ZIP = path.join(ROOT, "dist", "vault-gdr-clean.zip");
const errors = [];

const PRIMARY_PAGES = [
    "Inizia Qui.md",
    "Demo Regno Di Prova.md",
    "Risorse/Setup Guidato.md",
    "Risorse/Prima Sessione In 15 Minuti.md",
    "Hub/1. DM Dashboard.md",
    "Hub/Worldbuilder Dashboard.md",
    "Risorse/Preparazione Sessione.md",
    "Hub/Durante il Gioco.md",
    "Risorse/Post Sessione Guidato.md",
    "Hub/Cosa Succede Fuori Scena.md",
    "Hub/Vista Giocatori.md",
    "Risorse/Se Qualcosa Non Funziona.md"
];

const REQUIRED_BUTTONS = [
    "nuovo-mondo-homebrew",
    "preparazione-sessione-risorse-preparazione-sessione",
    "gioca-hub-durante-il-gioco-durante-il-gioco",
    "fuori-scena-hub-cosa-succede-fuori-scena-cosa-succede-fuori-scena",
    "setup-guidato-risorse-setup-guidato",
    "prima-sessione-in-15-minuti-risorse-prima-sessione-in-15-minuti",
    "worldbuilder-worldbuilder-dashboard-2",
    "nuova-sessione-z-modelli-dm-sessione-md",
    "rendi-sessione-attiva",
    "wizard-appunto-live",
    "registra-scelta-mondo",
    "wizard-fine-sessione",
    "applica-conseguenza",
    "propaga-a-entita",
    "prepara-recap-pubblico"
];

const FORBIDDEN_VISIBLE_MARKERS = [
    "TemplateFactory",
    "npm run",
    "node z.automazioni",
    "Dev/",
    "source_lab:",
    "idea_originale_riservata"
];

function fail(message) {
    errors.push(message);
}

function existsRel(relPath) {
    return fs.existsSync(path.join(OUT, relPath));
}

function readJson(relPath, fallback = null) {
    try {
        return JSON.parse(fs.readFileSync(path.join(OUT, relPath), "utf8"));
    } catch (error) {
        fail(`${relPath}: JSON non leggibile (${error.message})`);
        return fallback;
    }
}

function readText(relPath, fallback = "") {
    const file = path.join(OUT, relPath);
    if (!fs.existsSync(file)) return fallback;
    return fs.readFileSync(file, "utf8");
}

function walk(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, files);
        if (entry.isFile()) files.push(full);
    }
    return files;
}

function releaseRel(file) {
    return path.relative(OUT, file).replace(/\\/g, "/");
}

function collectBookmarks(items, out = []) {
    for (const item of items ?? []) {
        if (item.type === "group") collectBookmarks(item.items, out);
        if (item.type === "file") out.push(item.path);
    }
    return out;
}

function resolveWikiTarget(target) {
    if (!target) return true;
    if (/^(https?:|obsidian:|mailto:)/.test(target)) return true;
    const clean = target.split("#")[0].split("|")[0];
    if (!clean) return true;
    const candidates = [clean, `${clean}.md`, `${clean}.base`, `${clean}.canvas`, `${clean}.excalidraw.md`];
    if (candidates.some(existsRel)) return true;
    const base = path.basename(clean);
    return walk(OUT).some(file => {
        const rel = releaseRel(file);
        if (!/\.(md|base|canvas)$/i.test(rel)) return false;
        return path.basename(rel, path.extname(rel)) === base;
    });
}

function validateDataviewJsSyntax(relPath, text) {
    const normalized = text
        .split(/\r?\n/)
        .filter(line => !line.trimStart().startsWith(">"))
        .join("\n");
    const blockPattern = /```dataviewjs\n([\s\S]*?)\n```/g;
    let match;
    while ((match = blockPattern.exec(normalized))) {
        try {
            new Function("dv", "app", "input", `return (async () => {\n${match[1]}\n})()`);
        } catch (error) {
            fail(`${relPath}: blocco dataviewjs non compilabile (${error.message})`);
        }
    }
}

function validateTemplaterWrappers() {
    const templaterDir = path.join(OUT, "z.automazioni", "templater");
    const wrappers = walk(templaterDir).filter(file => file.endsWith(".js"));
    if (wrappers.length < 50) fail(`Templater: wrapper insufficienti nella release (${wrappers.length})`);
    for (const file of wrappers) {
        try {
            delete require.cache[require.resolve(file)];
            const exported = require(file);
            if (typeof exported !== "function") fail(`${releaseRel(file)}: export non funzione`);
        } catch (error) {
            fail(`${releaseRel(file)}: import wrapper fallito (${error.message})`);
        }
    }
}

function validateMetaBindTargets() {
    const metaBind = readJson(".obsidian/plugins/obsidian-meta-bind-plugin/data.json", {});
    const buttons = metaBind.buttonTemplates ?? [];
    const buttonIds = new Set(buttons.map(button => button.id));
    for (const button of REQUIRED_BUTTONS) {
        if (!buttonIds.has(button)) fail(`Meta Bind: pulsante first-run mancante (${button})`);
    }
    for (const button of buttons) {
        for (const action of button.actions ?? []) {
            if ((action.type === "templaterCreateNote" || action.type === "runTemplaterFile") && action.templateFile && !existsRel(action.templateFile)) {
                fail(`Meta Bind: ${button.id} punta a template mancante ${action.templateFile}`);
            }
            if (action.type === "open") {
                const target = String(action.link ?? "").match(/\[\[([^\]]+)\]\]/)?.[1];
                if (target && !resolveWikiTarget(target)) fail(`Meta Bind: ${button.id} apre target mancante ${target}`);
            }
        }
    }
}

function validatePrimaryPages() {
    for (const relPath of PRIMARY_PAGES) {
        if (!existsRel(relPath)) {
            fail(`pagina first-run mancante: ${relPath}`);
            continue;
        }
        const text = readText(relPath);
        if (/<%[\s\S]*?%>/.test(text)) fail(`${relPath}: contiene codice Templater visibile`);
        validateDataviewJsSyntax(relPath, text);
        for (const marker of FORBIDDEN_VISIBLE_MARKERS) {
            if (text.includes(marker)) fail(`${relPath}: marker tecnico visibile (${marker})`);
        }
        for (const match of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
            if (!resolveWikiTarget(match[1])) fail(`${relPath}: wikilink verso target mancante (${match[1]})`);
        }
    }
}

function validateRelease() {
    if (!fs.existsSync(OUT)) fail("release demo mancante: dist/vault-gdr-clean");
    if (!fs.existsSync(ZIP)) fail("zip release demo mancante: dist/vault-gdr-clean.zip");

    const workspace = readJson(".obsidian/workspace.json", {});
    const firstLeaf = workspace.main?.children?.[0]?.children?.[0]?.state?.state;
    if (firstLeaf?.file !== "Inizia Qui.md" || firstLeaf?.mode !== "preview") {
        fail("workspace first-run non apre Inizia Qui in preview");
    }

    const appConfig = readJson(".obsidian/app.json", {});
    for (const hidden of ["z.automazioni/", "z.engine/", "z.modelli/", "z.bases/", "z.fileclass/"]) {
        if (!appConfig.userIgnoreFilters?.includes(hidden)) fail(`app.json non nasconde ${hidden}`);
    }

    const communityPlugins = readJson(".obsidian/community-plugins.json", []);
    if (communityPlugins.length !== 27) fail(`plugin community attesi 27, trovati ${communityPlugins.length}`);
    for (const plugin of communityPlugins) {
        if (!existsRel(`.obsidian/plugins/${plugin}/manifest.json`)) fail(`manifest plugin mancante: ${plugin}`);
        if (!existsRel(`.obsidian/plugins/${plugin}/main.js`)) fail(`main plugin mancante: ${plugin}`);
    }

    const templater = readJson(".obsidian/plugins/templater-obsidian/data.json", {});
    if (templater.templates_folder !== "z.modelli") fail("Templater: templates_folder non e z.modelli");
    if (templater.user_scripts_folder !== "z.automazioni/templater") fail("Templater: user_scripts_folder non e z.automazioni/templater");
    if (templater.enable_system_commands !== false) fail("Templater: system commands devono restare disattivati");

    const dataview = readJson(".obsidian/plugins/dataview/data.json", {});
    if (dataview.enableDataviewJs !== true) fail("Dataview: DataviewJS non abilitato");

    const calendar = readJson(".obsidian/plugins/calendarium/data.json", {});
    if ((calendar.calendars ?? []).length !== 1 || calendar.calendars?.[0]?.name !== "Calendario Del Mondo") {
        fail("Calendarium: calendario neutro first-run non valido");
    }

    const bookmarks = collectBookmarks(readJson(".obsidian/bookmarks.json", {})?.items);
    for (const bookmark of bookmarks) {
        if (bookmark.startsWith("z.")) fail(`bookmark tecnico visibile: ${bookmark}`);
        if (!existsRel(bookmark)) fail(`bookmark verso file mancante: ${bookmark}`);
    }

    validateTemplaterWrappers();
    validateMetaBindTargets();
    validatePrimaryPages();

    for (const file of walk(path.join(OUT, "z.automazioni"))) {
        const rel = releaseRel(file);
        const base = path.basename(file);
        if (/^(check_|generate_|import_|render_|template_factory_)/.test(base)) {
            fail(`script tecnico vietato nella release first-run: ${rel}`);
        }
    }
}

execFileSync("node", ["z.automazioni/release_clean.js", "--with-demo"], { cwd: ROOT, stdio: "inherit" });
validateRelease();
try {
    execFileSync("unzip", ["-tq", ZIP], { cwd: ROOT, stdio: "ignore" });
} catch {
    fail("zip release demo non valida: unzip -tq fallito");
}

if (errors.length) {
    console.error("First-run release non valida:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("First-run release OK: zip demo, plugin, Templater, Meta Bind, workspace, bookmark e percorso utente verificati.");
