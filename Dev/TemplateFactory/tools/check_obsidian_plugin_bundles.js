#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const CONTRACT = "Dev/TemplateFactory/modules/obsidian_plugin_bundle_contract.yaml";

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

function readJson(relPath, fallback = null) {
    try {
        return JSON.parse(fs.readFileSync(repoPath(relPath), "utf8"));
    } catch {
        return fallback;
    }
}

function asStringList(value) {
    return Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : [];
}

function gitTracked(prefix) {
    const stdout = execFileSync("git", ["ls-files", "--", prefix], {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024
    });
    return stdout.split(/\r?\n/).filter(Boolean);
}

function listDirs(rootRel) {
    const root = repoPath(rootRel);
    if (!fs.existsSync(root)) return [];
    return fs.readdirSync(root, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();
}

function pluginFileParts(relPath, pluginRoot) {
    const rest = relPath.slice(`${pluginRoot}/`.length);
    const [pluginId, ...fileParts] = rest.split("/");
    return { pluginId, fileName: fileParts.join("/") };
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
const requiredPluginFiles = new Set(asStringList(policy.required_plugin_files));
const allowedPluginTrackedFiles = new Set(asStringList(policy.allowed_plugin_tracked_files));
const generatedPluginFiles = new Set(asStringList(policy.allowed_plugin_local_generated_files));
const requiredThemes = new Set(asStringList(contract.themes?.required));
const allowedThemeFiles = new Set(asStringList(contract.themes?.allowed_tracked_files));
const requiredSnippets = new Set(asStringList(contract.snippets?.required));
const allowedSnippetFiles = new Set(asStringList(contract.snippets?.allowed_tracked_files));

if (!allowedPluginTrackedFiles.size) errors.push(`${CONTRACT}: policy.allowed_plugin_tracked_files vuoto`);
if (!requiredPluginFiles.size) errors.push(`${CONTRACT}: policy.required_plugin_files vuoto`);

const matrixPath = String(contract.plugin_matrix ?? "Dev/TemplateFactory/modules/plugin_matrix.yaml");
const contractsPath = String(contract.plugin_contracts ?? "Dev/TemplateFactory/modules/plugin_contracts.yaml");
const matrixPlugins = loadYaml(matrixPath).plugins ?? [];
const pluginContracts = loadYaml(contractsPath).plugins ?? [];
const matrixIds = new Set(matrixPlugins.map(plugin => String(plugin.id ?? "").trim()).filter(Boolean));
const contractById = new Map(pluginContracts.map(plugin => [String(plugin.id ?? "").trim(), plugin]));

const pluginDirs = new Set(listDirs(pluginRoot));
const trackedPluginFiles = gitTracked(pluginRoot);
const trackedThemeFiles = gitTracked(themeRoot);
const trackedSnippetFiles = gitTracked(snippetRoot);

if (policy.require_all_matrix_plugins_vendored !== false) {
    for (const pluginId of matrixIds) {
        if (!pluginDirs.has(pluginId)) errors.push(`${pluginId}: plugin dichiarato in plugin_matrix ma bundle mancante in ${pluginRoot}`);
    }
}

for (const pluginId of pluginDirs) {
    if (!matrixIds.has(pluginId)) {
        errors.push(`${pluginId}: bundle plugin presente ma assente da plugin_matrix`);
        continue;
    }

    for (const requiredFile of requiredPluginFiles) {
        if (!fs.existsSync(repoPath(`${pluginRoot}/${pluginId}/${requiredFile}`))) {
            errors.push(`${pluginId}: file plugin richiesto mancante (${requiredFile})`);
        }
    }

    const manifest = readJson(`${pluginRoot}/${pluginId}/manifest.json`, {});
    if (policy.require_manifest_id_matches_directory !== false && manifest.id && manifest.id !== pluginId) {
        errors.push(`${pluginId}: manifest.id diverso dalla directory (${manifest.id})`);
    }

    const pluginContract = contractById.get(pluginId);
    if (!pluginContract) {
        errors.push(`${pluginId}: manca plugin_contracts`);
    } else if (policy.require_contract_version_matches_manifest !== false && manifest.version && String(pluginContract.version) !== String(manifest.version)) {
        errors.push(`${pluginId}: versione plugin_contracts diversa dal manifest (${pluginContract.version} != ${manifest.version})`);
    }
}

for (const relPath of trackedPluginFiles) {
    const { pluginId, fileName } = pluginFileParts(relPath, pluginRoot);
    if (!pluginId || !fileName) {
        errors.push(`${relPath}: path plugin tracciato non valido`);
        continue;
    }
    if (!matrixIds.has(pluginId)) errors.push(`${relPath}: file tracciato per plugin non dichiarato`);
    if (!allowedPluginTrackedFiles.has(fileName)) {
        errors.push(`${relPath}: file plugin tracciato non ammesso dal contratto`);
    }
    if (policy.forbid_tracked_plugin_config_json !== false && fileName.endsWith(".json") && fileName !== "manifest.json") {
        errors.push(`${relPath}: configurazione/stato plugin JSON non deve essere tracciata`);
    }
}

for (const pluginId of pluginDirs) {
    const pluginPath = repoPath(`${pluginRoot}/${pluginId}`);
    for (const entry of fs.readdirSync(pluginPath, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        const fileName = entry.name;
        if (allowedPluginTrackedFiles.has(fileName) || generatedPluginFiles.has(fileName)) continue;
        errors.push(`${pluginRoot}/${pluginId}/${fileName}: file locale plugin non previsto dal contratto`);
    }
}

for (const themeId of requiredThemes) {
    if (!fs.existsSync(repoPath(`${themeRoot}/${themeId}`))) errors.push(`${themeId}: tema richiesto mancante`);
}

for (const relPath of trackedThemeFiles) {
    const rest = relPath.slice(`${themeRoot}/`.length);
    const [themeId, ...fileParts] = rest.split("/");
    const fileName = fileParts.join("/");
    if (!requiredThemes.has(themeId)) errors.push(`${relPath}: tema tracciato non dichiarato`);
    if (!allowedThemeFiles.has(fileName)) errors.push(`${relPath}: file tema tracciato non ammesso`);
}

for (const snippet of requiredSnippets) {
    if (!fs.existsSync(repoPath(`${snippetRoot}/${snippet}`))) errors.push(`${snippet}: snippet richiesto mancante`);
}

for (const relPath of trackedSnippetFiles) {
    const fileName = relPath.slice(`${snippetRoot}/`.length);
    if (!allowedSnippetFiles.has(fileName)) errors.push(`${relPath}: snippet tracciato non ammesso`);
}

const communityPlugins = readJson(".obsidian/community-plugins.json", null);
if (Array.isArray(communityPlugins)) {
    const enabled = new Set(communityPlugins.map(pluginId => String(pluginId).trim()).filter(Boolean));
    for (const pluginId of enabled) {
        if (!matrixIds.has(pluginId)) errors.push(`${pluginId}: community-plugins.json abilita plugin fuori plugin_matrix`);
    }
    for (const pluginId of matrixIds) {
        if (!enabled.has(pluginId)) errors.push(`${pluginId}: plugin_matrix non abilitato in community-plugins.json generato`);
    }
}

if (errors.length) {
    console.error("Obsidian plugin bundle non valido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Obsidian plugin bundle OK: ${matrixIds.size} plugin, ${requiredThemes.size} temi, ${requiredSnippets.size} snippet.`);
