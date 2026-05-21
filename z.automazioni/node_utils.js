const fs = require("fs");
const path = require("path");

function rel(root, file) {
    return path.relative(root, file).replace(/\\/g, "/");
}

function walk(dir, options = {}) {
    if (!fs.existsSync(dir)) return [];

    const {
        ignoredDirs = new Set(),
        predicate = () => true
    } = options;
    const files = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ignoredDirs.has(entry.name)) continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...walk(fullPath, options));
        } else if (entry.isFile() && predicate(fullPath, entry)) {
            files.push(fullPath);
        }
    }

    return files;
}

function readTextIfExists(file, fallback = "") {
    return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : fallback;
}

function readJson(file, fallback = null, onError = null) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
        if (onError) onError(error);
        return fallback;
    }
}

function parseScalar(value) {
    const trimmed = String(value ?? "").trim();
    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (trimmed === "[]") return [];
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    return trimmed.replace(/^["']|["']$/g, "");
}

function parseFrontmatter(text) {
    if (!text.startsWith("---\n")) return {};

    const end = text.indexOf("\n---", 4);
    if (end === -1) return {};

    const data = {};
    let currentKey = null;

    for (const line of text.slice(4, end).split(/\r?\n/)) {
        const listMatch = line.match(/^\s+-\s+(.+)$/);

        if (listMatch && currentKey) {
            if (!Array.isArray(data[currentKey])) data[currentKey] = [];
            data[currentKey].push(parseScalar(listMatch[1]));
            continue;
        }

        const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (!keyMatch) continue;

        currentKey = keyMatch[1];
        const value = keyMatch[2] ?? "";

        if (!value.trim()) {
            data[currentKey] = "";
        } else if (/^\[.*\]$/.test(value.trim())) {
            const inner = value.trim().slice(1, -1).trim();
            data[currentKey] = inner ? inner.split(",").map(entry => parseScalar(entry.trim())) : [];
        } else {
            data[currentKey] = parseScalar(value);
        }
    }

    return data;
}

function hasValue(value) {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "number") return Number.isFinite(value) && value !== 0;
    return String(value ?? "").trim().length > 0;
}

function hasAny(frontmatter, fields) {
    return fields.some(field => hasValue(frontmatter[field]));
}

module.exports = {
    hasAny,
    hasValue,
    parseFrontmatter,
    readJson,
    readTextIfExists,
    rel,
    walk
};
