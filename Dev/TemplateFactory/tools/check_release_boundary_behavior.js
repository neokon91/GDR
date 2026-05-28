#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { loadReleaseBoundary } = require("./release_boundary_utils");
const { repoPath, walk } = require("./node_utils");

const ROOT = process.cwd();
const TEMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "vault-gdr-boundary-check-"));
const OUT = path.join(TEMP_ROOT, "vault-gdr-clean");
const ZIP = `${OUT}.zip`;
const errors = [];

function fail(message) {
    errors.push(message);
}

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function existsRel(root, relPath) {
    return fs.existsSync(path.join(root, relPath));
}

function readText(file) {
    return fs.readFileSync(file, "utf8");
}

function rel(file) {
    return path.relative(OUT, file).replace(/\\/g, "/");
}

function walkEntries(root, entries = []) {
    if (!fs.existsSync(root)) return entries;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        const fullPath = path.join(root, entry.name);
        entries.push(rel(fullPath));
        if (entry.isDirectory()) walkEntries(fullPath, entries);
    }
    return entries;
}

function readJsonRel(relPath, fallback = {}) {
    try {
        return JSON.parse(readText(path.join(OUT, relPath)));
    } catch (error) {
        fail(`${relPath}: JSON release non leggibile (${error.message})`);
        return fallback;
    }
}

function runtimeModulePaths(manifest) {
    const paths = new Set();
    for (const group of Object.values(manifest.runtime_modules ?? {})) {
        for (const spec of asArray(group)) {
            if (typeof spec?.path === "string" && spec.path.trim()) {
                paths.add(spec.path.replace(/\\/g, "/").trim());
            }
        }
    }
    return paths;
}

function resolveJsRequire(sourceFile, request) {
    const sourceDir = path.dirname(sourceFile);
    const raw = path.resolve(sourceDir, request);
    const candidates = [
        raw,
        `${raw}.js`,
        path.join(raw, "index.js")
    ];
    return candidates.find(candidate => fs.existsSync(candidate)) ?? candidates[1];
}

function validateCopyPolicy(boundary, entries) {
    const copyPolicy = boundary.copy_policy ?? {};
    const includedRoots = new Set(asArray(copyPolicy.included_roots));
    const includedRootFiles = new Set(asArray(copyPolicy.included_root_files));
    const generatedRoots = new Set(asArray(boundary.generated_release_roots));
    const requiredRootFiles = new Set(asArray(boundary.required_files).filter(file => !file.includes("/")));
    const generatedRootFiles = new Set(["LEGGIMI.md"]);

    for (const entry of entries) {
        const top = entry.split("/")[0];
        if (!entry.includes("/")) {
            if (
                includedRoots.has(entry)
                || generatedRoots.has(entry)
                || includedRootFiles.has(entry)
                || requiredRootFiles.has(entry)
                || generatedRootFiles.has(entry)
            ) {
                continue;
            }
            fail(`release boundary: root non dichiarato copiato (${entry})`);
            continue;
        }

        if (!includedRoots.has(top) && !generatedRoots.has(top)) {
            fail(`release boundary: path fuori root consentite (${entry})`);
        }
    }

    for (const relPath of asArray(copyPolicy.excluded_dirs)) {
        if (entries.some(entry => entry === relPath || entry.startsWith(`${relPath}/`))) {
            fail(`release boundary: directory esclusa presente (${relPath})`);
        }
    }

    for (const relPath of asArray(copyPolicy.excluded_root_files)) {
        if (entries.includes(relPath)) fail(`release boundary: root file escluso presente (${relPath})`);
    }

    for (const relPath of asArray(boundary.forbidden_roots)) {
        if (entries.some(entry => entry === relPath || entry.startsWith(`${relPath}/`))) {
            fail(`release boundary: root vietata presente (${relPath})`);
        }
    }

    for (const relPath of asArray(boundary.forbidden_paths)) {
        if (entries.some(entry => entry === relPath || entry.startsWith(`${relPath}/`))) {
            fail(`release boundary: path vietato presente (${relPath})`);
        }
    }

    for (const name of asArray(copyPolicy.excluded_risorse)) {
        const relPath = `Risorse/${name}`;
        if (entries.some(entry => entry === relPath || entry.startsWith(`${relPath}/`))) {
            fail(`release boundary: risorsa esclusa presente (${relPath})`);
        }
    }

    for (const name of asArray(copyPolicy.excluded_automazioni)) {
        const relPath = `z.automazioni/${name}`;
        if (entries.some(entry => entry === relPath || entry.startsWith(`${relPath}/`))) {
            fail(`release boundary: automazione esclusa presente (${relPath})`);
        }
    }

    for (const entry of entries.filter(item => item.startsWith("z.automazioni/"))) {
        const basename = path.basename(entry);
        if (asArray(boundary.forbidden_automation_prefixes).some(prefix => basename.startsWith(prefix))) {
            fail(`release boundary: script tecnico con prefisso vietato presente (${entry})`);
        }
    }
}

function validateRequiredFiles(boundary) {
    for (const relPath of asArray(boundary.required_files)) {
        if (!existsRel(OUT, relPath)) fail(`release boundary: required file mancante (${relPath})`);
    }

    for (const relPath of asArray(boundary.generated_release_roots)) {
        if (!existsRel(OUT, relPath)) fail(`release boundary: root generata mancante (${relPath})`);
    }

    for (const file of asArray(boundary.materialized_user_files)) {
        const relPath = String(file.path ?? "").replace(/\\/g, "/");
        if (relPath && !existsRel(OUT, relPath)) fail(`release boundary: materialized user file mancante (${relPath})`);
    }

    for (const moduleName of asArray(boundary.runtime_template_modules)) {
        const yamlPath = `z.automazioni/runtime_modules/${moduleName}`;
        const jsonPath = yamlPath.replace(/\.ya?ml$/, ".json");
        if (!existsRel(OUT, yamlPath)) fail(`release boundary: modulo YAML runtime mancante (${yamlPath})`);
        if (!existsRel(OUT, jsonPath)) fail(`release boundary: modulo JSON runtime mancante (${jsonPath})`);
    }
}

function validateHiddenTechnicalRoots(boundary) {
    const appConfig = readJsonRel(".obsidian/app.json", {});
    const filters = new Set(appConfig.userIgnoreFilters ?? []);
    for (const filter of asArray(boundary.copy_policy?.required_user_ignore_filters)) {
        if (!filters.has(filter)) fail(`release boundary: filtro navigazione utente mancante (${filter})`);
    }
}

function validateForbiddenText(boundary) {
    for (const file of walk(OUT, {
        predicate: item => /\.(md|ya?ml|json|js)$/i.test(item)
    })) {
        const text = readText(file);
        const relPath = rel(file);
        for (const marker of asArray(boundary.forbidden_text_markers)) {
            if (text.includes(marker)) fail(`release boundary: marker vietato in ${relPath} (${marker})`);
        }
    }
}

function validateLocalJsDependencies() {
    const files = walk(OUT, {
        predicate: item => item.endsWith(".js") && (
            rel(item).startsWith("z.automazioni/")
            || rel(item).startsWith("z.engine/")
        )
    });
    const requirePattern = /\brequire\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/g;
    const adapterReadPattern = /app\.vault\.adapter\.read\(\s*["']([^"']+)["']\s*\)/g;

    for (const file of files) {
        const source = readText(file);
        let match;
        while ((match = requirePattern.exec(source))) {
            const resolved = resolveJsRequire(file, match[1]);
            if (!fs.existsSync(resolved)) {
                fail(`release boundary: require locale mancante in ${rel(file)} -> ${match[1]}`);
            }
        }

        while ((match = adapterReadPattern.exec(source))) {
            const target = match[1].replace(/\\/g, "/");
            if (!existsRel(OUT, target)) {
                fail(`release boundary: app.vault.adapter.read punta a file assente in ${rel(file)} -> ${target}`);
            }
        }
    }
}

function validateBridgeRuntime(boundary) {
    const bridgePath = path.join(OUT, "z.engine/session_views.js");
    if (!fs.existsSync(bridgePath)) {
        fail("release boundary: session_views.js mancante");
        return;
    }

    const bridge = readText(bridgePath);
    if (!bridge.includes("z.automazioni/data/runtime/runtime_exports.json")) {
        fail("release boundary: session_views.js non legge runtime_exports.json");
    }
    const runtimeManifest = readJsonRel("z.automazioni/data/runtime/runtime_exports.json", { runtime_modules: {} });
    const runtimePaths = runtimeModulePaths(runtimeManifest);
    for (const moduleName of asArray(boundary.bridge_runtime_modules)) {
        const modulePath = `z.engine/${moduleName}`;
        if (!runtimePaths.has(modulePath)) {
            fail(`release boundary: runtime_exports.json non dichiara ${modulePath}`);
        }
        if (!existsRel(OUT, modulePath)) {
            fail(`release boundary: modulo bridge mancante (${modulePath})`);
        }
    }
}

function validateZip() {
    if (!fs.existsSync(ZIP)) {
        fail("release boundary: zip non generato");
        return;
    }

    try {
        execFileSync("unzip", ["-tq", ZIP], { cwd: ROOT, stdio: "ignore" });
    } catch {
        fail("release boundary: zip non valido");
    }
}

const boundary = loadReleaseBoundary(ROOT);

try {
    execFileSync("node", ["Dev/TemplateFactory/tools/release_clean.js", "--quiet", "--out", OUT], {
        cwd: ROOT,
        stdio: "inherit"
    });

    const entries = walkEntries(OUT);
    validateCopyPolicy(boundary, entries);
    validateRequiredFiles(boundary);
    validateHiddenTechnicalRoots(boundary);
    validateForbiddenText(boundary);
    validateLocalJsDependencies();
    validateBridgeRuntime(boundary);
    validateZip();
} finally {
    fs.rmSync(TEMP_ROOT, { recursive: true, force: true });
}

if (errors.length) {
    console.error("Release boundary non valido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Release boundary OK: copy policy, esclusioni dev, marker vietati, runtime bridge e dipendenze JS locali verificati.");
