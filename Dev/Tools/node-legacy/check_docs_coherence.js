#!/usr/bin/env node

const { readJson, readTextRel, repoPath } = require("./node_utils");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const errors = [];

function requireText(relPath, markers) {
    const text = readTextRel(ROOT, relPath, null);
    if (text === null) {
        errors.push(`Documentazione mancante: ${relPath}`);
        return "";
    }
    for (const marker of markers) {
        if (!text.includes(marker)) {
            errors.push(`${relPath}: marker documentazione mancante (${marker})`);
        }
    }
    return text;
}

const readme = requireText("README.md", [
    "La release utente include lo snippet, le configurazioni principali",
    "Il repository sorgente non traccia `SRD/`, `z.bases/`, `z.fileclass/`, `z.bacheche/`, `z.modelli/` o i JSON generati",
    "Non e una app standalone e non e un rules engine completo",
    "Release finale",
    "npm run release:final"
]);

const release = requireText("Dev/RELEASE.md", [
    "npm run release:final",
    "npm run release:clean",
    "Il percorso consegnabile standard e `npm run release:final`",
    "Non promettere che lo ZIP sia una app standalone, un rules engine completo o una ripubblicazione del regolamento 5.5e",
    "rigenerato nella release",
    "dist/vault-gdr-clean.zip"
]);

requireText("Dev/Sviluppo Vault.md", [
    "`SRD/` non e sorgente tracciato",
    "Le note di porting private non sono documentazione stabile del repository",
    "`z.bacheche`: bacheche Kanban per preparazione e creature, generate da `Dev/Source/YAML/render/bacheche.yaml`"
]);

requireText("Dev/Tools/node-legacy/release_clean.js", [
    "Risorse/Regione Giocabile.md",
    "Non e una app standalone, non e un rules engine completo"
]);

const license = requireText("LICENSE.md", [
    "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International",
    "Eccezione Per Il Materiale SRD",
    "CC-BY-4.0"
]);

const packageJson = readJson(repoPath(ROOT, "package.json"), {});
if (!packageJson.scripts?.["release:final"]) {
    errors.push("package.json: script release:final mancante");
}
if (!packageJson.scripts?.check?.includes("npm run check:docs")) {
    errors.push("package.json: npm run check non esegue check:docs");
}

const trackedDocs = execFileSync("git", ["ls-files", "docs"], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
if (trackedDocs.length) {
    errors.push(`docs/: documentazione sciolta ancora tracciata (${trackedDocs.join(", ")})`);
}
if (fs.existsSync(repoPath(ROOT, "Dev/Release Pulita.md"))) {
    errors.push("Dev/Release Pulita.md: documento duplicato/obsoleto, usare Dev/RELEASE.md");
}

for (const [relPath, text] of [
    ["README.md", readme],
    ["Dev/RELEASE.md", release]
]) {
    if (text.includes("Attiva `gdr-vault`") && relPath === "README.md" && !text.includes("Normalmente non devi configurare nulla")) {
        errors.push("README.md: snippet presentato come setup obbligatorio invece che recupero");
    }
}

for (const [relPath, text] of [
    ["README.md", readme],
    ["Dev/RELEASE.md", release]
]) {
    for (const marker of [
        "## Primi 5 Minuti",
        "D&D 5.5/SRD"
    ]) {
        if (text.includes(marker)) {
            errors.push(`${relPath}: formulazione documentale fuorviante (${marker})`);
        }
    }
}

const firstStartSection = readme.match(/## Primo Avvio In 5 Minuti\s+([\s\S]*?)\n## /);
if (!firstStartSection) {
    errors.push("README.md: sezione Primo Avvio In 5 Minuti mancante");
} else {
    const firstStartSteps = firstStartSection[1].match(/^\d+\. /gm) ?? [];
    if (firstStartSteps.length > 5) {
        errors.push(`README.md: Primo Avvio In 5 Minuti contiene ${firstStartSteps.length} passi invece di massimo 5`);
    }
}

for (const [relPath, text] of [
    ["README.md", readme],
    ["Dev/RELEASE.md", release],
    ["Dev/Sviluppo Vault.md", readTextRel(ROOT, "Dev/Sviluppo Vault.md", "")],
    ["LICENSE.md", license],
    ["Dev/Source/README.md", readTextRel(ROOT, "Dev/Source/README.md", "")]
]) {
    for (const marker of [
        "docs/",
        "SRD/` resta versionato",
        "Lo SRD e **versionato nel repository**",
        "Un clone **senza** cartella SRD non e ancora supportato",
        "source_lab:",
        "FantasyWorld",
        "FANTASYWORLD_INTEGRATION"
    ]) {
        if (text.includes(marker)) {
            errors.push(`${relPath}: riferimento documentale obsoleto (${marker})`);
        }
    }
}

function walkMarkdown(relPath, files = []) {
    const fullPath = repoPath(ROOT, relPath);
    if (!fs.existsSync(fullPath)) return files;
    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
        if (relPath.endsWith(".md")) files.push(relPath);
        return files;
    }
    for (const entry of fs.readdirSync(fullPath, { withFileTypes: true })) {
        walkMarkdown(path.posix.join(relPath, entry.name), files);
    }
    return files;
}

for (const relPath of [
    "Inizia Qui.md",
    ...walkMarkdown("Hub"),
    ...walkMarkdown("Risorse"),
    ...walkMarkdown("z.bacheche")
]) {
    const text = readTextRel(ROOT, relPath, "");
    if (/(^|[^`])BUTTON\[[^\]\n]+\](?!`)/.test(text)) {
        errors.push(`${relPath}: espone BUTTON[...] senza inline code Meta Bind`);
    }
}

for (const relPath of [
    "Dev/Source/YAML/render/root_pages.yaml",
    "Dev/Source/YAML/render/hub_pages.yaml",
    "Dev/Source/YAML/render/resource_support_pages.yaml"
]) {
    const text = readTextRel(ROOT, relPath, "");
    if (/`BUTTON\[[^\]\n]+\]`|(^|[^`])BUTTON\[[^\]\n]+\](?!`)/.test(text)) {
        errors.push(`${relPath}: sorgente pagina contiene BUTTON[...] invece di workflow:button`);
    }
}

for (const [relPath, text] of [
    ["README.md", readme],
    ["Dev/RELEASE.md", release],
    ["Dev/Sviluppo Vault.md", readTextRel(ROOT, "Dev/Sviluppo Vault.md", "")]
]) {
    if (/demo/i.test(text)) {
        errors.push(`${relPath}: riferimento demo non ammesso`);
    }
}

if (errors.length) {
    console.error("Documentazione non coerente:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Documentazione OK: README e release allineati.");
