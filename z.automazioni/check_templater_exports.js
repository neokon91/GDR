#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { readJson, readTextRel, repoPath, walk } = require("./node_utils");

const ROOT = process.cwd();
const TEMPLATER_DIR = "z.automazioni/templater";
const errors = [];

function fail(message) {
    errors.push(message);
}

function rel(file) {
    return path.relative(ROOT, file).replace(/\\/g, "/");
}

const templaterConfig = readJson(repoPath(ROOT, ".obsidian/plugins/templater-obsidian/data.json"), {});
if (templaterConfig.user_scripts_folder !== TEMPLATER_DIR) {
    fail(`Templater: user_scripts_folder deve puntare a ${TEMPLATER_DIR}, non a ${templaterConfig.user_scripts_folder}`);
}

const templaterRoot = repoPath(ROOT, TEMPLATER_DIR);
if (!fs.existsSync(templaterRoot)) {
    fail(`Cartella Templater mancante: ${TEMPLATER_DIR}`);
}

const wrappers = fs.existsSync(templaterRoot)
    ? walk(templaterRoot, { predicate: file => file.endsWith(".js") })
    : [];
const wrapperNames = new Set(wrappers.map(file => path.basename(file, ".js")));

for (const file of wrappers) {
    const fileRel = rel(file);
    const source = fs.readFileSync(file, "utf8");
    if (!/module\.exports\s*=/.test(source)) {
        fail(`${fileRel}: wrapper senza module.exports`);
        continue;
    }
    try {
        delete require.cache[require.resolve(file)];
        const exported = require(file);
        if (typeof exported !== "function") {
            fail(`${fileRel}: Templater accetta solo export funzione, trovato ${typeof exported}`);
        }
    } catch (error) {
        fail(`${fileRel}: import fallito (${error.message})`);
    }
}

for (const file of walk(repoPath(ROOT, "z.modelli"), { predicate: file => file.endsWith(".md") })) {
    const fileRel = rel(file);
    const text = readTextRel(ROOT, fileRel, "");
    for (const match of text.matchAll(/tp\.user\.([A-Za-z0-9_]+)/g)) {
        const helper = match[1];
        if (!wrapperNames.has(helper)) {
            fail(`${fileRel}: tp.user.${helper} senza wrapper in ${TEMPLATER_DIR}/${helper}.js`);
        }
    }
}

for (const file of walk(repoPath(ROOT, "z.automazioni"), { predicate: file => file.endsWith(".js") })) {
    const fileRel = rel(file);
    if (fileRel.startsWith(`${TEMPLATER_DIR}/`)) continue;
    if (fileRel.includes("/checks/")) continue;
    const base = path.basename(file, ".js");
    if (wrapperNames.has(base)) continue;
    const source = fs.readFileSync(file, "utf8");
    if (/module\.exports\s*=\s*\{/.test(source)) {
        // Questi moduli sono permessi come runtime interno: Templater non deve scansionarli direttamente.
        continue;
    }
}

if (errors.length) {
    console.error("Templater exports non validi:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Templater exports OK: ${wrappers.length} wrapper funzione in ${TEMPLATER_DIR}.`);
