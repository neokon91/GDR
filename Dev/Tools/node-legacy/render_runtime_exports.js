#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const SOURCE = "Dev/Source/YAML/json/runtime_exports.yaml";

function loadYaml(relPath) {
    const script = [
        "import json, sys, yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");
    const stdout = execFileSync("python3", ["-c", script, path.join(ROOT, relPath)], {
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024
    });
    return JSON.parse(stdout);
}

function normalizeSpecs(entries) {
    return Array.isArray(entries)
        ? entries.map(entry => ({
            key: String(entry?.key ?? "").trim(),
            path: String(entry?.path ?? "").replace(/\\/g, "/").trim()
        })).filter(entry => entry.key && entry.path)
        : [];
}

function runtimeModules(source) {
    const groups = {};
    for (const [groupId, entries] of Object.entries(source.runtime_modules ?? {})) {
        groups[groupId] = normalizeSpecs(entries);
    }
    return groups;
}

function commonjsRuntime(source) {
    const runtime = source.commonjs_runtime ?? {};
    return {
        entrypoints: normalizeSpecs(runtime.entrypoints),
        local_dependencies: normalizeSpecs(runtime.local_dependencies),
        data_dependencies: normalizeSpecs(runtime.data_dependencies)
    };
}

function main() {
    const source = loadYaml(SOURCE);
    const target = String(source.runtime_data ?? "z.automazioni/data/runtime/runtime_exports.json").trim();
    const payload = {
        generated_by: "render_runtime_exports",
        generated_from: SOURCE,
        source: SOURCE,
        purpose: "Registry runtime dei moduli caricati dal bridge DataviewJS e delle dipendenze CommonJS Templater.",
        commonjs_runtime: commonjsRuntime(source),
        runtime_modules: runtimeModules(source)
    };

    const outPath = path.join(ROOT, target);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(`Runtime exports data renderizzato: ${target}`);
}

main();
