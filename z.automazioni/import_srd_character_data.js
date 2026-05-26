#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { repoPath, rel } = require("./node_utils");

const ROOT = process.cwd();
const MODULE = repoPath(ROOT, "Dev/TemplateFactory/modules/srd_character_build.yaml");
const OUT_DIR = repoPath(ROOT, "z.automazioni/data/srd");
const GENERATED_BY = "import_srd_character_data";

function loadYaml(filePath) {
    const script = [
        "import json, sys",
        "import yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");

    const stdout = execFileSync("python3", ["-c", script, filePath], {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024
    });

    return JSON.parse(stdout);
}

function writeJson(target, payload) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(
        target,
        `${JSON.stringify({ ...payload, generated_by: GENERATED_BY }, null, 2)}\n`,
        "utf8"
    );
}

function main() {
    if (!fs.existsSync(MODULE)) {
        console.error(`Modulo SRD mancante: ${rel(ROOT, MODULE)}`);
        process.exit(1);
    }

    const module = loadYaml(MODULE);
    const core = module.core ?? {};
    const opzioni = module.opzioni ?? {};

    if (!core.statistiche?.length) {
        console.error("srd_character_build.yaml: core.statistiche mancante o vuoto");
        process.exit(1);
    }

    if (!opzioni.classi || !Object.keys(opzioni.classi).length) {
        console.error("srd_character_build.yaml: opzioni.classi mancante o vuoto");
        process.exit(1);
    }

    writeJson(repoPath(OUT_DIR, "core.json"), core);
    writeJson(repoPath(OUT_DIR, "opzioni_personaggio.json"), opzioni);

    console.log(
        `SRD character data importato: ${Object.keys(opzioni.classi).length} classi, ` +
        `${Object.keys(opzioni.specie ?? {}).length} specie, ` +
        `${Object.keys(opzioni.background ?? {}).length} background.`
    );
    console.log(`Output: ${rel(ROOT, OUT_DIR)}/`);
}

main();
