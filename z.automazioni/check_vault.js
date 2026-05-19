#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const IGNORED_DIRS = new Set([".git", "node_modules"]);
const REQUIRED_PLUGINS = [
    "dataview",
    "templater-obsidian",
    "obsidian-meta-bind-plugin",
    "js-engine",
    "metadata-menu",
    "folder-notes",
    "homepage"
];
const REQUIRED_SNIPPETS = [
    ".obsidian/snippets/gdr-vault.css"
];
const REQUIRED_FILES = [
    "Inizia Qui.md",
    "VERSION.md",
    "CHANGELOG.md",
    "RELEASE.md",
    "Risorse/FAQ.md",
    "Campagne/Demo - La Reliquia Spezzata.md"
];

const errors = [];
const warnings = [];

function rel(file) {
    return path.relative(ROOT, file).replace(/\\/g, "/");
}

function walk(dir, predicate = () => true) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (IGNORED_DIRS.has(entry.name)) continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...walk(fullPath, predicate));
        } else if (entry.isFile() && predicate(fullPath)) {
            files.push(fullPath);
        }
    }

    return files;
}

function readJson(file) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
        errors.push(`${rel(file)}: JSON non valido (${error.message})`);
        return null;
    }
}

function targetPath(target) {
    const normalized = String(target ?? "").replace(/\\/g, "/").trim();
    if (!normalized) return "";
    return normalized.endsWith(".md") ? normalized : `${normalized}.md`;
}

const markdownFiles = walk(ROOT, file => file.endsWith(".md"));
const markdownByPath = new Set();
const markdownByBasename = new Map();

for (const file of markdownFiles) {
    const fileRel = rel(file);
    const stem = fileRel.replace(/\.md$/, "");
    const basename = path.basename(stem);

    markdownByPath.add(stem);
    if (!markdownByBasename.has(basename)) markdownByBasename.set(basename, []);
    markdownByBasename.get(basename).push(fileRel);
}

for (const file of walk(ROOT, file => file.endsWith(".json"))) {
    readJson(file);
}

const communityPlugins = readJson(path.join(ROOT, ".obsidian/community-plugins.json")) ?? [];
for (const plugin of REQUIRED_PLUGINS) {
    if (!communityPlugins.includes(plugin)) {
        errors.push(`Plugin obbligatorio non abilitato: ${plugin}`);
    }

    if (!fs.existsSync(path.join(ROOT, ".obsidian/plugins", plugin, "manifest.json"))) {
        errors.push(`Plugin obbligatorio non incluso: ${plugin}`);
    }
}

for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(ROOT, file))) {
        errors.push(`File release/onboarding obbligatorio mancante: ${file}`);
    }
}

for (const snippet of REQUIRED_SNIPPETS) {
    const snippetPath = path.join(ROOT, snippet);
    if (!fs.existsSync(snippetPath)) {
        errors.push(`Snippet CSS obbligatorio mancante: ${snippet}`);
        continue;
    }

    const css = fs.readFileSync(snippetPath, "utf8");
    const openBraces = (css.match(/{/g) ?? []).length;
    const closeBraces = (css.match(/}/g) ?? []).length;

    if (openBraces !== closeBraces) {
        errors.push(`${snippet}: parentesi graffe CSS non bilanciate (${openBraces} aperte, ${closeBraces} chiuse)`);
    }
}

const wikiLinkPattern = /!?\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]*)?\]\]/g;
for (const file of markdownFiles) {
    const text = fs.readFileSync(file, "utf8");
    let match;

    while ((match = wikiLinkPattern.exec(text))) {
        const target = match[1].trim();
        if (!target || /^[a-z]+:\/\//i.test(target)) continue;

        const normalized = target.replace(/\\/g, "/").replace(/\.md$/, "");
        const basename = path.basename(normalized);

        if (markdownByPath.has(normalized)) continue;

        const matches = markdownByBasename.get(basename) ?? [];

        if (!matches.length) {
            errors.push(`${rel(file)}: wikilink rotto ${match[0]}`);
        } else if (matches.length > 1) {
            warnings.push(`${rel(file)}: wikilink ambiguo ${match[0]} -> ${matches.join(", ")}`);
        }
    }
}

const templatePattern = /templateFile:\s*["']([^"']+)["']/g;
for (const file of markdownFiles) {
    const text = fs.readFileSync(file, "utf8");
    let match;

    while ((match = templatePattern.exec(text))) {
        const template = targetPath(match[1]);
        if (!fs.existsSync(path.join(ROOT, template))) {
            errors.push(`${rel(file)}: template Meta Bind mancante ${template}`);
        }
    }
}

const iconConfig = readJson(path.join(ROOT, ".obsidian/plugins/obsidian-icon-folder/data.json"));
if (iconConfig) {
    for (const key of Object.keys(iconConfig)) {
        if (key === "settings") continue;
        if (!fs.existsSync(path.join(ROOT, key)) && !fs.existsSync(path.join(ROOT, `${key}.md`))) {
            errors.push(`Icon Folder punta a un percorso mancante: ${key}`);
        }
    }
}

const workspace = readJson(path.join(ROOT, ".obsidian/workspace.json"));
if (workspace) {
    const serialized = JSON.stringify(workspace);
    const stalePaths = ["Bestiario/Prova.md", "\"Mondo/"];
    for (const stalePath of stalePaths) {
        if (serialized.includes(stalePath)) {
            errors.push(`Configurazione Obsidian contiene percorso obsoleto: ${stalePath}`);
        }
    }
}

if (warnings.length) {
    console.log("Avvisi:");
    for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
    console.error("Errori:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Vault OK: ${markdownFiles.length} note, ${communityPlugins.length} plugin community abilitati.`);
