#!/usr/bin/env node

const fs = require("fs");
const { readJson, readTextRel, repoPath } = require("./node_utils");

const ROOT = process.cwd();
const CONTRACT = "Dev/plugin_deep_contract.json";
const STUDY = "Dev/Plugin Deep Study.md";
const errors = [];

function fail(message) {
    errors.push(message);
}

function existsRel(relPath) {
    return fs.existsSync(repoPath(ROOT, relPath));
}

const communityPlugins = readJson(repoPath(ROOT, ".obsidian/community-plugins.json"), []);
const official = readJson(repoPath(ROOT, "Dev/plugin_official_sources.json"), {});
const officialById = new Map((official.plugins ?? []).map(plugin => [plugin.id, plugin]));
const contract = readJson(repoPath(ROOT, CONTRACT), {});
const plugins = Array.isArray(contract.plugins) ? contract.plugins : [];
const byId = new Map(plugins.map(plugin => [plugin.id, plugin]));
const studyText = readTextRel(ROOT, STUDY, "");

if (!contract.policy?.includes("Contratto operativo profondo")) {
    fail(`${CONTRACT}: policy non esplicita`);
}

for (const id of communityPlugins) {
    const record = byId.get(id);
    const source = officialById.get(id);
    if (!record) {
        fail(`${CONTRACT}: plugin abilitato senza contratto profondo (${id})`);
        continue;
    }
    if (!source) {
        fail(`${CONTRACT}: ${id} senza fonte ufficiale collegata`);
        continue;
    }
    if (record.version !== source.version) fail(`${CONTRACT}: ${id} versione diversa da plugin_official_sources.json`);
    if (!Array.isArray(record.official_sources) || record.official_sources.length < 2) {
        fail(`${CONTRACT}: ${id} fonti ufficiali insufficienti`);
    }
    for (const field of ["official_capability", "local_scope", "visible_failure", "release_contract", "manual_smoke"]) {
        if (!String(record[field] ?? "").trim()) fail(`${CONTRACT}: ${id} campo mancante ${field}`);
    }
    if (!Array.isArray(record.gates) || !record.gates.length) {
        fail(`${CONTRACT}: ${id} senza gate`);
    }
    if (!studyText.includes(`\`${id}\``)) {
        fail(`${STUDY}: manca sezione per ${id}`);
    }
}

for (const record of plugins) {
    if (!communityPlugins.includes(record.id)) fail(`${CONTRACT}: record per plugin non abilitato (${record.id})`);
}

for (const required of [
    "Regola Madre",
    "Errore visibile da evitare",
    "Contratto release",
    "Debito Residuo"
]) {
    if (!studyText.includes(required)) fail(`${STUDY}: marker mancante (${required})`);
}

const templater = readJson(repoPath(ROOT, ".obsidian/plugins/templater-obsidian/data.json"), {});
if (templater.user_scripts_folder !== "z.automazioni/templater") {
    fail("Templater: contratto profondo violato, user_scripts_folder non isolato");
}
if (!existsRel("z.automazioni/check_templater_exports.js")) {
    fail("Templater: gate check_templater_exports.js mancante");
}

const dataview = readJson(repoPath(ROOT, ".obsidian/plugins/dataview/data.json"), {});
if (dataview.enableDataviewJs !== true) fail("Dataview: DataviewJS deve restare abilitato");

const tasks = readJson(repoPath(ROOT, ".obsidian/plugins/obsidian-tasks-plugin/data.json"), {});
if (tasks.globalFilter !== "#task") fail("Tasks: globalFilter deve restare #task");

const calendar = readJson(repoPath(ROOT, ".obsidian/plugins/calendarium/data.json"), {});
if ((calendar.calendars ?? []).length !== 1 || calendar.calendars?.[0]?.name !== "Calendario Del Mondo") {
    fail("Calendarium: deve restare un solo calendario neutro");
}

const metaBind = readJson(repoPath(ROOT, ".obsidian/plugins/obsidian-meta-bind-plugin/data.json"), {});
if (metaBind.enableJs !== true || !Array.isArray(metaBind.buttonTemplates) || !Array.isArray(metaBind.inputFieldTemplates)) {
    fail("Meta Bind: config base non valida per BUTTON/INPUT");
}

if (errors.length) {
    console.error("Contratto profondo plugin non valido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Plugin deep contract OK: ${communityPlugins.length} plugin con contratto operativo e gate.`);
