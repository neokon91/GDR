#!/usr/bin/env node

const { execFileSync } = require("child_process");
const path = require("path");
const { readTextRel } = require("./node_utils");
const { loadReleaseBoundary } = require("./release_boundary_utils");

const ROOT = process.cwd();
const RELEASE_EXPECTED_VERSION = "1.0.1";
const RELEASE_EXPECTED_DATE = "2026-05-29";
const RELEASE_CHANGELOG_MARKERS = [
    "Release finale pulita",
    "entity_model.yaml",
    "TemplateFactory ora copre",
    "Calendarium e selezionabile",
    "smistamento -> canonizzazione",
    "dist/vault-gdr-clean.zip"
];
const RELEASE_DOC_MARKERS = [
    "npm run release:final",
    "npm run release:clean",
    "Il percorso consegnabile standard e `npm run release:final`",
    "Non promettere che lo ZIP sia una app standalone",
    "Apri lo ZIP in Obsidian e fai lo smoke manuale"
];
const RELEASE_IMPORT_DOC_MARKERS = [
    "npm run import:map",
    "npm run import:azgaar",
    "npm run import:watabou:city",
    "npm run import:watabou:dungeon"
];
const errors = [];
const releaseBoundary = loadReleaseBoundary(ROOT);
const copyPolicy = releaseBoundary.copy_policy ?? {};

const versionText = readTextRel(ROOT, "VERSION.md");
if (!versionText.includes(`Versione: \`${RELEASE_EXPECTED_VERSION}\``)) {
    errors.push(`VERSION.md: versione attesa ${RELEASE_EXPECTED_VERSION}`);
}
if (!versionText.includes(`Data: ${RELEASE_EXPECTED_DATE}`)) {
    errors.push(`VERSION.md: data attesa ${RELEASE_EXPECTED_DATE}`);
}

const changelogText = readTextRel(ROOT, "Dev/CHANGELOG.md");
for (const marker of RELEASE_CHANGELOG_MARKERS) {
    if (!changelogText.includes(marker)) {
        errors.push(`Dev/CHANGELOG.md: marker release mancante (${marker})`);
    }
}

const releaseDocText = readTextRel(ROOT, "Dev/RELEASE.md");
for (const marker of RELEASE_DOC_MARKERS) {
    if (!releaseDocText.includes(marker)) {
        errors.push(`Dev/RELEASE.md: documentazione release incompleta (${marker})`);
    }
}

const importGuideText = `${readTextRel(ROOT, "Dev/Source/YAML/json/import_maps_cockpit.yaml")}\n${readTextRel(ROOT, "Risorse/Importare Mappe.md")}`;
for (const marker of RELEASE_IMPORT_DOC_MARKERS) {
    if (!importGuideText.includes(marker)) {
        errors.push(`import_maps_cockpit.yaml: comando import mancante (${marker})`);
    }
}

const releaseCleanText = readTextRel(ROOT, "Dev/Tools/node-legacy/release_clean.js");
if (!(copyPolicy.excluded_dirs ?? []).includes("Import")) {
    errors.push("release_boundary.copy_policy.excluded_dirs: la cartella Import deve restare fuori dalla release utente");
}
if (!releaseCleanText.includes("render_template_factory.py") || !releaseCleanText.includes("--materialize-only")) {
    errors.push("release_clean.js: la release deve materializzare z.modelli da TemplateFactory prima della copia");
}
const userIgnoreFilters = new Set(copyPolicy.required_user_ignore_filters ?? []);
for (const filter of ["SRD/", "z.automazioni/"]) {
    if (!userIgnoreFilters.has(filter)) {
        errors.push(`release_boundary.copy_policy.required_user_ignore_filters: filtro mancante ${filter}`);
    }
}

if (errors.length) {
    console.error("Errori release:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Release OK: versione ${RELEASE_EXPECTED_VERSION}, data ${RELEASE_EXPECTED_DATE}, changelog e verifica release allineati.`);
