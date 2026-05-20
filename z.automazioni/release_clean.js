#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const OUT = path.join(DIST, "vault-gdr-clean");
const ZIP = path.join(DIST, "vault-gdr-clean.zip");

const INCLUDED_ROOTS = new Set([
    ".obsidian",
    "Campagne",
    "Giocatori",
    "Hub",
    "Inbox",
    "Mondi",
    "Risorse",
    "SRD",
    "z.automazioni",
    "z.engine",
    "z.bacheche",
    "z.fileclass",
    "z.modelli"
]);

const INCLUDED_ROOT_FILES = new Set([
    "Inizia Qui.md",
    "LICENSE.md",
    "VERSION.md",
]);

const EXCLUDED_DIRS = new Set([".git", ".github", "dist", "docs", "Import", "node_modules"]);
const EXCLUDED_ROOT_FILES = new Set([".gitignore", "CHANGELOG.md", "CONTRIBUTING.md", "RELEASE.md", "Repository.md", "package.json"]);
const EXCLUDED_RISORSE = new Set([
    "Callout GDR.md",
    "Checklist Lore Professionale.md",
    "Consegna Nuovo DM.md",
    "Guida Lore Professionale.md",
    "Indice Connettore GPT.md",
    "Importare Mappe.md",
    "Integrazioni Plugin.md",
    "Media Scene.md",
    "Modello Entità.md",
    "Preset Calendario.md",
    "Profili Campagna.md",
    "Recap Plugin Installati.md",
    "Release Pulita.md",
    "Roadmap",
    "Strumenti Attivi.md",
    "Studio Iron Vault.md",
    "Sviluppo Vault.md",
    "Worldbuilding Tassonomico.md"
]);
const EXCLUDED_AUTOMAZIONI = new Set([
    "check_vault.js",
    "import_azgaar_geojson.js",
    "import_srd.js",
    "LICENSE.md",
    "release_beta.js",
    "release_clean.js",
    "README.md"
]);
const EXCLUDED_FILES = new Set([".DS_Store"]);

function readJson(file, fallback) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return fallback;
    }
}

const enabledPlugins = new Set(readJson(path.join(ROOT, ".obsidian/community-plugins.json"), []));

function rel(file) {
    return path.relative(ROOT, file).replace(/\\/g, "/");
}

function topSegment(relPath) {
    return relPath.split("/")[0];
}

function shouldIncludeRoot(relPath, entry) {
    const top = topSegment(relPath);
    if (INCLUDED_ROOTS.has(top) && !EXCLUDED_DIRS.has(top)) return true;
    if (entry.isDirectory()) return false;
    return INCLUDED_ROOT_FILES.has(relPath) && !EXCLUDED_ROOT_FILES.has(relPath);
}

function shouldSkip(relPath, entry) {
    if (EXCLUDED_FILES.has(entry.name)) return true;
    const top = topSegment(relPath);
    if (EXCLUDED_DIRS.has(top)) return true;
    if (!shouldIncludeRoot(relPath, entry)) return true;

    if (relPath.startsWith(".obsidian/plugins/")) {
        const pluginId = relPath.split("/")[2];
        if (pluginId && !enabledPlugins.has(pluginId)) return true;
    }

    if (relPath === ".obsidian/workspace.json") return true;

    if (relPath.startsWith("Risorse/")) {
        const first = relPath.slice("Risorse/".length).split("/")[0];
        if (EXCLUDED_RISORSE.has(first)) return true;
    }

    if (relPath.startsWith("z.automazioni/")) {
        const first = relPath.slice("z.automazioni/".length).split("/")[0];
        if (EXCLUDED_AUTOMAZIONI.has(first)) return true;
    }

    if (relPath === "z.modelli/README.md" || relPath === "z.bacheche/README.md") return true;

    return false;
}

function copyDir(source, target, base = source) {
    fs.mkdirSync(target, { recursive: true });

    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        const sourcePath = path.join(source, entry.name);
        const relPath = path.relative(base, sourcePath).replace(/\\/g, "/");
        const targetPath = path.join(target, entry.name);

        if (shouldSkip(relPath, entry)) continue;

        if (entry.isDirectory()) {
            copyDir(sourcePath, targetPath, base);
        } else if (entry.isFile()) {
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}

function writeUserReadme() {
    const note = [
        "# Vault GDR",
        "",
        "Questa cartella contiene il vault pronto per l'utente finale.",
        "",
        "Apri questa cartella in Obsidian come vault e parti da `Inizia Qui.md`.",
        "",
        "## Cosa Include",
        "",
        "- dashboard operative per preparazione, sessione, post-sessione e worldbuilding;",
        "- `Vista Giocatori` per recap, handout, mappe pubbliche e materiale condivisibile;",
        "- `Party Control` per PG, HP, missioni, inventario e flags;",
        "- `Quality Report` per copertura, buchi operativi e controllo anti-segreti;",
        "- atlante, mappe, template, automazioni e plugin abilitati necessari ai pulsanti;",
        "- SRD 5.2.1 italiano come modulo regolamentare separato.",
        "",
        "## Primo Avvio",
        "",
        "1. Apri Obsidian.",
        "2. Scegli `Apri cartella come vault`.",
        "3. Se Obsidian chiede conferma per gli strumenti inclusi, abilitali solo se hai scaricato il vault dalla release ufficiale.",
        "4. Apri `Inizia Qui.md`.",
        "5. Apri `Risorse/Setup Guidato.md` per controllare plugin, pulsanti e dashboard.",
        "",
        "## Cosa Non Include",
        "",
        "Questa copia non include materiali di sviluppo repository, issue template GitHub, roadmap interne, script CLI di import/release o plugin non abilitati.",
        ""
    ].join("\n");
    fs.writeFileSync(path.join(OUT, "LEGGIMI.md"), note);
}

function zipIfAvailable() {
    try {
        if (fs.existsSync(ZIP)) fs.rmSync(ZIP);
        execFileSync("zip", ["-qr", ZIP, "vault-gdr-clean"], { cwd: DIST, stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
copyDir(ROOT, OUT, ROOT);
writeUserReadme();

const zipped = zipIfAvailable();
console.log(`Release utente creata: ${rel(OUT)}`);
if (zipped) {
    console.log(`Zip utente creato: ${rel(ZIP)}`);
} else {
    console.log("Zip utente non creato: comando zip non disponibile.");
}
