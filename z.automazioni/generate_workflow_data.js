#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { repoPath, rel } = require("./node_utils");

const ROOT = process.cwd();
const MODULE = repoPath(ROOT, "Dev/TemplateFactory/modules/workflows.yaml");
const OUT = repoPath(ROOT, "z.automazioni/data/workflows/quick_actions.json");
const GENERATED_BY = "generate_workflow_data";
const CHECK_ONLY = process.argv.includes("--check");

function loadYaml(filePath) {
    const script = [
        "import json, sys",
        "import yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");

    const stdout = execFileSync("python3", ["-c", script, filePath], {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024
    });

    return JSON.parse(stdout);
}

function stableJson(payload) {
    return `${JSON.stringify(payload, null, 2)}\n`;
}

function fail(message) {
    console.error(message);
    process.exit(1);
}

function workflowQuickActions(module) {
    const workflows = module.workflows ?? {};
    const entries = {};

    for (const [workflowId, workflow] of Object.entries(workflows)) {
        const actions = workflow.quick_actions ?? [];
        if (!actions.length) continue;

        entries[workflowId] = {
            user_goal: workflow.user_goal ?? "",
            entry_points: (workflow.entry_points ?? []).map(entry => String(entry)),
            quick_actions: actions.map(action => ({
                button: String(action.button ?? ""),
                label: String(action.label ?? ""),
                use_when: String(action.use_when ?? "")
            }))
        };
    }

    return entries;
}

function main() {
    if (!fs.existsSync(MODULE)) fail(`Modulo workflow mancante: ${rel(ROOT, MODULE)}`);

    const module = loadYaml(MODULE);
    const workflows = workflowQuickActions(module);
    const payload = {
        generated_by: GENERATED_BY,
        source: rel(ROOT, MODULE),
        purpose: "Azioni rapide operative derivate da workflows.yaml per runtime, check e documentazione.",
        workflows
    };
    const expected = stableJson(payload);

    if (CHECK_ONLY) {
        const actual = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
        if (actual !== expected) {
            fail(`Workflow data non aggiornato: eseguire npm run generate:workflow-data (${rel(ROOT, OUT)})`);
        }
        console.log(`Workflow data OK: ${Object.keys(workflows).length} flussi con azioni rapide.`);
        return;
    }

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, expected, "utf8");
    console.log(`Workflow data generato: ${Object.keys(workflows).length} flussi in ${rel(ROOT, OUT)}.`);
}

main();
