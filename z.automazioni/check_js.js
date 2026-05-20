#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = process.cwd();
const JS_DIRS = ["z.automazioni", "z.engine"];
const IGNORED_DIRS = new Set([".git", "node_modules", "dist"]);
const errors = [];

function rel(file) {
    return path.relative(ROOT, file).replace(/\\/g, "/");
}

function walk(dir) {
    if (!fs.existsSync(dir)) return [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (IGNORED_DIRS.has(entry.name)) continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...walk(fullPath));
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
            files.push(fullPath);
        }
    }

    return files;
}

const jsFiles = JS_DIRS.flatMap(dir => walk(path.join(ROOT, dir))).sort();

for (const file of jsFiles) {
    try {
        const source = fs.readFileSync(file, "utf8").replace(/^#!.*\n/, "");
        new vm.Script(source, { filename: rel(file) });
    } catch (error) {
        errors.push(`${rel(file)}: JavaScript non parsabile (${error.message})`);
    }
}

if (errors.length) {
    console.error("Errori JS:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`JS OK: ${jsFiles.length} file controllati.`);
