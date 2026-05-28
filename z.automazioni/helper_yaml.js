const templateFactoryCache = {};

function parseYamlScalar(value) {
    const trimmed = String(value ?? "").trim();

    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (trimmed === "[]") return [];
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

    return trimmed.replace(/^["']|["']$/g, "");
}

function parseYamlKeyValue(text) {
    const match = String(text).match(/^([^:]+):(?:\s*(.*))?$/);
    if (!match) return null;

    return {
        key: match[1].trim(),
        value: match[2] ?? ""
    };
}

function parseSimpleYaml(text) {
    const lines = String(text ?? "")
        .split(/\r?\n/)
        .map(raw => ({
            indent: raw.match(/^\s*/)[0].length,
            text: raw.trim()
        }))
        .filter(line => line.text && !line.text.startsWith("#"));

    function parseBlock(index, indent) {
        if (index >= lines.length) return [{}, index];

        if (lines[index].text.startsWith("- ")) {
            const items = [];

            while (index < lines.length && lines[index].indent === indent && lines[index].text.startsWith("- ")) {
                const rest = lines[index].text.slice(2).trim();
                const pair = parseYamlKeyValue(rest);

                if (pair) {
                    const item = {};
                    if (pair.value.trim()) {
                        item[pair.key] = parseYamlScalar(pair.value);
                        index += 1;
                    } else {
                        const [child, nextIndex] = parseBlock(index + 1, indent + 2);
                        item[pair.key] = child;
                        index = nextIndex;
                    }

                    while (index < lines.length && lines[index].indent === indent + 2 && !lines[index].text.startsWith("- ")) {
                        const childPair = parseYamlKeyValue(lines[index].text);
                        if (!childPair) break;

                        if (childPair.value.trim()) {
                            item[childPair.key] = parseYamlScalar(childPair.value);
                            index += 1;
                        } else {
                            const [child, nextIndex] = parseBlock(index + 1, indent + 4);
                            item[childPair.key] = child;
                            index = nextIndex;
                        }
                    }

                    items.push(item);
                    continue;
                }

                items.push(parseYamlScalar(rest));
                index += 1;
            }

            return [items, index];
        }

        const data = {};
        while (index < lines.length && lines[index].indent === indent && !lines[index].text.startsWith("- ")) {
            const pair = parseYamlKeyValue(lines[index].text);
            if (!pair) {
                index += 1;
                continue;
            }

            if (pair.value.trim()) {
                data[pair.key] = parseYamlScalar(pair.value);
                index += 1;
            } else {
                const [child, nextIndex] = parseBlock(index + 1, indent + 2);
                data[pair.key] = child;
                index = nextIndex;
            }
        }

        return [data, index];
    }

    return parseBlock(0, 0)[0];
}

async function readVaultText(filePath) {
    if (typeof app !== "undefined" && app?.vault?.adapter?.read) {
        return await app.vault.adapter.read(filePath);
    }

    if (typeof require === "function") {
        const fs = require("fs");
        return fs.readFileSync(filePath, "utf8");
    }

    return "";
}

async function loadTemplateFactoryModule(moduleName) {
    if (templateFactoryCache[moduleName]) {
        return templateFactoryCache[moduleName];
    }

    const jsonCandidates = [
        `z.automazioni/runtime_modules/${moduleName}.json`
    ];
    for (const candidate of jsonCandidates) {
        try {
            const source = await readVaultText(candidate);
            if (source) {
                templateFactoryCache[moduleName] = JSON.parse(source);
                return templateFactoryCache[moduleName];
            }
        } catch {
            // I JSON runtime esistono solo nella release pulita.
        }
    }

    const yamlCandidates = [
        `Dev/TemplateFactory/modules/${moduleName}.yaml`,
        `z.automazioni/runtime_modules/${moduleName}.yaml`
    ];
    let source = "";
    for (const candidate of yamlCandidates) {
        try {
            source = await readVaultText(candidate);
            if (source) break;
        } catch {
            // In release i moduli YAML runtime sono copiati sotto z.automazioni/runtime_modules.
        }
    }
    if (!source) {
        throw new Error(`Modulo TemplateFactory mancante nel vault: ${moduleName}`);
    }
    const parser = typeof parseYaml === "function"
        ? parseYaml
        : typeof window !== "undefined" && typeof window.parseYaml === "function"
            ? window.parseYaml
            : parseSimpleYaml;

    templateFactoryCache[moduleName] = parser(source) ?? {};
    return templateFactoryCache[moduleName];
}

async function loadRuntimeProfiles() {
    const module = await loadTemplateFactoryModule("runtime_profiles");
    return module.profiles ?? {};
}

async function runtimeProfile(name) {
    const profiles = await loadRuntimeProfiles();
    return profiles[name] ?? {};
}

async function frontmatterProfile(name) {
    const module = await loadTemplateFactoryModule("frontmatter_profiles");
    return module.profiles?.[name] ?? {};
}

function renderFrontmatterFromProfile(profile, values = {}) {
    const fields = profile.fields ?? [];
    const lines = fields.map(field => {
        const key = field.key;
        const valueKey = field.value;
        const rawValue = valueKey && Object.prototype.hasOwnProperty.call(values, valueKey)
            ? values[valueKey]
            : field.default ?? "";
        const value = Array.isArray(rawValue)
            ? inlineYamlList(rawValue)
            : rawValue;

        return `${key}: ${value}`;
    });

    return `---\n${lines.join("\n")}\n---\n`;
}

async function renderFrontmatter(profileName, values = {}) {
    return renderFrontmatterFromProfile(await frontmatterProfile(profileName), values);
}

function renderYamlScalar(value) {
    if (value === true) return "true";
    if (value === false) return "false";
    if (value === null || value === undefined) return '""';
    if (typeof value === "number") return String(value);
    if (Array.isArray(value)) {
        if (!value.length) return "[]";
        return `\n${value.map(item => `  - ${renderYamlScalar(item)}`).join("\n")}`;
    }
    const text = String(value);
    if (!text) return '""';
    if (/[:#\[\]{}&,*?|>!%@`"']/.test(text) || /^\s|\s$/.test(text)) {
        return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return text;
}

function renderYamlObject(data, indent = 0) {
    const lines = [];
    const prefix = " ".repeat(indent);

    for (const [key, value] of Object.entries(data ?? {})) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
            lines.push(`${prefix}${key}:`);
            lines.push(...renderYamlObject(value, indent + 2));
            continue;
        }

        const rendered = renderYamlScalar(value);
        if (typeof rendered === "string" && rendered.startsWith("\n")) {
            lines.push(`${prefix}${key}:${rendered}`);
        } else {
            lines.push(`${prefix}${key}: ${rendered}`);
        }
    }

    return lines;
}

function mergeFrontmatterNested(frontmatter, nested = {}) {
    const match = String(frontmatter ?? "").match(/^---\n([\s\S]*?)\n---\n?$/);
    if (!match) {
        throw new Error("Frontmatter non valido per merge annidato.");
    }

    const nestedLines = renderYamlObject(nested, 0);
    const body = [match[1].trimEnd(), ...nestedLines].filter(Boolean).join("\n");
    return `---\n${body}\n---\n`;
}

function inlineYamlArray(entries) {
    if (!entries.length) {
        return "[]";
    }

    return `[${entries.map(entry =>
        `{name: ${yamlQuote(entry.name)}, desc: ${yamlQuote(entry.desc)}}`
    ).join(", ")}]`;
}

function yamlQuote(value) {
    return JSON.stringify(String(value ?? ""));
}

function slugify(value) {
    return String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

function normalizeText(value) {
    return String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function inlineYamlList(values) {
    const filtered = (values ?? []).filter(Boolean);
    return filtered.length ? `[${filtered.join(", ")}]` : "[]";
}

function normalizeWikilinkTarget(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";
    if (/^\[\[[^\]]+\]\]$/.test(text)) return text;
    return `[[${text.replace(/^#+/, "").trim()}]]`;
}

function splitListInput(value) {
    return String(value ?? "")
        .split(/[\n,;]+/)
        .map(entry => entry.trim())
        .filter(Boolean);
}

function inlineYamlWikilinkList(values) {
    const normalized = (values ?? [])
        .map(normalizeWikilinkTarget)
        .filter(Boolean);
    return inlineYamlList([...new Set(normalized)]);
}

function inlineYamlTextList(values) {
    const filtered = (values ?? [])
        .map(value => String(value ?? "").trim())
        .filter(Boolean);

    return filtered.length ? `[${filtered.map(yamlQuote).join(", ")}]` : "[]";
}

function referenceFields({
    fonti = [],
    riferimentiSrd = [],
    riferimentiRegola = [],
    sezioni = [],
    blocchi = [],
    tabelle = [],
    tags = []
} = {}) {
    return {
        fonti: inlineYamlWikilinkList(fonti),
        riferimenti_srd: inlineYamlWikilinkList(riferimentiSrd),
        riferimenti_regola: inlineYamlWikilinkList(riferimentiRegola),
        sezioni_collegate: inlineYamlWikilinkList(sezioni),
        blocchi_collegati: inlineYamlWikilinkList(blocchi),
        tabelle_collegate: inlineYamlWikilinkList(tabelle),
        tags: inlineYamlTextList(tags)
    };
}

function yamlNumber(value) {
    const text = String(value ?? "").trim().replace(",", ".");
    return /^-?\d+(\.\d+)?$/.test(text) ? text : "";
}

function parseAbilityScores(value, fallback = "10 10 10 10 10 10") {
    const source = String(value ?? "").trim() || fallback;
    const scores = source
        .split(/[\s,;/|]+/)
        .map(score => score.trim())
        .filter(Boolean)
        .slice(0, 6);

    while (scores.length < 6) {
        scores.push("10");
    }

    return scores.map(score => yamlNumber(score) || "10");
}

function abilityArray(value, fallback = "10 10 10 10 10 10") {
    return `[${parseAbilityScores(value, fallback).join(", ")}]`;
}

module.exports = {
    abilityArray,
    frontmatterProfile,
    inlineYamlArray,
    inlineYamlList,
    inlineYamlTextList,
    inlineYamlWikilinkList,
    mergeFrontmatterNested,
    normalizeText,
    normalizeWikilinkTarget,
    parseAbilityScores,
    referenceFields,
    renderFrontmatter,
    renderYamlObject,
    runtimeProfile,
    slugify,
    splitListInput,
    yamlNumber,
    yamlQuote
};
