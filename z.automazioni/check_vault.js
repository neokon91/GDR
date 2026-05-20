#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const IGNORED_DIRS = new Set([".git", "node_modules"]);
const REQUIRED_PLUGINS = [
    "dataview",
    "templater-obsidian",
    "obsidian-meta-bind-plugin",
    "js-engine",
    "metadata-menu",
    "folder-notes",
    "homepage"
];
const REQUIRED_SNIPPETS = [
    ".obsidian/snippets/gdr-vault.css"
];
const REQUIRED_FILES = [
    "Inizia Qui.md",
    "VERSION.md",
    "CHANGELOG.md",
    "RELEASE.md",
    "Risorse/FAQ.md",
    "Risorse/Indice Connettore GPT.md",
    "Campagne/Demo - La Reliquia Spezzata.md"
];
const ALLOWED_CATEGORIES = new Set([
    "avventura",
    "campagna",
    "conflitto",
    "cosmologia",
    "creatura",
    "cultura",
    "dispensa",
    "evento storico",
    "fazione",
    "incontro",
    "lingua",
    "lore capture",
    "luogo",
    "missione",
    "mondo",
    "nota rapida",
    "oggetto",
    "personaggio",
    "religione",
    "risorsa",
    "sessione",
    "srd"
]);
const ALLOWED_STATES = new Set([
    "accettata",
    "archiviata",
    "bozza",
    "canonico",
    "canonica",
    "collegata",
    "conclusa",
    "da smistare",
    "giocata",
    "ignorata",
    "in corso",
    "in gioco",
    "in guerra",
    "minacciato",
    "morto",
    "ostile",
    "preparazione",
    "pronto",
    "proposta",
    "scomparso",
    "smistata"
]);
const ALLOWED_TYPES_BY_CATEGORY = {
    campagna: new Set(["demo", "campagna"]),
    conflitto: new Set(["conflitto", "guerra", "crisi", "rivalità"]),
    cosmologia: new Set(["piano", "reame divino", "aldilà", "principio cosmico", "soglia"]),
    cultura: new Set(["cultura", "popolo", "etnia", "tradizione"]),
    dispensa: new Set(["lettera", "mappa", "documento", "indizio", "dispensa"]),
    "evento storico": new Set(["evento", "conseguenza", "rumor", "leggenda", "era", "epoca", "guerra", "catastrofe", "fondazione"]),
    fazione: new Set(["fazione generica", "confraternita", "culto", "gilda", "ordine rituale"]),
    incontro: new Set(["combattimento", "esplorazione", "pericolo ambientale", "trappola"]),
    lingua: new Set(["lingua", "dialetto", "scrittura", "lingua antica"]),
    "lore capture": new Set(["evento", "png improvvisato", "luogo improvvisato", "dialogo", "conseguenza", "idea"]),
    missione: new Set(["incarico", "mistero", "missione"]),
    oggetto: new Set(["oggetto", "oggetto magico", "chiave"]),
    personaggio: new Set(["pg", "png"]),
    religione: new Set(["divinità", "soglia"]),
    sessione: new Set(["sessione di campagna"])
};
const REQUIRED_FIELDS_BY_CATEGORY = {
    campagna: ["stato"],
    conflitto: ["stato", "mondo", "pressione", "prossima_mossa"],
    cosmologia: ["stato", "mondo"],
    creatura: ["stato"],
    cultura: ["stato", "mondo"],
    dispensa: ["stato"],
    "evento storico": ["stato", "mondo", "data_mondo"],
    fazione: ["stato", "mondo", "pressione"],
    incontro: ["stato"],
    lingua: ["stato", "mondo"],
    "lore capture": ["stato", "mondo", "data_mondo"],
    luogo: ["stato", "mondo", "tipo"],
    missione: ["stato", "mondo", "prossima_mossa"],
    mondo: ["stato", "tono", "tema"],
    "nota rapida": ["stato"],
    oggetto: ["stato"],
    personaggio: ["stato"],
    religione: ["stato", "mondo"],
    risorsa: ["stato"],
    sessione: ["stato", "attiva", "mondo"]
};

const errors = [];
const warnings = [];

function rel(file) {
    return path.relative(ROOT, file).replace(/\\/g, "/");
}

function walk(dir, predicate = () => true) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (IGNORED_DIRS.has(entry.name)) continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...walk(fullPath, predicate));
        } else if (entry.isFile() && predicate(fullPath)) {
            files.push(fullPath);
        }
    }

    return files;
}

function readJson(file) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
        errors.push(`${rel(file)}: JSON non valido (${error.message})`);
        return null;
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

    const yaml = text.slice(4, end).split(/\r?\n/);
    const data = {};
    let currentKey = null;

    for (const line of yaml) {
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

function isFolderIndex(fileRel) {
    const parsed = path.parse(fileRel);
    return parsed.name === path.basename(parsed.dir);
}

function isSrdNote(fileRel) {
    return fileRel.startsWith("SRD/");
}

function isIndexLikeNote(fileRel) {
    return isFolderIndex(fileRel) || [
        "Mondi/Mondo.md",
        "Mondi/Stato del Mondo.md",
        "Risorse/Indice Connettore GPT.md",
        "Risorse/Sviluppo Vault.md",
        "Risorse/Guida DM.md",
        "Risorse/Controllo Vault.md"
    ].includes(fileRel);
}

function isOperationalNote(fileRel) {
    return !isSrdNote(fileRel) && (/^(Campagne|Inbox|Mondi|Risorse|z\.modelli)\//.test(fileRel) || !fileRel.includes("/"));
}

function targetPath(target) {
    const normalized = String(target ?? "").replace(/\\/g, "/").trim();
    if (!normalized) return "";
    return normalized.endsWith(".md") ? normalized : `${normalized}.md`;
}

const markdownFiles = walk(ROOT, file => file.endsWith(".md"));
const markdownByPath = new Set();
const markdownByBasename = new Map();
const markdownMeta = new Map();

for (const file of markdownFiles) {
    const fileRel = rel(file);
    const stem = fileRel.replace(/\.md$/, "");
    const basename = path.basename(stem);
    const text = fs.readFileSync(file, "utf8");

    markdownByPath.add(stem);
    if (!markdownByBasename.has(basename)) markdownByBasename.set(basename, []);
    markdownByBasename.get(basename).push(fileRel);
    markdownMeta.set(fileRel, parseFrontmatter(text));
}

for (const file of walk(ROOT, file => file.endsWith(".json"))) {
    readJson(file);
}

const communityPlugins = readJson(path.join(ROOT, ".obsidian/community-plugins.json")) ?? [];
for (const plugin of REQUIRED_PLUGINS) {
    if (!communityPlugins.includes(plugin)) {
        errors.push(`Plugin obbligatorio non abilitato: ${plugin}`);
    }

    if (!fs.existsSync(path.join(ROOT, ".obsidian/plugins", plugin, "manifest.json"))) {
        errors.push(`Plugin obbligatorio non incluso: ${plugin}`);
    }
}

for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(ROOT, file))) {
        errors.push(`File release/onboarding obbligatorio mancante: ${file}`);
    }
}

for (const snippet of REQUIRED_SNIPPETS) {
    const snippetPath = path.join(ROOT, snippet);
    if (!fs.existsSync(snippetPath)) {
        errors.push(`Snippet CSS obbligatorio mancante: ${snippet}`);
        continue;
    }

    const css = fs.readFileSync(snippetPath, "utf8");
    const openBraces = (css.match(/{/g) ?? []).length;
    const closeBraces = (css.match(/}/g) ?? []).length;

    if (openBraces !== closeBraces) {
        errors.push(`${snippet}: parentesi graffe CSS non bilanciate (${openBraces} aperte, ${closeBraces} chiuse)`);
    }
}

const wikiLinkPattern = /!?\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]*)?\]\]/g;
for (const file of markdownFiles) {
    const text = fs.readFileSync(file, "utf8");
    let match;

    while ((match = wikiLinkPattern.exec(text))) {
        const target = match[1].trim();
        if (!target || /^[a-z]+:\/\//i.test(target)) continue;

        const normalized = target.replace(/\\/g, "/").replace(/\.md$/, "");
        const basename = path.basename(normalized);

        if (markdownByPath.has(normalized)) continue;

        const matches = markdownByBasename.get(basename) ?? [];

        if (!matches.length) {
            errors.push(`${rel(file)}: wikilink rotto ${match[0]}`);
        } else if (matches.length > 1) {
            warnings.push(`${rel(file)}: wikilink ambiguo ${match[0]} -> ${matches.join(", ")}`);
        }
    }
}

const templatePattern = /templateFile:\s*["']([^"']+)["']/g;
for (const file of markdownFiles) {
    const text = fs.readFileSync(file, "utf8");
    let match;

    while ((match = templatePattern.exec(text))) {
        const template = targetPath(match[1]);
        if (!fs.existsSync(path.join(ROOT, template))) {
            errors.push(`${rel(file)}: template Meta Bind mancante ${template}`);
        }
    }
}

const automationDir = path.join(ROOT, "z.automazioni");
const automationNames = fs.existsSync(automationDir)
    ? new Set(walk(automationDir, file => file.endsWith(".js")).map(file => path.basename(file, ".js")))
    : new Set();
const templaterUserPattern = /tp\.user\.([A-Za-z0-9_]+)/g;
for (const file of markdownFiles.filter(file => rel(file).startsWith("z.modelli/"))) {
    const text = fs.readFileSync(file, "utf8");
    let match;

    while ((match = templaterUserPattern.exec(text))) {
        const helper = match[1];
        if (!automationNames.has(helper)) {
            errors.push(`${rel(file)}: helper Templater senza script in z.automazioni (${helper}.js)`);
        }
    }
}

const iconConfig = readJson(path.join(ROOT, ".obsidian/plugins/obsidian-icon-folder/data.json"));
if (iconConfig) {
    for (const key of Object.keys(iconConfig)) {
        if (key === "settings") continue;
        if (!fs.existsSync(path.join(ROOT, key)) && !fs.existsSync(path.join(ROOT, `${key}.md`))) {
            errors.push(`Iconize punta a un percorso mancante: ${key}`);
        }
    }
}

const workspace = readJson(path.join(ROOT, ".obsidian/workspace.json"));
if (workspace) {
    const serialized = JSON.stringify(workspace);
    const stalePaths = ["Bestiario/Prova.md", "\"Mondo/"];
    for (const stalePath of stalePaths) {
        if (serialized.includes(stalePath)) {
            errors.push(`Configurazione Obsidian contiene percorso obsoleto: ${stalePath}`);
        }
    }
}

const realEntries = [...markdownMeta.entries()]
    .filter(([fileRel]) => !path.basename(fileRel, ".md").startsWith("Prova -"))
    .filter(([fileRel]) => !isFolderIndex(fileRel));

const activeSessions = realEntries
    .filter(([fileRel, fm]) => fileRel.startsWith("Mondi/Sessioni/") && fm.categoria === "sessione" && fm.attiva === true);

if (activeSessions.length > 1) {
    errors.push(`Sessioni multiple attive: ${activeSessions.map(([fileRel]) => fileRel).join(", ")}`);
}

const gptConnectorIndex = markdownMeta.get("Risorse/Indice Connettore GPT.md");
if (gptConnectorIndex?.is_code_search_indexed !== true) {
    errors.push("Risorse/Indice Connettore GPT.md: manca is_code_search_indexed: true");
}

const gptIndexPath = path.join(ROOT, "Risorse/Indice Connettore GPT.md");
if (!fs.existsSync(gptIndexPath)) {
    errors.push("Risorse/Indice Connettore GPT.md: file mancante");
} else {
    const gptIndexText = fs.readFileSync(gptIndexPath, "utf8");
    const codePathPattern = /`([^`\n]+\.(?:md|js|json|css))`/g;
    let match;

    while ((match = codePathPattern.exec(gptIndexText))) {
        const referenced = match[1].trim();
        if (!fs.existsSync(path.join(ROOT, referenced))) {
            errors.push(`Risorse/Indice Connettore GPT.md: percorso citato mancante ${referenced}`);
        }
    }
}

for (const [fileRel, fm] of realEntries) {
    if (isOperationalNote(fileRel) && hasValue(fm.categoria) && !ALLOWED_CATEGORIES.has(String(fm.categoria))) {
        warnings.push(`${fileRel}: categoria non prevista (${fm.categoria})`);
    }

    const allowedTypes = ALLOWED_TYPES_BY_CATEGORY[fm.categoria];
    if (isOperationalNote(fileRel) && allowedTypes && hasValue(fm.tipo) && !allowedTypes.has(String(fm.tipo))) {
        warnings.push(`${fileRel}: tipo non previsto per categoria ${fm.categoria} (${fm.tipo})`);
    }

    if (isOperationalNote(fileRel) && hasValue(fm.stato) && !ALLOWED_STATES.has(String(fm.stato))) {
        warnings.push(`${fileRel}: stato non previsto (${fm.stato})`);
    }

    const requiredFields = isIndexLikeNote(fileRel) ? [] : REQUIRED_FIELDS_BY_CATEGORY[fm.categoria] ?? [];
    for (const field of requiredFields) {
        if (!Object.prototype.hasOwnProperty.call(fm, field) || !hasValue(fm[field])) {
            warnings.push(`${fileRel}: campo frontmatter mancante o vuoto (${field})`);
        }
    }

    if (fileRel.startsWith("Mondi/Sessioni/") && fm.categoria === "sessione" && !Object.prototype.hasOwnProperty.call(fm, "attiva")) {
        warnings.push(`${fileRel}: sessione senza campo esplicito attiva`);
    }

    if (fm.stato === "pronto") {
        const requiredByCategory = {
            sessione: ["mondo", "campagne", "luoghi", "missioni"],
            missione: ["mondo", "luoghi", "fazioni", "committente"],
            incontro: ["luogo", "creature", "missioni", "fazioni"],
            png: ["mondo", "luogo", "fazioni"],
            luogo: ["mondo", "luogo_padre", "fazioni"],
            fazione: ["mondo", "luoghi", "rivali"]
        };
        const fields = requiredByCategory[fm.tipo] ?? requiredByCategory[fm.categoria] ?? null;

        if (fields && !hasAny(fm, fields)) {
            warnings.push(`${fileRel}: nota pronta senza collegamenti minimi (${fields.join(", ")})`);
        }
    }

    if (fileRel.startsWith("Inbox/") && fm.categoria === "lore capture" && ["evento", "png improvvisato", "luogo improvvisato", "conseguenza"].includes(String(fm.tipo ?? ""))) {
        if (!hasValue(fm.sessioni)) {
            warnings.push(`${fileRel}: nota live senza sessione collegata`);
        }
        if (!hasValue(fm.mondo)) {
            warnings.push(`${fileRel}: nota live senza mondo collegato`);
        }
    }

    if (fileRel.startsWith("Mondi/Missioni/") && fm.stato !== "archiviata" && !hasValue(fm.prossima_mossa)) {
        warnings.push(`${fileRel}: missione senza prossima_mossa`);
    }

    if (fileRel.startsWith("Mondi/Personaggi/") && fm.tipo === "png" && fm.stato === "in gioco" && !hasValue(fm.luogo)) {
        warnings.push(`${fileRel}: PNG in gioco senza luogo`);
    }

    if (fileRel.startsWith("Mondi/Personaggi/") && fm.tipo === "png" && fm.stato === "in gioco" && !hasAny(fm, ["fazioni", "relazioni"])) {
        warnings.push(`${fileRel}: PNG in gioco senza fazione o relazione`);
    }

    if ((fileRel.startsWith("Mondi/Fazioni/") || fileRel.startsWith("Mondi/Religioni/")) && Number(fm.pressione ?? 0) > 0 && !hasValue(fm.prossima_mossa)) {
        warnings.push(`${fileRel}: fazione con pressione senza prossima_mossa`);
    }

    if (fileRel.startsWith("Mondi/Timeline/") && fm.categoria === "evento storico" && (fm.canonico === true || fm.stato_canonico === "canonico") && !hasValue(fm.conseguenze)) {
        warnings.push(`${fileRel}: evento canonico senza conseguenze`);
    }

    if (fileRel.startsWith("Mondi/Luoghi/") && fm.stato === "pronto" && !hasAny(fm, ["pericolo", "stabilita", "pressione"])) {
        warnings.push(`${fileRel}: luogo pronto senza pericolo, stabilita o pressione`);
    }
}

if (warnings.length) {
    console.log("Avvisi:");
    for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
    console.error("Errori:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Vault OK: ${markdownFiles.length} note, ${communityPlugins.length} plugin community abilitati.`);
