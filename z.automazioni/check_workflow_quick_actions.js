#!/usr/bin/env node

const { existsRel, readJson, readTextRel, repoPath } = require("./node_utils");

const ROOT = process.cwd();
const DATA_FILE = "z.automazioni/data/workflows/quick_actions.json";

function fail(errors) {
    console.error("Workflow quick actions non valide:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

function main() {
    const errors = [];
    const data = readJson(repoPath(ROOT, DATA_FILE), null);

    if (!data || data.generated_by !== "generate_workflow_data") {
        errors.push(`${DATA_FILE}: artefatto mancante o non generato da generate_workflow_data`);
        fail(errors);
    }

    for (const [workflowId, workflow] of Object.entries(data.workflows ?? {})) {
        const entryPoints = workflow.entry_points ?? [];
        const actions = workflow.quick_actions ?? [];
        const plugins = workflow.required_plugins ?? [];

        if (!entryPoints.length) {
            errors.push(`${workflowId}: entry_points mancanti nel JSON workflow`);
            continue;
        }

        if (!actions.length) {
            errors.push(`${workflowId}: quick_actions mancanti nel JSON workflow`);
            continue;
        }
        if (!plugins.length) {
            errors.push(`${workflowId}: required_plugins mancanti nel JSON workflow`);
        }

        for (const entry of entryPoints) {
            if (!existsRel(ROOT, entry)) {
                errors.push(`${workflowId}: pagina operativa mancante (${entry})`);
                continue;
            }

            const text = readTextRel(ROOT, entry);
            for (const action of actions) {
                const button = String(action.button ?? "");
                if (!button) {
                    errors.push(`${workflowId}: quick action senza button`);
                    continue;
                }
                if (!text.includes(`BUTTON[${button}]`)) {
                    errors.push(`${workflowId}: ${entry} non espone BUTTON[${button}]`);
                }
            }
        }
    }

    if (errors.length) fail(errors);

    console.log(`Workflow quick actions OK: ${Object.keys(data.workflows ?? {}).length} flussi verificati nelle pagine operative.`);
}

main();
