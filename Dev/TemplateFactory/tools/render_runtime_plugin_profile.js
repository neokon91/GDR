#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const SOURCE = "Dev/TemplateFactory/modules/runtime_plugin_profile.yaml";
const errors = [];

function repoPath(relPath) {
    return path.join(ROOT, relPath);
}

function loadYaml(relPath) {
    try {
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
    } catch (error) {
        errors.push(`${relPath}: YAML non leggibile (${error.message})`);
        return {};
    }
}

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function normalizeList(value) {
    return asArray(value).map(item => String(item).trim()).filter(Boolean);
}

function requireId(source, expected, relPath) {
    if (source.id !== expected) errors.push(`${relPath}: id atteso ${expected}`);
}

function jsonText(data) {
    return `${JSON.stringify(data, null, 2)}\n`;
}

function addPlugin(target, label, data) {
    const normalizedLabel = String(label ?? "").trim();
    const id = String(data?.id ?? "").trim();
    if (!normalizedLabel || !id) return;
    target[normalizedLabel] = {
        id,
        label: normalizedLabel,
        source: data.source ?? "community",
        function: String(data.function ?? "").trim(),
        symptom: String(data.symptom ?? data.visible_failure ?? data.function ?? "").trim(),
        manual_action: String(data.manual_action ?? "").trim()
    };
}

const profileSource = loadYaml(SOURCE);
requireId(profileSource, "runtime_plugin_profile", SOURCE);

const sourcePaths = profileSource.sources ?? {};
const pluginMatrixPath = String(sourcePaths.plugin_matrix ?? "Dev/TemplateFactory/modules/plugin_matrix.yaml");
const pluginContractsPath = String(sourcePaths.plugin_contracts ?? "Dev/TemplateFactory/modules/plugin_contracts.yaml");
const workflowsPath = String(sourcePaths.workflows ?? "Dev/TemplateFactory/modules/workflows.yaml");
const outputPath = String(profileSource.output ?? "z.automazioni/data/runtime/plugin_profile.json");

const pluginMatrix = loadYaml(pluginMatrixPath);
const pluginContracts = loadYaml(pluginContractsPath);
const workflows = loadYaml(workflowsPath);
requireId(pluginMatrix, "plugin_matrix", pluginMatrixPath);
requireId(pluginContracts, "plugin_contracts", pluginContractsPath);
requireId(workflows, "workflows", workflowsPath);

const matrixById = new Map(asArray(pluginMatrix.plugins).map(plugin => [String(plugin.id ?? "").trim(), plugin]));
const contractById = new Map(asArray(pluginContracts.plugins).map(plugin => [String(plugin.id ?? "").trim(), plugin]));
const manualActions = profileSource.manual_actions ?? {};
const defaultManualAction = String(profileSource.defaults?.manual_action ?? "").trim();
const pluginsByLabel = {};

for (const [pluginId, matrixPlugin] of matrixById.entries()) {
    if (!pluginId) continue;
    const contractPlugin = contractById.get(pluginId) ?? {};
    const base = {
        id: pluginId,
        source: "community",
        function: matrixPlugin.function ?? contractPlugin.local_scope ?? "",
        symptom: contractPlugin.visible_failure ?? matrixPlugin.function ?? "",
        manual_action: manualActions[matrixPlugin.name] ?? manualActions[contractPlugin.name] ?? manualActions[pluginId] ?? defaultManualAction
    };
    addPlugin(pluginsByLabel, matrixPlugin.name, base);
    if (contractPlugin.name && contractPlugin.name !== matrixPlugin.name) {
        addPlugin(pluginsByLabel, contractPlugin.name, {
            ...base,
            manual_action: manualActions[contractPlugin.name] ?? base.manual_action
        });
    }
}

for (const corePlugin of asArray(profileSource.core_plugins)) {
    const label = String(corePlugin.label ?? "").trim();
    addPlugin(pluginsByLabel, label, {
        id: corePlugin.id,
        source: corePlugin.source ?? "core",
        function: corePlugin.function,
        symptom: corePlugin.symptom,
        manual_action: manualActions[label] ?? corePlugin.manual_action ?? defaultManualAction
    });
}

for (const [label, action] of Object.entries(manualActions)) {
    if (!pluginsByLabel[label]) {
        errors.push(`${SOURCE}: manual_actions.${label} non corrisponde a nessun plugin runtime`);
        continue;
    }
    pluginsByLabel[label].manual_action = String(action).trim();
}

const workflowPlugins = {};
for (const [workflowId, workflow] of Object.entries(workflows.workflows ?? {})) {
    const requiredPlugins = normalizeList(workflow.required_plugins);
    if (!requiredPlugins.length) continue;
    workflowPlugins[workflowId] = requiredPlugins;
    for (const label of requiredPlugins) {
        if (!pluginsByLabel[label]) {
            errors.push(`${workflowsPath}: ${workflowId}.required_plugins contiene plugin non profilato (${label})`);
        }
    }
}

const defaultWorkflowPlugins = normalizeList(profileSource.defaults?.workflow_plugins);
for (const label of defaultWorkflowPlugins) {
    if (!pluginsByLabel[label]) {
        errors.push(`${SOURCE}: defaults.workflow_plugins contiene plugin non profilato (${label})`);
    }
}

const profile = {
    generated_from: {
        runtime_plugin_profile: SOURCE,
        plugin_matrix: pluginMatrixPath,
        plugin_contracts: pluginContractsPath,
        workflows: workflowsPath
    },
    default_workflow_plugins: defaultWorkflowPlugins,
    default_manual_action: defaultManualAction,
    plugins_by_label: Object.fromEntries(Object.entries(pluginsByLabel).sort(([left], [right]) => left.localeCompare(right))),
    workflow_plugins: Object.fromEntries(Object.entries(workflowPlugins).sort(([left], [right]) => left.localeCompare(right)))
};

if (!errors.length) {
    const target = repoPath(outputPath);
    const expected = jsonText(profile);
    if (process.argv.includes("--check")) {
        const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
        if (current !== expected) {
            errors.push(`${outputPath} non allineato a ${SOURCE}`);
        }
    } else {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, expected, "utf8");
    }
}

if (errors.length) {
    console.error("Runtime plugin profile non valido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Runtime plugin profile OK: ${Object.keys(profile.plugins_by_label).length} label plugin, ${Object.keys(profile.workflow_plugins).length} workflow.`);
