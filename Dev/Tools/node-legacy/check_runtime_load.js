#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const RUNTIME_EXPORTS_SOURCE = "Dev/Source/YAML/json/runtime_exports.yaml";
const errors = [];

function loadYamlModule(relPath) {
    try {
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
    } catch (error) {
        errors.push(`${relPath}: YAML non leggibile (${error.message})`);
        return {};
    }
}

function readJsonRel(relPath) {
    try {
        return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), "utf8"));
    } catch (error) {
        errors.push(`${relPath}: JSON non leggibile (${error.message})`);
        return [];
    }
}

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireStringArray(source, key, sourcePath) {
    const values = Array.isArray(source?.[key])
        ? source[key].map(value => String(value).trim()).filter(Boolean)
        : [];
    if (!values.length) errors.push(`${sourcePath}: ${key} mancante o vuoto`);
    return values;
}

function requireObjectArray(source, key, sourcePath) {
    const values = Array.isArray(source?.[key])
        ? source[key].filter(isPlainObject)
        : [];
    if (!values.length) errors.push(`${sourcePath}: ${key} mancante o vuoto`);
    return values;
}

function stringList(source, key) {
    return Array.isArray(source?.[key])
        ? source[key].map(value => String(value).trim()).filter(Boolean)
        : [];
}

function jsonText(data) {
    return `${JSON.stringify(data, null, 2)}\n`;
}

function runtimeModuleSpecs(source, sourcePath) {
    const groups = source?.runtime_modules;
    if (!isPlainObject(groups)) {
        errors.push(`${sourcePath}: runtime_modules mancante o non valido`);
        return { groups: {}, modules: [] };
    }

    const normalizedGroups = {};
    const modules = [];
    const seenKeys = new Set();
    for (const [groupId, entries] of Object.entries(groups)) {
        if (!Array.isArray(entries) || !entries.length) {
            errors.push(`${sourcePath}: runtime_modules.${groupId} deve essere lista non vuota`);
            normalizedGroups[groupId] = [];
            continue;
        }
        normalizedGroups[groupId] = entries.map((entry, index) => {
            const key = String(entry?.key ?? "").trim();
            const modulePath = String(entry?.path ?? "").trim();
            if (!key) errors.push(`${sourcePath}: runtime_modules.${groupId}[${index}] senza key`);
            if (!modulePath) errors.push(`${sourcePath}: runtime_modules.${groupId}[${index}] senza path`);
            if (key && seenKeys.has(key)) errors.push(`${sourcePath}: runtime module key duplicata (${key})`);
            if (key) seenKeys.add(key);
            if (modulePath) modules.push(modulePath);
            return { key, path: modulePath };
        });
    }

    for (const groupId of ["shared_context", "continuity_context", "session_context"]) {
        if (!normalizedGroups[groupId]?.length) errors.push(`${sourcePath}: runtime_modules.${groupId} mancante`);
    }

    return { groups: normalizedGroups, modules };
}

function normalizeSpecList(source, key, sourcePath, { required = true } = {}) {
    const entries = source?.[key];
    if (!Array.isArray(entries) || (required && !entries.length)) {
        errors.push(`${sourcePath}.${key}: lista mancante o vuota`);
        return [];
    }

    const seenKeys = new Set();
    const seenPaths = new Set();
    return entries.map((entry, index) => {
        const id = `${sourcePath}.${key}[${index}]`;
        const specKey = String(entry?.key ?? "").trim();
        const specPath = String(entry?.path ?? "").replace(/\\/g, "/").trim();
        if (!specKey) errors.push(`${id}: key mancante`);
        if (!specPath) errors.push(`${id}: path mancante`);
        if (specKey && seenKeys.has(specKey)) errors.push(`${sourcePath}.${key}: key duplicata (${specKey})`);
        if (specPath && seenPaths.has(specPath)) errors.push(`${sourcePath}.${key}: path duplicato (${specPath})`);
        if (specKey) seenKeys.add(specKey);
        if (specPath) seenPaths.add(specPath);
        return { key: specKey, path: specPath };
    });
}

function resolveLocalJs(sourceRelPath, request) {
    const sourceDir = path.dirname(path.join(ROOT, sourceRelPath));
    const raw = path.resolve(sourceDir, request);
    const candidates = [
        raw,
        `${raw}.js`,
        path.join(raw, "index.js")
    ];
    const resolved = candidates.find(candidate => fs.existsSync(candidate)) ?? candidates[1];
    return path.relative(ROOT, resolved).replace(/\\/g, "/");
}

function localJsDependencies(sourceRelPath) {
    const source = fs.existsSync(path.join(ROOT, sourceRelPath))
        ? fs.readFileSync(path.join(ROOT, sourceRelPath), "utf8")
        : "";
    const dependencies = [];
    const requirePattern = /\b(?:require|optionalRequire)\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/g;
    let match;
    while ((match = requirePattern.exec(source))) {
        dependencies.push(resolveLocalJs(sourceRelPath, match[1]));
    }
    return dependencies;
}

function commonJsRuntimeSpecs(source, sourcePath) {
    const commonjs = source?.commonjs_runtime;
    if (!isPlainObject(commonjs)) {
        errors.push(`${sourcePath}: commonjs_runtime mancante o non valido`);
        return { entrypoints: [], local_dependencies: [], data_dependencies: [], modules: [], data: [] };
    }

    const commonjsPath = `${sourcePath}.commonjs_runtime`;
    const entrypoints = normalizeSpecList(commonjs, "entrypoints", commonjsPath);
    const localDependencies = normalizeSpecList(commonjs, "local_dependencies", commonjsPath);
    const dataDependencies = normalizeSpecList(commonjs, "data_dependencies", commonjsPath);
    const modules = [...entrypoints, ...localDependencies].map(spec => spec.path).filter(Boolean);
    const data = dataDependencies.map(spec => spec.path).filter(Boolean);
    const declaredRuntimePaths = new Set([...modules, ...data]);

    for (const modulePath of modules) {
        if (!modulePath.endsWith(".js")) {
            errors.push(`${commonjsPath}: modulo CommonJS non JS (${modulePath})`);
            continue;
        }

        for (const dependency of localJsDependencies(modulePath)) {
            if (!dependency.startsWith("z.automazioni/") && !dependency.startsWith("z.engine/")) continue;
            if (!declaredRuntimePaths.has(dependency)) {
                errors.push(`${commonjsPath}: dipendenza locale non dichiarata (${modulePath} -> ${dependency})`);
            }
        }
    }

    return {
        entrypoints,
        local_dependencies: localDependencies,
        data_dependencies: dataDependencies,
        modules,
        data
    };
}

function validatePathRegistryRuntime() {
    const contractPath = "z.automazioni/data/runtime/session_context.json";
    const contract = readJsonRel(contractPath);
    const registry = contract?.path_registry;
    if (!isPlainObject(registry) || !Object.keys(registry).length) {
        errors.push(`${contractPath}: path_registry mancante o vuoto`);
        return;
    }

    try {
        const helperPaths = require(path.join(ROOT, "z.automazioni/helper_paths.js"));
        if (JSON.stringify(helperPaths.PATHS ?? {}) !== JSON.stringify(registry)) {
            errors.push("z.automazioni/helper_paths.js: PATHS non allineato a session_context.json.path_registry");
        }
    } catch (error) {
        errors.push(`z.automazioni/helper_paths.js: caricamento path registry fallito (${error.message})`);
    }
}

function validateSourceRoutes(routes, sourcePath) {
    for (const [index, route] of routes.entries()) {
        const id = String(route.id ?? `source_routes[${index}]`);
        const hasExact = route.exact !== undefined && String(route.exact).trim();
        const hasContains = route.contains !== undefined && String(route.contains).trim();
        const hasAny = stringList(route, "when_any").length > 0;
        const hasAll = stringList(route, "when_all").length > 0;
        if (!hasExact && !hasContains && !hasAny && !hasAll) {
            errors.push(`${sourcePath}: ${id} senza condizione Dataview`);
        }
        if (!stringList(route, "include_prefixes").length) {
            errors.push(`${sourcePath}: ${id} senza include_prefixes`);
        }
    }
}

function pageCollection(items) {
    return {
        where(predicate) {
            return pageCollection(items.filter(predicate));
        },
        sort(mapper, direction = "asc") {
            const ordered = [...items].sort((a, b) => {
                const left = mapper(a);
                const right = mapper(b);
                return left > right ? 1 : left < right ? -1 : 0;
            });
            return pageCollection(direction === "desc" ? ordered.reverse() : ordered);
        },
        limit(count) {
            return pageCollection(items.slice(0, count));
        },
        map(mapper) {
            return pageCollection(items.map(mapper));
        },
        forEach(callback) {
            items.forEach(callback);
        },
        some(predicate) {
            return items.some(predicate);
        },
        first() {
            return items[0] ?? null;
        },
        array() {
            return items;
        },
        get length() {
            return items.length;
        }
    };
}

function routeMatches(query, route) {
    if (route.exact !== undefined && query.trim() !== String(route.exact).trim()) return false;
    if (route.contains !== undefined && !query.includes(String(route.contains))) return false;

    const requiredTerms = stringList(route, "when_all");
    if (requiredTerms.length && !requiredTerms.every(term => query.includes(term))) return false;

    const optionalTerms = stringList(route, "when_any");
    if (optionalTerms.length && !optionalTerms.some(term => query.includes(term))) return false;

    return route.exact !== undefined || route.contains !== undefined || requiredTerms.length > 0 || optionalTerms.length > 0;
}

function pagesForSource(source, fixturePages, sourceRoutes) {
    const query = String(source ?? "");
    const route = sourceRoutes.find(candidate => routeMatches(query, candidate));
    if (!route) return [];

    const prefixes = stringList(route, "include_prefixes");
    return fixturePages.filter(page => {
        const filePath = String(page?.file?.path ?? "");
        return prefixes.some(prefix => filePath.startsWith(prefix));
    });
}

function makeDataviewMock(rendered, fixturePages, sourceRoutes) {
    return {
        array(items) {
            return pageCollection(Array.isArray(items) ? items : items ? [items] : []);
        },
        el(tag, text = "", options = {}) {
            const node = { tag, text, options, innerHTML: "" };
            rendered.push(node);
            return node;
        },
        header(level, text) {
            rendered.push({ tag: `h${level}`, text, innerHTML: text });
        },
        pages(source) {
            return pageCollection(pagesForSource(source, fixturePages, sourceRoutes));
        },
        page(link) {
            const key = String(link?.path ?? link ?? "");
            return fixturePages.find(page => page.file.path === key || page.file.link === key || page.file.name === key || page.file.name === key.replace(/\.md$/, "")) ?? null;
        },
        paragraph(text) {
            rendered.push({ tag: "p", text, innerHTML: text });
        },
        table(headers, rows) {
            rendered.push({ tag: "table", headers, rows, text: rows.flat().join(" "), innerHTML: rows.flat().join(" ") });
        }
    };
}

function callNames(step) {
    if (typeof step.call === "string" && step.call.trim()) return [step.call.trim()];
    if (Array.isArray(step.calls)) return step.calls.map(name => String(name).trim()).filter(Boolean);
    return [];
}

function callArgs(step) {
    if (Array.isArray(step.args)) return step.args;
    return step.args === undefined ? [] : [step.args];
}

function nodeContent(node, field = "content") {
    if (field === "html") return String(node.innerHTML ?? "");
    if (field === "text") return String(node.text ?? "");
    return [node.innerHTML, node.text, Array.isArray(node.rows) ? node.rows.flat().join(" ") : ""]
        .map(value => String(value ?? ""))
        .join(" ");
}

function nodeMatchesCriterion(node, criterion) {
    if (!isPlainObject(criterion)) return false;
    if (criterion.tag !== undefined && node.tag !== String(criterion.tag)) return false;
    if (criterion.contains !== undefined) {
        return nodeContent(node, criterion.field).includes(String(criterion.contains));
    }
    if (criterion.not_contains !== undefined) {
        return !nodeContent(node, criterion.field).includes(String(criterion.not_contains));
    }
    return criterion.tag !== undefined;
}

function expectationPasses(nodes, expectation) {
    if (Array.isArray(expectation.any_of)) {
        return expectation.any_of.some(criterion => nodes.some(node => nodeMatchesCriterion(node, criterion)));
    }
    if (expectation.not_contains !== undefined) {
        return !nodes.some(node => {
            if (expectation.tag !== undefined && node.tag !== String(expectation.tag)) return false;
            return nodeContent(node, expectation.field).includes(String(expectation.not_contains));
        });
    }
    return nodes.some(node => nodeMatchesCriterion(node, expectation));
}

async function runRenderChecks(views, dv, rendered, renderChecks) {
    for (const [index, step] of renderChecks.entries()) {
        const names = callNames(step);
        if (!names.length) {
            errors.push(`${RUNTIME_RENDER_CONTRACT_SOURCE}: render_checks[${index}] senza call/calls`);
            continue;
        }

        const start = rendered.length;
        for (const name of names) {
            if (typeof views[name] !== "function") {
                errors.push(`${RUNTIME_RENDER_CONTRACT_SOURCE}: render_checks[${index}] funzione non esportata: ${name}`);
                continue;
            }
            try {
                await views[name](dv, ...callArgs(step));
            } catch (error) {
                errors.push(`${name}: errore durante render check (${error.message})`);
            }
        }

        const scope = step.scope === "all" ? rendered : rendered.slice(start);
        const expectations = Array.isArray(step.expects) ? step.expects : [];
        if (!expectations.length) {
            errors.push(`${RUNTIME_RENDER_CONTRACT_SOURCE}: render_checks[${index}] senza expects`);
            continue;
        }

        for (const expectation of expectations) {
            if (!expectationPasses(scope, expectation)) {
                errors.push(String(expectation.message ?? `${names.join("+")}: aspettativa runtime non soddisfatta`));
            }
        }
    }
}

const RUNTIME_EXPORTS = loadYamlModule(RUNTIME_EXPORTS_SOURCE);
if (RUNTIME_EXPORTS.id !== "runtime_exports") {
    errors.push(`${RUNTIME_EXPORTS_SOURCE}: id non valido`);
}

const RUNTIME_RENDER_CONTRACT_SOURCE = String(RUNTIME_EXPORTS.render_contract ?? "Dev/Source/YAML/json/runtime_render_contract.yaml").trim();
const RUNTIME_RENDER_CONTRACT = loadYamlModule(RUNTIME_RENDER_CONTRACT_SOURCE);
if (RUNTIME_RENDER_CONTRACT.id !== "runtime_render_contract") {
    errors.push(`${RUNTIME_RENDER_CONTRACT_SOURCE}: id non valido`);
}

const RUNTIME_DATAVIEW_CONTRACT_SOURCE = String(RUNTIME_RENDER_CONTRACT.dataview_contract ?? "Dev/Source/YAML/json/runtime_dataview_contract.yaml").trim();
const RUNTIME_DATAVIEW_CONTRACT = loadYamlModule(RUNTIME_DATAVIEW_CONTRACT_SOURCE);
if (RUNTIME_DATAVIEW_CONTRACT.id !== "runtime_dataview_contract") {
    errors.push(`${RUNTIME_DATAVIEW_CONTRACT_SOURCE}: id non valido`);
}

const REQUIRED_EXPORTS = requireStringArray(RUNTIME_EXPORTS, "required_exports", RUNTIME_EXPORTS_SOURCE);
const RUNTIME_MODULES = runtimeModuleSpecs(RUNTIME_EXPORTS, RUNTIME_EXPORTS_SOURCE);
const COMMONJS_RUNTIME = commonJsRuntimeSpecs(RUNTIME_EXPORTS, RUNTIME_EXPORTS_SOURCE);
const REQUIRED_MODULES = [
    String(RUNTIME_EXPORTS.bridge ?? "z.engine/session_views.js").trim(),
    ...RUNTIME_MODULES.modules,
    ...COMMONJS_RUNTIME.modules,
    ...COMMONJS_RUNTIME.data
].filter(Boolean);
const RENDER_CHECKS = requireObjectArray(RUNTIME_RENDER_CONTRACT, "render_checks", RUNTIME_RENDER_CONTRACT_SOURCE);
const SOURCE_ROUTES = requireObjectArray(RUNTIME_DATAVIEW_CONTRACT, "source_routes", RUNTIME_DATAVIEW_CONTRACT_SOURCE);
validateSourceRoutes(SOURCE_ROUTES, RUNTIME_DATAVIEW_CONTRACT_SOURCE);
const RUNTIME_FIXTURE = String(RUNTIME_DATAVIEW_CONTRACT.fixture ?? RUNTIME_RENDER_CONTRACT.fixture ?? RUNTIME_EXPORTS.fixture ?? "Dev/Tests/fixtures/runtime_fixture_pages.json").trim();
const RUNTIME_DATA = String(RUNTIME_EXPORTS.runtime_data ?? "z.automazioni/data/runtime/runtime_exports.json").trim();
const RUNTIME_DATA_PAYLOAD = {
    generated_by: "check_runtime_load",
    generated_from: RUNTIME_EXPORTS_SOURCE,
    source: RUNTIME_EXPORTS_SOURCE,
    purpose: "Registry runtime dei moduli caricati dal bridge DataviewJS e delle dipendenze CommonJS Templater.",
    commonjs_runtime: {
        entrypoints: COMMONJS_RUNTIME.entrypoints,
        local_dependencies: COMMONJS_RUNTIME.local_dependencies,
        data_dependencies: COMMONJS_RUNTIME.data_dependencies
    },
    runtime_modules: RUNTIME_MODULES.groups
};

function validateRuntimeData() {
    const target = path.join(ROOT, RUNTIME_DATA);
    const expected = jsonText(RUNTIME_DATA_PAYLOAD);
    if (process.argv.includes("--render-runtime-data")) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, expected, "utf8");
        console.log(`Runtime exports data renderizzato: ${RUNTIME_DATA}`);
        return false;
    }
    const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
    if (current !== expected) errors.push(`${RUNTIME_DATA} non allineato a ${RUNTIME_EXPORTS_SOURCE}`);
    return true;
}

global.app = {
    plugins: {
        enabledPlugins: new Set([
            "dataview",
            "obsidian-meta-bind-plugin",
            "templater-obsidian",
            "obsidian-tasks-plugin"
        ])
    },
    vault: {
        adapter: {
            async read(relPath) {
                return fs.readFileSync(path.join(ROOT, relPath), "utf8");
            }
        }
    }
};

async function main() {
    if (!errors.length && !validateRuntimeData()) return;

    for (const relPath of REQUIRED_MODULES) {
        if (!fs.existsSync(path.join(ROOT, relPath))) {
            errors.push(`runtime mancante: ${relPath}`);
        }
    }

    if (!errors.length) {
        validatePathRegistryRuntime();
    }

    if (!errors.length) {
        const views = await eval(fs.readFileSync(path.join(ROOT, RUNTIME_EXPORTS.bridge ?? "z.engine/session_views.js"), "utf8"));
        for (const name of REQUIRED_EXPORTS) {
            if (typeof views[name] !== "function") {
                errors.push(`export runtime mancante o non funzione: ${name}`);
            }
        }

        if (!errors.length) {
            const rendered = [];
            const fixturePages = readJsonRel(RUNTIME_FIXTURE);
            const dv = makeDataviewMock(rendered, fixturePages, SOURCE_ROUTES);
            await runRenderChecks(views, dv, rendered, RENDER_CHECKS);
        }
    }

    if (errors.length) {
        console.error("Runtime Obsidian non valido:");
        for (const error of errors) console.error(`- ${error}`);
        process.exit(1);
    }

    console.log(`Runtime Obsidian OK: ${REQUIRED_EXPORTS.length} export verificati, ${RENDER_CHECKS.length} render check eseguiti.`);
}

main().catch(error => {
    console.error(error.stack || error.message);
    process.exit(1);
});
