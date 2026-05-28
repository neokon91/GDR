#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const CONTRACT = "Dev/TemplateFactory/modules/naming_contract.yaml";
const errors = [];

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
        maxBuffer: 4 * 1024 * 1024
    });
    return JSON.parse(stdout);
}

function gitFiles(args) {
    const stdout = execFileSync("git", args, {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 8 * 1024 * 1024
    });
    return stdout.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function normalizeList(value) {
    return Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : [];
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termRegex(term) {
    const flags = term.case_insensitive === false ? "g" : "gi";
    const raw = escapeRegExp(term.term ?? "");
    if (term.match === "word") return new RegExp(`\\b${raw}\\b`, flags);
    return new RegExp(raw, flags);
}

function isUnderRoot(relPath, root) {
    return relPath === root || relPath.startsWith(`${root.replace(/\/$/, "")}/`);
}

const contract = loadYaml(CONTRACT);
if (contract.id !== "naming_contract") {
    errors.push(`${CONTRACT}: id non valido`);
}

const policy = contract.policy ?? {};
const scanRoots = normalizeList(policy.scan_roots);
const textExtensions = new Set(normalizeList(policy.text_extensions));
const allowedHistoricalPaths = new Set(normalizeList(policy.allowed_historical_paths));
const forbiddenTerms = Array.isArray(policy.forbidden_active_terms) ? policy.forbidden_active_terms : [];

if (!scanRoots.length) errors.push(`${CONTRACT}: policy.scan_roots vuoto`);
if (!textExtensions.size) errors.push(`${CONTRACT}: policy.text_extensions vuoto`);
if (!forbiddenTerms.length) errors.push(`${CONTRACT}: policy.forbidden_active_terms vuoto`);

const files = new Set([
    ...gitFiles(["ls-files"]),
    ...gitFiles(["ls-files", "--others", "--exclude-standard"])
]);

for (const relPath of [...files].sort()) {
    const fullPath = repoPath(relPath);
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) continue;
    if (!scanRoots.some(root => isUnderRoot(relPath, root))) continue;
    if (allowedHistoricalPaths.has(relPath)) continue;

    const extension = path.extname(relPath);
    if (relPath !== "package.json" && !textExtensions.has(extension)) continue;

    for (const term of forbiddenTerms) {
        const label = String(term.term ?? "").trim();
        if (!label) continue;

        if (termRegex(term).test(relPath)) {
            errors.push(`${relPath}: path contiene nome obsoleto (${label}); usare ${term.replacement ?? "nome di dominio"}`);
        }
    }

    const text = fs.readFileSync(fullPath, "utf8");
    for (const term of forbiddenTerms) {
        const label = String(term.term ?? "").trim();
        if (!label) continue;

        const regex = termRegex(term);
        const lines = text.split(/\r?\n/);
        for (const [index, line] of lines.entries()) {
            if (regex.test(line)) {
                errors.push(`${relPath}:${index + 1}: nome obsoleto (${label}); usare ${term.replacement ?? "nome di dominio"}`);
            }
        }
    }
}

if (errors.length) {
    console.error("Naming contract non valido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Naming contract OK: ${forbiddenTerms.length} termini legacy vietati fuori dai documenti storici.`);
