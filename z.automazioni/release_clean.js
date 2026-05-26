#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { generateDemoWorld } = require("./generate_demo_world");
const { readJson, rel: relativePath, repoPath } = require("./node_utils");
const { loadReleaseBoundary, materializedUserFiles, renderMaterializedUserFile } = require("./release_boundary_utils");

const ROOT = process.cwd();
function optionValue(name, fallback) {
    const index = process.argv.indexOf(name);
    if (index === -1) return fallback;
    const value = process.argv[index + 1];
    if (!value || value.startsWith("--")) {
        console.error(`${name} richiede un percorso`);
        process.exit(1);
    }
    return value;
}

const OUT = path.resolve(ROOT, optionValue("--out", "dist/vault-gdr-clean"));
const DIST = path.dirname(OUT);
const ZIP = `${OUT}.zip`;
const INCLUDE_DEMO = process.argv.includes("--with-demo");
const QUIET = process.argv.includes("--quiet");
const TEMPLATE_FACTORY_RENDERER = repoPath(ROOT, "z.automazioni/render_template_factory.py");
const RELEASE_BOUNDARY = loadReleaseBoundary(ROOT);
const COPY_POLICY = RELEASE_BOUNDARY.copy_policy ?? {};
const INCLUDED_ROOTS = new Set(COPY_POLICY.included_roots ?? []);
const INCLUDED_ROOT_FILES = new Set(COPY_POLICY.included_root_files ?? []);
const EXCLUDED_DIRS = new Set(COPY_POLICY.excluded_dirs ?? []);
const EXCLUDED_ROOT_FILES = new Set(COPY_POLICY.excluded_root_files ?? []);
const EXCLUDED_RISORSE = new Set(COPY_POLICY.excluded_risorse ?? []);
const EXCLUDED_AUTOMAZIONI = new Set(COPY_POLICY.excluded_automazioni ?? []);
const EXCLUDED_AUTOMAZIONI_PREFIXES = RELEASE_BOUNDARY.forbidden_automation_prefixes ?? [];
const EXCLUDED_FILES = new Set(COPY_POLICY.excluded_files ?? []);
const REQUIRED_RELEASE_FILES = RELEASE_BOUNDARY.required_files ?? [];
const REQUIRED_USER_IGNORE_FILTERS = COPY_POLICY.required_user_ignore_filters ?? [];
const GENERATED_RELEASE_NOTES = {
    "LEGGIMI.md": `# Vault GDR

Questa cartella contiene il vault pronto per l'utente finale.

Apri questa cartella in Obsidian come vault e parti da \`Inizia Qui.md\`.

## Cosa Include

- dashboard operative per preparazione, sessione, post-sessione e worldbuilding;
- \`Vista Giocatori\` per recap, handout, mappe pubbliche e materiale condivisibile;
- \`Party Control\` per PG, HP, missioni, inventario e flags;
- \`Quality Report\` per copertura, buchi operativi e controllo anti-segreti;
- atlante, mappe, template, automazioni, plugin e configurazioni gia inclusi;
- SRD 5.2.1 italiano come modulo regolamentare separato.

Le cartelle tecniche e il compendio SRD sono inclusi per far funzionare automazioni, template e riferimenti, ma sono nascosti dalla navigazione normale del vault.

## Primo Avvio

1. Apri Obsidian.
2. Scegli \`Apri cartella come vault\`.
3. Se Obsidian chiede conferma per gli strumenti inclusi, abilitali solo se hai scaricato il vault dalla release ufficiale.
4. Apri \`Inizia Qui.md\`.
5. Usa \`Risorse/Setup Guidato.md\` solo se pulsanti, tabelle o pagina iniziale non rispondono.

## Cosa Non Include

Questa copia contiene solo il vault pronto da aprire in Obsidian. Non include roadmap interne, strumenti di sviluppo o materiali sorgente non necessari al gioco.
`
};

const GENERATED_RELEASE_JSON = {
    ".obsidian/workspace.json": {
        main: {
            id: "gdr-release-main",
            type: "split",
            children: [{
                id: "gdr-release-tabs",
                type: "tabs",
                children: [{
                    id: "gdr-release-start",
                    type: "leaf",
                    state: {
                        type: "markdown",
                        state: {
                            file: "Inizia Qui.md",
                            mode: "preview",
                            source: false
                        },
                        icon: "lucide-file",
                        title: "Inizia Qui"
                    }
                }],
                currentTab: 0
            }],
            direction: "vertical"
        },
        left: {
            id: "gdr-release-left",
            type: "split",
            children: [{
                id: "gdr-release-left-tabs",
                type: "tabs",
                children: [
                    {
                        id: "gdr-release-bookmarks",
                        type: "leaf",
                        state: {
                            type: "bookmarks",
                            state: {},
                            icon: "lucide-bookmark",
                            title: "Percorsi"
                        }
                    },
                    {
                        id: "gdr-release-files",
                        type: "leaf",
                        state: {
                            type: "file-explorer",
                            state: {
                                sortOrder: "alphabetical",
                                autoReveal: false
                            },
                            icon: "lucide-folder-closed",
                            title: "File"
                        }
                    }
                ],
                currentTab: 0
            }],
            direction: "horizontal",
            width: 300
        },
        right: {
            id: "gdr-release-right",
            type: "split",
            children: [],
            direction: "horizontal",
            collapsed: true
        },
        active: "gdr-release-start",
        lastOpenFiles: ["Inizia Qui.md"]
    },
    ".obsidian/bookmarks.json": {
        items: [
            {
                type: "group",
                title: "Primo utilizzo",
                items: [
                    { type: "file", path: "Inizia Qui.md", title: "Inizia Qui" },
                    ...(INCLUDE_DEMO ? [{ type: "file", path: "Demo Regno Di Prova.md", title: "Demo Regno Di Prova" }] : []),
                    { type: "file", path: "Risorse/Prima Sessione In 15 Minuti.md", title: "Prima Sessione In 15 Minuti" },
                    { type: "file", path: "Risorse/Setup Guidato.md", title: "Setup Guidato" }
                ]
            },
            {
                type: "group",
                title: "Ciclo di gioco",
                items: [
                    { type: "file", path: "Risorse/Preparazione Sessione.md", title: "Preparazione Sessione" },
                    { type: "file", path: "Hub/Durante il Gioco.md", title: "Durante il Gioco" },
                    { type: "file", path: "Risorse/Post Sessione Guidato.md", title: "Post Sessione Guidato" },
                    { type: "file", path: "Hub/Cosa Succede Fuori Scena.md", title: "Cosa Succede Fuori Scena" }
                ]
            },
            {
                type: "group",
                title: "Mondo e giocatori",
                items: [
                    { type: "file", path: "Hub/Worldbuilder Dashboard.md", title: "Worldbuilder" },
                    { type: "file", path: "Hub/Atlante del Mondo.md", title: "Atlante del Mondo" },
                    { type: "file", path: "Hub/Campagna da Ambientazione.md", title: "Campagna da Ambientazione" },
                    { type: "file", path: "Hub/Vista Giocatori.md", title: "Vista Giocatori" }
                ]
            }
        ]
    }
};

const enabledPlugins = new Set(readJson(repoPath(ROOT, ".obsidian/community-plugins.json"), []));

function rel(file) {
    return relativePath(ROOT, file);
}

function topSegment(relPath) {
    return relPath.split("/")[0];
}

function shouldIncludeRoot(relPath, entry) {
    const top = topSegment(relPath);
    if (INCLUDED_ROOTS.has(top) && !EXCLUDED_DIRS.has(top)) return true;
    if (entry.isDirectory()) return false;
    return INCLUDED_ROOT_FILES.has(relPath) && !EXCLUDED_ROOT_FILES.has(relPath);
}

function shouldSkip(relPath, entry) {
    if (entry.isDirectory() && entry.name === "__pycache__") return true;
    if (EXCLUDED_FILES.has(entry.name)) return true;
    const top = topSegment(relPath);
    if (EXCLUDED_DIRS.has(top)) return true;
    if (!shouldIncludeRoot(relPath, entry)) return true;

    if (relPath.startsWith(".obsidian/plugins/")) {
        const pluginId = relPath.split("/")[2];
        if (pluginId && !enabledPlugins.has(pluginId)) return true;
    }

    if (relPath === ".obsidian/workspace.json") return true;

    if (relPath.startsWith("Risorse/")) {
        const first = relPath.slice("Risorse/".length).split("/")[0];
        if (EXCLUDED_RISORSE.has(first)) return true;
    }

    if (relPath.startsWith("z.automazioni/")) {
        const first = relPath.slice("z.automazioni/".length).split("/")[0];
        if (EXCLUDED_AUTOMAZIONI.has(first)) return true;
        if (EXCLUDED_AUTOMAZIONI_PREFIXES.some(prefix => first.startsWith(prefix))) return true;
    }

    if (relPath === "z.modelli/README.md" || relPath === "z.bacheche/README.md" || relPath === "z.engine/README.md") return true;

    return false;
}

function copyDir(source, target, base = source) {
    fs.mkdirSync(target, { recursive: true });

    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        const sourcePath = path.join(source, entry.name);
        const relPath = path.relative(base, sourcePath).replace(/\\/g, "/");
        const targetPath = path.join(target, entry.name);

        if (shouldSkip(relPath, entry)) continue;

        if (entry.isDirectory()) {
            copyDir(sourcePath, targetPath, base);
        } else if (entry.isFile()) {
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}

function writeGeneratedReleaseNotes() {
    for (const [file, text] of Object.entries(GENERATED_RELEASE_NOTES)) {
        fs.writeFileSync(repoPath(OUT, file), text);
    }
    for (const [file, data] of Object.entries(GENERATED_RELEASE_JSON)) {
        const target = repoPath(OUT, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`);
    }

    const workflowData = readJson(repoPath(OUT, "z.automazioni/data/workflows/quick_actions.json"), {});
    for (const file of materializedUserFiles(ROOT)) {
        const relPath = String(file.path ?? "").replace(/\\/g, "/");
        if (!relPath) continue;
        const target = repoPath(OUT, relPath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, renderMaterializedUserFile(file, workflowData.workflows ?? {}), "utf8");
    }
}

function walkRelease(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(OUT, fullPath).replace(/\\/g, "/");
        files.push(relPath);
        if (entry.isDirectory()) {
            walkRelease(fullPath, files);
        }
    }
    return files;
}

function validateReleaseLinks(releaseEntries, errors) {
    const fileEntries = releaseEntries.filter(entry => fs.statSync(repoPath(OUT, entry)).isFile());
    const exactTargets = new Set(fileEntries);
    const extensionlessTargets = new Set(fileEntries.map(entry => entry.replace(/\.[^.]+$/, "")));
    const stemTargets = new Set(fileEntries.map(entry => path.basename(entry).replace(/\.[^.]+$/, "")));
    const wikiLinkPattern = /\[\[([^\]]+)\]\]/g;

    for (const entry of fileEntries.filter(file => file.endsWith(".md"))) {
        const text = fs.readFileSync(repoPath(OUT, entry), "utf8");
        for (const match of text.matchAll(wikiLinkPattern)) {
            const target = String(match[1]).split("|")[0].split("#")[0].trim();
            if (!target || target.startsWith("http://") || target.startsWith("https://")) continue;

            const withoutMarkdown = target.replace(/\.md$/, "");
            const matchesTarget = exactTargets.has(target)
                || extensionlessTargets.has(withoutMarkdown)
                || stemTargets.has(withoutMarkdown)
                || [...extensionlessTargets].some(candidate => candidate.endsWith(`/${withoutMarkdown}`));

            if (!matchesTarget) {
                errors.push(`wikilink mancante nella release: ${entry} -> [[${match[1]}]]`);
            }
        }
    }
}

function validateRelease() {
    const errors = [];

    for (const file of REQUIRED_RELEASE_FILES) {
        if (!fs.existsSync(repoPath(OUT, file))) {
            errors.push(`file release obbligatorio mancante: ${file}`);
        }
    }

    const releaseEntries = walkRelease(OUT);
    const releaseAppConfig = readJson(repoPath(OUT, ".obsidian/app.json"), {});
    const ignoredFilters = new Set(releaseAppConfig.userIgnoreFilters ?? []);
    for (const filter of REQUIRED_USER_IGNORE_FILTERS) {
        if (!ignoredFilters.has(filter)) {
            errors.push(`filtro navigazione utente mancante in .obsidian/app.json: ${filter}`);
        }
    }

    for (const forbidden of [...EXCLUDED_DIRS, ...EXCLUDED_ROOT_FILES]) {
        if (releaseEntries.some(entry => entry === forbidden || entry.startsWith(`${forbidden}/`))) {
            errors.push(`percorso non ammesso nella release pulita: ${forbidden}`);
        }
    }

    for (const entry of releaseEntries) {
        if (!entry.startsWith("z.automazioni/")) continue;
        const file = path.basename(entry);
        if (EXCLUDED_AUTOMAZIONI.has(file) || EXCLUDED_AUTOMAZIONI_PREFIXES.some(prefix => file.startsWith(prefix))) {
            errors.push(`script di manutenzione non ammesso nella release pulita: ${entry}`);
        }
    }

    validateReleaseLinks(releaseEntries, errors);

    const pluginRoot = repoPath(OUT, ".obsidian/plugins");
    if (fs.existsSync(pluginRoot)) {
        const bundledPlugins = fs.readdirSync(pluginRoot, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);

        for (const pluginId of bundledPlugins) {
            if (!enabledPlugins.has(pluginId)) {
                errors.push(`plugin non abilitato incluso nella release: ${pluginId}`);
            }
        }
    }

    const homepageConfig = readJson(repoPath(OUT, ".obsidian/plugins/homepage/data.json"), {});
    const homepage = homepageConfig.homepages?.["Main Homepage"];
    if (homepage?.value !== "Inizia Qui" || homepage?.openOnStartup !== true) {
        errors.push("homepage non configurata per aprire Inizia Qui all'avvio");
    }

    const appearanceConfig = readJson(repoPath(OUT, ".obsidian/appearance.json"), {});
    if (!Array.isArray(appearanceConfig.enabledCssSnippets) || !appearanceConfig.enabledCssSnippets.includes("gdr-vault")) {
        errors.push("snippet gdr-vault non abilitato nella release");
    }

    const templaterConfig = readJson(repoPath(OUT, ".obsidian/plugins/templater-obsidian/data.json"), {});
    if (templaterConfig.templates_folder !== "z.modelli" || templaterConfig.user_scripts_folder !== "z.automazioni/templater") {
        errors.push("Templater non configurato su z.modelli e z.automazioni/templater nella release");
    }

    const dataviewConfig = readJson(repoPath(OUT, ".obsidian/plugins/dataview/data.json"), {});
    if (dataviewConfig.enableDataviewJs !== true) {
        errors.push("DataviewJS non abilitato nella release");
    }

    const workspaceConfig = readJson(repoPath(OUT, ".obsidian/workspace.json"), {});
    const firstLeaf = workspaceConfig.main?.children?.[0]?.children?.[0]?.state;
    if (firstLeaf?.state?.file !== "Inizia Qui.md" || firstLeaf?.state?.mode !== "preview") {
        errors.push("workspace release non apre Inizia Qui in modalita lettura");
    }

    const releaseSet = new Set(releaseEntries);
    const bookmarksConfig = readJson(repoPath(OUT, ".obsidian/bookmarks.json"), {});
    const collectBookmarks = items => {
        for (const item of items ?? []) {
            if (item.type === "group") collectBookmarks(item.items);
            if (item.type === "file") {
                if (String(item.path ?? "").startsWith("z.")) errors.push(`bookmark tecnico nella release: ${item.path}`);
                if (!releaseSet.has(item.path)) errors.push(`bookmark verso file mancante nella release: ${item.path}`);
            }
        }
    };
    collectBookmarks(bookmarksConfig.items);

    if (errors.length) {
        console.error("Release pulita non valida:");
        for (const error of errors) console.error(`- ${error}`);
        process.exit(1);
    }

    if (!QUIET) console.log(`Release pulita verificata: ${releaseEntries.length} percorsi controllati.`);
}

function hasPluginNativeReleasePage(text) {
    return text.includes("````tabs")
        && /> \[![^\]]+\]/.test(text)
        && /```dataview|```dataviewjs|```tasks|INPUT\[|BUTTON\[|#task/.test(text)
        && /Fallback Markdown/i.test(text);
}

function zipIfAvailable() {
    try {
        if (fs.existsSync(ZIP)) fs.rmSync(ZIP);
        execFileSync("zip", ["-qr", ZIP, path.basename(OUT)], { cwd: DIST, stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}

function materializeTemplates(targetRoot) {
    execFileSync("python3", [
        TEMPLATE_FACTORY_RENDERER,
        "--materialize-only",
        "--target-root",
        targetRoot,
        ...(QUIET ? ["--quiet"] : [])
    ], { cwd: ROOT, stdio: "inherit" });
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
copyDir(ROOT, OUT, ROOT);
materializeTemplates(OUT);
writeGeneratedReleaseNotes();
if (INCLUDE_DEMO) {
    const result = generateDemoWorld({ outDir: OUT, force: true });
    if (!QUIET) console.log(`Demo utente generata: ${result.files.length} file in ${rel(result.root)}`);
}
validateRelease();

const zipped = zipIfAvailable();
if (!QUIET) console.log(`Release utente creata: ${rel(OUT)}`);
if (zipped && !QUIET) {
    console.log(`Zip utente creato: ${rel(ZIP)}`);
} else if (!zipped) {
    console.log("Zip utente non creato: comando zip non disponibile.");
}
