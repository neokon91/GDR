#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const CONTRACT = "Dev/Source/YAML/quality/obsidian_plugin_bundle_contract.yaml";
const OBSIDIAN_CONFIG = "Dev/Source/YAML/json/obsidian_config.yaml";

function repoPath(relPath) {
    return path.join(ROOT, relPath);
}

function loadYaml(relPath) {
    const script = [
        "import json, sys, yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");
    const stdout = execFileSync("python3", ["-c", script, repoPath(relPath)], {
        encoding: "utf8",
        maxBuffer: 8 * 1024 * 1024
    });
    return JSON.parse(stdout);
}

function asStringList(value) {
    return Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : [];
}

function declaredCommunityPlugins(errors) {
    const source = loadYaml(OBSIDIAN_CONFIG);
    const record = (source.configs ?? []).find(item => item?.target === ".obsidian/community-plugins.json");
    if (!record) {
        errors.push(`${OBSIDIAN_CONFIG}: target .obsidian/community-plugins.json mancante`);
        return [];
    }
    const plugins = asStringList(record.data);
    if (plugins.length === 0) errors.push(`${OBSIDIAN_CONFIG}: community-plugins.json dichiarato senza plugin`);
    return plugins;
}

function gitTracked(prefix) {
    const stdout = execFileSync("git", ["ls-files", "--", prefix], {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024
    });
    return stdout
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .filter(relPath => fs.existsSync(repoPath(relPath)));
}

function relFileName(relPath, root) {
    return relPath.slice(`${root}/`.length).split("/").slice(1).join("/");
}

const errors = [];
const contract = loadYaml(CONTRACT);
if (contract.id !== "obsidian_plugin_bundle_contract") {
    errors.push(`${CONTRACT}: id non valido`);
}

const policy = contract.policy ?? {};
const pluginRoot = String(policy.plugin_root ?? ".obsidian/plugins").replace(/\/$/, "");
const themeRoot = String(policy.theme_root ?? ".obsidian/themes").replace(/\/$/, "");
const snippetRoot = String(policy.snippet_root ?? ".obsidian/snippets").replace(/\/$/, "");
const allowedPluginTrackedFiles = new Set(asStringList(policy.allowed_plugin_tracked_files));
const generatedPluginFiles = new Set(asStringList(policy.allowed_plugin_local_generated_files));
const requiredSnippets = new Set(asStringList(contract.snippets?.required));
const allowedSnippetFiles = new Set(asStringList(contract.snippets?.allowed_tracked_files));

const matrixPath = String(contract.plugin_matrix ?? "Dev/Source/YAML/json/plugin_matrix.yaml");
const contractsPath = String(contract.plugin_contracts ?? "Dev/Source/YAML/canonical/plugin_contracts.yaml");
const matrixPlugins = loadYaml(matrixPath).plugins ?? [];
const pluginContracts = loadYaml(contractsPath).plugins ?? [];
const matrixIds = new Set(matrixPlugins.map(plugin => String(plugin.id ?? "").trim()).filter(Boolean));
const contractIds = new Set(pluginContracts.map(plugin => String(plugin.id ?? "").trim()).filter(Boolean));

for (const pluginId of matrixIds) {
    if (!contractIds.has(pluginId)) {
        errors.push(`${pluginId}: plugin_matrix senza plugin_contracts`);
    }
}

const trackedPluginFiles = gitTracked(pluginRoot);
for (const relPath of trackedPluginFiles) {
    const fileName = relFileName(relPath, pluginRoot);
    if (allowedPluginTrackedFiles.has(fileName)) continue;
    errors.push(`${relPath}: bundle/config plugin tracciato ma il repository deve solo dichiarare plugin e generare configurazioni`);
}

const trackedThemeFiles = gitTracked(themeRoot);
for (const relPath of trackedThemeFiles) {
    errors.push(`${relPath}: tema vendorizzato tracciato; usare tema installato localmente o snippet progetto`);
}

const trackedSnippetFiles = gitTracked(snippetRoot);
for (const snippet of requiredSnippets) {
    if (!fs.existsSync(repoPath(`${snippetRoot}/${snippet}`))) {
        errors.push(`${snippet}: snippet richiesto mancante`);
    }
}
for (const relPath of trackedSnippetFiles) {
    const fileName = relPath.slice(`${snippetRoot}/`.length);
    if (!allowedSnippetFiles.has(fileName)) {
        errors.push(`${relPath}: snippet tracciato non ammesso`);
    }
}

const communityPlugins = declaredCommunityPlugins(errors);
const enabled = new Set(communityPlugins.map(pluginId => String(pluginId).trim()).filter(Boolean));
for (const pluginId of enabled) {
    if (!matrixIds.has(pluginId)) errors.push(`${pluginId}: obsidian_config abilita plugin fuori plugin_matrix`);
}
for (const pluginId of matrixIds) {
    if (!enabled.has(pluginId)) errors.push(`${pluginId}: plugin_matrix non dichiarato in obsidian_config community-plugins`);
}

// I bundle locali ignorati sono ammessi: servono al manutentore per collaudo e
// possono essere copiati nella release finale. Il contratto blocca solo file tracciati.

if (errors.length) {
    console.error("Contratto plugin Obsidian non valido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Plugin Obsidian OK: ${matrixIds.size} plugin dichiarati, bundle terzi non tracciati, ${requiredSnippets.size} snippet progetto.`);
