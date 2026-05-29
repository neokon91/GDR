#!/usr/bin/env node

const vm = require("vm");
const { readTextIfExists, rel: relativePath, repoPath, walk } = require("./node_utils");

const ROOT = process.cwd();
const JS_DIRS = ["Dev/Tools", "z.automazioni", "z.engine"];
const IGNORED_DIRS = new Set([".git", "node_modules", "dist"]);
const errors = [];
const warnings = [];

function rel(file) {
    return relativePath(ROOT, file);
}

const jsFiles = JS_DIRS.flatMap(dir => walk(repoPath(ROOT, dir), {
    ignoredDirs: IGNORED_DIRS,
    predicate: file => file.endsWith(".js")
})).sort();

for (const file of jsFiles) {
    const fileRel = rel(file);
    try {
        const source = readTextIfExists(file).replace(/^#!.*\n/, "");
        new vm.Script(source, { filename: fileRel });
        if (fileRel.startsWith("z.engine/") && /\b(processFrontMatter|app\.vault\.modify|app\.vault\.create|app\.vault\.delete|adapter\.write)\b/.test(source)) {
            errors.push(`${fileRel}: z.engine deve renderizzare viste senza scrivere file`);
        }
    } catch (error) {
        errors.push(`${fileRel}: JavaScript non parsabile (${error.message})`);
    }
}

if (errors.length) {
    console.error("Errori JS:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

if (warnings.length) {
    for (const warning of warnings) console.warn(`Warning: ${warning}`);
}

console.log(`JS OK: ${jsFiles.length} file controllati.`);
