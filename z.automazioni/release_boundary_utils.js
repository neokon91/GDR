const { execFileSync } = require("child_process");
const path = require("path");
const { repoPath } = require("./node_utils");

const BOUNDARY = "Dev/TemplateFactory/modules/release_boundary.yaml";

function loadYaml(root, relPath) {
    const script = [
        "import json, sys, yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");
    const stdout = execFileSync("python3", ["-c", script, repoPath(root, relPath)], {
        encoding: "utf8",
        maxBuffer: 2 * 1024 * 1024
    });
    return JSON.parse(stdout);
}

function loadReleaseBoundary(root) {
    return loadYaml(root, BOUNDARY);
}

function materializedUserFiles(root) {
    return loadReleaseBoundary(root).materialized_user_files ?? [];
}

function materializedUserFileMap(root) {
    return new Map(materializedUserFiles(root).map(file => [String(file.path ?? "").replace(/\\/g, "/"), file]));
}

function renderWorkflowBlock(workflowId, workflow) {
    const lines = [];
    const plugins = workflow.required_plugins ?? [];
    const actionGroups = workflow.action_groups ?? {};
    const userFacing = workflow.audience === "user";

    lines.push(`<!-- workflow:quick_actions:start ${workflowId} -->`);
    lines.push("> [!regia] Azioni rapide");
    lines.push(`> ${workflow.user_goal}`);
    if (plugins.length && !userFacing) {
        lines.push(">");
        lines.push(`> Plugin coinvolti: ${plugins.map(plugin => `\`${plugin}\``).join(", ")}.`);
    }

    for (const action of workflow.quick_actions ?? []) {
        lines.push(">");
        lines.push(`> **${action.label}** - ${action.use_when}`);
        lines.push(`> \`BUTTON[${action.button}]\``);
    }

    for (const group of Object.values(actionGroups)) {
        lines.push(">");
        lines.push(`> [!regia]- ${group.label}`);
        if (group.purpose) lines.push(`> ${group.purpose}`);
        for (const action of group.actions ?? []) {
            lines.push(">");
            lines.push(`> **${action.label}** - ${action.use_when}`);
            lines.push(`> \`BUTTON[${action.button}]\``);
        }
    }

    lines.push(`<!-- workflow:quick_actions:end ${workflowId} -->`);
    return lines.join("\n");
}

function renderMaterializedUserFile(file, workflows = {}) {
    const title = file.title ?? path.basename(String(file.path ?? ""), ".md");
    const body = String(file.body ?? "").trim();
    const workflowBlocks = (file.workflow_blocks ?? [])
        .map(workflowId => renderWorkflowBlock(workflowId, workflows[workflowId] ?? {}))
        .join("\n\n");
    const sections = [
        "---",
        "cssclasses:",
        "  - indice",
        "generated_by: release_clean",
        "---",
        "",
        `# ${title}`,
        body,
        workflowBlocks
    ].filter(section => String(section).length > 0);

    return `${sections.join("\n\n")}\n`;
}

module.exports = {
    loadReleaseBoundary,
    materializedUserFileMap,
    materializedUserFiles,
    renderMaterializedUserFile,
    renderWorkflowBlock
};
