#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { readJson, readTextRel, repoPath, walk } = require("./node_utils");

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const OUT = path.join(DIST, "vault-gdr-clean");
const ZIP = path.join(DIST, "vault-gdr-clean.zip");
const CONTRACT = "Dev/TemplateFactory/modules/plugin_contracts.yaml";
const WORKFLOWS = "Dev/TemplateFactory/modules/workflows.yaml";
const TEMPLATER_DIR = "z.automazioni/templater";
const IGNORED_DIRS = new Set([".git", "node_modules", "dist"]);
const BUTTON_REF_PATTERN = /BUTTON\[([^\]\n]+)\]/g;
const META_BIND_BUTTON_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const errors = [];

const ALLOWED_META_BIND_ACTION_TYPES = new Set([
    "command",
    "open",
    "runTemplaterFile",
    "templaterCreateNote"
]);

const REQUIRED_META_BIND_INPUTS = [
    "mondo",
    "campagne",
    "canonico",
    "stato base",
    "stato canonico",
    "stato",
    "pressione",
    "prossima_mossa",
    "connessioni",
    "player_safe",
    "entita_impattate",
    "propaga_a",
    "sessioni",
    "luoghi",
    "fazioni",
    "missioni",
    "tracciati"
];

const REQUIRED_FIRST_RUN_BUTTONS = [
    "nuovo-mondo-homebrew",
    "preparazione-sessione-risorse-preparazione-sessione",
    "gioca-hub-durante-il-gioco-durante-il-gioco",
    "fuori-scena-hub-cosa-succede-fuori-scena-cosa-succede-fuori-scena",
    "setup-guidato-risorse-setup-guidato",
    "prima-sessione-in-15-minuti-risorse-prima-sessione-in-15-minuti",
    "worldbuilder-worldbuilder-dashboard-2",
    "nuova-sessione-z-modelli-dm-sessione-md",
    "rendi-sessione-attiva",
    "wizard-appunto-live",
    "registra-scelta-mondo",
    "wizard-fine-sessione",
    "applica-conseguenza",
    "propaga-a-entita",
    "prepara-recap-pubblico"
];

const FIRST_RUN_PAGES = [
    "Inizia Qui.md",
    "Demo Regno Di Prova.md",
    "Risorse/Setup Guidato.md",
    "Risorse/Prima Sessione In 15 Minuti.md",
    "Hub/1. DM Dashboard.md",
    "Hub/Worldbuilder Dashboard.md",
    "Risorse/Preparazione Sessione.md",
    "Hub/Durante il Gioco.md",
    "Risorse/Post Sessione Guidato.md",
    "Hub/Cosa Succede Fuori Scena.md",
    "Hub/Vista Giocatori.md",
    "Risorse/Se Qualcosa Non Funziona.md"
];

const FORBIDDEN_CALENDAR_MARKERS = [
    "Harptos",
    "Faer",
    "Forgotten Realms",
    "Greyhawk",
    "Galifar",
    "Barovia",
    "Brumafonda",
    "Terre della Soglia"
];

const FORBIDDEN_FIRST_RUN_MARKERS = [
    "TemplateFactory",
    "npm run",
    "node z.automazioni",
    "Dev/",
    "source_lab:",
    "idea_originale_riservata"
];

function fail(message) {
    errors.push(message);
}

function loadYaml(relPath) {
    const script = [
        "import json, sys, yaml",
        "with open(sys.argv[1], encoding='utf-8') as handle:",
        "    data = yaml.safe_load(handle) or {}",
        "print(json.dumps(data, ensure_ascii=False))"
    ].join("\n");
    const stdout = execFileSync("python3", ["-c", script, repoPath(ROOT, relPath)], {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024
    });
    return JSON.parse(stdout);
}

function existsRel(relPath, root = ROOT) {
    return fs.existsSync(path.join(root, relPath));
}

function readJsonRel(relPath, root = ROOT, fallback = {}) {
    try {
        return JSON.parse(fs.readFileSync(path.join(root, relPath), "utf8"));
    } catch (error) {
        fail(`${relPath}: JSON non leggibile (${error.message})`);
        return fallback;
    }
}

function readText(relPath, root = ROOT, fallback = "") {
    const file = path.join(root, relPath);
    return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : fallback;
}

function rel(root, file) {
    return path.relative(root, file).replace(/\\/g, "/");
}

function markdownFiles(root = ROOT) {
    return walk(root, {
        ignoredDirs: IGNORED_DIRS,
        predicate: file => file.endsWith(".md")
    }).map(file => rel(root, file));
}

function resolveObsidianTarget(target, root = ROOT) {
    if (!target) return true;
    if (/^(https?:|obsidian:|mailto:)/.test(target)) return true;
    const clean = target.split("#")[0].split("|")[0];
    if (!clean) return true;
    const candidates = [clean, `${clean}.md`, `${clean}.base`, `${clean}.canvas`, `${clean}.excalidraw.md`];
    if (candidates.some(candidate => existsRel(candidate, root))) return true;
    const base = path.basename(clean);
    return walk(root, {
        ignoredDirs: IGNORED_DIRS,
        predicate: file => /\.(md|base|canvas)$/i.test(file)
    }).some(file => path.basename(rel(root, file), path.extname(file)) === base);
}

function validateObsidianCommand(buttonId, command, communityPlugins, root = ROOT) {
    const commandId = String(command ?? "").trim();
    const match = commandId.match(/^([^:]+):(.+)$/);
    if (!match) {
        fail(`Meta Bind: ${buttonId} usa command non qualificato (${commandId})`);
        return;
    }

    const [, pluginId, localCommandId] = match;
    if (!communityPlugins.includes(pluginId)) {
        fail(`Meta Bind: ${buttonId} usa command di plugin non abilitato (${pluginId})`);
        return;
    }

    const pluginMain = path.join(root, ".obsidian/plugins", pluginId, "main.js");
    if (!fs.existsSync(pluginMain)) {
        fail(`Meta Bind: ${buttonId} usa command di plugin senza main.js (${pluginId})`);
        return;
    }

    const source = fs.readFileSync(pluginMain, "utf8");
    const commandPattern = new RegExp(`\\bid\\s*:\\s*["'\`]${localCommandId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]`);
    if (!commandPattern.test(source)) {
        fail(`Meta Bind: ${buttonId} usa command non trovato nel plugin ${pluginId} (${localCommandId})`);
    }
}

function dataviewBlocks(text) {
    const normalized = text
        .split(/\r?\n/)
        .filter(line => !line.trimStart().startsWith(">"))
        .join("\n");
    return [...normalized.matchAll(/```dataviewjs\n([\s\S]*?)\n```/g)].map(match => match[1]);
}

function workflowActions(workflow) {
    return [
        ...(workflow.quick_actions ?? []),
        ...Object.values(workflow.action_groups ?? {}).flatMap(group => group.actions ?? [])
    ];
}

function runtimePluginLabels() {
    const text = readText("z.engine/session_views.js");
    const match = text.match(/const pluginIds = \{([\s\S]*?)\n  \};/);
    if (!match) return new Set();
    return new Set([...match[1].matchAll(/^\s+"([^"]+)":\s+"[^"]+"/gm)].map(entry => entry[1]));
}

function collectBookmarks(items, out = []) {
    for (const item of items ?? []) {
        if (item.type === "group") collectBookmarks(item.items, out);
        if (item.type === "file") out.push(item.path);
    }
    return out;
}

function validatePluginContract() {
    const communityPlugins = readJsonRel(".obsidian/community-plugins.json", ROOT, []);
    const manifests = new Map(communityPlugins.map(id => [id, readJsonRel(`.obsidian/plugins/${id}/manifest.json`)]));
    const matrix = readJsonRel("Dev/plugin_matrix.json", ROOT, []);
    const matrixIds = new Set(matrix.map(entry => entry.id));
    const contract = loadYaml(CONTRACT);
    const contractPlugins = new Map((contract.plugins ?? []).map(plugin => [plugin.id, plugin]));

    if (!contract.policy?.includes("Contratto operativo profondo")) {
        fail(`${CONTRACT}: policy non esplicita`);
    }

    for (const id of communityPlugins) {
        const manifest = manifests.get(id);
        const record = contractPlugins.get(id);
        if (!matrixIds.has(id)) fail(`${id}: assente da Dev/plugin_matrix.json`);
        if (!existsRel(`.obsidian/plugins/${id}/main.js`)) fail(`${id}: main.js plugin mancante`);
        if (!record) {
            fail(`${CONTRACT}: plugin abilitato senza contratto (${id})`);
            continue;
        }
        if (record.name !== manifest.name) fail(`${CONTRACT}: ${id} name non coincide con manifest`);
        if (record.version !== manifest.version) fail(`${CONTRACT}: ${id} version non coincide con manifest`);
        if (!Array.isArray(record.official_sources) || record.official_sources.length < 2) {
            fail(`${CONTRACT}: ${id} fonti ufficiali insufficienti`);
        }
        for (const field of ["official_capability", "local_scope", "visible_failure", "release_contract", "manual_smoke"]) {
            if (!String(record[field] ?? "").trim()) fail(`${CONTRACT}: ${id} campo mancante ${field}`);
        }
        if (!Array.isArray(record.gates) || !record.gates.length) fail(`${CONTRACT}: ${id} senza gate`);
    }

    for (const id of contractPlugins.keys()) {
        if (!communityPlugins.includes(id)) fail(`${CONTRACT}: record per plugin non abilitato (${id})`);
    }
}

function validateRuntimeConfig(root = ROOT) {
    const communityPlugins = readJsonRel(".obsidian/community-plugins.json", root, []);
    const dataview = readJsonRel(".obsidian/plugins/dataview/data.json", root);
    if (dataview.enableDataviewJs !== true) fail("Dataview: enableDataviewJs deve essere true");
    if (dataview.enableInlineDataviewJs !== true) fail("Dataview: enableInlineDataviewJs deve essere true");

    const templater = readJsonRel(".obsidian/plugins/templater-obsidian/data.json", root);
    if (templater.templates_folder !== "z.modelli") fail("Templater: templates_folder deve essere z.modelli");
    if (templater.user_scripts_folder !== TEMPLATER_DIR) fail(`Templater: user_scripts_folder deve essere ${TEMPLATER_DIR}`);
    if (templater.enable_system_commands !== false) fail("Templater: enable_system_commands deve restare false");

    const metaBind = readJsonRel(".obsidian/plugins/obsidian-meta-bind-plugin/data.json", root);
    if (metaBind.enableJs !== true) fail("Meta Bind: enableJs deve essere true");
    const inputNames = new Set((metaBind.inputFieldTemplates ?? []).map(input => input.name));
    for (const name of REQUIRED_META_BIND_INPUTS) {
        if (!inputNames.has(name)) fail(`Meta Bind: input template mancante (${name})`);
    }
    validateMetaBindTargets(metaBind, root, root === OUT, communityPlugins);

    const metadataMenu = readJsonRel(".obsidian/plugins/metadata-menu/data.json", root);
    if (metadataMenu.classFilesPath !== "z.fileclass/") fail("Metadata Menu: classFilesPath deve essere z.fileclass/");

    const homepage = readJsonRel(".obsidian/plugins/homepage/data.json", root);
    const mainHomepage = homepage.homepages?.["Main Homepage"];
    if (mainHomepage?.value !== "Inizia Qui" || mainHomepage?.openOnStartup !== true) fail("Homepage: apertura iniziale non punta a Inizia Qui");

    const tasks = readJsonRel(".obsidian/plugins/obsidian-tasks-plugin/data.json", root);
    if (tasks.globalFilter !== "#task") fail("Tasks: globalFilter deve restare #task");

    const calendarText = readText(".obsidian/plugins/calendarium/data.json", root);
    const calendar = readJsonRel(".obsidian/plugins/calendarium/data.json", root);
    if ((calendar.calendars ?? []).length !== 1 || calendar.calendars?.[0]?.name !== "Calendario Del Mondo") {
        fail("Calendarium: deve restare un solo calendario neutro");
    }
    for (const marker of FORBIDDEN_CALENDAR_MARKERS) {
        if (calendarText.includes(marker)) fail(`Calendarium: riferimento non neutro vietato (${marker})`);
    }
}

function validateMetaBindTargets(metaBind, root, firstRun, communityPlugins = []) {
    const buttons = metaBind.buttonTemplates ?? [];
    const buttonIds = new Set(buttons.map(button => button.id));
    if (buttonIds.size !== buttons.length) fail("Meta Bind: buttonTemplates contiene id duplicati");
    if (firstRun) {
        for (const button of REQUIRED_FIRST_RUN_BUTTONS) {
            if (!buttonIds.has(button)) fail(`Meta Bind: pulsante first-run mancante (${button})`);
        }
    }

    for (const button of buttons) {
        if (!META_BIND_BUTTON_ID_PATTERN.test(String(button.id ?? ""))) {
            fail(`Meta Bind: id pulsante non valido (${button.id})`);
        }
        if (!String(button.label ?? "").trim()) {
            fail(`Meta Bind: ${button.id} senza label visibile`);
        }
        if (!Array.isArray(button.actions) || !button.actions.length) {
            fail(`Meta Bind: ${button.id} senza azioni`);
            continue;
        }
        for (const action of button.actions ?? []) {
            if (!ALLOWED_META_BIND_ACTION_TYPES.has(action.type)) {
                fail(`Meta Bind: ${button.id} usa action type non contrattualizzato (${action.type})`);
                continue;
            }
            if (action.type === "templaterCreateNote" || action.type === "runTemplaterFile") {
                if (!String(action.templateFile ?? "").trim()) {
                    fail(`Meta Bind: ${button.id} azione Templater senza templateFile`);
                } else if (!existsRel(action.templateFile, root)) {
                    fail(`Meta Bind: ${button.id} punta a template mancante ${action.templateFile}`);
                }
            }
            if (action.type === "templaterCreateNote") {
                if (!String(action.folderPath ?? "").trim()) {
                    fail(`Meta Bind: ${button.id} crea nota senza folderPath`);
                } else if (!fs.existsSync(path.join(root, action.folderPath)) || !fs.statSync(path.join(root, action.folderPath)).isDirectory()) {
                    fail(`Meta Bind: ${button.id} crea nota in cartella mancante ${action.folderPath}`);
                }
                if (typeof action.openNote !== "boolean") {
                    fail(`Meta Bind: ${button.id} crea nota senza openNote booleano`);
                }
            }
            if (action.type === "open") {
                if (!String(action.link ?? "").trim()) fail(`Meta Bind: ${button.id} azione open senza link`);
                const target = String(action.link ?? "").match(/\[\[([^\]]+)\]\]/)?.[1];
                if (target && !resolveObsidianTarget(target, root)) fail(`Meta Bind: ${button.id} apre target mancante ${target}`);
            }
            if (action.type === "command") {
                validateObsidianCommand(button.id, action.command, communityPlugins, root);
            }
        }
    }

    if (!firstRun) {
        for (const fileRel of markdownFiles(ROOT)) {
            if (fileRel.startsWith("Dev/TemplateFactory/examples/")) continue;
            const text = readText(fileRel);
            for (const match of text.matchAll(/`BUTTON\[([^\]\n]+)\]`/g)) {
                if (!match[1].includes("...") && !buttonIds.has(match[1])) fail(`${fileRel}: BUTTON senza template Meta Bind (${match[1]})`);
            }
        }
    }
}

function validateWorkflowRuntimeContract() {
    const workflows = loadYaml(WORKFLOWS).workflows ?? {};
    const buttonIds = new Set((readJsonRel(".obsidian/plugins/obsidian-meta-bind-plugin/data.json").buttonTemplates ?? []).map(button => String(button.id ?? "")));
    const labels = runtimePluginLabels();

    for (const [workflowId, workflow] of Object.entries(workflows)) {
        const actions = workflowActions(workflow);
        const requiredPlugins = workflow.required_plugins ?? [];

        if ((workflow.quick_actions?.length || Object.keys(workflow.action_groups ?? {}).length) && !(workflow.entry_points ?? []).length) {
            fail(`${WORKFLOWS}: ${workflowId} ha azioni ma non dichiara entry_points`);
        }

        for (const plugin of requiredPlugins) {
            if (!labels.has(plugin)) fail(`${WORKFLOWS}: ${workflowId} richiede plugin non diagnosticabile nel runtime (${plugin})`);
        }

        for (const action of actions) {
            const button = String(action.button ?? "");
            if (!button) {
                fail(`${WORKFLOWS}: ${workflowId} contiene azione senza button`);
                continue;
            }
            if (!buttonIds.has(button)) fail(`${WORKFLOWS}: ${workflowId} usa BUTTON[${button}] non presente in Meta Bind`);
            if (!String(action.label ?? "").trim()) fail(`${WORKFLOWS}: ${workflowId} BUTTON[${button}] senza label`);
            if (!String(action.use_when ?? "").trim()) fail(`${WORKFLOWS}: ${workflowId} BUTTON[${button}] senza use_when`);
        }
    }
}

function validateRuntimeButtonReferences(root = ROOT) {
    const buttonIds = new Set((readJsonRel(".obsidian/plugins/obsidian-meta-bind-plugin/data.json", root).buttonTemplates ?? []).map(button => String(button.id ?? "")));
    const files = [
        ...markdownFiles(root).filter(file => !file.startsWith("Dev/TemplateFactory/examples/")),
        ...walk(path.join(root, "z.engine"), { predicate: file => file.endsWith(".js") }).map(file => rel(root, file))
    ];

    for (const fileRel of files) {
        const text = readText(fileRel, root);
        for (const match of text.matchAll(BUTTON_REF_PATTERN)) {
            const id = match[1];
            if (id.includes("${") || id.includes("...")) continue;
            if (!buttonIds.has(id)) fail(`${fileRel}: BUTTON[${id}] senza template Meta Bind`);
        }
    }
}

function validateTemplaterWrappers(root = ROOT) {
    const templaterRoot = path.join(root, TEMPLATER_DIR);
    const wrappers = fs.existsSync(templaterRoot)
        ? walk(templaterRoot, { predicate: file => file.endsWith(".js") })
        : [];
    if (wrappers.length < 50) fail(`Templater: wrapper insufficienti (${wrappers.length})`);
    const wrapperNames = new Set(wrappers.map(file => path.basename(file, ".js")));
    for (const file of walk(templaterRoot)) {
        if (!file.endsWith(".js")) fail(`${rel(root, file)}: Templater user_scripts_folder deve contenere solo wrapper JS`);
        if (path.dirname(file) !== templaterRoot) fail(`${rel(root, file)}: wrapper Templater annidato, non richiamabile come tp.user diretto`);
    }

    for (const file of wrappers) {
        try {
            delete require.cache[require.resolve(file)];
            const exported = require(file);
            if (typeof exported !== "function") fail(`${rel(root, file)}: Templater accetta solo export funzione`);
        } catch (error) {
            fail(`${rel(root, file)}: import wrapper fallito (${error.message})`);
        }
    }

    for (const file of walk(path.join(root, "z.modelli"), { predicate: file => file.endsWith(".md") })) {
        const fileRel = rel(root, file);
        const text = readText(fileRel, root);
        for (const match of text.matchAll(/tp\.user\.([A-Za-z0-9_]+)/g)) {
            if (!wrapperNames.has(match[1])) fail(`${fileRel}: tp.user.${match[1]} senza wrapper in ${TEMPLATER_DIR}`);
        }
    }
}

function validateDataviewSyntax(root = ROOT, firstRunOnly = false) {
    const files = firstRunOnly ? FIRST_RUN_PAGES : markdownFiles(root).filter(file => !file.startsWith("z.modelli/") && !file.startsWith("Dev/TemplateFactory/examples/"));
    for (const fileRel of files) {
        if (!existsRel(fileRel, root)) continue;
        for (const code of dataviewBlocks(readText(fileRel, root))) {
            try {
                new Function("dv", "app", "input", `return (async () => {\n${code}\n})()`);
            } catch (error) {
                fail(`${fileRel}: blocco dataviewjs non compilabile (${error.message})`);
            }
        }
    }
}

function validateReleaseFirstRun() {
    if (!fs.existsSync(OUT) || !fs.existsSync(ZIP)) {
        execFileSync("node", ["z.automazioni/release_clean.js", "--with-demo", "--quiet"], { cwd: ROOT, stdio: "inherit" });
    }
    if (!fs.existsSync(OUT)) fail("release demo mancante: dist/vault-gdr-clean");
    if (!fs.existsSync(ZIP)) fail("zip release demo mancante: dist/vault-gdr-clean.zip");

    const workspace = readJsonRel(".obsidian/workspace.json", OUT);
    const firstLeaf = workspace.main?.children?.[0]?.children?.[0]?.state?.state;
    if (firstLeaf?.file !== "Inizia Qui.md" || firstLeaf?.mode !== "preview") fail("workspace first-run non apre Inizia Qui in preview");

    const appConfig = readJsonRel(".obsidian/app.json", OUT);
    for (const hidden of ["z.automazioni/", "z.engine/", "z.modelli/", "z.bases/", "z.fileclass/"]) {
        if (!appConfig.userIgnoreFilters?.includes(hidden)) fail(`app.json non nasconde ${hidden}`);
    }

    const communityPlugins = readJsonRel(".obsidian/community-plugins.json", OUT, []);
    if (communityPlugins.length !== 27) fail(`plugin community attesi 27, trovati ${communityPlugins.length}`);
    for (const plugin of communityPlugins) {
        if (!existsRel(`.obsidian/plugins/${plugin}/manifest.json`, OUT)) fail(`manifest plugin mancante: ${plugin}`);
        if (!existsRel(`.obsidian/plugins/${plugin}/main.js`, OUT)) fail(`main plugin mancante: ${plugin}`);
    }

    const bookmarks = collectBookmarks(readJsonRel(".obsidian/bookmarks.json", OUT).items);
    for (const bookmark of bookmarks) {
        if (bookmark.startsWith("z.")) fail(`bookmark tecnico visibile: ${bookmark}`);
        if (!existsRel(bookmark, OUT)) fail(`bookmark verso file mancante: ${bookmark}`);
    }

    validateRuntimeConfig(OUT);
    validateTemplaterWrappers(OUT);
    validateDataviewSyntax(OUT, true);

    for (const relPath of FIRST_RUN_PAGES) {
        if (!existsRel(relPath, OUT)) {
            fail(`pagina first-run mancante: ${relPath}`);
            continue;
        }
        const text = readText(relPath, OUT);
        if (/<%[\s\S]*?%>/.test(text)) fail(`${relPath}: contiene codice Templater visibile`);
        for (const marker of FORBIDDEN_FIRST_RUN_MARKERS) {
            if (text.includes(marker)) fail(`${relPath}: marker tecnico visibile (${marker})`);
        }
        for (const match of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
            if (!resolveObsidianTarget(match[1], OUT)) fail(`${relPath}: wikilink verso target mancante (${match[1]})`);
        }
    }

    for (const file of walk(path.join(OUT, "z.automazioni"))) {
        const base = path.basename(file);
        if (/^(check_|generate_|import_|render_|template_factory_)/.test(base)) fail(`script tecnico vietato nella release: ${rel(OUT, file)}`);
    }

    try {
        execFileSync("unzip", ["-tq", ZIP], { cwd: ROOT, stdio: "ignore" });
    } catch {
        fail("zip release demo non valida: unzip -tq fallito");
    }
}

validatePluginContract();
validateWorkflowRuntimeContract();
validateRuntimeConfig(ROOT);
validateRuntimeButtonReferences(ROOT);
validateTemplaterWrappers(ROOT);
validateDataviewSyntax(ROOT);
validateReleaseFirstRun();

if (errors.length) {
    console.error("Release quality non valida:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Release quality OK: plugin, workflow, Meta Bind, Templater, DataviewJS e first-run release verificati.");
