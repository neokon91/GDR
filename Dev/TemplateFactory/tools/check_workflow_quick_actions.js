#!/usr/bin/env node

const { existsRel, readJson, readTextRel, repoPath } = require("./node_utils");
const { materializedUserFileMap, renderMaterializedUserFile } = require("./release_boundary_utils");

const ROOT = process.cwd();
const DATA_FILE = "z.automazioni/data/workflows/quick_actions.json";
const META_BIND_CONFIG = ".obsidian/plugins/obsidian-meta-bind-plugin/data.json";
const BUTTON_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const BUTTON_PATTERN = /`BUTTON\[([^\]\n]+)\]`/g;

function buttonDeclaration(button) {
    return `<!-- workflow:button ${button} -->`;
}

function workflowBlock(text, workflowId) {
    const start = `<!-- workflow:quick_actions:start ${workflowId} -->`;
    const end = `<!-- workflow:quick_actions:end ${workflowId} -->`;
    const startIndex = text.indexOf(start);
    const endIndex = text.indexOf(end);
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) return "";
    return text.slice(startIndex, endIndex + end.length);
}

function fail(errors) {
    console.error("Workflow quick actions non valide:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

function stripWorkflowBlocks(text) {
    return text.replace(/<!-- workflow:quick_actions:start [^>]+ -->[\s\S]*?<!-- workflow:quick_actions:end [^>]+ -->/g, "");
}

function main() {
    const errors = [];
    const data = readJson(repoPath(ROOT, DATA_FILE), null);
    const metaBind = readJson(repoPath(ROOT, META_BIND_CONFIG), null);
    const virtualFiles = materializedUserFileMap(ROOT);
    const buttonIds = new Set((metaBind?.buttonTemplates ?? []).map(button => String(button.id ?? "")));

    if (!data || data.generated_by !== "generate_workflow_data") {
        errors.push(`${DATA_FILE}: artefatto mancante o non generato da generate_workflow_data`);
        fail(errors);
    }

    for (const [workflowId, workflow] of Object.entries(data.workflows ?? {})) {
        const entryPoints = workflow.entry_points ?? [];
        const actions = workflow.quick_actions ?? [];
        const plugins = workflow.required_plugins ?? [];
        const groupedActions = Object.values(workflow.action_groups ?? {}).flatMap(group => group.actions ?? []);
        const allActions = [...actions, ...groupedActions];

        if (!entryPoints.length) {
            errors.push(`${workflowId}: entry_points mancanti nel JSON workflow`);
            continue;
        }

        if (!allActions.length) {
            errors.push(`${workflowId}: azioni mancanti nel JSON workflow`);
            continue;
        }
        if (!plugins.length) {
            errors.push(`${workflowId}: required_plugins mancanti nel JSON workflow`);
        }

        for (const entry of entryPoints) {
            const virtualFile = virtualFiles.get(entry);
            if (!existsRel(ROOT, entry) && !virtualFile) {
                errors.push(`${workflowId}: pagina operativa mancante (${entry})`);
                continue;
            }

            const text = existsRel(ROOT, entry)
                ? readTextRel(ROOT, entry)
                : renderMaterializedUserFile(virtualFile, data.workflows ?? {});
        const block = workflowBlock(text, workflowId);
        const visibleWorkflowButtons = [...block.matchAll(BUTTON_PATTERN)].map(match => match[1]);
        if (visibleWorkflowButtons.length) {
            errors.push(`${workflowId}: ${entry} espone sintassi Meta Bind visibile nel blocco workflow (${visibleWorkflowButtons.join(", ")})`);
        }
        for (const action of allActions) {
                const button = String(action.button ?? "");
                if (!button) {
                    errors.push(`${workflowId}: quick action senza button`);
                    continue;
                }
                if (button.includes("BUTTON[") || button.includes("]")) {
                    errors.push(`${workflowId}: usare l'id Meta Bind pulito nel workflow, non ${button}`);
                }
                if (!BUTTON_ID_PATTERN.test(button)) {
                    errors.push(`${workflowId}: id pulsante Meta Bind non valido (${button})`);
                }
                if (!buttonIds.has(button)) {
                    errors.push(`${workflowId}: BUTTON[${button}] non presente nella configurazione Meta Bind`);
                }
                if (!text.includes(buttonDeclaration(button))) {
                    errors.push(`${workflowId}: ${entry} non dichiara workflow:button ${button}`);
                }
            }

            const outsideWorkflowBlocks = stripWorkflowBlocks(text);
            let match;
            while ((match = BUTTON_PATTERN.exec(outsideWorkflowBlocks))) {
                errors.push(`${workflowId}: ${entry} espone BUTTON[${match[1]}] fuori dal blocco workflow dichiarativo`);
            }
        }
    }

    if (errors.length) fail(errors);

    console.log(`Workflow quick actions OK: ${Object.keys(data.workflows ?? {}).length} flussi verificati nelle pagine operative.`);
}

main();
