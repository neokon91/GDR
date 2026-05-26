#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { FIXTURE_SCENARIO } = require("./generate_demo_fixture");
const { DEMO_FILES, DEMO_WORLD_FILE, generateDemoWorld } = require("./generate_demo_world");
const { existsRel, parseFrontmatter, readJson, readTextRel, repoPath, walk } = require("./node_utils");

const ROOT = process.cwd();
const CONTRACT = "Dev/TemplateFactory/modules/demo_contract.yaml";

function loadYaml(relPath) {
    const script = [
        "import json, sys, yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");
    const stdout = execFileSync("python3", ["-c", script, repoPath(ROOT, relPath)], {
        encoding: "utf8",
        maxBuffer: 1024 * 1024
    });
    return JSON.parse(stdout);
}

function fail(errors, message) {
    errors.push(message);
}

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function validateGenerators(errors, contract, packageJson) {
    const generators = contract.generators ?? {};
    for (const [id, generator] of Object.entries(generators)) {
        if (!generator.script || !existsRel(ROOT, generator.script)) {
            fail(errors, `demo_contract.generators.${id}: script mancante (${generator.script})`);
        }
        if (!generator.npm || !packageJson.scripts?.[generator.npm]) {
            fail(errors, `demo_contract.generators.${id}: script npm mancante (${generator.npm})`);
        }
        if (!generator.role) {
            fail(errors, `demo_contract.generators.${id}: role mancante`);
        }
    }
}

function validateForbiddenSources(errors, contract) {
    // La demo finale deve restare artefatto generato: nessuna nota demo sorgente nel vault.
    if (contract.policy?.source_demo_allowed !== false) {
        fail(errors, "demo_contract.policy.source_demo_allowed deve restare false");
    }

    const forbidden = asArray(contract.checks?.forbidden_source_files);
    if (!forbidden.includes(DEMO_WORLD_FILE)) {
        fail(errors, `demo_contract: demo world vietata non dichiarata (${DEMO_WORLD_FILE})`);
    }

    for (const relPath of forbidden) {
        if (existsRel(ROOT, relPath)) {
            fail(errors, `demo sorgente presente ma vietata: ${relPath}`);
        }
    }
}

function validateChecks(errors, contract, packageJson) {
    for (const scriptName of asArray(contract.checks?.required_npm)) {
        if (!packageJson.scripts?.[scriptName]) {
            fail(errors, `demo_contract.checks.required_npm: script mancante (${scriptName})`);
        }
    }

    const packageCheck = packageJson.scripts?.check ?? "";
    for (const scriptName of asArray(contract.checks?.required_npm)) {
        if (!packageCheck.includes(`npm run ${scriptName}`)) {
            fail(errors, `package.json check non esegue ${scriptName}`);
        }
    }
}

function validateMinimumScenario(errors, contract) {
    // La fixture M11 e il contratto demo devono coprire la stessa catena narrativa minima.
    const requiredCategories = new Set(asArray(contract.final_demo_minimum?.categories));
    for (const category of FIXTURE_SCENARIO.requiredCategories) {
        if (!requiredCategories.has(category)) {
            fail(errors, `demo_contract.final_demo_minimum.categories non copre fixture M11 (${category})`);
        }
    }
    if (!requiredCategories.has("evento storico")) {
        fail(errors, "demo_contract.final_demo_minimum.categories deve includere evento storico/conseguenza");
    }

    for (const field of ["scelta", "conseguenza", "entita_impattate", "propaga_a", "propagazione_stato", "player_safe"]) {
        if (!asArray(contract.final_demo_minimum?.flows).includes(field)) {
            fail(errors, `demo_contract.final_demo_minimum.flows: campo mancante (${field})`);
        }
    }

    for (const surface of asArray(contract.final_demo_minimum?.player_safe_surfaces)) {
        if (!existsRel(ROOT, surface)) {
            fail(errors, `demo_contract.final_demo_minimum.player_safe_surfaces mancante (${surface})`);
        }
    }
}

function validateDemoWorldGenerator(errors, contract) {
    const tempParent = fs.mkdtempSync(path.join(os.tmpdir(), "gdr-demo-world-"));
    try {
        const result = generateDemoWorld({
            root: tempParent,
            outDir: "release",
            create: true,
            force: true
        });
        const expected = new Set(DEMO_FILES);
        for (const relPath of expected) {
            if (!result.files.includes(relPath)) {
                fail(errors, `generate_demo_world: output non dichiara ${relPath}`);
            }
            if (!fs.existsSync(path.join(result.root, relPath))) {
                fail(errors, `generate_demo_world: file non generato (${relPath})`);
            }
        }

        const notes = walk(result.root, {
            predicate: file => file.endsWith(".md")
        }).map(file => ({
            relPath: path.relative(result.root, file).replace(/\\/g, "/"),
            frontmatter: parseFrontmatter(fs.readFileSync(file, "utf8"))
        }));
        const categories = new Set(notes.map(note => String(note.frontmatter.categoria ?? "")));
        for (const category of asArray(contract.final_demo_minimum?.categories)) {
            if (!categories.has(category)) {
                fail(errors, `generate_demo_world: categoria minima non generata (${category})`);
            }
        }

        for (const field of asArray(contract.final_demo_minimum?.flows)) {
            if (!notes.some(note => note.frontmatter[field] !== undefined && String(note.frontmatter[field] ?? "").length > 0)) {
                fail(errors, `generate_demo_world: campo flusso minimo assente (${field})`);
            }
        }

        if (!notes.some(note => note.frontmatter.pubblico === true && String(note.frontmatter.player_safe ?? "").length > 0)) {
            fail(errors, "generate_demo_world: nessun materiale pubblico player_safe");
        }
        if (!notes.some(note => note.frontmatter.attiva === true && note.frontmatter.categoria === "sessione")) {
            fail(errors, "generate_demo_world: nessuna sessione demo attiva");
        }
    } finally {
        fs.rmSync(tempParent, { recursive: true, force: true });
    }
}

function validateDocs(errors) {
    const smokeText = readTextRel(ROOT, "Dev/Smoke Demo Finale.md");
    for (const marker of ["demo_contract.yaml", "generate:demo-fixture", "generate:demo-world"]) {
        if (!smokeText.includes(marker)) {
            fail(errors, `Dev/Smoke Demo Finale.md non cita ${marker}`);
        }
    }
}

const errors = [];
const contract = loadYaml(CONTRACT);
const packageJson = readJson(repoPath(ROOT, "package.json"), {});

if (contract.id !== "demo_contract") fail(errors, "demo_contract: id non allineato");
if (contract.status !== "pre_finale") fail(errors, "demo_contract: status deve restare pre_finale finche la demo non e finale");

validateGenerators(errors, contract, packageJson);
validateForbiddenSources(errors, contract);
validateChecks(errors, contract, packageJson);
validateMinimumScenario(errors, contract);
validateDemoWorldGenerator(errors, contract);
validateDocs(errors);

if (errors.length) {
    console.error("Demo contract non valido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Demo contract OK: generatori, divieti sorgente, gate e scenario minimo verificati.");
