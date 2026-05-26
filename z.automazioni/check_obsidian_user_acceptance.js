#!/usr/bin/env node

const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const OBSIDIAN_APP = optionValue("--obsidian", "/Applications/Obsidian.app");
const ACCEPT_PROMPTS = process.argv.includes("--accept-prompts");
const KEEP_OPEN = process.argv.includes("--keep-open");
const RESET_PROFILE = process.argv.includes("--reset-profile");
const PRESEED_DAEMON = !process.argv.includes("--no-daemon-preseed");
const WITH_DEMO = !process.argv.includes("--no-demo");
const REQUESTED_PORT = Number(optionValue("--port", "0")) || 0;
const PAGE_SETTLE_MS = Number(optionValue("--page-settle-ms", "5000")) || 5000;
const PROFILE_ROOT = path.join(os.homedir(), "Library/Application Support/obsidian-gdr-live-test");
const WORK_ROOT = path.join(os.homedir(), "Library/Caches/vault-gdr-live-test");
const OUT = path.join(WORK_ROOT, "vault-gdr-clean");
const FIRST_RUN_PAGES = [
    "Inizia Qui.md",
    "Risorse/Setup Guidato.md",
    "Hub/1. DM Dashboard.md",
    "Hub/Durante il Gioco.md",
    "Risorse/Post Sessione Guidato.md",
    "Hub/Cosa Succede Fuori Scena.md",
    "Hub/Worldbuilder Dashboard.md",
    "Hub/Vista Giocatori.md",
    "Risorse/Quality Report.md"
];

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
        "Uso: npm run check:obsidian-user -- --accept-prompts",
        "",
        "Avvia Obsidian con profilo persistente isolato, accetta i prompt iniziali",
        "di trust/plugin/daemon tramite AppleScript e verifica le pagine first-run.",
        "",
        "Opzioni:",
        "  --accept-prompts   obbligatorio: consente click automatici sui prompt Obsidian",
        "  --reset-profile    elimina il profilo live-test prima della prova",
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
    if (RESET_PROFILE) fs.rmSync(PROFILE_ROOT, { recursive: true, force: true });
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

async function runLivePass(port) {
    const page = await waitForPageTarget(port);
    const cdp = cdpClient(page.webSocketDebuggerUrl);
    await cdp.open();

    try {
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

        const results = [];
        for (const pagePath of FIRST_RUN_PAGES) {
            const before = cdp.events.length;
            if (ACCEPT_PROMPTS) acceptPrompts();
            const exists = await cdp.evaluate(`(() => {
                const pagePath = ${JSON.stringify(pagePath)};
                const file = app.vault.getAbstractFileByPath(pagePath);
                if (!file) return false;
                app.workspace.openLinkText(pagePath, "", false);
                return true;
            })()`);
            await sleep(PAGE_SETTLE_MS);
            const state = await cdp.evaluate(`(() => {
                const text = document.body.innerText;
                return {
                    page: ${JSON.stringify(pagePath)},
                    exists: ${JSON.stringify(exists)},
                    activeFile: app.workspace.getActiveFile()?.path ?? null,
                    title: document.title,
                    restrictedMode: /restricted mode|community plugins.*disabled|modalita.*limitata/i.test(text),
                    dataviewError: /Evaluation Error|dataview.*error|dataviewjs.*error/i.test(text),
                    templaterLeak: /<%[\\s\\S]*?%>/.test(text),
                    problemNotices: [...document.querySelectorAll(".notice")]
                        .map(node => node.innerText)
                        .filter(text => /error|errore|failed|fallit|exception/i.test(text))
                        .slice(-5)
                };
            })()`);
            results.push({ ...state, newEvents: cdp.events.slice(before) });
        }

        return { summary, results, events: cdp.events };
    } finally {
        cdp.close();
    }
}

function validateReport(report) {
    const errors = [];
    const { summary, results, events } = report;
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
        if (!result.exists) errors.push(`pagina first-run mancante nel live pass: ${result.page}`);
        if (result.activeFile !== result.page) errors.push(`pagina non aperta nel live pass: ${result.page} -> ${result.activeFile}`);
        if (result.restrictedMode) errors.push(`restricted mode visibile nel live pass: ${result.page}`);
        if (result.dataviewError) errors.push(`errore Dataview visibile nel live pass: ${result.page}`);
        if (result.templaterLeak) errors.push(`codice Templater visibile nel live pass: ${result.page}`);
        if (result.problemNotices.length) errors.push(`notice problematica nel live pass ${result.page}: ${result.problemNotices.join(" | ")}`);
        if (result.newEvents.length) errors.push(`eventi console nel live pass ${result.page}: ${JSON.stringify(result.newEvents)}`);
    }
    if (events.length) errors.push(`eventi console globali nel live pass: ${JSON.stringify(events)}`);
    return errors;
}

async function main() {
    if (process.argv.includes("--help")) {
        usage();
        process.exit(0);
    }
    if (!ACCEPT_PROMPTS) {
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
        const errors = validateReport(report);
        if (errors.length) {
            console.error("Obsidian user-acceptance non valido:");
            for (const error of errors) console.error(`- ${error}`);
            console.error(`Profilo test: ${PROFILE_ROOT}`);
            console.error(`Vault test: ${OUT}`);
            process.exitCode = 1;
            return;
        }
        console.log(`Obsidian user-acceptance OK: ${report.summary.expectedPluginCount} plugin caricati, ${report.results.length} pagine first-run verificate.`);
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
