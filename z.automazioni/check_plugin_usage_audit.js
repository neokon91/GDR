#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { readTextRel, repoPath } = require("./node_utils");
const { materializedUserFiles } = require("./release_boundary_utils");

const ROOT = process.cwd();
const MATRIX = "Dev/TemplateFactory/modules/plugin_matrix.yaml";
const CONTRACTS = "Dev/TemplateFactory/modules/plugin_contracts.yaml";
const BINDINGS = "Dev/TemplateFactory/modules/plugin_bindings.yaml";

const REQUIRED_CLASSES = new Set(["core", "supporto", "opzionale", "manutenzione"]);
const OPTIONAL_ALLOWED = new Set(["fantasy-content-generator"]);
const SUPPORT_LIGHT_ALLOWED = new Set([
    "obsidian-icon-folder",
    "obsidian-style-settings",
    "table-editor-obsidian"
]);
const MAINTENANCE_ALLOWED = new Set(["obsidian-linter", "obsidian42-brat"]);

function loadYaml(relPath) {
    const script = [
        "import json, sys, yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");
    const stdout = execFileSync("python3", ["-c", script, repoPath(ROOT, relPath)], {
        encoding: "utf8",
        maxBuffer: 8 * 1024 * 1024
    });
    return JSON.parse(stdout);
}

function readJson(relPath, fallback = null) {
    try {
        return JSON.parse(fs.readFileSync(repoPath(ROOT, relPath), "utf8"));
    } catch {
        return fallback;
    }
}

function targetExists(target, generatedTargets, virtualUserPaths) {
    const clean = String(target ?? "").trim();
    if (!clean) return false;
    if (/^https?:/.test(clean)) return true;
    const candidates = [
        clean,
        `${clean}.md`,
        `${clean}.base`,
        `${clean}.canvas`,
        `${clean}.excalidraw.md`
    ];
    return candidates.some(candidate =>
        fs.existsSync(repoPath(ROOT, candidate)) ||
        generatedTargets.has(candidate) ||
        virtualUserPaths.has(candidate) ||
        virtualUserPaths.has(candidate.replace(/\.md$/, ""))
    );
}

function loadGeneratedTargets() {
    const targets = new Set();
    try {
        const stdout = execFileSync("python3", ["-c", [
            "import json, sys",
            "from pathlib import Path",
            "root = Path.cwd()",
            "sys.path.insert(0, str(root / 'z.automazioni'))",
            "from render_template_factory import materialized_targets",
            "from template_factory_utils import load_modules, resolved_blueprints, ROOT",
            "for name, blueprint in resolved_blueprints(load_modules()).items():",
            "    for target in materialized_targets(name, blueprint):",
            "        print(str(target.relative_to(ROOT)))"
        ].join("\n")], {
            cwd: ROOT,
            encoding: "utf8",
            env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
            maxBuffer: 1024 * 1024
        });
        for (const line of stdout.split(/\r?\n/).filter(Boolean)) {
            targets.add(line);
            targets.add(line.replace(/\.md$/, ""));
        }
    } catch {
        // Il generation contract segnala gia problemi sui target generati.
    }
    return targets;
}

function loadVirtualUserPaths() {
    const paths = new Set();
    for (const file of materializedUserFiles(ROOT)) {
        const fileRel = String(file.path ?? "").replace(/\\/g, "/");
        if (!fileRel) continue;
        paths.add(fileRel);
        paths.add(fileRel.replace(/\.md$/, ""));
        let currentDir = path.dirname(fileRel).replace(/\\/g, "/");
        while (currentDir && currentDir !== ".") {
            paths.add(currentDir);
            currentDir = path.dirname(currentDir).replace(/\\/g, "/");
        }
    }
    return paths;
}

function tierFor(entry) {
    const head = String(entry.class ?? "").split(/\s+/, 1)[0].toLowerCase();
    return REQUIRED_CLASSES.has(head) ? head : "";
}

function hasBindingSubstance(binding) {
    return Boolean(
        binding?.responsibility ||
        binding?.use_for ||
        binding?.fields ||
        binding?.codeblock ||
        binding?.inline_syntax ||
        binding?.config_path ||
        binding?.output_targets ||
        binding?.required_frontmatter
    );
}

const errors = [];
const community = readJson(".obsidian/community-plugins.json", []);
const matrix = loadYaml(MATRIX).plugins ?? [];
const contracts = loadYaml(CONTRACTS).plugins ?? [];
const bindings = loadYaml(BINDINGS).bindings ?? {};
const generatedTargets = loadGeneratedTargets();
const virtualUserPaths = loadVirtualUserPaths();

const matrixById = new Map(matrix.map(entry => [entry.id, entry]));
const contractById = new Map(contracts.map(entry => [entry.id, entry]));
const bindingByPluginId = new Map(Object.entries(bindings)
    .filter(([, binding]) => binding?.plugin_id)
    .map(([name, binding]) => [binding.plugin_id, { name, binding }]));

const counts = { core: 0, supporto: 0, opzionale: 0, manutenzione: 0 };

for (const pluginId of community) {
    const entry = matrixById.get(pluginId);
    const contract = contractById.get(pluginId);
    const bindingRecord = bindingByPluginId.get(pluginId);
    const manifest = readJson(`.obsidian/plugins/${pluginId}/manifest.json`, {});

    if (!entry) {
        errors.push(`${pluginId}: plugin installato senza plugin_matrix`);
        continue;
    }
    const tier = tierFor(entry);
    if (!tier) {
        errors.push(`${pluginId}: classe plugin non classificata (${entry.class})`);
        continue;
    }
    counts[tier] += 1;

    if (!contract) errors.push(`${pluginId}: manca plugin_contracts`);
    if (!bindingRecord) errors.push(`${pluginId}: manca plugin_bindings.plugin_id`);
    if (contract && manifest.version && String(contract.version) !== String(manifest.version)) {
        errors.push(`${pluginId}: versione contratto diversa dal manifest`);
    }

    if (!targetExists(entry.guide, generatedTargets, virtualUserPaths)) errors.push(`${pluginId}: guide non risolta (${entry.guide})`);
    if (!targetExists(entry.operational, generatedTargets, virtualUserPaths)) errors.push(`${pluginId}: superficie operativa non risolta (${entry.operational})`);
    if (!targetExists(entry.smoke, generatedTargets, virtualUserPaths)) errors.push(`${pluginId}: smoke non risolto (${entry.smoke})`);

    if (bindingRecord && !hasBindingSubstance(bindingRecord.binding)) {
        errors.push(`${pluginId}: binding tecnico senza responsabilita, uso, sintassi o config`);
    }
    if (bindingRecord?.binding?.config_path && !fs.existsSync(repoPath(ROOT, bindingRecord.binding.config_path))) {
        errors.push(`${pluginId}: config_path dichiarato ma mancante (${bindingRecord.binding.config_path})`);
    }

    const gates = contract?.gates ?? [];
    if ((tier === "core" || tier === "supporto") && gates.length < 2 && !SUPPORT_LIGHT_ALLOWED.has(pluginId)) {
        errors.push(`${pluginId}: plugin ${tier} con meno di due gate di verifica`);
    }
    if (tier === "opzionale" && !OPTIONAL_ALLOWED.has(pluginId)) {
        errors.push(`${pluginId}: plugin opzionale non approvato esplicitamente`);
    }
    if (tier === "manutenzione" && !MAINTENANCE_ALLOWED.has(pluginId)) {
        errors.push(`${pluginId}: plugin manutenzione non approvato esplicitamente`);
    }

    const searchableText = [
        readTextRel(ROOT, entry.guide, ""),
        readTextRel(ROOT, entry.operational, ""),
        readTextRel(ROOT, "Dev/Integrazioni Plugin.md", ""),
        readTextRel(ROOT, "Dev/Plugin Technical Reference.md", "")
    ].join("\n");
    if (!searchableText.includes(entry.name) && !searchableText.includes(pluginId)) {
        errors.push(`${pluginId}: documentazione/superficie non cita nome o id plugin`);
    }
}

for (const pluginId of matrixById.keys()) {
    if (!community.includes(pluginId)) errors.push(`${pluginId}: plugin in matrice ma non installato`);
}

if (errors.length) {
    console.error("Plugin usage audit non valido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Plugin usage audit OK: ${community.length} plugin (${counts.core} core, ${counts.supporto} supporto, ${counts.opzionale} opzionale, ${counts.manutenzione} manutenzione).`);
