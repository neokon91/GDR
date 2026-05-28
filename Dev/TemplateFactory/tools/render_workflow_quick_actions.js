#!/usr/bin/env node

const fs = require("fs");
const { readJson, readTextRel, repoPath } = require("./node_utils");
const { materializedUserFileMap, renderMaterializedUserFile } = require("./release_boundary_utils");

const ROOT = process.cwd();
const DATA_FILE = "z.automazioni/data/workflows/quick_actions.json";
const CHECK_ONLY = process.argv.includes("--check");

function fail(errors) {
    console.error("Render workflow quick actions non valido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

function markers(workflowId) {
    return {
        start: `<!-- workflow:quick_actions:start ${workflowId} -->`,
        end: `<!-- workflow:quick_actions:end ${workflowId} -->`
    };
}

function renderAction(lines, action) {
    const label = String(action.label ?? "").trim();
    const useWhen = String(action.use_when ?? "").trim();
    const button = String(action.button ?? "").trim();

    lines.push(">");
    lines.push(`> **${label}**${useWhen ? ` - ${useWhen}` : ""}`);
    if (button) lines.push(`<!-- workflow:button ${button} -->`);
}

function renderBlock(workflowId, workflow) {
    const lines = [];
    const plugins = workflow.required_plugins ?? [];
    const actionGroups = workflow.action_groups ?? {};
    const userFacing = workflow.audience === "user";
    lines.push(markers(workflowId).start);
    lines.push("> [!regia] Azioni rapide");
    lines.push(`> ${workflow.user_goal}`);
    if (plugins.length && !userFacing) {
        lines.push(">");
        lines.push(`> Plugin coinvolti: ${plugins.map(plugin => `\`${plugin}\``).join(", ")}.`);
    }

    for (const action of workflow.quick_actions ?? []) {
        renderAction(lines, action);
    }

    for (const group of Object.values(actionGroups)) {
        lines.push(">");
        lines.push(`> [!regia]- ${group.label}`);
        if (group.purpose) lines.push(`> ${group.purpose}`);
        for (const action of group.actions ?? []) {
            renderAction(lines, action);
        }
    }

    lines.push(markers(workflowId).end);
    return lines.join("\n");
}

function replaceBlock(text, workflowId, block) {
    const marker = markers(workflowId);
    const start = text.indexOf(marker.start);
    const end = text.indexOf(marker.end);

    if (start === -1 || end === -1 || end < start) return null;

    return `${text.slice(0, start)}${block}${text.slice(end + marker.end.length)}`;
}

function main() {
    const errors = [];
    const data = readJson(repoPath(ROOT, DATA_FILE), null);
    const virtualFiles = materializedUserFileMap(ROOT);

    if (!data || data.generated_by !== "generate_workflow_data") {
        fail([`${DATA_FILE}: artefatto mancante o non generato da generate_workflow_data`]);
    }

    for (const [workflowId, workflow] of Object.entries(data.workflows ?? {})) {
        const block = renderBlock(workflowId, workflow);

        for (const entry of workflow.entry_points ?? []) {
            const file = repoPath(ROOT, entry);
            const virtualFile = virtualFiles.get(entry);
            const current = readTextRel(ROOT, entry, null) ?? (
                virtualFile ? renderMaterializedUserFile(virtualFile, data.workflows ?? {}) : null
            );
            if (current === null) {
                errors.push(`${workflowId}: pagina operativa mancante (${entry})`);
                continue;
            }

            const next = replaceBlock(current, workflowId, block);
            if (next === null) {
                errors.push(`${workflowId}: marker quick_actions mancanti o malformati in ${entry}`);
                continue;
            }

            if (CHECK_ONLY) {
                if (next !== current) errors.push(`${entry}: blocco quick_actions non aggiornato; eseguire npm run render:workflow-actions`);
            } else if (virtualFile) {
                continue;
            } else if (next !== current) {
                fs.writeFileSync(file, next, "utf8");
            }
        }
    }

    if (errors.length) fail(errors);

    console.log(`Workflow quick actions ${CHECK_ONLY ? "OK" : "renderizzate"}: ${Object.keys(data.workflows ?? {}).length} flussi.`);
}

main();
