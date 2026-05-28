#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { repoPath } = require("./node_utils");

const ROOT = process.cwd();
const CONTRACT = "Dev/TemplateFactory/modules/repo_quality_contract.yaml";
const OBSIDIAN_CONFIG = "Dev/TemplateFactory/modules/obsidian_config.yaml";
const RELEASE_BOUNDARY = "Dev/TemplateFactory/modules/release_boundary.yaml";

function loadYamlModule(relPath) {
    const script = [
        "import json, sys, yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");
    const stdout = execFileSync("python3", ["-c", script, repoPath(ROOT, relPath)], {
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024
    });
    return JSON.parse(stdout);
}

function configDataByTarget(config, target) {
    return (config.configs ?? []).find(item => item?.target === target)?.data;
}

function requireNonEmptyArray(errors, value, pathText) {
    if (!Array.isArray(value) || value.length === 0) {
        errors.push(`${CONTRACT}: ${pathText} deve essere lista non vuota`);
        return [];
    }

    const normalized = value.map(item => String(item ?? "").trim()).filter(Boolean);
    if (normalized.length !== value.length) {
        errors.push(`${CONTRACT}: ${pathText} contiene valori vuoti`);
    }

    const duplicates = normalized.filter((item, index) => normalized.indexOf(item) !== index);
    if (duplicates.length) {
        errors.push(`${CONTRACT}: ${pathText} contiene duplicati (${[...new Set(duplicates)].join(", ")})`);
    }
    return normalized;
}

function requireSection(errors, value, pathText) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        errors.push(`${CONTRACT}: ${pathText} deve essere mappa non vuota`);
        return {};
    }
    if (!Object.keys(value).length) {
        errors.push(`${CONTRACT}: ${pathText} deve essere mappa non vuota`);
    }
    return value;
}

function requireExistingFiles(errors, files, pathText) {
    for (const relPath of files) {
        if (!existsRelOrGenerated(relPath)) {
            errors.push(`${CONTRACT}: ${pathText} punta a file mancante (${relPath})`);
        }
    }
}

function generatedRootSet() {
    return new Set((releaseBoundary.generated_release_roots ?? []).map(root => String(root).replace(/\\/g, "/").replace(/\/$/, "")));
}

function metadataTargetSet(errors) {
    try {
        const stdout = execFileSync("python3", ["Dev/TemplateFactory/tools/render_metadata_surfaces.py", "--list-targets"], {
            cwd: ROOT,
            encoding: "utf8",
            env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
            maxBuffer: 1024 * 1024
        });
        return new Set(stdout.split(/\r?\n/).filter(Boolean).map(file => file.replace(/\\/g, "/")));
    } catch (error) {
        errors.push(`${CONTRACT}: impossibile leggere target metadata generati (${error.message})`);
        return new Set();
    }
}

function validateSubset(errors, values, allowedValues, pathText, sourcePath) {
    for (const value of values) {
        if (!allowedValues.has(value)) {
            errors.push(`${CONTRACT}: ${pathText} contiene valore non dichiarato in ${sourcePath} (${value})`);
        }
    }
}

const errors = [];
const contract = loadYamlModule(CONTRACT);
const obsidianConfig = loadYamlModule(OBSIDIAN_CONFIG);
const releaseBoundary = loadYamlModule(RELEASE_BOUNDARY);
const generatedRoots = generatedRootSet();
const generatedMetadataTargets = metadataTargetSet(errors);

function existsRelOrGenerated(relPath) {
    const normalized = String(relPath).replace(/\\/g, "/");
    const top = normalized.split("/", 1)[0];
    if (fs.existsSync(repoPath(ROOT, normalized))) return true;
    return generatedRoots.has(top) && generatedMetadataTargets.has(normalized);
}

if (contract.id !== "repo_quality_contract") {
    errors.push(`${CONTRACT}: id non valido`);
}

const surfaces = requireSection(errors, contract.required_surfaces, "required_surfaces");
const markers = requireSection(errors, contract.documentation_markers, "documentation_markers");

const requiredPlugins = requireNonEmptyArray(errors, surfaces.plugins, "required_surfaces.plugins");
const requiredSnippets = requireNonEmptyArray(errors, surfaces.snippets, "required_surfaces.snippets");
const requiredFiles = requireNonEmptyArray(errors, surfaces.files, "required_surfaces.files");
const requiredBaseFiles = requireNonEmptyArray(errors, surfaces.base_files, "required_surfaces.base_files");
const requiredLayerFiles = requireNonEmptyArray(errors, surfaces.layer_files, "required_surfaces.layer_files");
const metadataMenuPresets = requireNonEmptyArray(errors, surfaces.metadata_menu_presets, "required_surfaces.metadata_menu_presets");
const devReadmeMarkers = requireNonEmptyArray(errors, markers.dev_readme_architecture, "documentation_markers.dev_readme_architecture");
const workflowMarkers = requireNonEmptyArray(errors, markers.workflow_contract, "documentation_markers.workflow_contract");

requireExistingFiles(errors, requiredSnippets, "required_surfaces.snippets");
requireExistingFiles(errors, requiredFiles, "required_surfaces.files");
requireExistingFiles(errors, requiredBaseFiles, "required_surfaces.base_files");
requireExistingFiles(errors, requiredLayerFiles, "required_surfaces.layer_files");

const declaredCommunityPlugins = configDataByTarget(obsidianConfig, ".obsidian/community-plugins.json") ?? [];
validateSubset(
    errors,
    requiredPlugins,
    new Set(Array.isArray(declaredCommunityPlugins) ? declaredCommunityPlugins.map(String) : []),
    "required_surfaces.plugins",
    OBSIDIAN_CONFIG
);

validateSubset(
    errors,
    requiredPlugins,
    new Set((releaseBoundary.required_plugins ?? []).map(String)),
    "required_surfaces.plugins",
    RELEASE_BOUNDARY
);

const appearance = configDataByTarget(obsidianConfig, ".obsidian/appearance.json") ?? {};
const enabledSnippets = new Set((appearance.enabledCssSnippets ?? []).map(String));
for (const snippet of requiredSnippets) {
    if (!snippet.startsWith(".obsidian/snippets/") || path.extname(snippet) !== ".css") {
        errors.push(`${CONTRACT}: required_surfaces.snippets contiene path non snippet CSS (${snippet})`);
        continue;
    }
    const snippetName = path.basename(snippet, ".css");
    if (!enabledSnippets.has(snippetName)) {
        errors.push(`${CONTRACT}: snippet ${snippet} non abilitato in ${OBSIDIAN_CONFIG}`);
    }
}

const metadataMenu = configDataByTarget(obsidianConfig, ".obsidian/plugins/metadata-menu/data.json") ?? {};
const declaredPresetNames = new Set((metadataMenu.presetFields ?? [])
    .map(field => String(field?.name ?? ""))
    .filter(Boolean));
validateSubset(
    errors,
    metadataMenuPresets,
    declaredPresetNames,
    "required_surfaces.metadata_menu_presets",
    OBSIDIAN_CONFIG
);

for (const marker of devReadmeMarkers) {
    if (!fs.readFileSync(repoPath(ROOT, "Dev/README.md"), "utf8").includes(marker)) {
        errors.push(`${CONTRACT}: documentation_markers.dev_readme_architecture non verificato in Dev/README.md (${marker})`);
    }
}

const workflowsText = fs.readFileSync(repoPath(ROOT, "Dev/TemplateFactory/modules/workflows.yaml"), "utf8");
for (const marker of workflowMarkers) {
    if (!workflowsText.includes(marker)) {
        errors.push(`${CONTRACT}: documentation_markers.workflow_contract non verificato in workflows.yaml (${marker})`);
    }
}

if (errors.length) {
    console.error("Contratto qualita repo non valido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Repo quality contract OK: ${requiredFiles.length + requiredBaseFiles.length + requiredLayerFiles.length} file, ${requiredPlugins.length} plugin minimi, ${metadataMenuPresets.length} preset Metadata Menu.`);
