#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { readJson, readTextRel, repoPath } = require("./node_utils");

const ROOT = process.cwd();
const USER_PATH_FILE = "Dev/TemplateFactory/modules/user_path.yaml";
const USER_PATH = loadYamlModule(USER_PATH_FILE);
const errors = [];

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

function requiredArray(pathText) {
    const values = String(pathText).split(".").reduce((value, key) => value?.[key], USER_PATH);
    const normalized = Array.isArray(values)
        ? values.filter(Boolean)
        : [];
    if (!normalized.length) {
        errors.push(`${USER_PATH_FILE}: ${pathText} deve essere lista non vuota`);
    }
    return normalized;
}

function requiredText(value, pathText) {
    const text = String(value ?? "").trim();
    if (!text) errors.push(`${USER_PATH_FILE}: ${pathText} vuoto o mancante`);
    return text;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function simpleCallPattern(workflowId) {
    const escaped = escapeRegExp(workflowId);
    return new RegExp(`renderWorkflowCommandDeck\\(dv,\\s*["']${escaped}["'],\\s*\\{\\s*mode:\\s*["']simple["']\\s*\\}\\)`);
}

function workflowBlock(text, workflowId) {
    const start = `<!-- workflow:quick_actions:start ${workflowId} -->`;
    const end = `<!-- workflow:quick_actions:end ${workflowId} -->`;
    const startIndex = text.indexOf(start);
    const endIndex = text.indexOf(end);
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) return "";
    return text.slice(startIndex, endIndex + end.length);
}

function validateContract(primaryPath) {
    if (USER_PATH.id !== "user_path") errors.push(`${USER_PATH_FILE}: id non valido`);

    const seenWorkflows = new Set();
    const seenPages = new Set();
    for (const [index, step] of primaryPath.entries()) {
        const workflow = requiredText(step.workflow, `primary_path[${index}].workflow`);
        const page = requiredText(step.page, `primary_path[${index}].page`);
        requiredText(step.label, `primary_path[${index}].label`);

        if (workflow) {
            if (seenWorkflows.has(workflow)) errors.push(`${USER_PATH_FILE}: workflow duplicato nel percorso utente (${workflow})`);
            seenWorkflows.add(workflow);
        }
        if (page) {
            if (seenPages.has(page)) errors.push(`${USER_PATH_FILE}: pagina duplicata nel percorso utente (${page})`);
            seenPages.add(page);
        }

        const buttons = Array.isArray(step.required_buttons)
            ? step.required_buttons.map(String).filter(Boolean)
            : [];
        if (!buttons.length) errors.push(`${USER_PATH_FILE}: primary_path.${workflow || index}.required_buttons vuoto o mancante`);
    }
}

function main() {
    const workflows = readJson(repoPath(ROOT, "z.automazioni/data/workflows/quick_actions.json"), null)?.workflows ?? {};
    const metaBind = readJson(repoPath(ROOT, ".obsidian/plugins/obsidian-meta-bind-plugin/data.json"), {});
    const buttonIds = new Set((metaBind.buttonTemplates ?? []).map(button => String(button.id ?? "")));
    const primaryPath = requiredArray("primary_path");
    const forbiddenMarkers = requiredArray("policy.forbidden_user_block_markers").map(String);
    const releaseConfig = requiredArray("required_release_config").map(String);
    const requireSimpleMode = USER_PATH.policy?.user_workflows_must_use_simple_mode !== false;

    validateContract(primaryPath);

    for (const step of primaryPath) {
        const workflowId = String(step.workflow ?? "");
        const page = String(step.page ?? "");
        const label = String(step.label ?? workflowId);
        const requiredButtons = (step.required_buttons ?? []).map(String).filter(Boolean);
        const text = readTextRel(ROOT, page, null);
        const workflow = workflows[workflowId];

        if (!text) {
            errors.push(`${label}: pagina mancante (${page})`);
            continue;
        }
        if (!workflow) {
            errors.push(`${label}: workflow mancante (${workflowId})`);
            continue;
        }
        if (workflow.audience !== "user") {
            errors.push(`${label}: workflow non marcato audience=user`);
        }
        if (requireSimpleMode && step.require_simple_mode !== false && !simpleCallPattern(workflowId).test(text)) {
            errors.push(`${label}: deck runtime non usa mode simple`);
        }

        const block = workflowBlock(text, workflowId);
        if (!block) {
            errors.push(`${label}: blocco quick_actions mancante`);
            continue;
        }
        for (const marker of forbiddenMarkers) {
            if (block.includes(marker)) {
                errors.push(`${label}: blocco utente espone marker vietato (${marker})`);
            }
        }
        for (const button of requiredButtons) {
            if (!buttonIds.has(button)) {
                errors.push(`${label}: pulsante Meta Bind non configurato (${button})`);
            }
            if (!block.includes(`BUTTON[${button}]`)) {
                errors.push(`${label}: azione primaria non esposta (${button})`);
            }
        }
    }

    for (const relPath of releaseConfig) {
        if (!fs.existsSync(path.join(ROOT, relPath))) {
            errors.push(`Release utente: configurazione Obsidian mancante (${relPath})`);
        }
    }

    if (errors.length) {
        console.error("Percorso utente nuovo non valido:");
        for (const error of errors) console.error(`- ${error}`);
        process.exit(1);
    }

    console.log(`Percorso utente nuovo OK: ${primaryPath.length} superfici primarie verificate da YAML.`);
}

main();
