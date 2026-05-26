#!/usr/bin/env node

const fs = require("fs");
const { readJson, readTextRel, repoPath } = require("./node_utils");

const ROOT = process.cwd();
const SOURCE_FILE = "Dev/plugin_official_sources.json";
const AUDIT_FILE = "Dev/Plugin Official Audit.md";
const errors = [];

function fail(message) {
    errors.push(message);
}

function existsRel(relPath) {
    return fs.existsSync(repoPath(ROOT, relPath));
}

const communityPlugins = readJson(repoPath(ROOT, ".obsidian/community-plugins.json"), []);
const sourceContract = readJson(repoPath(ROOT, SOURCE_FILE), {});
const plugins = Array.isArray(sourceContract.plugins) ? sourceContract.plugins : [];
const byId = new Map(plugins.map(plugin => [plugin.id, plugin]));
const auditText = readTextRel(ROOT, AUDIT_FILE, "");

if (!sourceContract.generated_from?.includes("obsidianmd/obsidian-releases")) {
    fail(`${SOURCE_FILE}: fonte directory ufficiale Obsidian mancante`);
}
if (!sourceContract.checked_at) {
    fail(`${SOURCE_FILE}: checked_at mancante`);
}

for (const id of communityPlugins) {
    const record = byId.get(id);
    if (!record) {
        fail(`${SOURCE_FILE}: plugin abilitato senza record ufficiale (${id})`);
        continue;
    }

    const manifest = readJson(repoPath(ROOT, `.obsidian/plugins/${id}/manifest.json`), {});
    if (record.name !== manifest.name) fail(`${SOURCE_FILE}: ${id} name non coincide con manifest locale`);
    if (record.version !== manifest.version) fail(`${SOURCE_FILE}: ${id} version non coincide con manifest locale`);
    if (!record.community_repo) fail(`${SOURCE_FILE}: ${id} senza repo community ufficiale`);

    const sources = record.official_sources ?? [];
    if (!sources.some(url => url.includes("obsidianmd/obsidian-releases"))) {
        fail(`${SOURCE_FILE}: ${id} senza fonte directory Obsidian`);
    }
    if (!sources.some(url => record.community_repo && url.includes(record.community_repo))) {
        fail(`${SOURCE_FILE}: ${id} senza repository ufficiale dichiarato`);
    }
    if (sources.length < 2) fail(`${SOURCE_FILE}: ${id} fonti ufficiali insufficienti`);

    for (const localFile of record.local_config_files ?? []) {
        if (!existsRel(localFile)) fail(`${SOURCE_FILE}: ${id} file locale dichiarato ma mancante (${localFile})`);
    }

    if (!Array.isArray(record.local_usage_checked) || record.local_usage_checked.length === 0) {
        fail(`${SOURCE_FILE}: ${id} senza uso locale verificato`);
    }
    if (record.audit_status !== "verificato_da_fonti_ufficiali") {
        fail(`${SOURCE_FILE}: ${id} audit_status non verificato`);
    }
    if (!auditText.includes(`\`${id}\``)) {
        fail(`${AUDIT_FILE}: manca sezione o riga audit per ${id}`);
    }
}

for (const record of plugins) {
    if (!communityPlugins.includes(record.id)) {
        fail(`${SOURCE_FILE}: record per plugin non abilitato (${record.id})`);
    }
}

for (const marker of [
    "Fonti Primarie Usate",
    "Contratto Di Verifica",
    "Matrice Plugin",
    "Limiti Non Negoziabili"
]) {
    if (!auditText.includes(marker)) fail(`${AUDIT_FILE}: marker mancante (${marker})`);
}

if (errors.length) {
    console.error("Documentazione ufficiale plugin non coerente:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Plugin official docs OK: ${communityPlugins.length} plugin coperti da fonti ufficiali e audit locale.`);
