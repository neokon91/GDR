#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { cdpClient, waitForPageTarget: waitForDevToolsPageTarget } = require("./obsidian_acceptance_cdp");
const { createLiveAcceptanceConfig } = require("./obsidian_acceptance_config");
const {
    acceptPrompts: acceptProfilePrompts,
    buildRelease,
    findFreePort,
    launchObsidian,
    markProfileReady,
    prepareProfile,
    sleep,
    stopProfileObsidian
} = require("./obsidian_acceptance_process");
const { createObsidianAcceptanceValidators } = require("./obsidian_acceptance_validators");

const ROOT = process.cwd();
const OBSIDIAN_APP = optionValue("--obsidian", "/Applications/Obsidian.app");
const ACCEPT_PROMPTS = process.argv.includes("--accept-prompts");
const CONTRACT_CHECK = process.argv.includes("--contract-check");
const KEEP_OPEN = process.argv.includes("--keep-open");
const FRESH_INSTALL = process.argv.includes("--fresh-install");
const LEGACY_RESET_PROFILE = process.argv.includes("--reset-profile");
const PRESEED_DAEMON = !process.argv.includes("--no-daemon-preseed");
const WITH_DEMO = !process.argv.includes("--no-demo");
const RUN_WORKFLOW_SMOKE = !process.argv.includes("--skip-workflow");
const RUN_CYCLE_SMOKE = RUN_WORKFLOW_SMOKE && !process.argv.includes("--skip-cycle");
const RUN_PLUGIN_RUNTIME_PROBES = !process.argv.includes("--skip-plugin-probes");
const REQUESTED_PORT = Number(optionValue("--port", "0")) || 0;
const PAGE_SETTLE_MS = Number(optionValue("--page-settle-ms", "5000")) || 5000;
const PROFILE_ROOT = path.join(os.homedir(), "Library/Application Support/obsidian-gdr-live-test");
const WORK_ROOT = path.join(os.homedir(), "Library/Caches/vault-gdr-live-test");
const OUT = path.join(WORK_ROOT, "vault-gdr-clean");
const PROFILE_READY_FILE = path.join(PROFILE_ROOT, "gdr-live-test-profile-ready.json");
const {
    CYCLE_SMOKE,
    FIRST_RUN_PAGES,
    PLUGIN_RUNTIME_PROBES,
    UX_SURFACE_CHECKS,
    WORKFLOW_SMOKE,
    validateLiveAcceptanceContract
} = createLiveAcceptanceConfig(ROOT);
const {
    validatePersistenceReport,
    validateReport
} = createObsidianAcceptanceValidators({
    cycleSmoke: CYCLE_SMOKE,
    pluginRuntimeProbes: PLUGIN_RUNTIME_PROBES,
    runCycleSmoke: RUN_CYCLE_SMOKE,
    runPluginRuntimeProbes: RUN_PLUGIN_RUNTIME_PROBES,
    runWorkflowSmoke: RUN_WORKFLOW_SMOKE,
    workflowSmoke: WORKFLOW_SMOKE
});

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

function usage() {
    console.error([
        "Uso: npm run check:obsidian-user",
        "",
        "Avvia Obsidian con profilo persistente isolato e verifica first-run, workflow",
        "Nuovo Mondo Homebrew e persistenza senza riaccettare prompt ogni volta.",
        "",
        "Opzioni:",
        "  --fresh-install    elimina il profilo live-test: solo per riprovare il primo avvio",
        "  --accept-prompts   consente click automatici sui prompt; richiesto con --fresh-install",
        "  --contract-check   valida solo live_acceptance.yaml e non apre Obsidian",
        "  --skip-workflow    salta il workflow smoke Nuovo Mondo Homebrew",
        "  --skip-cycle       salta ciclo live sessione/post-sessione",
        "  --skip-plugin-probes salta probe plugin profondi; utile per live UX rapido",
        "  --no-daemon-preseed diagnostica: non installa il daemon nel profilo prima del bootstrap",
        "  --keep-open        lascia Obsidian aperto a fine prova",
        "  --no-demo          crea release senza demo",
        "  --port <n>         porta DevTools esplicita",
        "  --page-settle-ms <n> attesa dopo apertura pagina, default 5000"
    ].join("\n"));
}

function uniqueStrings(values) {
    return [...new Set((values ?? []).map(value => String(value)).filter(Boolean))];
}

function acceptPrompts() {
    return acceptProfilePrompts(PROFILE_ROOT);
}

async function waitForPageTarget(port, timeoutMs = 45000) {
    return await waitForDevToolsPageTarget(port, {
        timeoutMs,
        acceptPrompts: ACCEPT_PROMPTS ? acceptPrompts : null
    });
}

async function waitForReadyPlugins(cdp) {
    const readyDeadline = Date.now() + 45000;
    while (Date.now() < readyDeadline) {
        if (ACCEPT_PROMPTS) acceptPrompts();
        const ready = await cdp.evaluate("(() => typeof app === \"object\" && Boolean(app.vault) && Boolean(app.workspace))()");
        if (ready) break;
        await sleep(750);
    }

    let summary = null;
    const pluginDeadline = Date.now() + (FRESH_INSTALL || ACCEPT_PROMPTS ? 240000 : 180000);
    while (Date.now() < pluginDeadline) {
        if (ACCEPT_PROMPTS) acceptPrompts();
        summary = await cdp.evaluate(`(async () => {
            const expected = JSON.parse(await app.vault.adapter.read(".obsidian/community-plugins.json"));
            const enabled = Array.from(app.plugins?.enabledPlugins ?? []);
            const loaded = Object.keys(app.plugins?.plugins ?? {});
            const commands = Object.keys(app.commands?.commands ?? {});
            return {
                vault: app.vault.getName(),
                activeFile: app.workspace.getActiveFile()?.path ?? null,
                expectedPluginCount: expected.length,
                enabledPluginCount: enabled.filter(id => expected.includes(id)).length,
                loadedPluginCount: loaded.filter(id => expected.includes(id)).length,
                missingLoaded: expected.filter(id => !loaded.includes(id)),
                keyCommands: {
                    templater: commands.some(id => id.includes("templater")),
                    metabind: commands.some(id => id.includes("obsidian-meta-bind-plugin") || id.includes("meta-bind")),
                    dataview: commands.some(id => id.includes("dataview")),
                    fantasyGenerator: commands.some(id => id.includes("fantasy-content-generator"))
                }
            };
        })()`, { awaitPromise: true, timeoutMs: 20000 });
        const commandsReady = Object.values(summary.keyCommands).every(Boolean);
        if (summary.loadedPluginCount === summary.expectedPluginCount && !summary.missingLoaded.length && commandsReady) break;
        await sleep(1000);
    }
    return summary;
}

async function inspectPage(cdp, pagePath) {
    const before = cdp.events.length;
    if (ACCEPT_PROMPTS) acceptPrompts();
    const openState = await cdp.evaluate(`(async () => {
        const pagePath = ${JSON.stringify(pagePath)};
        const file = app.vault.getAbstractFileByPath(pagePath);
        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        if (!file) return { exists: false, activeFile: app.workspace.getActiveFile()?.path ?? null };
        let activeFile = null;
        for (let attempt = 0; attempt < 8; attempt += 1) {
            const leaf = app.workspace.getLeaf(attempt === 0 ? false : "tab");
            await leaf.openFile(file, { active: true });
            if (typeof app.workspace.setActiveLeaf === "function") {
                app.workspace.setActiveLeaf(leaf, { focus: true });
            }
            await sleep(500);
            activeFile = app.workspace.getActiveFile()?.path ?? null;
            if (activeFile === pagePath) return { exists: true, activeFile, attempts: attempt + 1 };
        }
        return { exists: true, activeFile, attempts: 8 };
    })()`, { awaitPromise: true, timeoutMs: 20000 });
    await sleep(PAGE_SETTLE_MS);
    const state = await cdp.evaluate(`(async () => {
        const pagePath = ${JSON.stringify(pagePath)};
        const ux = ${JSON.stringify(UX_SURFACE_CHECKS)};
        const file = app.vault.getAbstractFileByPath(pagePath);
        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        let activeFile = app.workspace.getActiveFile()?.path ?? null;
        let previewModeError = null;
        if (file && activeFile !== pagePath) {
            const leaf = app.workspace.getLeaf("tab");
            await leaf.openFile(file, { active: true });
            if (typeof app.workspace.setActiveLeaf === "function") {
                app.workspace.setActiveLeaf(leaf, { focus: true });
            }
            await sleep(500);
            activeFile = app.workspace.getActiveFile()?.path ?? null;
        }
        try {
            const activeLeaf = app.workspace.getLeaf(false);
            if (file && activeLeaf?.setViewState) {
                await activeLeaf.setViewState({
                    type: "markdown",
                    state: { file: pagePath, mode: "preview" },
                    active: true
                });
                await sleep(500);
                activeFile = app.workspace.getActiveFile()?.path ?? null;
            }
        } catch (error) {
            previewModeError = String(error?.message ?? error);
        }
        const activeLeafElement = document.querySelector(".workspace-leaf.mod-active") ?? document.querySelector(".workspace-leaf");
        const contentRoot = activeLeafElement?.querySelector(".markdown-preview-view, .markdown-reading-view, .markdown-source-view, .view-content") ?? activeLeafElement ?? document.body;
        const visibleText = String(contentRoot?.innerText ?? "");
        const normalizedVisibleText = visibleText.toLocaleLowerCase("it");
        const bodyText = document.body.innerText;
        const text = visibleText || bodyText;
        const includesVisible = value => normalizedVisibleText.includes(String(value ?? "").toLocaleLowerCase("it"));
        const isVisible = node => {
            const style = window.getComputedStyle(node);
            if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
            const rect = node.getBoundingClientRect();
            return rect.width > 0 || rect.height > 0 || node.getClientRects().length > 0;
        };
        const forbiddenTextHits = (ux.forbidden_visible_text ?? [])
            .map(String)
            .filter(marker => marker && visibleText.includes(marker));
        const forbiddenRegexHits = [];
        for (const pattern of ux.forbidden_visible_regex ?? []) {
            try {
                const regex = new RegExp(String(pattern), "i");
                if (regex.test(visibleText)) forbiddenRegexHits.push(String(pattern));
            } catch {
                forbiddenRegexHits.push("regex non valida: " + String(pattern));
            }
        }
        const forbiddenSelectorHits = [];
        for (const rule of ux.forbidden_visible_selectors ?? []) {
            try {
                const nodes = [...contentRoot.querySelectorAll(String(rule.selector ?? ""))]
                    .filter(node => isVisible(node) && String(node.innerText ?? "").trim());
                if (nodes.length) {
                    forbiddenSelectorHits.push({
                        selector: String(rule.selector ?? ""),
                        description: String(rule.description ?? ""),
                        count: nodes.length,
                        sample: nodes.slice(0, 2).map(node => String(node.innerText ?? "").trim().slice(0, 120))
                    });
                }
            } catch {
                forbiddenSelectorHits.push({
                    selector: String(rule.selector ?? ""),
                    description: "selettore UX non valutabile",
                    count: 1,
                    sample: []
                });
            }
        }
        const requiredRule = (ux.required_visible_text_by_page ?? []).find(rule => String(rule.page ?? "") === pagePath) ?? null;
        const missingAllText = (requiredRule?.all ?? []).map(String).filter(marker => !includesVisible(marker));
        const anyText = (requiredRule?.any ?? []).map(String).filter(Boolean);
        const missingAnyText = anyText.length && !anyText.some(marker => includesVisible(marker)) ? anyText : [];
        const collectClickableLabels = () => [...contentRoot.querySelectorAll(".meta-bind-button, .mb-button, button")]
            .filter(isVisible)
            .map(node => String(node.innerText ?? node.getAttribute("aria-label") ?? node.getAttribute("title") ?? "").trim())
            .filter(Boolean);
        const clickableLabels = [];
        const addClickableLabels = labels => {
            for (const label of labels) {
                if (!clickableLabels.includes(label)) clickableLabels.push(label);
            }
        };
        addClickableLabels(collectClickableLabels());
        const scrollContainer = [
            contentRoot,
            contentRoot.closest?.(".view-content"),
            activeLeafElement?.querySelector(".view-content"),
            document.scrollingElement
        ].filter(Boolean).find(node => Number(node.scrollHeight ?? 0) > Number(node.clientHeight ?? 0) + 20) ?? contentRoot;
        const originalScrollTop = Number(scrollContainer.scrollTop ?? 0);
        const maxScrollTop = Math.max(0, Number(scrollContainer.scrollHeight ?? 0) - Number(scrollContainer.clientHeight ?? 0));
        if (maxScrollTop > 0) {
            for (const ratio of [0.25, 0.5, 0.75, 1]) {
                scrollContainer.scrollTop = Math.round(maxScrollTop * ratio);
                await sleep(150);
                addClickableLabels(collectClickableLabels());
            }
            scrollContainer.scrollTop = originalScrollTop;
        }
        const normalizedClickableLabels = clickableLabels.map(label => label.toLocaleLowerCase("it"));
        const includesClickable = value => normalizedClickableLabels.some(label => label.includes(String(value ?? "").toLocaleLowerCase("it")));
        const clickableRule = (ux.required_clickable_buttons_by_page ?? []).find(rule => String(rule.page ?? "") === pagePath) ?? null;
        const missingClickableAll = (clickableRule?.all ?? []).map(String).filter(marker => !includesClickable(marker));
        const clickableAny = (clickableRule?.any ?? []).map(String).filter(Boolean);
        const missingClickableAny = clickableAny.length && !clickableAny.some(marker => includesClickable(marker)) ? clickableAny : [];
        return {
            page: ${JSON.stringify(pagePath)},
            exists: ${JSON.stringify(Boolean(openState.exists))},
            openAttempts: ${JSON.stringify(openState.attempts ?? 0)},
            activeFile,
            title: document.title,
            previewModeError,
            restrictedMode: /restricted mode|community plugins.*disabled|modalita.*limitata/i.test(text),
            dataviewError: /Evaluation Error|dataview.*error|dataviewjs.*error/i.test(text),
            templaterLeak: /<%[\\s\\S]*?%>/.test(text),
            ux: {
                visibleTextLength: visibleText.length,
                forbiddenTextHits,
                forbiddenRegexHits,
                forbiddenSelectorHits,
                missingAllText,
                missingAnyText,
                clickableLabels,
                missingClickableAll,
                missingClickableAny
            },
            problemNotices: [...document.querySelectorAll(".notice")]
                .map(node => node.innerText)
                .filter(text => /error|errore|failed|fallit|exception/i.test(text))
                .slice(-5)
        };
    })()`, { awaitPromise: true, timeoutMs: 20000 });
    return { ...state, newEvents: cdp.events.slice(before) };
}

async function verifyWorkflowState(cdp, phase) {
    return await cdp.evaluate(`(async () => {
        const workflow = ${JSON.stringify(WORKFLOW_SMOKE)};
        const expectedFiles = (workflow.expected_files ?? []).map(String);
        const expectedWorldPath = String(workflow.expected_world_path ?? "");
        const expectedWorldContains = (workflow.expected_world_contains ?? []).map(String);
        const missingFiles = expectedFiles.filter(filePath => !app.vault.getAbstractFileByPath(filePath));
        const worldFile = app.vault.getAbstractFileByPath(expectedWorldPath);
        const worldText = worldFile ? await app.vault.read(worldFile) : "";
        const missingWorldText = expectedWorldContains.filter(snippet => !worldText.includes(snippet));
        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        let cache = worldFile ? app.metadataCache.getFileCache(worldFile)?.frontmatter ?? null : null;
        let dataviewPage = null;
        for (let attempt = 0; attempt < 30; attempt += 1) {
            cache = worldFile ? app.metadataCache.getFileCache(worldFile)?.frontmatter ?? null : null;
            const dataviewApi = app.plugins?.plugins?.dataview?.api ?? null;
            dataviewPage = dataviewApi
                ? dataviewApi.page(expectedWorldPath) ?? dataviewApi.page(expectedWorldPath.replace(/\\.md$/, ""))
                : null;
            if (cache?.categoria === "mondo" && dataviewPage) break;
            await sleep(500);
        }
        return {
            phase: ${JSON.stringify(phase)},
            expectedFileCount: expectedFiles.length,
            missingFiles,
            worldExists: Boolean(worldFile),
            worldPath: worldFile?.path ?? null,
            activeFile: app.workspace.getActiveFile()?.path ?? null,
            missingWorldText,
            metadataCategoria: cache?.categoria ?? null,
            metadataNome: cache?.nome ?? null,
            dataviewIndexed: Boolean(dataviewPage)
        };
    })()`, { awaitPromise: true, timeoutMs: 30000 });
}

async function runWorkflowSmoke(cdp) {
    const before = cdp.events.length;
    const workflow = WORKFLOW_SMOKE;
    await inspectPage(cdp, String(workflow.setup_page));

    const result = await cdp.evaluate(`(async () => {
        const workflow = ${JSON.stringify(WORKFLOW_SMOKE)};
        const promptAnswers = workflow.prompt_answers ?? {};
        const suggesterAnswers = workflow.suggester_answers ?? {};
        const expectedFiles = (workflow.expected_files ?? []).map(String);
        const templateFile = String(workflow.template_file ?? "");
        const tempNote = String(workflow.temp_note ?? "");
        const expectedWorldPath = String(workflow.expected_world_path ?? "");
        const expectedWorldName = String(workflow.expected_world_name ?? "");

        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        const stripOptional = value => String(value ?? "").replace(/\\s+\\(opzionale\\)$/, "");
        const getFile = filePath => app.vault.getAbstractFileByPath(filePath);
        const ensureFolder = async folderPath => {
            const parts = String(folderPath ?? "").split("/").filter(Boolean);
            let current = "";
            for (const part of parts) {
                current = current ? current + "/" + part : part;
                if (!app.vault.getAbstractFileByPath(current)) await app.vault.createFolder(current);
            }
        };
        const deleteIfExists = async filePath => {
            const file = getFile(filePath);
            if (file) await app.vault.delete(file, true);
        };
        const moduleCache = {};
        const normalizeRequiredPath = (fromPath, required) => {
            if (!String(required ?? "").startsWith(".")) return "";
            const fromParts = String(fromPath).split("/");
            fromParts.pop();
            for (const part of String(required).split("/")) {
                if (!part || part === ".") continue;
                if (part === "..") fromParts.pop();
                else fromParts.push(part);
            }
            const resolved = fromParts.join("/");
            return /\.(js|json)$/i.test(resolved) ? resolved : resolved + ".js";
        };
        const loadCommonJs = async filePath => {
            const normalizedPath = String(filePath);
            if (moduleCache[normalizedPath]) return moduleCache[normalizedPath].exports;
            const source = await app.vault.adapter.read(normalizedPath);
            if (normalizedPath.endsWith(".json")) {
                const module = { exports: JSON.parse(source) };
                moduleCache[normalizedPath] = module;
                return module.exports;
            }
            const module = { exports: {} };
            moduleCache[normalizedPath] = module;
            const requiredModules = [...source.matchAll(/require\\(["']([^"']+)["']\\)/g)]
                .map(match => normalizeRequiredPath(normalizedPath, match[1]))
                .filter(Boolean);
            for (const requiredPath of requiredModules) {
                await loadCommonJs(requiredPath);
            }
            const localRequire = required => {
                const requiredPath = normalizeRequiredPath(normalizedPath, required);
                if (requiredPath && moduleCache[requiredPath]) return moduleCache[requiredPath].exports;
                throw new Error("require non supportato nel live workflow: " + required);
            };
            Function("module", "exports", "require", "app", "Notice", source)(module, module.exports, localRequire, app, Notice);
            return module.exports;
        };

        const bodyText = document.body.innerText;
        const metaBindConfig = JSON.parse(await app.vault.adapter.read(".obsidian/plugins/obsidian-meta-bind-plugin/data.json"));
        const button = (metaBindConfig.buttonTemplates ?? []).find(entry => entry.id === workflow.button_id);
        const buttonAction = button?.actions?.[0] ?? null;
        const templateExists = Boolean(getFile(templateFile));
        const helperExists = Boolean(getFile(String(workflow.helper_script ?? "")));
        const userScriptExists = Boolean(getFile(String(workflow.user_script ?? "")));

        for (const filePath of [...expectedFiles].reverse()) await deleteIfExists(filePath);
        await deleteIfExists(tempNote);
        await ensureFolder(tempNote.split("/").slice(0, -1).join("/"));
        await app.vault.create(tempNote, "# Live Acceptance Temp\\n");
        await app.workspace.openLinkText(tempNote, "", false);

        const helpers = await loadCommonJs(String(workflow.helper_script));
        const wizard = await loadCommonJs(String(workflow.user_script));
        let currentPath = tempNote;
        const promptLog = [];
        const suggesterLog = [];
        const tp = {
            user: { helpers },
            system: {
                async prompt(message, defaultValue = "") {
                    const key = stripOptional(message);
                    const value = Object.prototype.hasOwnProperty.call(promptAnswers, key)
                        ? promptAnswers[key]
                        : defaultValue;
                    promptLog.push({ message: key, value: String(value ?? "") });
                    return value;
                },
                async suggester(labels, options, _throwOnCancel, message) {
                    const expected = String(suggesterAnswers[message] ?? labels[0] ?? "");
                    const index = labels.findIndex(label => String(label) === expected);
                    const selected = index >= 0 ? options[index] : options[0];
                    suggesterLog.push({ message: String(message ?? ""), value: String(selected?.label ?? selected?.id ?? selected ?? "") });
                    return selected;
                }
            },
            file: {
                async move(targetWithoutExt) {
                    const targetPath = String(targetWithoutExt).endsWith(".md")
                        ? String(targetWithoutExt)
                        : String(targetWithoutExt) + ".md";
                    await ensureFolder(targetPath.split("/").slice(0, -1).join("/"));
                    const currentFile = getFile(currentPath);
                    if (!currentFile) throw new Error("nota temporanea live acceptance mancante: " + currentPath);
                    if (app.fileManager?.renameFile) await app.fileManager.renameFile(currentFile, targetPath);
                    else await app.vault.rename(currentFile, targetPath);
                    currentPath = targetPath;
                }
            }
        };

        const frontmatter = await wizard(tp);
        const templateText = await app.vault.adapter.read(templateFile);
        const templateBody = templateText.replace(/^<%[\\s\\S]*?%>\\s*/, "");
        const worldFile = getFile(currentPath);
        if (!worldFile) throw new Error("nota mondo live acceptance non creata: " + currentPath);
        await app.vault.modify(worldFile, String(frontmatter ?? "") + templateBody);
        await app.workspace.openLinkText(currentPath, "", false);
        await sleep(1500);

        return {
            setupPage: workflow.setup_page,
            bodyHasButtonLabel: bodyText.includes(String(workflow.button_label ?? "")) || bodyText.includes("Crea mondo"),
            buttonFound: Boolean(button),
            buttonLabel: button?.label ?? null,
            buttonActionType: buttonAction?.type ?? null,
            buttonTemplateFile: buttonAction?.templateFile ?? null,
            templateExists,
            helperExists,
            userScriptExists,
            expectedWorldPath,
            expectedWorldName,
            currentPath,
            promptCount: promptLog.length,
            suggesterCount: suggesterLog.length,
            promptLog,
            suggesterLog
        };
    })()`, { awaitPromise: true, timeoutMs: 120000 });

    const state = await verifyWorkflowState(cdp, "workflow");
    return { ...result, state, newEvents: cdp.events.slice(before) };
}

async function verifyCycleState(cdp, phase) {
    return await cdp.evaluate(`(async () => {
        const cycle = ${JSON.stringify(CYCLE_SMOKE)};
        const expectedSessionPath = String(cycle.expected_session_path ?? "");
        const expectedText = (cycle.expected_session_contains ?? []).map(String);
        const expectedFrontmatter = cycle.expected_session_frontmatter ?? {};
        const expectedLists = cycle.expected_session_list_contains ?? {};
        const sessionFile = app.vault.getAbstractFileByPath(expectedSessionPath);
        const sessionText = sessionFile ? await app.vault.read(sessionFile) : "";
        const missingSessionText = expectedText.filter(snippet => !sessionText.includes(snippet));
        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        let cache = sessionFile ? app.metadataCache.getFileCache(sessionFile)?.frontmatter ?? null : null;
        let dataviewPage = null;
        for (let attempt = 0; attempt < 30; attempt += 1) {
            cache = sessionFile ? app.metadataCache.getFileCache(sessionFile)?.frontmatter ?? null : null;
            const dataviewApi = app.plugins?.plugins?.dataview?.api ?? null;
            dataviewPage = dataviewApi
                ? dataviewApi.page(expectedSessionPath) ?? dataviewApi.page(expectedSessionPath.replace(/\\.md$/, ""))
                : null;
            if (cache?.categoria === "sessione" && dataviewPage) break;
            await sleep(500);
        }
        const missingFrontmatter = Object.entries(expectedFrontmatter)
            .filter(([key, expected]) => cache?.[key] !== expected)
            .map(([key, expected]) => ({ key, expected, actual: cache?.[key] ?? null }));
        const normalize = value => Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
        const missingListValues = Object.entries(expectedLists).flatMap(([key, expectedValues]) => {
            const actual = normalize(cache?.[key]);
            return normalize(expectedValues)
                .filter(expected => !actual.includes(expected))
                .map(expected => ({ key, expected, actual }));
        });
        return {
            phase: ${JSON.stringify(phase)},
            sessionExists: Boolean(sessionFile),
            sessionPath: sessionFile?.path ?? null,
            activeFile: app.workspace.getActiveFile()?.path ?? null,
            missingSessionText,
            missingFrontmatter,
            missingListValues,
            metadataCategoria: cache?.categoria ?? null,
            metadataStato: cache?.stato ?? null,
            metadataAttiva: cache?.attiva ?? null,
            dataviewIndexed: Boolean(dataviewPage)
        };
    })()`, { awaitPromise: true, timeoutMs: 30000 });
}

async function runPluginRuntimeProbes(cdp) {
    return await cdp.evaluate(`(async () => {
        const probes = ${JSON.stringify(PLUGIN_RUNTIME_PROBES)};
        const commandText = Object.entries(app.commands?.commands ?? {})
            .map(([id, command]) => [id, command?.name ?? ""].join(" ").toLowerCase());
        const getPath = (data, pathText) => String(pathText ?? "").split(".").reduce((value, key) => value?.[key], data);
        const readText = async filePath => await app.vault.adapter.read(filePath);
        const errors = [];
        const results = [];

        for (const probe of probes) {
            const id = String(probe.id ?? "");
            const plugin = app.plugins?.plugins?.[id] ?? null;
            const result = { id, loaded: Boolean(plugin), checks: [] };
            if (!plugin) {
                errors.push(id + ": plugin non caricato nel live runtime");
            }

            for (const needle of probe.commands_any ?? []) {
                const normalized = String(needle).toLowerCase();
                const matched = commandText.some(command => command.includes(normalized));
                result.checks.push({ type: "command", needle, ok: matched });
                if (!matched) errors.push(id + ": comando runtime non trovato (" + needle + ")");
            }

            for (const apiCheck of probe.api_checks ?? []) {
                let ok = false;
                if (apiCheck === "dataview_page") {
                    const api = app.plugins?.plugins?.dataview?.api ?? null;
                    const sample = api?.page?.("Inizia Qui") ?? api?.page?.("Hub/1. DM Dashboard");
                    const pages = api?.pages?.();
                    const pageCount = typeof pages?.length === "number"
                        ? pages.length
                        : typeof pages?.array === "function"
                            ? pages.array().length
                            : 0;
                    ok = Boolean(api && (sample || pageCount > 0));
                }
                result.checks.push({ type: "api", apiCheck, ok });
                if (!ok) errors.push(id + ": API runtime non verificata (" + apiCheck + ")");
            }

            for (const filePath of probe.file_checks ?? []) {
                const exists = Boolean(app.vault.getAbstractFileByPath(String(filePath)));
                result.checks.push({ type: "file", filePath, ok: exists });
                if (!exists) errors.push(id + ": file operativo mancante (" + filePath + ")");
            }

            for (const sourceCheck of probe.source_checks ?? []) {
                const filePath = String(sourceCheck.file ?? "");
                let text = "";
                let exists = false;
                try {
                    text = await readText(filePath);
                    exists = true;
                } catch {
                    exists = false;
                }
                result.checks.push({ type: "source", filePath, ok: exists });
                if (!exists) {
                    errors.push(id + ": sorgente operativa mancante (" + filePath + ")");
                    continue;
                }
                for (const marker of sourceCheck.contains ?? []) {
                    const ok = text.includes(String(marker));
                    result.checks.push({ type: "source-contains", filePath, marker, ok });
                    if (!ok) errors.push(id + ": marker operativo mancante in " + filePath + " (" + marker + ")");
                }
            }

            for (const configCheck of probe.config_checks ?? []) {
                const filePath = String(configCheck.path ?? "");
                let text = "";
                let data = null;
                try {
                    text = await readText(filePath);
                    data = JSON.parse(text);
                } catch {
                    // Alcuni plugin usano file non JSON, ma in questo vault dichiariamo solo data.json.
                }
                const exists = Boolean(text);
                result.checks.push({ type: "config", filePath, ok: exists });
                if (!exists) {
                    errors.push(id + ": configurazione plugin mancante (" + filePath + ")");
                    continue;
                }
                for (const marker of configCheck.contains ?? []) {
                    const ok = text.includes(String(marker));
                    result.checks.push({ type: "config-contains", filePath, marker, ok });
                    if (!ok) errors.push(id + ": marker configurazione mancante in " + filePath + " (" + marker + ")");
                }
                for (const [jsonPath, expected] of Object.entries(configCheck.json_equals ?? {})) {
                    const actual = getPath(data, jsonPath);
                    const ok = actual === expected;
                    result.checks.push({ type: "json-equals", filePath, jsonPath, expected, actual, ok });
                    if (!ok) errors.push(id + ": configurazione " + filePath + "." + jsonPath + " inattesa (" + actual + ")");
                }
                for (const [jsonPath, minLength] of Object.entries(configCheck.array_min ?? {})) {
                    const actual = getPath(data, jsonPath);
                    const length = Array.isArray(actual) ? actual.length : 0;
                    const ok = length >= Number(minLength);
                    result.checks.push({ type: "array-min", filePath, jsonPath, minLength, length, ok });
                    if (!ok) errors.push(id + ": configurazione " + filePath + "." + jsonPath + " sotto soglia (" + length + "/" + minLength + ")");
                }
            }

            results.push(result);
        }

        return { probeCount: probes.length, errors, results };
    })()`, { awaitPromise: true, timeoutMs: 120000 });
}

async function runCycleSmoke(cdp) {
    const before = cdp.events.length;
    const cycle = CYCLE_SMOKE;
    await inspectPage(cdp, String(cycle.setup_page));

    const result = await cdp.evaluate(`(async () => {
        const cycle = ${JSON.stringify(CYCLE_SMOKE)};
        const workflow = ${JSON.stringify(WORKFLOW_SMOKE)};
        const promptAnswers = cycle.prompt_answers ?? {};
        const suggesterAnswers = cycle.suggester_answers ?? {};
        const expectedSessionPath = String(cycle.expected_session_path ?? "");
        const sessionTemplateFile = String(cycle.session_template_file ?? "");
        const postSessionTemplateFile = String(cycle.post_session_template_file ?? "");
        const tempNote = String(cycle.temp_note ?? "");

        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        const stripOptional = value => String(value ?? "").replace(/\\s+\\(opzionale\\)$/, "");
        const getFile = filePath => app.vault.getAbstractFileByPath(filePath);
        const normalize = value => Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
        const appendUnique = (value, entries) => {
            const current = normalize(value).map(String);
            for (const entry of normalize(entries).map(String)) {
                if (entry && !current.includes(entry)) current.push(entry);
            }
            return current;
        };
        const ensureFolder = async folderPath => {
            const parts = String(folderPath ?? "").split("/").filter(Boolean);
            let current = "";
            for (const part of parts) {
                current = current ? current + "/" + part : part;
                if (!app.vault.getAbstractFileByPath(current)) await app.vault.createFolder(current);
            }
        };
        const deleteIfExists = async filePath => {
            const file = getFile(filePath);
            if (file) await app.vault.delete(file, true);
        };
        const moduleCache = {};
        const normalizeRequiredPath = (fromPath, required) => {
            if (!String(required ?? "").startsWith(".")) return "";
            const fromParts = String(fromPath).split("/");
            fromParts.pop();
            for (const part of String(required).split("/")) {
                if (!part || part === ".") continue;
                if (part === "..") fromParts.pop();
                else fromParts.push(part);
            }
            const resolved = fromParts.join("/");
            return /\.(js|json)$/i.test(resolved) ? resolved : resolved + ".js";
        };
        const loadCommonJs = async filePath => {
            const normalizedPath = String(filePath);
            if (moduleCache[normalizedPath]) return moduleCache[normalizedPath].exports;
            const source = await app.vault.adapter.read(normalizedPath);
            if (normalizedPath.endsWith(".json")) {
                const module = { exports: JSON.parse(source) };
                moduleCache[normalizedPath] = module;
                return module.exports;
            }
            const module = { exports: {} };
            moduleCache[normalizedPath] = module;
            const requiredModules = [...source.matchAll(/require\\(["']([^"']+)["']\\)/g)]
                .map(match => normalizeRequiredPath(normalizedPath, match[1]))
                .filter(Boolean);
            for (const requiredPath of requiredModules) {
                await loadCommonJs(requiredPath);
            }
            const localRequire = required => {
                const requiredPath = normalizeRequiredPath(normalizedPath, required);
                if (requiredPath && moduleCache[requiredPath]) return moduleCache[requiredPath].exports;
                throw new Error("require non supportato nel ciclo live acceptance: " + required);
            };
            Function("module", "exports", "require", "app", "Notice", source)(module, module.exports, localRequire, app, Notice);
            return module.exports;
        };
        const processFrontmatter = async (file, updater) => {
            if (app.fileManager?.processFrontMatter) {
                await app.fileManager.processFrontMatter(file, updater);
                return;
            }
            throw new Error("processFrontMatter Obsidian non disponibile nel ciclo live");
        };
        const openFile = async filePath => {
            const file = getFile(filePath);
            if (!file) throw new Error("file live acceptance mancante: " + filePath);
            const leaf = app.workspace.getLeaf("tab");
            await leaf.openFile(file, { active: true });
            if (typeof app.workspace.setActiveLeaf === "function") app.workspace.setActiveLeaf(leaf, { focus: true });
            await sleep(750);
        };

        const metaBindConfig = JSON.parse(await app.vault.adapter.read(".obsidian/plugins/obsidian-meta-bind-plugin/data.json"));
        const sessionButton = (metaBindConfig.buttonTemplates ?? []).find(entry => entry.id === cycle.session_button_id);
        const postSessionButton = (metaBindConfig.buttonTemplates ?? []).find(entry => entry.id === cycle.post_session_button_id);
        const sessionAction = sessionButton?.actions?.[0] ?? null;
        const postSessionAction = postSessionButton?.actions?.[0] ?? null;
        const sessionTemplateExists = Boolean(getFile(sessionTemplateFile));
        const postSessionTemplateExists = Boolean(getFile(postSessionTemplateFile));
        const sessionScriptExists = Boolean(getFile(String(cycle.session_user_script ?? "")));
        const postSessionScriptExists = Boolean(getFile(String(cycle.post_session_user_script ?? "")));

        await deleteIfExists(expectedSessionPath);
        await deleteIfExists(tempNote);
        await ensureFolder(tempNote.split("/").slice(0, -1).join("/"));
        await app.vault.create(tempNote, "# Live Session Acceptance Temp\\n");
        await openFile(tempNote);

        const helpers = await loadCommonJs("z.automazioni/helpers.js");
        const continuityState = await loadCommonJs("z.automazioni/continuity_state.js");
        const sessionLifecycleActions = await loadCommonJs("z.automazioni/session_lifecycle_actions.js");
        const sessionWizard = await loadCommonJs(String(cycle.session_user_script));
        const postSessionRunner = await loadCommonJs(String(cycle.post_session_user_script));
        helpers.setRoute({ mondo: "[[" + workflow.expected_world_name + "]]" });

        let currentPath = tempNote;
        const promptLog = [];
        const suggesterLog = [];
        const tp = {
            user: {
                helpers,
                continuity_state: continuityState,
                meta_actions: postSessionRunner,
                session_lifecycle_actions: sessionLifecycleActions
            },
            date: {
                now(format) {
                    return String(promptAnswers.Data ?? "2026-05-26");
                }
            },
            system: {
                async prompt(message, defaultValue = "") {
                    const key = stripOptional(message);
                    const value = Object.prototype.hasOwnProperty.call(promptAnswers, key)
                        ? promptAnswers[key]
                        : defaultValue;
                    promptLog.push({ message: key, value: String(value ?? "") });
                    return value;
                },
                async suggester(labels, options, _throwOnCancel, message) {
                    const expected = String(suggesterAnswers[message] ?? labels[0] ?? "");
                    const index = labels.findIndex(label => String(label) === expected);
                    const selected = index >= 0 ? options[index] : options[0];
                    suggesterLog.push({ message: String(message ?? ""), value: String(selected?.label ?? selected?.id ?? selected ?? "") });
                    return selected;
                }
            },
            file: {
                async move(targetWithoutExt) {
                    const targetPath = String(targetWithoutExt).endsWith(".md")
                        ? String(targetWithoutExt)
                        : String(targetWithoutExt) + ".md";
                    await ensureFolder(targetPath.split("/").slice(0, -1).join("/"));
                    const currentFile = getFile(currentPath);
                    if (!currentFile) throw new Error("nota temporanea ciclo live mancante: " + currentPath);
                    if (app.fileManager?.renameFile) await app.fileManager.renameFile(currentFile, targetPath);
                    else await app.vault.rename(currentFile, targetPath);
                    currentPath = targetPath;
                }
            }
        };

        const frontmatter = await sessionWizard(tp);
        const templateText = await app.vault.adapter.read(sessionTemplateFile);
        const templateBody = templateText.replace(/^<%[\\s\\S]*?%>\\s*/, "");
        const sessionFile = getFile(currentPath);
        if (!sessionFile) throw new Error("nota sessione live acceptance non creata: " + currentPath);
        await app.vault.modify(sessionFile, String(frontmatter ?? "") + templateBody);
        await sleep(1000);

        await processFrontmatter(sessionFile, fm => {
            for (const [key, value] of Object.entries(cycle.prepare_frontmatter ?? {})) {
                fm[key] = value;
            }
            for (const [key, value] of Object.entries(cycle.live_frontmatter ?? {})) {
                fm[key] = Array.isArray(value) ? appendUnique(fm[key], value) : value;
            }
        });
        await sleep(1000);
        await openFile(String(cycle.table_page));

        await postSessionRunner(tp, String(cycle.post_session_action));
        await sleep(1500);
        await openFile(String(cycle.post_session_page));

        return {
            setupPage: cycle.setup_page,
            tablePage: cycle.table_page,
            postSessionPage: cycle.post_session_page,
            sessionButtonFound: Boolean(sessionButton),
            sessionButtonLabel: sessionButton?.label ?? null,
            sessionButtonActionType: sessionAction?.type ?? null,
            sessionButtonTemplateFile: sessionAction?.templateFile ?? null,
            postSessionButtonFound: Boolean(postSessionButton),
            postSessionButtonLabel: postSessionButton?.label ?? null,
            postSessionButtonActionType: postSessionAction?.type ?? null,
            postSessionButtonTemplateFile: postSessionAction?.templateFile ?? null,
            sessionTemplateExists,
            postSessionTemplateExists,
            sessionScriptExists,
            postSessionScriptExists,
            expectedSessionPath,
            currentPath,
            promptCount: promptLog.length,
            suggesterCount: suggesterLog.length,
            promptLog,
            suggesterLog
        };
    })()`, { awaitPromise: true, timeoutMs: 120000 });

    const state = await verifyCycleState(cdp, "cycle");
    return { ...result, state, newEvents: cdp.events.slice(before) };
}

async function runPersistencePass(port) {
    const page = await waitForPageTarget(port);
    const cdp = cdpClient(page.webSocketDebuggerUrl);
    await cdp.open();

    try {
        const summary = await waitForReadyPlugins(cdp);
        const state = await verifyWorkflowState(cdp, "persistence");
        const cycleState = RUN_CYCLE_SMOKE ? await verifyCycleState(cdp, "persistence") : null;
        const results = [];
        const pages = uniqueStrings([
            ...(WORKFLOW_SMOKE.persistence_pages ?? []),
            ...(RUN_CYCLE_SMOKE ? (CYCLE_SMOKE.persistence_pages ?? []) : [])
        ]);
        for (const pagePath of pages) {
            results.push(await inspectPage(cdp, String(pagePath)));
        }
        return { summary, state, cycleState, results, events: cdp.events };
    } finally {
        cdp.close();
    }
}

async function runLivePass(port) {
    const page = await waitForPageTarget(port);
    const cdp = cdpClient(page.webSocketDebuggerUrl);
    await cdp.open();

    try {
        const summary = await waitForReadyPlugins(cdp);

        const results = [];
        for (const pagePath of FIRST_RUN_PAGES) {
            results.push(await inspectPage(cdp, pagePath));
        }

        const workflow = RUN_WORKFLOW_SMOKE ? await runWorkflowSmoke(cdp) : null;
        const workflowPages = [];
        for (const pagePath of RUN_WORKFLOW_SMOKE ? (WORKFLOW_SMOKE.verify_pages_after_workflow ?? []) : []) {
            workflowPages.push(await inspectPage(cdp, String(pagePath)));
        }

        const cycle = RUN_CYCLE_SMOKE ? await runCycleSmoke(cdp) : null;
        const cyclePages = [];
        for (const pagePath of RUN_CYCLE_SMOKE ? (CYCLE_SMOKE.verify_pages_after_cycle ?? []) : []) {
            cyclePages.push(await inspectPage(cdp, String(pagePath)));
        }

        const pluginRuntimeProbes = RUN_PLUGIN_RUNTIME_PROBES ? await runPluginRuntimeProbes(cdp) : null;

        return { summary, results, workflow, workflowPages, cycle, cyclePages, pluginRuntimeProbes, events: cdp.events };
    } finally {
        cdp.close();
    }
}

async function main() {
    if (process.argv.includes("--help")) {
        usage();
        process.exit(0);
    }
    const contractErrors = validateLiveAcceptanceContract();
    if (CONTRACT_CHECK) {
        if (contractErrors.length) {
            console.error("Live acceptance contract non valido:");
            for (const error of contractErrors) console.error(`- ${error}`);
            process.exit(1);
        }
        console.log(`Live acceptance contract OK: ${FIRST_RUN_PAGES.length} pagine first-run, ${UX_SURFACE_CHECKS.required_visible_text_by_page.length} gate UX, ${PLUGIN_RUNTIME_PROBES.length} probe plugin, workflow ${WORKFLOW_SMOKE.button_id}, ciclo ${CYCLE_SMOKE.expected_session_name}.`);
        process.exit(0);
    }
    if (LEGACY_RESET_PROFILE && !FRESH_INSTALL) {
        throw new Error("--reset-profile non e piu accettato: cancella la fiducia Obsidian e forza i prompt. Usa --fresh-install --accept-prompts solo per riprovare il primo avvio.");
    }
    if (contractErrors.length) {
        throw new Error(`Live acceptance contract non valido:\n- ${contractErrors.join("\n- ")}`);
    }
    if (FRESH_INSTALL && !ACCEPT_PROMPTS) {
        usage();
        process.exit(2);
    }
    if (typeof WebSocket !== "function" || typeof fetch !== "function") {
        throw new Error("serve Node recente con fetch/WebSocket globali");
    }
    if (process.platform !== "darwin") {
        throw new Error("questo harness usa macOS, Obsidian.app e AppleScript");
    }
    if (!fs.existsSync(OBSIDIAN_APP)) {
        throw new Error(`Obsidian non trovato: ${OBSIDIAN_APP}`);
    }

    stopProfileObsidian(PROFILE_ROOT);
    await sleep(1000);
    prepareProfile({
        freshInstall: FRESH_INSTALL,
        out: OUT,
        preseedDaemon: PRESEED_DAEMON,
        profileRoot: PROFILE_ROOT,
        workRoot: WORK_ROOT
    });
    buildRelease({
        root: ROOT,
        out: OUT,
        withDemo: WITH_DEMO
    });

    const port = REQUESTED_PORT || await findFreePort();
    launchObsidian({
        obsidianApp: OBSIDIAN_APP,
        port,
        profileRoot: PROFILE_ROOT
    });

    try {
        const report = await runLivePass(port);
        let errors = validateReport(report);
        let persistenceReport = null;
        if (!errors.length && RUN_WORKFLOW_SMOKE) {
            stopProfileObsidian(PROFILE_ROOT);
            await sleep(1500);
            const persistencePort = await findFreePort(REQUESTED_PORT ? REQUESTED_PORT + 1 : port + 1);
            launchObsidian({
                obsidianApp: OBSIDIAN_APP,
                port: persistencePort,
                profileRoot: PROFILE_ROOT
            });
            persistenceReport = await runPersistencePass(persistencePort);
            errors = [...errors, ...validatePersistenceReport(persistenceReport)];
        }
        if (errors.length) {
            console.error("Obsidian user-acceptance non valido:");
            for (const error of errors) console.error(`- ${error}`);
            console.error(`Profilo test: ${PROFILE_ROOT}`);
            console.error(`Vault test: ${OUT}`);
            process.exitCode = 1;
            return;
        }
        const workflowText = RUN_WORKFLOW_SMOKE
            ? `, workflow ${WORKFLOW_SMOKE.button_id} creato e persistente`
            : "";
        const cycleText = RUN_CYCLE_SMOKE
            ? `, ciclo sessione/post-sessione ${CYCLE_SMOKE.expected_session_name} verificato`
            : "";
        const probesText = RUN_PLUGIN_RUNTIME_PROBES
            ? `, ${report.pluginRuntimeProbes?.probeCount ?? 0} probe plugin runtime verificati`
            : ", probe plugin profondi saltati";
        const uxText = `, ${UX_SURFACE_CHECKS.required_visible_text_by_page.length} gate UX visibili verificati`;
        console.log(`Obsidian user-acceptance OK: ${report.summary.expectedPluginCount} plugin caricati, ${report.results.length} pagine first-run verificate${uxText}${probesText}${workflowText}${cycleText}.`);
        markProfileReady({
            out: OUT,
            profileReadyFile: PROFILE_READY_FILE,
            profileRoot: PROFILE_ROOT
        });
        console.log(`Profilo test persistente: ${PROFILE_ROOT}`);
        console.log(`Vault test persistente: ${OUT}`);
    } finally {
        if (!KEEP_OPEN) stopProfileObsidian(PROFILE_ROOT);
    }
}

main().catch(error => {
    console.error(error.stack || error.message);
    process.exit(1);
});
