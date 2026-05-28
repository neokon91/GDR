const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function privateVarPath(file) {
    return file.replace(/^\/var\//, "/private/var/");
}

function processLines() {
    return execFileSync("ps", ["ax", "-o", "pid=,command="], { encoding: "utf8" }).split(/\r?\n/);
}

function profileProcessIds(profileRoot) {
    const markers = [profileRoot, privateVarPath(profileRoot)];
    return processLines()
        .filter(line => markers.some(marker => line.includes(marker)))
        .map(line => Number(line.trim().split(/\s+/, 1)[0]))
        .filter(pid => pid && pid !== process.pid);
}

function mainObsidianPid(profileRoot) {
    const markers = [profileRoot, privateVarPath(profileRoot)];
    for (const line of processLines()) {
        if (!markers.some(marker => line.includes(marker))) continue;
        if (!line.includes("/Obsidian.app/Contents/MacOS/Obsidian")) continue;
        const pid = Number(line.trim().split(/\s+/, 1)[0]);
        if (pid) return pid;
    }
    return 0;
}

function stopProfileObsidian(profileRoot) {
    for (const pid of profileProcessIds(profileRoot)) {
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
    throw new Error(`nessuna porta DevTools libera da ${start} a ${start + 79}`);
}

function prepareProfile({ freshInstall, profileRoot, workRoot, out, preseedDaemon }) {
    if (freshInstall) fs.rmSync(profileRoot, { recursive: true, force: true });
    fs.mkdirSync(profileRoot, { recursive: true });
    fs.mkdirSync(workRoot, { recursive: true });

    for (const file of fs.readdirSync(profileRoot).filter(name => /^mx-main-daemon-.*\.asar$/.test(name))) {
        fs.rmSync(path.join(profileRoot, file), { force: true });
    }
    if (preseedDaemon) {
        const sourceProfile = path.join(os.homedir(), "Library/Application Support/obsidian");
        const daemon = fs.existsSync(sourceProfile)
            ? fs.readdirSync(sourceProfile)
                .filter(name => /^mx-main-daemon-.*\.asar$/.test(name))
                .sort()
                .pop()
            : "";
        if (daemon) {
            fs.copyFileSync(path.join(sourceProfile, daemon), path.join(profileRoot, daemon));
        }
    }
    fs.writeFileSync(path.join(profileRoot, "mx-pref.json"), `${JSON.stringify({ enableExtension: true }, null, 2)}\n`);
    fs.writeFileSync(path.join(profileRoot, "obsidian.json"), `${JSON.stringify({
        vaults: {
            "vault-gdr-live-test": {
                path: out,
                ts: Date.now(),
                open: true
            }
        },
        cli: true
    }, null, 2)}\n`);
}

function buildRelease({ root, out, withDemo }) {
    execFileSync("node", [
        "Dev/TemplateFactory/tools/release_clean.js",
        "--quiet",
        "--out",
        out,
        ...(withDemo ? ["--with-demo"] : [])
    ], { cwd: root, stdio: "inherit" });
}

function launchObsidian({ obsidianApp, profileRoot, port }) {
    execFileSync("open", [
        "-na",
        obsidianApp,
        "--args",
        `--user-data-dir=${profileRoot}`,
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

function acceptPrompts(profileRoot) {
    const pid = mainObsidianPid(profileRoot);
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

function markProfileReady({ profileRoot, profileReadyFile, out }) {
    fs.mkdirSync(profileRoot, { recursive: true });
    fs.writeFileSync(profileReadyFile, `${JSON.stringify({
        profileRoot,
        vault: out,
        updatedAt: new Date().toISOString(),
        promptPolicy: "persistent-profile-no-reaccept"
    }, null, 2)}\n`);
}

module.exports = {
    acceptPrompts,
    buildRelease,
    findFreePort,
    launchObsidian,
    markProfileReady,
    prepareProfile,
    sleep,
    stopProfileObsidian
};
