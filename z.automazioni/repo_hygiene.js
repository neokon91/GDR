#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { readJson: readJsonFile, rel: relativePath, walk } = require("./node_utils");

const ROOT = process.cwd();
const FIX = process.argv.includes("--fix");
const IGNORED_DIRS = new Set([".git", "node_modules"]);
const JUNK_FILE_PATTERNS = [
    /^\.DS_Store$/,
    /^Thumbs\.db$/,
    /~$/,
    /\.tmp$/i,
    /\.bak$/i,
    /\.orig$/i,
    /\.swp$/i
];
const REQUIRED_NPM_SCRIPTS = ["check", "check:repo", "check:js", "check:smoke", "check:release", "check:diff", "release:clean"];
const errors = [];
const fixed = [];

function rel(file) {
    return relativePath(ROOT, file);
}

function readJson(file) {
    return readJsonFile(file, null, error => {
        errors.push(`${rel(file)}: JSON non valido (${error.message})`);
    });
}

const files = walk(ROOT, { ignoredDirs: IGNORED_DIRS });

for (const file of files) {
    const basename = path.basename(file);
    if (!JUNK_FILE_PATTERNS.some(pattern => pattern.test(basename))) continue;

    if (FIX) {
        fs.rmSync(file, { force: true });
        fixed.push(rel(file));
    } else {
        errors.push(`${rel(file)}: artefatto locale da rimuovere; usa npm run clean:repo`);
    }
}

for (const file of files) {
    const fileRel = rel(file);
    if (fileRel.startsWith("dist/")) continue;

    if (!fileRel.endsWith(".md") && !fileRel.endsWith(".geojson")) continue;

    if (path.basename(fileRel).startsWith("Prova -") || fileRel === "Risorse/Prove Entità.md") {
        errors.push(`${fileRel}: nota di prova residua fuori dalla release generata`);
    }
}

const gitignorePath = path.join(ROOT, ".gitignore");
if (!fs.existsSync(gitignorePath)) {
    errors.push(".gitignore mancante");
} else {
    const gitignore = fs.readFileSync(gitignorePath, "utf8");
    for (const pattern of [".DS_Store", "Thumbs.db", "*.tmp", "*.bak", "*.orig", "*~", "dist/"]) {
        if (!gitignore.includes(pattern)) {
            errors.push(`.gitignore: pattern mancante ${pattern}`);
        }
    }
}

const packageJson = readJson(path.join(ROOT, "package.json"));
if (packageJson) {
    const scripts = packageJson.scripts ?? {};
    for (const script of REQUIRED_NPM_SCRIPTS) {
        if (!scripts[script]) {
            errors.push(`package.json: script npm mancante (${script})`);
        }
    }
}

if (fixed.length) {
    console.log("Rimossi:");
    for (const file of fixed) console.log(`- ${file}`);
}

if (errors.length) {
    console.error("Errori repository:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Repository OK: nessun artefatto locale o nota di prova residua.");
