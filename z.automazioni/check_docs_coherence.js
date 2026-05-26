#!/usr/bin/env node

const { readJson, readTextRel, repoPath } = require("./node_utils");

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
    "npm run release:demo",
    "Demo Regno Di Prova.md"
]);

const release = requireText("Dev/RELEASE.md", [
    "npm run release:clean",
    "npm run release:demo",
    "dist/vault-gdr-clean.zip",
    "Demo Regno Di Prova.md"
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

if (errors.length) {
    console.error("Documentazione non coerente:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Documentazione OK: README, release e demo allineati.");
