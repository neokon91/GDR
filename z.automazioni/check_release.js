#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const RELEASE_EXPECTED_VERSION = "1.0.0";
const RELEASE_EXPECTED_DATE = "2026-05-21";
const RELEASE_CHANGELOG_MARKERS = [
    "Demo Brumafonda.md",
    "[[Dev/Smoke Demo Finale]]",
    "Gate statico M3",
    "TemplateFactory ora copre",
    "Calendarium e selezionabile",
    "smistamento -> canonizzazione",
    "dist/vault-gdr-clean.zip"
];
const RELEASE_VERIFICATION_MARKERS = [
    "## Ultima Verifica Automatica",
    RELEASE_EXPECTED_DATE,
    "`npm run check` passato senza warning",
    "`npm run release:clean` ha creato `dist/vault-gdr-clean`",
    "`npm run release:clean` ha creato `dist/vault-gdr-clean.zip`",
    "`dist/` resta artefatto locale ignorato da Git"
];

const errors = [];

function readIfExists(relPath) {
    const fullPath = path.join(ROOT, relPath);
    return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : "";
}

const versionText = readIfExists("VERSION.md");
if (!versionText.includes(`Versione: \`${RELEASE_EXPECTED_VERSION}\``)) {
    errors.push(`VERSION.md: versione attesa ${RELEASE_EXPECTED_VERSION}`);
}
if (!versionText.includes(`Data: ${RELEASE_EXPECTED_DATE}`)) {
    errors.push(`VERSION.md: data attesa ${RELEASE_EXPECTED_DATE}`);
}

const changelogText = readIfExists("Dev/CHANGELOG.md");
for (const marker of RELEASE_CHANGELOG_MARKERS) {
    if (!changelogText.includes(marker)) {
        errors.push(`Dev/CHANGELOG.md: marker release mancante (${marker})`);
    }
}

const cleanReleaseText = readIfExists("Dev/Release Pulita.md");
for (const marker of RELEASE_VERIFICATION_MARKERS) {
    if (!cleanReleaseText.includes(marker)) {
        errors.push(`Dev/Release Pulita.md: verifica release mancante (${marker})`);
    }
}

if (errors.length) {
    console.error("Errori release:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Release OK: versione ${RELEASE_EXPECTED_VERSION}, data ${RELEASE_EXPECTED_DATE}, changelog e verifica release allineati.`);
