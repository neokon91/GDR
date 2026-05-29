#!/usr/bin/env node

const { execFileSync } = require("child_process");
const path = require("path");
const { readTextRel } = require("./node_utils");
const { loadReleaseBoundary } = require("./release_boundary_utils");

const ROOT = process.cwd();
const NAMING_CONTRACT_SOURCE = "Dev/TemplateFactory/modules/naming_contract.yaml";
const RELEASE_EXPECTED_VERSION = "1.0.0";
const RELEASE_EXPECTED_DATE = "2026-05-21";
const RELEASE_CHANGELOG_MARKERS = [
    "[[Dev/Smoke Demo Finale]]",
    "Gate statico M3",
    "TemplateFactory ora copre",
    "Calendarium e selezionabile",
    "smistamento -> canonizzazione",
    "dist/vault-gdr-clean.zip"
];
const RELEASE_DOC_MARKERS = [
    "npm run release:clean",
    "npm run release:demo",
    "Il percorso consegnabile e `npm run release:demo`",
    "Non promettere che lo ZIP sia una app standalone",
    "Apri lo ZIP in Obsidian e fai lo smoke manuale"
];
const RELEASE_IMPORT_DOC_MARKERS = [
    "npm run import:map",
    "npm run import:azgaar",
    "npm run import:watabou:city",
    "npm run import:watabou:dungeon"
];
const RELEASE_ROADMAP_MARKERS = [
    "Questa e la roadmap attiva di chiusura release",
    "## Definition Of Done 1.0",
    "## Gap Bloccanti",
    "Audit visuale Obsidian",
    "Feedback giocabilita nelle dashboard",
    "Taxonomy gate SRD/D&D",
    "Pulizia controllata `z.automazioni`",
    "## Fuori Scope 1.0"
];

const errors = [];
const releaseBoundary = loadReleaseBoundary(ROOT);
const copyPolicy = releaseBoundary.copy_policy ?? {};

function loadYamlModule(relPath) {
    try {
        const script = [
            "import json, sys, yaml",
            "with open(sys.argv[1], encoding='utf-8') as handle:",
            "    data = yaml.safe_load(handle) or {}",
            "print(json.dumps(data, ensure_ascii=False))"
        ].join("\n");
        const stdout = execFileSync("python3", ["-c", script, path.join(ROOT, relPath)], {
            encoding: "utf8",
            maxBuffer: 4 * 1024 * 1024
        });
        return JSON.parse(stdout);
    } catch (error) {
        errors.push(`${relPath}: YAML non leggibile (${error.message})`);
        return {};
    }
}

const namingContract = loadYamlModule(NAMING_CONTRACT_SOURCE);

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

const importGuideText = `${readTextRel(ROOT, "Dev/TemplateFactory/modules/import_maps_cockpit.yaml")}\n${readTextRel(ROOT, "Risorse/Importare Mappe.md")}`;
for (const marker of RELEASE_IMPORT_DOC_MARKERS) {
    if (!importGuideText.includes(marker)) {
        errors.push(`import_maps_cockpit.yaml: comando import mancante (${marker})`);
    }
}

const roadmapText = readTextRel(ROOT, "Dev/Roadmap/1.0 Professionale.md");
for (const marker of RELEASE_ROADMAP_MARKERS) {
    if (!roadmapText.includes(marker)) {
        errors.push(`Dev/Roadmap/1.0 Professionale.md: roadmap chiusura release incompleta (${marker})`);
    }
}
for (const obsolete of namingContract.release_cleanup?.obsolete_roadmap_titles ?? []) {
    if (roadmapText.includes(obsolete)) {
        errors.push(`Dev/Roadmap/1.0 Professionale.md: marker roadmap storico rimasto (${obsolete})`);
    }
}

const releaseCleanText = readTextRel(ROOT, "Dev/TemplateFactory/tools/release_clean.js");
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
