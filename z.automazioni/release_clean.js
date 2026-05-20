#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const OUT = path.join(DIST, "vault-gdr-clean");
const ZIP = path.join(DIST, "vault-gdr-clean.zip");

const EXCLUDED_DIRS = new Set([
    ".git",
    "node_modules",
    "dist"
]);

const EXCLUDED_FILES = new Set([
    ".DS_Store"
]);

function shouldSkip(relPath, entry) {
    if (EXCLUDED_FILES.has(entry.name)) return true;
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) return true;
    if (relPath.startsWith(".git/")) return true;
    if (relPath.startsWith("node_modules/")) return true;
    if (relPath.startsWith("dist/")) return true;
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

function zipIfAvailable() {
    try {
        if (fs.existsSync(ZIP)) fs.rmSync(ZIP);
        execFileSync("zip", ["-qr", ZIP, "vault-gdr-clean"], { cwd: DIST, stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
copyDir(ROOT, OUT, ROOT);

const zipped = zipIfAvailable();
console.log(`Release pulita creata: ${path.relative(ROOT, OUT)}`);
if (zipped) {
    console.log(`Zip creato: ${path.relative(ROOT, ZIP)}`);
} else {
    console.log("Zip non creato: comando zip non disponibile.");
}
