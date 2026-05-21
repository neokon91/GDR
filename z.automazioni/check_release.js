#!/usr/bin/env node

const { readTextRel } = require("./node_utils");

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
const RELEASE_IMPORT_DOC_MARKERS = [
    "npm run import:azgaar",
    "npm run import:watabou:city",
    "npm run import:watabou:dungeon"
];
const RELEASE_HANDOFF_MARKERS = [
    "Warning noti: **nessuno**",
    "M8 Release Evidence And Zero-Warning Discipline",
    "disciplina zero-warning",
    "`npm run check` deve restare senza warning"
];

const errors = [];

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

const cleanReleaseText = readTextRel(ROOT, "Dev/Release Pulita.md");
for (const marker of RELEASE_VERIFICATION_MARKERS) {
    if (!cleanReleaseText.includes(marker)) {
        errors.push(`Dev/Release Pulita.md: verifica release mancante (${marker})`);
    }
}

const importGuideText = readTextRel(ROOT, "Risorse/Importare Mappe.md");
for (const marker of RELEASE_IMPORT_DOC_MARKERS) {
    if (!importGuideText.includes(marker)) {
        errors.push(`Risorse/Importare Mappe.md: comando import mancante (${marker})`);
    }
}

const handoffText = readTextRel(ROOT, "Dev/NEXT_PHASE_HANDOFF.md");
for (const marker of RELEASE_HANDOFF_MARKERS) {
    if (!handoffText.includes(marker)) {
        errors.push(`Dev/NEXT_PHASE_HANDOFF.md: handoff M8 obsoleto o incompleto (${marker})`);
    }
}
if (/Warning noti:\s*\n\s*-/i.test(handoffText)) {
    errors.push("Dev/NEXT_PHASE_HANDOFF.md: non deve elencare warning noti dopo la disciplina zero-warning");
}

const releaseCleanText = readTextRel(ROOT, "z.automazioni/release_clean.js");
if (!releaseCleanText.includes('"Import"')) {
    errors.push("release_clean.js: la cartella Import deve restare fuori dalla release utente");
}
if (!releaseCleanText.includes("render_template_factory.py") || !releaseCleanText.includes("--materialize-only")) {
    errors.push("release_clean.js: la release deve materializzare z.modelli da TemplateFactory prima della copia");
}
if (!releaseCleanText.includes("REQUIRED_USER_IGNORE_FILTERS") || !releaseCleanText.includes("z.automazioni/") || !releaseCleanText.includes("SRD/")) {
    errors.push("release_clean.js: la release deve verificare i filtri di navigazione per cartelle tecniche e SRD");
}

if (errors.length) {
    console.error("Errori release:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Release OK: versione ${RELEASE_EXPECTED_VERSION}, data ${RELEASE_EXPECTED_DATE}, changelog e verifica release allineati.`);
