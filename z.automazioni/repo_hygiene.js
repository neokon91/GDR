#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { readJson: readJsonFile, readTextIfExists, rel: relativePath, repoPath, walk } = require("./node_utils");
const { loadReleaseBoundary } = require("./release_boundary_utils");

const ROOT = process.cwd();
const FIX = process.argv.includes("--fix");
const RELEASE_BOUNDARY = loadReleaseBoundary(ROOT);
const GENERATED_RELEASE_ROOTS = RELEASE_BOUNDARY.generated_release_roots ?? [];
const IGNORED_DIRS = new Set([".git", "node_modules"]);
const GENERATED_LOCAL_DIRS = [
    "dist",
    ...GENERATED_RELEASE_ROOTS,
    "z.modelli",
    "Dev/TemplateFactory/examples/generated",
    ".pytest_cache",
    "__pycache__",
    "z.automazioni/__pycache__",
    "tests/__pycache__"
];
const JUNK_FILE_PATTERNS = [
    /^\.DS_Store$/,
    /^Thumbs\.db$/,
    /~$/,
    /\.tmp$/i,
    /\.bak$/i,
    /\.orig$/i,
    /\.swp$/i
];
const REQUIRED_NPM_SCRIPTS = ["check", "check:repo", "check:js", "check:smoke", "check:release", "check:importers", "check:metadata", "check:diff", "release:clean"];
const FORBIDDEN_TRACKED_USER_ROOTS = ["Mondi", "Campagne", "Giocatori", "Inbox", "Import"];
const FORBIDDEN_TRACKED_GENERATED_ROOTS = ["z.bacheche"];
const FORBIDDEN_TRACKED_GENERATED_FILES = [
    "Risorse/Risorse.md",
    "Risorse/Audio/Audio.md",
    "Risorse/Video/Video.md",
    "Risorse/Immagini/Immagini.md",
    "Risorse/Dispense/Dispense.md"
];
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

for (const root of FORBIDDEN_TRACKED_USER_ROOTS) {
    const tracked = execFileSync("git", ["ls-files", `${root}/**`], { cwd: ROOT, encoding: "utf8" })
        .split(/\r?\n/)
        .filter(Boolean);
    if (tracked.length) {
        errors.push(`${root}: cartella utente tracciata nel sorgente (${tracked.length} file); deve esistere solo in release/output`);
    }
}

for (const root of GENERATED_RELEASE_ROOTS) {
    const tracked = execFileSync("git", ["ls-files", `${root}/**`], { cwd: ROOT, encoding: "utf8" })
        .split(/\r?\n/)
        .filter(Boolean);
    if (tracked.length) {
        errors.push(`${root}: root generata tracciata nel sorgente (${tracked.length} file); deve essere materializzata in release/output`);
    }
}

for (const root of FORBIDDEN_TRACKED_GENERATED_ROOTS) {
    const tracked = execFileSync("git", ["ls-files", `${root}/**`], { cwd: ROOT, encoding: "utf8" })
        .split(/\r?\n/)
        .filter(Boolean);
    if (tracked.length) {
        errors.push(`${root}: superficie vault generata tracciata nel sorgente (${tracked.length} file); deve derivare da YAML/Jinja`);
    }
}

for (const relPath of FORBIDDEN_TRACKED_GENERATED_FILES) {
    const tracked = execFileSync("git", ["ls-files", relPath], { cwd: ROOT, encoding: "utf8" }).trim();
    if (tracked) {
        errors.push(`${relPath}: superficie vault generata tracciata nel sorgente; deve derivare da YAML/Jinja`);
    }
}

for (const relDir of GENERATED_LOCAL_DIRS) {
    const target = repoPath(ROOT, relDir);
    if (!fs.existsSync(target)) continue;

    if (FIX) {
        fs.rmSync(target, { recursive: true, force: true });
        fixed.push(relDir);
    } else {
        errors.push(`${relDir}: cartella locale generata da rimuovere; usa npm run clean:repo`);
    }
}

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

const gitignorePath = repoPath(ROOT, ".gitignore");
const gitignore = readTextIfExists(gitignorePath, null);
if (gitignore === null) {
    errors.push(".gitignore mancante");
} else {
    const requiredGitignorePatterns = [
        ".DS_Store",
        "Thumbs.db",
        "*.tmp",
        "*.bak",
        "*.orig",
        "*~",
        "dist/",
        ...GENERATED_RELEASE_ROOTS.map(root => `${String(root).replace(/\/$/, "")}/`),
        "z.modelli/",
        "Dev/TemplateFactory/examples/generated/",
        "__pycache__/",
        "*.py[cod]",
        ".pytest_cache/"
    ];
    for (const pattern of [...new Set(requiredGitignorePatterns)]) {
        if (!gitignore.includes(pattern)) {
            errors.push(`.gitignore: pattern mancante ${pattern}`);
        }
    }
}

const packageJson = readJson(repoPath(ROOT, "package.json"));
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
