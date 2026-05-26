#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { readTextRel, repoPath } = require("./node_utils");
const { loadReleaseBoundary, materializedUserFiles } = require("./release_boundary_utils");
const { releasePluginProfile } = require("./release_plugin_profile");

const ROOT = process.cwd();
const MATRIX = "Dev/TemplateFactory/modules/plugin_matrix.yaml";
const CONTRACTS = "Dev/TemplateFactory/modules/plugin_contracts.yaml";
const BINDINGS = "Dev/TemplateFactory/modules/plugin_bindings.yaml";
const LIVE_ACCEPTANCE = "Dev/TemplateFactory/modules/live_acceptance.yaml";

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

function asStringList(value) {
    return Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : [];
}

function asBoolean(value, fallback = false) {
    return typeof value === "boolean" ? value : fallback;
}

function loadPolicy(matrixSource, errors) {
    const policy = matrixSource.audit_policy ?? {};
    const requiredTiers = new Set(asStringList(policy.required_tiers));
    const optionalAllowed = new Set(asStringList(policy.optional_allowed));
    const supportLightAllowed = new Set(asStringList(policy.support_light_allowed));
    const maintenanceAllowed = new Set(asStringList(policy.maintenance_allowed));
    const minimumGatesByTier = policy.minimum_gates_by_tier ?? {};
    const releaseEnabled = policy.release_enabled ?? {};
    const requireResolvedSurfaces = new Set(asStringList(releaseEnabled.require_resolved_surfaces));

    if (requiredTiers.size === 0) errors.push(`${MATRIX}: audit_policy.required_tiers vuoto`);
    if (Object.keys(minimumGatesByTier).length === 0) errors.push(`${MATRIX}: audit_policy.minimum_gates_by_tier vuoto`);
    if (optionalAllowed.size === 0) errors.push(`${MATRIX}: audit_policy.optional_allowed vuoto`);
    if (maintenanceAllowed.size === 0) errors.push(`${MATRIX}: audit_policy.maintenance_allowed vuoto`);
    if (requireResolvedSurfaces.size === 0) errors.push(`${MATRIX}: audit_policy.release_enabled.require_resolved_surfaces vuoto`);

    return {
        requiredTiers,
        optionalAllowed,
        supportLightAllowed,
        maintenanceAllowed,
        minimumGatesByTier,
        releaseEnabled: {
            requireContract: asBoolean(releaseEnabled.require_contract, true),
            requireBinding: asBoolean(releaseEnabled.require_binding, true),
            requireRuntimeProbe: asBoolean(releaseEnabled.require_runtime_probe, true),
            requireResolvedSurfaces
        }
    };
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
    try {
        const stdout = execFileSync("python3", ["z.automazioni/render_metadata_surfaces.py", "--list-targets"], {
            cwd: ROOT,
            encoding: "utf8",
            env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
            maxBuffer: 1024 * 1024
        });
        for (const line of stdout.split(/\r?\n/).filter(Boolean)) {
            targets.add(line);
            targets.add(line.replace(/\.(md|base)$/, ""));
        }
    } catch {
        // Il generation contract segnala gia problemi sui target metadata generati.
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

function tierFor(entry, requiredTiers) {
    const head = String(entry.class ?? "").split(/\s+/, 1)[0].toLowerCase();
    return requiredTiers.has(head) ? head : "";
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
const matrixSource = loadYaml(MATRIX);
const matrix = matrixSource.plugins ?? [];
const contracts = loadYaml(CONTRACTS).plugins ?? [];
const bindings = loadYaml(BINDINGS).bindings ?? {};
const liveAcceptance = loadYaml(LIVE_ACCEPTANCE);
const policy = loadPolicy(matrixSource, errors);
const generatedTargets = loadGeneratedTargets();
const virtualUserPaths = loadVirtualUserPaths();
const releaseProfile = releasePluginProfile(ROOT, loadReleaseBoundary(ROOT));
const releaseEnabledPlugins = releaseProfile.enabledPluginSet;
const runtimeProbeIds = new Set((liveAcceptance.plugin_runtime_probes ?? []).map(probe => String(probe.id ?? "").trim()).filter(Boolean));

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
    const tier = tierFor(entry, policy.requiredTiers);
    if (!tier) {
        errors.push(`${pluginId}: classe plugin non classificata (${entry.class})`);
        continue;
    }
    counts[tier] += 1;

    const isReleaseEnabled = releaseEnabledPlugins.has(pluginId);
    if (!contract && (!isReleaseEnabled || policy.releaseEnabled.requireContract)) {
        errors.push(`${pluginId}: manca plugin_contracts`);
    }
    if (!bindingRecord && (!isReleaseEnabled || policy.releaseEnabled.requireBinding)) {
        errors.push(`${pluginId}: manca plugin_bindings.plugin_id`);
    }
    if (contract && manifest.version && String(contract.version) !== String(manifest.version)) {
        errors.push(`${pluginId}: versione contratto diversa dal manifest`);
    }

    const requiredSurfaces = isReleaseEnabled
        ? policy.releaseEnabled.requireResolvedSurfaces
        : new Set(["guide", "operational", "smoke"]);
    if (requiredSurfaces.has("guide") && !targetExists(entry.guide, generatedTargets, virtualUserPaths)) errors.push(`${pluginId}: guide non risolta (${entry.guide})`);
    if (requiredSurfaces.has("operational") && !targetExists(entry.operational, generatedTargets, virtualUserPaths)) errors.push(`${pluginId}: superficie operativa non risolta (${entry.operational})`);
    if (requiredSurfaces.has("smoke") && !targetExists(entry.smoke, generatedTargets, virtualUserPaths)) errors.push(`${pluginId}: smoke non risolto (${entry.smoke})`);

    if (bindingRecord && !hasBindingSubstance(bindingRecord.binding)) {
        errors.push(`${pluginId}: binding tecnico senza responsabilita, uso, sintassi o config`);
    }
    if (bindingRecord?.binding?.config_path && !fs.existsSync(repoPath(ROOT, bindingRecord.binding.config_path))) {
        errors.push(`${pluginId}: config_path dichiarato ma mancante (${bindingRecord.binding.config_path})`);
    }

    const gates = contract?.gates ?? [];
    const minimumGates = Number(policy.minimumGatesByTier[tier] ?? 0);
    if (minimumGates > 0 && gates.length < minimumGates && !policy.supportLightAllowed.has(pluginId)) {
        errors.push(`${pluginId}: plugin ${tier} con meno di ${minimumGates} gate di verifica`);
    }
    if (tier === "opzionale" && !policy.optionalAllowed.has(pluginId)) {
        errors.push(`${pluginId}: plugin opzionale non approvato esplicitamente`);
    }
    if (tier === "manutenzione" && !policy.maintenanceAllowed.has(pluginId)) {
        errors.push(`${pluginId}: plugin manutenzione non approvato esplicitamente`);
    }
    if (isReleaseEnabled && policy.releaseEnabled.requireRuntimeProbe && !runtimeProbeIds.has(pluginId)) {
        errors.push(`${pluginId}: plugin incluso in release senza plugin_runtime_probes in ${LIVE_ACCEPTANCE}`);
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

for (const pluginId of runtimeProbeIds) {
    if (!releaseEnabledPlugins.has(pluginId)) {
        errors.push(`${pluginId}: plugin_runtime_probes presente ma plugin non incluso nel profilo release`);
    }
}

if (errors.length) {
    console.error("Plugin usage audit non valido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Plugin usage audit OK: ${community.length} plugin (${counts.core} core, ${counts.supporto} supporto, ${counts.opzionale} opzionale, ${counts.manutenzione} manutenzione).`);
