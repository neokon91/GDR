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
    "La release utente include gia snippet, tema e configurazioni principali.",
    "Il repository sorgente non traccia `SRD/`, `z.bases/`, `z.fileclass/`, `z.bacheche/`, `z.modelli/` o i JSON generati",
    "Non e una app standalone e non e un rules engine completo",
    "La release senza demo si crea con `npm run release:clean`; quella con demo si crea con:",
    "npm run release:demo",
    "Demo Regno Di Prova.md"
]);

const release = requireText("Dev/RELEASE.md", [
    "npm run release:clean",
    "npm run release:demo",
    "Il percorso consegnabile e `npm run release:demo`",
    "Non promettere che lo ZIP sia una app standalone, un rules engine completo o una ripubblicazione del regolamento 5.5e",
    "rigenerato nella release",
    "dist/vault-gdr-clean.zip",
    "Demo Regno Di Prova.md"
]);

requireText("Dev/Sviluppo Vault.md", [
    "`SRD/` non e sorgente tracciato",
    "Le note di porting private non sono documentazione stabile del repository",
    "`z.bacheche`: bacheche Kanban per preparazione e creature, generate da `Dev/TemplateFactory/modules/bacheche.yaml`"
]);

const smokeDemo = requireText("Dev/Smoke Demo Finale.md", [
    "Per una release consegnabile con demo usa `npm run release:demo`",
    "Percorso normale per la release demo",
    "generate:demo-world",
    "npm run check:demo-contract",
    "Il check `npm run check:demo-contract` genera la demo in una cartella temporanea"
]);

requireText("Dev/TemplateFactory/tools/release_clean.js", [
    "Risorse/Regione Giocabile.md",
    "Non e una app standalone, non e un rules engine completo"
]);

const license = requireText("LICENSE.md", [
    "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International",
    "Eccezione Per Il Materiale SRD",
    "CC-BY-4.0"
]);

const packageJson = readJson(repoPath(ROOT, "package.json"), {});
if (!packageJson.scripts?.["release:demo"]) {
    errors.push("package.json: script release:demo mancante");
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
    ["Dev/RELEASE.md", release],
    ["Dev/Smoke Demo Finale.md", smokeDemo]
]) {
    if (text.includes("Demo Brumafonda.md")) {
        errors.push(`${relPath}: riferimento obsoleto a Demo Brumafonda.md`);
    }
    if (text.includes("Attiva `gdr-vault`") && relPath === "README.md" && !text.includes("Normalmente non devi configurare nulla")) {
        errors.push("README.md: snippet presentato come setup obbligatorio invece che recupero");
    }
}

if (readme.includes("generate:demo-world")) {
    errors.push("README.md: non deve esporre generate:demo-world come percorso utente o release");
}
if (release.includes("generate:demo-world") && !release.includes("solo uno strumento interno di manutenzione")) {
    errors.push("Dev/RELEASE.md: generate:demo-world citato senza chiarire che e solo manutenzione interna");
}
if (smokeDemo.includes("generate:demo-world") && !smokeDemo.includes("Per debug del solo generatore")) {
    errors.push("Dev/Smoke Demo Finale.md: generate:demo-world citato senza separarlo dal percorso release:demo");
}
for (const [relPath, text] of [
    ["README.md", readme],
    ["Dev/RELEASE.md", release],
    ["Dev/Smoke Demo Finale.md", smokeDemo]
]) {
    for (const marker of [
        "genera la demo dopo `npm run release:clean`",
        "Va generata da script dentro `dist/` dopo la creazione della release pulita",
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
    ["Dev/Smoke Demo Finale.md", smokeDemo],
    ["Dev/Sviluppo Vault.md", readTextRel(ROOT, "Dev/Sviluppo Vault.md", "")],
    ["LICENSE.md", license],
    ["Dev/TemplateFactory/README.md", readTextRel(ROOT, "Dev/TemplateFactory/README.md", "")]
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
    if (/`BUTTON\[[^\]\n]+\]`/.test(text)) {
        errors.push(`${relPath}: espone sintassi Meta Bind BUTTON[...] come testo visibile`);
    }
}

for (const relPath of [
    "Dev/TemplateFactory/modules/root_pages.yaml",
    "Dev/TemplateFactory/modules/hub_pages.yaml",
    "Dev/TemplateFactory/modules/resource_support_pages.yaml"
]) {
    const text = readTextRel(ROOT, relPath, "");
    if (/`BUTTON\[[^\]\n]+\]`/.test(text)) {
        errors.push(`${relPath}: sorgente pagina contiene BUTTON[...] visibile invece di workflow:button`);
    }
}

if (errors.length) {
    console.error("Documentazione non coerente:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Documentazione OK: README, release e demo allineati.");
