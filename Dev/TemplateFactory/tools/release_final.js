#!/usr/bin/env node

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const skipSync = process.argv.includes("--skip-sync");
const quiet = process.argv.includes("--quiet");

function optionValue(name, fallback) {
    const index = process.argv.indexOf(name);
    if (index === -1) return fallback;
    const value = process.argv[index + 1];
    if (!value || value.startsWith("--")) {
        console.error(`${name} richiede un valore`);
        process.exit(1);
    }
    return value;
}

const out = optionValue("--out", "dist/vault-gdr-clean");
const zip = `${out}.zip`;

const steps = [
    ...(skipSync ? [] : [{
        label: "Rigenera sorgenti",
        command: ["python3", "Dev/TemplateFactory/tools/run_source_pipeline.py", "--mode", "render"]
    }]),
    {
        label: "Verifica versione release",
        command: ["node", "Dev/TemplateFactory/tools/check_release.js"]
    },
    {
        label: "Verifica runtime Obsidian",
        command: ["node", "Dev/TemplateFactory/tools/check_runtime_load.js"]
    },
    {
        label: "Verifica sintassi JS",
        command: ["node", "Dev/TemplateFactory/tools/check_js.js"]
    },
    {
        label: "Verifica diff",
        command: ["git", "diff", "--check"]
    },
    {
        label: "Crea release finale pulita",
        command: [
            "node",
            "Dev/TemplateFactory/tools/release_clean.js",
            "--out",
            out,
            ...(quiet ? ["--quiet"] : [])
        ]
    }
];

function runStep(step) {
    console.log(`\n[release-final] ${step.label}`);
    execFileSync(step.command[0], step.command.slice(1), {
        cwd: ROOT,
        stdio: "inherit",
        maxBuffer: 64 * 1024 * 1024
    });
}

for (const step of steps) runStep(step);

if (!fs.existsSync(path.join(ROOT, out))) {
    console.error(`Release finale mancante: ${out}`);
    process.exit(1);
}

if (fs.existsSync(path.join(ROOT, zip))) {
    console.log(`\nRelease finale pronta: ${out}`);
    console.log(`Zip finale pronto: ${zip}`);
} else {
    console.log(`\nRelease finale pronta: ${out}`);
    console.log("Zip finale non creato: comando zip non disponibile.");
}
