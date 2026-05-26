#!/usr/bin/env node

const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const LIVE_ACCEPTANCE_FILE = "Dev/TemplateFactory/modules/live_acceptance.yaml";
const LIVE_ACCEPTANCE = loadYamlModule(LIVE_ACCEPTANCE_FILE);
const OBSIDIAN_APP = optionValue("--obsidian", "/Applications/Obsidian.app");
const ACCEPT_PROMPTS = process.argv.includes("--accept-prompts");
const CONTRACT_CHECK = process.argv.includes("--contract-check");
const KEEP_OPEN = process.argv.includes("--keep-open");
const FRESH_INSTALL = process.argv.includes("--fresh-install");
const LEGACY_RESET_PROFILE = process.argv.includes("--reset-profile");
const PRESEED_DAEMON = !process.argv.includes("--no-daemon-preseed");
const WITH_DEMO = !process.argv.includes("--no-demo");
const RUN_WORKFLOW_SMOKE = !process.argv.includes("--skip-workflow");
const REQUESTED_PORT = Number(optionValue("--port", "0")) || 0;
const PAGE_SETTLE_MS = Number(optionValue("--page-settle-ms", "5000")) || 5000;
const PROFILE_ROOT = path.join(os.homedir(), "Library/Application Support/obsidian-gdr-live-test");
const WORK_ROOT = path.join(os.homedir(), "Library/Caches/vault-gdr-live-test");
const OUT = path.join(WORK_ROOT, "vault-gdr-clean");
const PROFILE_READY_FILE = path.join(PROFILE_ROOT, "gdr-live-test-profile-ready.json");
const FIRST_RUN_PAGES = requiredConfigArray("first_run_pages");
const WORKFLOW_SMOKE = requiredConfigObject("workflow_smoke");

function loadYamlModule(relPath) {
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

function configValue(pathText) {
    return String(pathText).split(".").reduce((value, key) => value?.[key], LIVE_ACCEPTANCE);
}

function requiredConfigArray(pathText) {
    const values = configValue(pathText) ?? [];
    const normalized = Array.isArray(values)
        ? values.map(value => String(value)).filter(Boolean)
        : [];
    if (!normalized.length) {
        throw new Error(`${LIVE_ACCEPTANCE_FILE}: ${pathText} vuoto o mancante`);
    }
    return normalized;
}

function requiredConfigObject(pathText) {
    const value = configValue(pathText);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${LIVE_ACCEPTANCE_FILE}: ${pathText} deve essere mappa`);
    }
    return value;
}

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
        "  --no-daemon-preseed diagnostica: non installa il daemon nel profilo prima del bootstrap",
        "  --keep-open        lascia Obsidian aperto a fine prova",
        "  --no-demo          crea release senza demo",
        "  --port <n>         porta DevTools esplicita",
        "  --page-settle-ms <n> attesa dopo apertura pagina, default 5000"
    ].join("\n"));
}

function fail(message) {
    throw new Error(message);
}

function validateLiveAcceptanceContract() {
    const errors = [];
    const workflow = WORKFLOW_SMOKE;
    const requiredWorkflowStrings = [
        "setup_page",
        "button_id",
        "button_label",
        "template_file",
        "helper_script",
        "user_script",
        "temp_note",
        "expected_world_path",
        "expected_world_name"
    ];
    for (const key of requiredWorkflowStrings) {
        if (!String(workflow[key] ?? "").trim()) {
            errors.push(`${LIVE_ACCEPTANCE_FILE}: workflow_smoke.${key} vuoto o mancante`);
        }
    }
    for (const key of ["prompt_answers", "suggester_answers"]) {
        const value = workflow[key];
        if (!value || typeof value !== "object" || Array.isArray(value) || !Object.keys(value).length) {
            errors.push(`${LIVE_ACCEPTANCE_FILE}: workflow_smoke.${key} deve essere mappa non vuota`);
        }
    }
    for (const key of ["expected_files", "expected_world_contains", "verify_pages_after_workflow", "persistence_pages"]) {
        if (!Array.isArray(workflow[key]) || !workflow[key].length) {
            errors.push(`${LIVE_ACCEPTANCE_FILE}: workflow_smoke.${key} deve essere lista non vuota`);
        }
    }
    for (const relPath of [workflow.helper_script, workflow.user_script, workflow.template_file]) {
        const sourcePath = path.join(ROOT, String(relPath ?? ""));
        if (relPath && !fs.existsSync(sourcePath) && relPath !== workflow.template_file) {
            errors.push(`${LIVE_ACCEPTANCE_FILE}: file sorgente mancante ${relPath}`);
        }
    }
    if (!FIRST_RUN_PAGES.includes(workflow.setup_page)) {
        errors.push(`${LIVE_ACCEPTANCE_FILE}: workflow_smoke.setup_page deve essere incluso in first_run_pages`);
    }
    if (!workflow.expected_files?.includes?.(workflow.expected_world_path)) {
        errors.push(`${LIVE_ACCEPTANCE_FILE}: workflow_smoke.expected_files deve includere expected_world_path`);
    }
    return errors;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function compact(value) {
    return String(value ?? "").replace(/\s+/g, " ").slice(0, 900);
}

function privateVarPath(file) {
    return file.replace(/^\/var\//, "/private/var/");
}

function processLines() {
    return execFileSync("ps", ["ax", "-o", "pid=,command="], { encoding: "utf8" }).split(/\r?\n/);
}

function profileProcessIds() {
    const markers = [PROFILE_ROOT, privateVarPath(PROFILE_ROOT)];
    return processLines()
        .filter(line => markers.some(marker => line.includes(marker)))
        .map(line => Number(line.trim().split(/\s+/, 1)[0]))
        .filter(pid => pid && pid !== process.pid);
}

function mainObsidianPid() {
    const markers = [PROFILE_ROOT, privateVarPath(PROFILE_ROOT)];
    for (const line of processLines()) {
        if (!markers.some(marker => line.includes(marker))) continue;
        if (!line.includes("/Obsidian.app/Contents/MacOS/Obsidian")) continue;
        const pid = Number(line.trim().split(/\s+/, 1)[0]);
        if (pid) return pid;
    }
    return 0;
}

function stopProfileObsidian() {
    for (const pid of profileProcessIds()) {
        try {
            process.kill(pid, "SIGTERM");
        } catch {
            // Il processo puo essere gia terminato.
        }
    }
}

async function findFreePort(start = 9231) {
    for (let port = start; port < start + 80; port += 1) {
        const free = await new Promise(resolve => {
            const server = net.createServer()
                .once("error", () => resolve(false))
                .once("listening", () => server.close(() => resolve(true)))
                .listen(port, "127.0.0.1");
        });
        if (free) return port;
    }
    fail(`nessuna porta DevTools libera da ${start} a ${start + 79}`);
}

function prepareProfile() {
    if (FRESH_INSTALL) fs.rmSync(PROFILE_ROOT, { recursive: true, force: true });
    fs.mkdirSync(PROFILE_ROOT, { recursive: true });
    fs.mkdirSync(WORK_ROOT, { recursive: true });

    for (const file of fs.readdirSync(PROFILE_ROOT).filter(name => /^mx-main-daemon-.*\.asar$/.test(name))) {
        fs.rmSync(path.join(PROFILE_ROOT, file), { force: true });
    }
    if (PRESEED_DAEMON) {
        const sourceProfile = path.join(os.homedir(), "Library/Application Support/obsidian");
        const daemon = fs.existsSync(sourceProfile)
            ? fs.readdirSync(sourceProfile)
                .filter(name => /^mx-main-daemon-.*\.asar$/.test(name))
                .sort()
                .pop()
            : "";
        if (daemon) {
            fs.copyFileSync(path.join(sourceProfile, daemon), path.join(PROFILE_ROOT, daemon));
        }
    }
    fs.writeFileSync(path.join(PROFILE_ROOT, "mx-pref.json"), `${JSON.stringify({ enableExtension: true }, null, 2)}\n`);
    fs.writeFileSync(path.join(PROFILE_ROOT, "obsidian.json"), `${JSON.stringify({
        vaults: {
            "vault-gdr-live-test": {
                path: OUT,
                ts: Date.now(),
                open: true
            }
        },
        cli: true
    }, null, 2)}\n`);
}

function buildRelease() {
    execFileSync("node", [
        "z.automazioni/release_clean.js",
        "--quiet",
        "--out",
        OUT,
        ...(WITH_DEMO ? ["--with-demo"] : [])
    ], { cwd: ROOT, stdio: "inherit" });
}

function launchObsidian(port) {
    execFileSync("open", [
        "-na",
        OBSIDIAN_APP,
        "--args",
        `--user-data-dir=${PROFILE_ROOT}`,
        `--remote-debugging-port=${port}`
    ], { stdio: "ignore" });
}

const PROMPT_ACCEPTOR = `
on valueText(itemRef)
  set outText to ""
  try
    set outText to outText & " " & (name of itemRef as text)
  end try
  try
    set outText to outText & " " & (description of itemRef as text)
  end try
  try
    set outText to outText & " " & (value of itemRef as text)
  end try
  return outText
end valueText

on collectText(itemRef, depthLeft)
  set outText to my valueText(itemRef)
  if depthLeft <= 0 then return outText
  tell application "System Events"
    try
      repeat with childRef in UI elements of itemRef
        set outText to outText & " " & my collectText(childRef, depthLeft - 1)
      end repeat
    end try
  end tell
  return outText
end collectText

on hasAny(textValue, needles)
  repeat with needle in needles
    if textValue contains (needle as text) then return true
  end repeat
  return false
end hasAny

on shouldClick(labelText, rootText)
  if my hasAny(labelText, {"Cancel", "Annulla", "Don't", "Dont", "Non ", "Deny", "Rifiuta"}) then return false
  if my hasAny(labelText, {"Trust author and enable plugins", "Trust author", "Enable plugins", "Enable community plugins", "Turn on community plugins"}) then return true
  if my hasAny(labelText, {"Considera attendibile", "Autore attendibile", "Abilita plugin", "Plugin della community"}) then return true
  if my hasAny(labelText, {"Install Main Daemon", "Install main daemon", "Installa Main Daemon", "Installa daemon"}) then return true
  if my hasAny(labelText, {"Install", "Installa"}) and my hasAny(rootText, {"Daemon", "daemon", "MX", "Media Extended"}) then return true
  if my hasAny(labelText, {"Continue", "OK", "Continua"}) and my hasAny(rootText, {"community plugin", "Community plugin", "Trust", "trust", "Daemon", "daemon", "plugin della community", "attendibile"}) then return true
  return false
end shouldClick

on clickFirst(itemRef, rootText)
  tell application "System Events"
    try
      if role of itemRef is "AXButton" then
        set labelText to my valueText(itemRef)
        if my shouldClick(labelText, rootText) then
          click itemRef
          return "clicked " & labelText
        end if
      end if
    end try
    try
      repeat with childRef in UI elements of itemRef
        set resultText to my clickFirst(childRef, rootText)
        if resultText is not "" then return resultText
      end repeat
    end try
  end tell
  return ""
end clickFirst

on run argv
  set targetPid to item 1 of argv as integer
  tell application "System Events"
    try
      set targetProcess to first process whose unix id is targetPid
      set frontmost of targetProcess to true
      repeat with winRef in windows of targetProcess
        set rootText to my collectText(winRef, 5)
        set resultText to my clickFirst(winRef, rootText)
        if resultText is not "" then return resultText
      end repeat
    on error errText
      return "error " & errText
    end try
  end tell
  return ""
end run
`;

function acceptPrompts() {
    const pid = mainObsidianPid();
    if (!pid) return "";
    try {
        return execFileSync("osascript", ["-e", PROMPT_ACCEPTOR, String(pid)], {
            encoding: "utf8",
            timeout: 5000
        }).trim();
    } catch (error) {
        return `osascript failed: ${error.message}`;
    }
}

async function waitForPageTarget(port, timeoutMs = 45000) {
    const deadline = Date.now() + timeoutMs;
    let lastError = "";

    while (Date.now() < deadline) {
        if (ACCEPT_PROMPTS) acceptPrompts();
        try {
            const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
            const page = targets.find(target => target.type === "page" && /vault-gdr-clean|Obsidian/.test(target.title ?? ""));
            if (page?.webSocketDebuggerUrl) return page;
        } catch (error) {
            lastError = error.message;
        }
        await sleep(750);
    }

    fail(`target DevTools Obsidian non trovato sulla porta ${port}${lastError ? ` (${lastError})` : ""}`);
}

function cdpClient(wsUrl) {
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    const events = [];

    function send(method, params = {}, timeoutMs = 30000) {
        const id = ++seq;
        ws.send(JSON.stringify({ id, method, params }));
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`timeout CDP ${method}`)), timeoutMs);
            pending.set(id, { resolve, reject, timer, method });
        });
    }

    ws.onmessage = event => {
        const msg = JSON.parse(event.data);
        if (msg.id && pending.has(msg.id)) {
            const item = pending.get(msg.id);
            pending.delete(msg.id);
            clearTimeout(item.timer);
            if (msg.error) item.reject(new Error(`${item.method}: ${msg.error.message}`));
            else item.resolve(msg.result);
            return;
        }
        if (msg.method === "Runtime.exceptionThrown") {
            const details = msg.params.exceptionDetails ?? {};
            const stack = details.stackTrace?.callFrames
                ?.slice(0, 5)
                ?.map(frame => `${frame.functionName || "<anon>"} ${frame.url || ""}:${frame.lineNumber}:${frame.columnNumber}`)
                ?.join(" | ");
            events.push({
                type: "exception",
                text: compact(details.exception?.description || details.exception?.value || details.text),
                url: details.url ?? "",
                line: details.lineNumber ?? null,
                column: details.columnNumber ?? null,
                stack: compact(stack)
            });
        }
        if (msg.method === "Runtime.consoleAPICalled") {
            const level = msg.params.type;
            if (["error", "warning", "assert"].includes(level)) {
                events.push({ type: `console:${level}`, text: msg.params.args.map(arg => compact(arg.value ?? arg.description)).join(" | ") });
            }
        }
        if (msg.method === "Log.entryAdded") {
            const entry = msg.params.entry;
            if (["error", "warning"].includes(entry.level)) {
                events.push({ type: `log:${entry.level}`, text: compact(entry.text) });
            }
        }
    };

    async function open() {
        await new Promise((resolve, reject) => {
            ws.onopen = resolve;
            ws.onerror = reject;
        });
        await send("Runtime.enable");
        await send("Log.enable");
        await send("Page.enable");
    }

    async function evaluate(expression, options = {}) {
        const timeoutMs = options.timeoutMs ?? 30000;
        const result = await send("Runtime.evaluate", {
            expression,
            awaitPromise: options.awaitPromise ?? false,
            returnByValue: true,
            timeout: timeoutMs
        }, timeoutMs + 3000);
        if (result.exceptionDetails) {
            fail(result.exceptionDetails.text || result.exceptionDetails.exception?.description || "Runtime exception");
        }
        return result.result.value;
    }

    return {
        events,
        evaluate,
        open,
        close() {
            ws.close();
        }
    };
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
    const pluginDeadline = Date.now() + 90000;
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
        const file = app.vault.getAbstractFileByPath(pagePath);
        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        let activeFile = app.workspace.getActiveFile()?.path ?? null;
        if (file && activeFile !== pagePath) {
            const leaf = app.workspace.getLeaf("tab");
            await leaf.openFile(file, { active: true });
            if (typeof app.workspace.setActiveLeaf === "function") {
                app.workspace.setActiveLeaf(leaf, { focus: true });
            }
            await sleep(500);
            activeFile = app.workspace.getActiveFile()?.path ?? null;
        }
        const text = document.body.innerText;
        return {
            page: ${JSON.stringify(pagePath)},
            exists: ${JSON.stringify(Boolean(openState.exists))},
            openAttempts: ${JSON.stringify(openState.attempts ?? 0)},
            activeFile,
            title: document.title,
            restrictedMode: /restricted mode|community plugins.*disabled|modalita.*limitata/i.test(text),
            dataviewError: /Evaluation Error|dataview.*error|dataviewjs.*error/i.test(text),
            templaterLeak: /<%[\\s\\S]*?%>/.test(text),
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
        const cache = worldFile ? app.metadataCache.getFileCache(worldFile)?.frontmatter ?? null : null;
        const dataviewApi = app.plugins?.plugins?.dataview?.api ?? null;
        const dataviewPage = dataviewApi
            ? dataviewApi.page(expectedWorldPath) ?? dataviewApi.page(expectedWorldPath.replace(/\\.md$/, ""))
            : null;
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
        const loadCommonJs = async filePath => {
            const source = await app.vault.adapter.read(filePath);
            const module = { exports: {} };
            const localRequire = required => {
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

async function runPersistencePass(port) {
    const page = await waitForPageTarget(port);
    const cdp = cdpClient(page.webSocketDebuggerUrl);
    await cdp.open();

    try {
        const summary = await waitForReadyPlugins(cdp);
        const state = await verifyWorkflowState(cdp, "persistence");
        const results = [];
        for (const pagePath of WORKFLOW_SMOKE.persistence_pages ?? []) {
            results.push(await inspectPage(cdp, String(pagePath)));
        }
        return { summary, state, results, events: cdp.events };
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

        return { summary, results, workflow, workflowPages, events: cdp.events };
    } finally {
        cdp.close();
    }
}

function validateReport(report) {
    const errors = [];
    const { summary, results, workflow, workflowPages = [], events } = report;
    if (!summary) {
        errors.push("plugin summary non disponibile");
        return errors;
    }
    if (summary.enabledPluginCount !== summary.expectedPluginCount || summary.loadedPluginCount !== summary.expectedPluginCount || summary.missingLoaded.length) {
        errors.push(`plugin release non caricati: ${JSON.stringify(summary)}`);
    }
    for (const [name, ok] of Object.entries(summary.keyCommands)) {
        if (!ok) errors.push(`comando/plugin chiave assente nel live pass: ${name}`);
    }
    for (const result of results) {
        errors.push(...validatePageResult(result, "first-run"));
    }
    if (RUN_WORKFLOW_SMOKE) errors.push(...validateWorkflowResult(workflow, "workflow"));
    for (const result of workflowPages) {
        errors.push(...validatePageResult(result, "post-workflow"));
    }
    if (events.length) errors.push(`eventi console globali nel live pass: ${JSON.stringify(events)}`);
    return errors;
}

function validatePageResult(result, label) {
    const errors = [];
    if (!result.exists) errors.push(`pagina ${label} mancante nel live pass: ${result.page}`);
    if (result.activeFile !== result.page) errors.push(`pagina ${label} non aperta nel live pass: ${result.page} -> ${result.activeFile}`);
    if (result.restrictedMode) errors.push(`restricted mode visibile nel live pass ${label}: ${result.page}`);
    if (result.dataviewError) errors.push(`errore Dataview visibile nel live pass ${label}: ${result.page}`);
    if (result.templaterLeak) errors.push(`codice Templater visibile nel live pass ${label}: ${result.page}`);
    if (result.problemNotices.length) errors.push(`notice problematica nel live pass ${label} ${result.page}: ${result.problemNotices.join(" | ")}`);
    if (result.newEvents.length) errors.push(`eventi console nel live pass ${label} ${result.page}: ${JSON.stringify(result.newEvents)}`);
    return errors;
}

function validateWorkflowState(state, label) {
    const errors = [];
    if (!state) return [`workflow ${label} non eseguito`];
    if (state.missingFiles?.length) errors.push(`workflow ${label}: file attesi mancanti (${state.missingFiles.join(", ")})`);
    if (!state.worldExists) errors.push(`workflow ${label}: mondo non creato`);
    if (state.missingWorldText?.length) errors.push(`workflow ${label}: contenuto mondo incompleto (${state.missingWorldText.join(", ")})`);
    if (state.metadataCategoria !== "mondo") errors.push(`workflow ${label}: metadata categoria non indicizzata come mondo (${state.metadataCategoria})`);
    if (!state.dataviewIndexed) errors.push(`workflow ${label}: Dataview non vede il mondo creato`);
    return errors;
}

function validateWorkflowResult(workflow, label) {
    const errors = [];
    if (!workflow) return [`workflow ${label} non eseguito`];
    if (!workflow.bodyHasButtonLabel) errors.push(`workflow ${label}: pulsante Nuovo Mondo non visibile nella pagina setup`);
    if (!workflow.buttonFound) errors.push(`workflow ${label}: template button Meta Bind mancante (${WORKFLOW_SMOKE.button_id})`);
    if (workflow.buttonActionType !== "templaterCreateNote") errors.push(`workflow ${label}: azione Meta Bind inattesa (${workflow.buttonActionType})`);
    if (workflow.buttonTemplateFile !== WORKFLOW_SMOKE.template_file) errors.push(`workflow ${label}: template Meta Bind inatteso (${workflow.buttonTemplateFile})`);
    if (!workflow.templateExists) errors.push(`workflow ${label}: template materializzato mancante (${WORKFLOW_SMOKE.template_file})`);
    if (!workflow.helperExists) errors.push(`workflow ${label}: helper runtime mancante (${WORKFLOW_SMOKE.helper_script})`);
    if (!workflow.userScriptExists) errors.push(`workflow ${label}: user script Templater mancante (${WORKFLOW_SMOKE.user_script})`);
    if (workflow.currentPath !== WORKFLOW_SMOKE.expected_world_path) errors.push(`workflow ${label}: mondo creato nel path inatteso (${workflow.currentPath})`);
    if (!workflow.promptCount || workflow.promptCount < Object.keys(WORKFLOW_SMOKE.prompt_answers ?? {}).length) {
        errors.push(`workflow ${label}: prompt compilati insufficienti (${workflow.promptCount})`);
    }
    errors.push(...validateWorkflowState(workflow.state, label));
    if (workflow.newEvents?.length) errors.push(`workflow ${label}: eventi console durante creazione (${JSON.stringify(workflow.newEvents)})`);
    return errors;
}

function validatePersistenceReport(report) {
    const errors = [];
    if (!report?.summary) return ["persistence live pass non disponibile"];
    if (report.summary.missingLoaded?.length) errors.push(`persistence: plugin mancanti (${report.summary.missingLoaded.join(", ")})`);
    errors.push(...validateWorkflowState(report.state, "persistence"));
    for (const result of report.results ?? []) {
        errors.push(...validatePageResult(result, "persistence"));
    }
    if (report.events?.length) errors.push(`persistence: eventi console globali (${JSON.stringify(report.events)})`);
    return errors;
}

function markProfileReady() {
    fs.mkdirSync(PROFILE_ROOT, { recursive: true });
    fs.writeFileSync(PROFILE_READY_FILE, `${JSON.stringify({
        profileRoot: PROFILE_ROOT,
        vault: OUT,
        updatedAt: new Date().toISOString(),
        promptPolicy: "persistent-profile-no-reaccept"
    }, null, 2)}\n`);
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
        console.log(`Live acceptance contract OK: ${FIRST_RUN_PAGES.length} pagine first-run, workflow ${WORKFLOW_SMOKE.button_id}.`);
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
        fail("serve Node recente con fetch/WebSocket globali");
    }
    if (process.platform !== "darwin") {
        fail("questo harness usa macOS, Obsidian.app e AppleScript");
    }
    if (!fs.existsSync(OBSIDIAN_APP)) {
        fail(`Obsidian non trovato: ${OBSIDIAN_APP}`);
    }

    stopProfileObsidian();
    await sleep(1000);
    prepareProfile();
    buildRelease();

    const port = REQUESTED_PORT || await findFreePort();
    launchObsidian(port);

    try {
        const report = await runLivePass(port);
        let errors = validateReport(report);
        let persistenceReport = null;
        if (!errors.length && RUN_WORKFLOW_SMOKE) {
            stopProfileObsidian();
            await sleep(1500);
            const persistencePort = await findFreePort(REQUESTED_PORT ? REQUESTED_PORT + 1 : port + 1);
            launchObsidian(persistencePort);
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
        console.log(`Obsidian user-acceptance OK: ${report.summary.expectedPluginCount} plugin caricati, ${report.results.length} pagine first-run verificate${workflowText}.`);
        markProfileReady();
        console.log(`Profilo test persistente: ${PROFILE_ROOT}`);
        console.log(`Vault test persistente: ${OUT}`);
    } finally {
        if (!KEEP_OPEN) stopProfileObsidian();
    }
}

main().catch(error => {
    console.error(error.stack || error.message);
    process.exit(1);
});
