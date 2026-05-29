#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const IMPORTER = path.join(ROOT, "Dev", "Tools", "node-legacy", "import_srd.js");
const source = fs.readFileSync(IMPORTER, "utf8");
const errors = [];

function matchConst(name) {
    const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*"([^"]+)"`));
    return match ? match[1] : "";
}

const repository = matchConst("SOURCE_REPOSITORY");
const ref = matchConst("SOURCE_REF");
const version = matchConst("VERSION");

if (repository !== "neokon91/DND-SRD-IT") {
    errors.push(`SOURCE_REPOSITORY inatteso: ${repository || "(mancante)"}`);
}

if (!/^[0-9a-f]{40}$/i.test(ref)) {
    errors.push(`SOURCE_REF deve essere un commit SHA da 40 caratteri, non ${ref || "(mancante)"}`);
}

if (["main", "master"].includes(ref)) {
    errors.push("SOURCE_REF non deve puntare a branch mobile main/master");
}

if (version !== "5.2.1") {
    errors.push(`VERSION SRD inattesa: ${version || "(mancante)"}`);
}

if (/raw\.githubusercontent\.com\/neokon91\/DND-SRD-IT\/(?:main|master)(?:\/|["'`])/.test(source)) {
    errors.push("import_srd.js non deve usare raw.githubusercontent.com con branch mobile main/master");
}

if (!source.includes("validateSourcePin();")) {
    errors.push("import_srd.js deve validare SOURCE_REF a runtime");
}

if (errors.length) {
    console.error("SRD import source non riproducibile:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`SRD import source OK: ${repository}@${ref.slice(0, 12)} (${version}).`);
