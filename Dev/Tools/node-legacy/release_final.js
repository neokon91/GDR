#!/usr/bin/env node

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const keepGenerated = process.argv.includes("--keep-generated");

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
const defaultOut = out.replace(/\\/g, "/") === "dist/vault-gdr-clean";

if (defaultOut) {
    fs.rmSync(path.join(ROOT, "dist"), { recursive: true, force: true });
}

const steps = [
    {
        label: "Genera output YAML/Jinja",
        command: ["python3", "Dev/Tools/python/run_source_pipeline.py", "--mode", "render", "--outputs-only"]
    },
    {
        label: "Crea vault release in dist",
        command: [
            "node",
            "Dev/Tools/node-legacy/release_clean.js",
            "--out",
            out,
            "--quiet"
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

let exitCode = 0;
try {
    for (const step of steps) runStep(step);
} catch (error) {
    exitCode = Number.isInteger(error.status) ? error.status : 1;
} finally {
    if (!keepGenerated) {
        try {
            runStep({
                label: "Pulisci output generati dalla root",
                command: ["python3", "Dev/Tools/python/clean_generated_outputs.py"]
            });
        } catch (error) {
            exitCode = exitCode || (Number.isInteger(error.status) ? error.status : 1);
        }
    }
}

if (exitCode !== 0) process.exit(exitCode);

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
