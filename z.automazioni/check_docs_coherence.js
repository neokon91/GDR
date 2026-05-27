#!/usr/bin/env node

const { readJson, readTextRel, repoPath } = require("./node_utils");
const { execFileSync } = require("child_process");

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
    "npm run release:demo",
    "Demo Regno Di Prova.md"
]);

const release = requireText("Dev/RELEASE.md", [
    "npm run release:clean",
    "npm run release:demo",
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
    "generate:demo-world",
    "npm run check:demo-contract",
    "Il check `npm run check:demo-contract` genera la demo in una cartella temporanea"
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

for (const [relPath, text] of [
    ["README.md", readme],
    ["Dev/RELEASE.md", release],
    ["Dev/Smoke Demo Finale.md", smokeDemo],
    ["Dev/Sviluppo Vault.md", readTextRel(ROOT, "Dev/Sviluppo Vault.md", "")]
]) {
    for (const marker of [
        "docs/",
        "SRD/` resta versionato",
        "Lo SRD e **versionato nel repository**",
        "Un clone **senza** cartella SRD non e ancora supportato",
        "source_lab:",
        "FANTASYWORLD_INTEGRATION"
    ]) {
        if (text.includes(marker)) {
            errors.push(`${relPath}: riferimento documentale obsoleto (${marker})`);
        }
    }
}

if (errors.length) {
    console.error("Documentazione non coerente:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Documentazione OK: README, release e demo allineati.");
