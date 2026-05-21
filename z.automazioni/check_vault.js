#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const IGNORED_DIRS = new Set([".git", "node_modules", "dist"]);
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
    "Dev/README.md",
    "Dev/CHANGELOG.md",
    "Dev/CONTRIBUTING.md",
    "Dev/Repository.md",
    "Dev/RELEASE.md",
    "Dev/Sviluppo Vault.md",
    "Dev/Integrazioni Plugin.md",
    "Dev/Matrice Plugin 1.0.md",
    "Dev/plugin_matrix.json",
    "Dev/Plugin Technical Reference.md",
    "Dev/TemplateFactory/README.md",
    "Dev/TemplateFactory/modules/fields_core.yaml",
    "Dev/TemplateFactory/modules/plugin_bindings.yaml",
    "Dev/TemplateFactory/modules/template_blueprints.yaml",
    "Dev/TemplateFactory/modules/sections.yaml",
    "Dev/TemplateFactory/modules/callouts.yaml",
    "Dev/TemplateFactory/modules/tabs.yaml",
    "Dev/TemplateFactory/modules/dataview_blocks.yaml",
    "Dev/TemplateFactory/modules/metabind_inputs.yaml",
    "Dev/TemplateFactory/modules/metabind_buttons.yaml",
    "Dev/TemplateFactory/modules/bases_views.yaml",
    "Dev/TemplateFactory/modules/workflows.yaml",
    "Hub/1. DM Dashboard.md",
    "Hub/Atlante del Mondo.md",
    "Hub/Bibbia del Mondo.md",
    "Hub/Campagna da Ambientazione.md",
    "Hub/Compendium Del Mondo.md",
    "Hub/Controllo Canone.md",
    "Hub/Controllo Worldbuilding.md",
    "Hub/Cosa Succede Fuori Scena.md",
    "Hub/Durante il Gioco.md",
    "Hub/Economia E Rotte.md",
    "Hub/Geopolitical Dashboard.md",
    "Hub/Lore Hub.md",
    "Hub/Motore Mondo Vivo.md",
    "Hub/Revisione Lore.md",
    "Hub/Vista Giocatori.md",
    "Hub/Worldbuilder Dashboard.md",
    "Risorse/FAQ.md",
    "Dev/Confine Release Repository.md",
    "Dev/Release Pulita.md",
    "Dev/Smoke 1.0 Professionale.md",
    "Dev/Smoke Demo Finale.md",
    "Dev/Plugin Layer Interno.md",
    "Dev/Roadmap/1.0 Professionale.md",
    "Dev/Roadmap/Roadmap.md",
    "Dev/Indice Connettore GPT.md",
    "Risorse/Smistamento Bozze Generate.md",
    "Mondi/Societa/Societa.md",
    "z.fileclass/mondo.md",
    "z.bacheche/Manutenzione Vault.md"
];
const REQUIRED_BASE_FILES = [
    "z.bases/Atlante Mappe.base",
    "z.bases/Economia.base",
    "z.bases/Fazioni.base",
    "z.bases/Incontri.base",
    "z.bases/Luoghi.base",
    "z.bases/Missioni.base",
    "z.bases/PNG.base",
    "z.bases/Worldbuilding.base"
];
const REQUIRED_LAYER_FILES = [
    "z.automazioni/helpers.js",
    "z.automazioni/check_smoke.js",
    "z.automazioni/audit_template_migration.py",
    "z.automazioni/check_template_factory.py",
    "z.automazioni/render_template_factory.py",
    "z.automazioni/session_context.js",
    "z.automazioni/meta_actions.js",
    "z.automazioni/template_router.js",
    "z.automazioni/wizard_layer.js",
    "z.automazioni/world_taxonomy.js",
    "z.automazioni/world_entity.js",
    "z.automazioni/nuovo_mondo_homebrew.js",
    "z.engine/README.md",
    "z.engine/gdr_views.js",
    "z.engine/session_views.js"
];
const DEMO_REQUIRED_FILES = [
    "Dev/Demo Finale.md",
    "Mondi/Brumafonda Demo.md",
    "Campagne/Campagna - Sale Sotto La Nebbia.md",
    "Mondi/Culture/Custodi Delle Saline.md",
    "Mondi/Fazioni/Consorzio Del Sale Nero.md",
    "Mondi/Religioni/Culto Della Lanterna Bassa.md",
    "Mondi/Luoghi/Porto Di Brumafonda.md",
    "Mondi/Mercati/Mercato Del Sale Nero.md",
    "Risorse/Mappe/Mappa Pubblica Di Brumafonda.md",
    "Mondi/Dispense/Avviso Della Dogana Di Brumafonda.md",
    "Mondi/Missioni/Recuperare La Campana Sommersa.md",
    "Mondi/Sessioni/2026-05-28 - La Campana Nella Nebbia.md",
    "Mondi/Timeline/La Marea Ha Preso Il Faro Vecchio.md"
];
const DEMO_PUBLIC_FILES = [
    "Risorse/Mappe/Mappa Pubblica Di Brumafonda.md",
    "Mondi/Dispense/Avviso Della Dogana Di Brumafonda.md",
    "Mondi/Sessioni/2026-05-28 - La Campana Nella Nebbia.md"
];
const RELEASE_EXPECTED_VERSION = "1.0.0";
const RELEASE_EXPECTED_DATE = "2026-05-21";
const RELEASE_CHANGELOG_MARKERS = [
    "[[Dev/Demo Finale]]",
    "[[Dev/Smoke Demo Finale]]",
    "Gate statico M3",
    "TemplateFactory ora copre",
    "Calendarium e selezionabile",
    "smistamento -> canonizzazione",
    "dist/vault-gdr-clean.zip"
];
const RELEASE_VERIFICATION_MARKERS = [
    "## Ultima Verifica Automatica",
    RELEASE_EXPECTED_DATE,
    "`npm run check` passato senza warning",
    "`npm run release:clean` ha creato `dist/vault-gdr-clean`",
    "`npm run release:clean` ha creato `dist/vault-gdr-clean.zip`",
    "`dist/` resta artefatto locale ignorato da Git"
];
const REQUIRED_META_BIND_INPUT_TEMPLATES = [
    "mondo",
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
const REQUIRED_META_BIND_BUTTONS = [
    "marca-canonico",
    "marca-rumor",
    "archivia-nota",
    "smista-bozza-generata",
    "canonizza-bozza-generata",
    "applica-conseguenza",
    "avanza-clock",
    "collega-sessione-attiva",
    "propaga-a-entita",
    "prepara-recap-pubblico",
    "nuovo-mondo-homebrew",
    "wizard-nuova-entita-viva",
    "wizard-appunto-live",
    "wizard-conseguenza",
    "wizard-fine-sessione",
    "wizard-sessione-da-output"
];
const REQUIRED_METADATA_MENU_PRESETS = [
    "mondo",
    "stato",
    "stato_canonico",
    "canonico",
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
    "relazione",
    "risorsa",
    "sessione",
    "societa",
    "tracciato",
    "srd"
]);
const ALLOWED_STATES = new Set([
    "accettata",
    "archiviata",
    "bozza",
    "canonico",
    "canonica",
    "collegata",
    "completato",
    "conclusa",
    "da smistare",
    "giocata",
    "ignorata",
    "attivo",
    "fallito",
    "in pausa",
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
const RESOURCE_ENTITY_TYPES = [
    "risorsa",
    "merce",
    "materia prima",
    "reliquia",
    "rotta",
    "mercato",
    "merce strategica",
    "miniera cava foresta o fonte",
    "porto mercato fiera o caravanserraglio",
    "monopolio",
    "rotta illegale",
    "debito o banca",
    "carestia",
    "tecnologia produttiva",
    "oggetto di prestigio",
    "leva economica da definire"
];
const RESOURCE_DOCUMENT_TYPES = [
    "aspetto",
    "audio",
    "audit plugin",
    "calendario diegetico",
    "canon control",
    "codex mondo",
    "compendium",
    "compendium mondo",
    "controllo",
    "controllo worldbuilding",
    "dashboard",
    "dashboard economia",
    "dashboard fuori scena",
    "dashboard geopolitica",
    "faq",
    "generatori worldbuilding",
    "guida",
    "guida plugin",
    "guida rapida",
    "immagini",
    "indice",
    "indice connettore gpt",
    "indice mercati",
    "indice risorse",
    "indice rotte",
    "indice segreti",
    "lore",
    "lore hub",
    "lore review",
    "mappa",
    "mappe",
    "media",
    "mistero",
    "motore mondo vivo",
    "onboarding",
    "plugin",
    "portale giocatori",
    "post-sessione",
    "preparazione",
    "primo avvio",
    "repository",
    "roadmap",
    "setup",
    "stato mondo",
    "studio plugin",
    "supporto",
    "sviluppo",
    "tabelle",
    "video"
];
const ALLOWED_TYPES_BY_CATEGORY = {
    campagna: new Set(["campagna"]),
    conflitto: new Set(["conflitto", "guerra", "crisi", "rivalità"]),
    cosmologia: new Set(["piano", "reame divino", "aldilà", "principio cosmico", "soglia", "legge arcana", "scuola o tradizione magica", "risorsa magica", "fenomeno magico", "patto", "contaminazione", "soglia o portale", "anomalia", "piano reame o aldila", "mistero arcano"]),
    creatura: new Set(["habitat", "migrazione", "catena alimentare", "variante regionale", "creatura sacra", "mostro sociale", "specie senziente", "predatore territoriale", "piaga sciame o invasione", "ecosistema da definire"]),
    cultura: new Set(["cultura", "popolo", "etnia", "tradizione", "festa o calendario rituale", "tabu", "rito di passaggio", "costume quotidiano", "cucina e ospitalita", "matrimonio famiglia e parentela", "funerali e memoria", "duello onore e vendetta", "arte musica teatro moda", "cultura da definire"]),
    dispensa: new Set(["lettera", "mappa", "documento", "indizio", "dispensa"]),
    "evento storico": new Set(["evento", "conseguenza", "rumor", "leggenda", "era", "epoca", "guerra", "catastrofe", "fondazione", "dinastia", "migrazione", "rivoluzione", "scoperta", "trattato", "eta mitica", "cronologia concorrente", "evento da definire"]),
    fazione: new Set(["fazione generica", "confraternita", "culto", "gilda", "ordine rituale"]),
    incontro: new Set(["combattimento", "esplorazione", "pericolo ambientale", "trappola"]),
    lingua: new Set(["lingua", "dialetto", "scrittura", "lingua antica"]),
    "lore capture": new Set(["evento", "png improvvisato", "luogo improvvisato", "dialogo", "conseguenza", "idea"]),
    missione: new Set(["incarico", "ricerca", "mistero", "salvataggio", "caccia", "viaggio", "fronte", "trama personale", "missione di fazione", "arco narrativo", "missione"]),
    oggetto: new Set(["oggetto", "oggetto magico", "chiave"]),
    personaggio: new Set(["pg", "png"]),
    religione: new Set(["divinità", "soglia", "pantheon", "divinita", "santo profeta o eroe mitico", "eresia", "ordine religioso", "reliquia", "luogo sacro", "profezia", "pratica quotidiana", "mito da definire"]),
    relazione: new Set(["relazione", "alleanza", "rivalità", "guerra fredda", "vassallaggio", "trattato", "debito", "faida", "patto religioso", "tradimento"]),
    risorsa: new Set([...RESOURCE_ENTITY_TYPES, ...RESOURCE_DOCUMENT_TYPES]),
    sessione: new Set(["sessione di campagna", "sessione zero", "interludio", "downtime", "finale", "one-shot"]),
    societa: new Set(["ceto sociale", "clan casata o famiglia", "istituzione civile", "legge o codice", "crimine organizzato", "accademia o scuola", "burocrazia", "gilda non economica", "movimento popolare", "societa da definire"]),
    tracciato: new Set(["clock", "progress track", "fronte", "rituale", "minaccia", "viaggio", "progetto"])
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
    relazione: ["stato", "mondo", "soggetti"],
    risorsa: ["stato"],
    sessione: ["stato", "attiva", "mondo"],
    societa: ["stato", "mondo"],
    tracciato: ["stato", "mondo", "progress_value", "progress_max", "prossima_mossa"]
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

function readOptionalJson(file) {
    if (!fs.existsSync(file)) return null;
    return readJson(file);
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

function flatText(value) {
    if (Array.isArray(value)) return value.map(flatText).join(" ");
    if (value && typeof value === "object") return Object.values(value).map(flatText).join(" ");
    return String(value ?? "");
}

function normalizedText(value) {
    return flatText(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function hasPrivatePublicText(value) {
    const text = normalizedText(value);
    return /\b(dm|segreto|segreti|nascost[oaie]?|verita|prossima mossa|mosse segrete|retroscena|non rivelare)\b/.test(text);
}

function hasOperationalLinks(frontmatter) {
    return hasAny(frontmatter, [
        "connessioni",
        "luoghi",
        "luogo",
        "luogo_padre",
        "fazioni",
        "personaggi",
        "missioni",
        "tracciati",
        "relazioni",
        "mondo"
    ]);
}

function hasCodexIdentity(frontmatter) {
    return hasAny(frontmatter, ["gancio", "impressione", "identita", "descrizione", "vuole", "agenda", "tipo"]);
}

function hasCodexTableUse(frontmatter) {
    return hasAny(frontmatter, ["uso_al_tavolo", "promessa_al_tavolo", "prossima_mossa", "scene", "innesco", "posta"]);
}

function hasCodexDmLayer(frontmatter) {
    if (frontmatter.pubblico === true) return true;
    return hasAny(frontmatter, ["segreto", "segreti", "verita_nascosta", "prossima_mossa", "propaga_a", "entita_impattate"]);
}

function sessionWorldAnchorCount(frontmatter) {
    return [
        hasAny(frontmatter, ["mondo"]),
        hasAny(frontmatter, ["luoghi", "luogo"]),
        hasAny(frontmatter, ["fazioni", "personaggi"]),
        hasAny(frontmatter, ["missioni"]),
        hasAny(frontmatter, ["tracciati", "pressioni"]),
        hasAny(frontmatter, ["mappe", "incontri", "materiale_pronto"])
    ].filter(Boolean).length;
}

function daysSince(value) {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return null;
    return Math.floor((Date.now() - timestamp) / 86400000);
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
        "Dev/Indice Connettore GPT.md",
        "Dev/Sviluppo Vault.md",
        "Risorse/Smistamento Bozze Generate.md",
        "Risorse/Guida DM.md",
        "Risorse/Controllo Vault.md",
        "Hub/1. DM Dashboard.md",
        "Hub/Atlante del Mondo.md",
        "Hub/Bibbia del Mondo.md",
        "Hub/Campagna da Ambientazione.md",
        "Hub/Compendium Del Mondo.md",
        "Hub/Controllo Canone.md",
        "Hub/Controllo Worldbuilding.md",
        "Hub/Cosa Succede Fuori Scena.md",
        "Hub/Durante il Gioco.md",
        "Hub/Economia E Rotte.md",
        "Hub/Geopolitical Dashboard.md",
        "Hub/Lore Hub.md",
        "Hub/Motore Mondo Vivo.md",
        "Hub/Revisione Lore.md",
        "Hub/Vista Giocatori.md",
        "Hub/Worldbuilder Dashboard.md"
    ].includes(fileRel);
}

function isOperationalNote(fileRel) {
    return !isSrdNote(fileRel) && (/^(Campagne|Inbox|Mondi|Risorse|z\.modelli)\//.test(fileRel) || !fileRel.includes("/"));
}

function isLiveEntityNote(fileRel) {
    return /^(Mondi\/(Luoghi|Personaggi|Fazioni|Missioni|Timeline|Oggetti|Tracciati|Relazioni|Rotte|Risorse|Mercati|Culture|Religioni|Societa)|Risorse\/Mappe)\//.test(fileRel)
        && !isIndexLikeNote(fileRel)
        && !fileRel.startsWith("z.modelli/");
}

function isGeneratedFantasyDraft(fileRel, frontmatter) {
    return fileRel.startsWith("Inbox/Generati/") && frontmatter.plugin === "fantasy-content-generator";
}

function targetPath(target) {
    const normalized = String(target ?? "").replace(/\\/g, "/").trim();
    if (!normalized) return "";
    return normalized.endsWith(".md") ? normalized : `${normalized}.md`;
}

const generatedTemplatePaths = new Set();

function addGeneratedTemplatePath(templatePath) {
    const normalized = String(templatePath ?? "").replace(/\\/g, "/");
    if (!normalized) return;
    generatedTemplatePaths.add(normalized);
    generatedTemplatePaths.add(normalized.replace(/\.md$/, ""));
}

const templateFactoryManifest = readOptionalJson(path.join(ROOT, "z.modelli/.templatefactory-manifest.json"));
for (const entry of templateFactoryManifest?.files ?? []) {
    addGeneratedTemplatePath(entry?.path);
}

const templateBlueprintsPath = path.join(ROOT, "Dev/TemplateFactory/modules/template_blueprints.yaml");
if (fs.existsSync(templateBlueprintsPath)) {
    const lines = fs.readFileSync(templateBlueprintsPath, "utf8").split(/\r?\n/);
    let outputFolder = "";
    let inFiles = false;

    for (const line of lines) {
        const folderMatch = line.match(/^ {6}folder:\s*(.+?)\s*$/);
        if (folderMatch) {
            outputFolder = folderMatch[1].replace(/^["']|["']$/g, "");
            inFiles = false;
            continue;
        }

        if (/^ {6}files:\s*$/.test(line)) {
            inFiles = true;
            continue;
        }

        const fileMatch = inFiles ? line.match(/^ {6}-\s*(.+?)\s*$/) : null;
        if (fileMatch && outputFolder) {
            addGeneratedTemplatePath(path.posix.normalize(`${outputFolder}/${fileMatch[1].replace(/^["']|["']$/g, "")}`));
            continue;
        }

        if (inFiles && !/^ {6}-\s*/.test(line) && !/^\s*$/.test(line)) {
            inFiles = false;
        }
    }
}

function isGeneratedTemplatePath(fileRel) {
    const normalized = String(fileRel ?? "").replace(/\\/g, "/");
    return generatedTemplatePaths.has(normalized) || generatedTemplatePaths.has(targetPath(normalized));
}

const markdownFiles = walk(ROOT, file => file.endsWith(".md"));
const linkableFiles = walk(ROOT, file => /\.(md|canvas|base)$/.test(file));
const markdownByPath = new Set();
const markdownByBasename = new Map();
const linkableByPath = new Set();
const linkableByBasename = new Map();
const markdownMeta = new Map();

for (const file of linkableFiles) {
    const fileRel = rel(file);
    const stem = fileRel.replace(/\.(md|canvas|base)$/, "");
    const basename = path.basename(stem);

    linkableByPath.add(stem);
    if (!linkableByBasename.has(basename)) linkableByBasename.set(basename, []);
    linkableByBasename.get(basename).push(fileRel);
}

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
const calendariumData = readOptionalJson(path.join(ROOT, ".obsidian/plugins/calendarium/data.json")) ?? {};
const calendariumCalendars = Array.isArray(calendariumData.calendars)
    ? calendariumData.calendars
    : Object.values(calendariumData.calendars ?? {});
const calendariumNames = new Set(calendariumCalendars
    .flatMap(calendar => [calendar?.name, calendar?.id])
    .filter(Boolean)
    .map(value => String(value).toLowerCase()));

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

for (const file of REQUIRED_BASE_FILES) {
    if (!fs.existsSync(path.join(ROOT, file))) {
        errors.push(`Base operativa mancante: ${file}`);
    }
}

for (const file of REQUIRED_LAYER_FILES) {
    if (!fs.existsSync(path.join(ROOT, file))) {
        errors.push(`Plugin layer interno: file obbligatorio mancante ${file}`);
    }
}

const pluginMatrixPath = path.join(ROOT, "Dev/plugin_matrix.json");
const pluginMatrix = readJson(pluginMatrixPath) ?? [];
const pluginMatrixById = new Map();
const requiredPluginMatrixFields = ["id", "name", "class", "function", "guide", "operational", "smoke"];
if (!Array.isArray(pluginMatrix)) {
    errors.push("Dev/plugin_matrix.json: root deve essere un array");
} else {
    for (const entry of pluginMatrix) {
        for (const field of requiredPluginMatrixFields) {
            if (!hasValue(entry?.[field])) {
                errors.push(`Dev/plugin_matrix.json: entry plugin senza campo ${field}`);
            }
        }

        if (!entry?.id) continue;
        if (pluginMatrixById.has(entry.id)) {
            errors.push(`Dev/plugin_matrix.json: plugin duplicato ${entry.id}`);
        }
        pluginMatrixById.set(entry.id, entry);

        for (const field of ["guide", "operational", "smoke"]) {
            const target = String(entry[field] ?? "");
            if (!target) continue;
            const targetWithExtension = /\.(md|base|js|json|excalidraw)$/i.test(target) ? target : targetPath(target);
            if (!fs.existsSync(path.join(ROOT, targetWithExtension)) && !isGeneratedTemplatePath(targetWithExtension)) {
                errors.push(`Dev/plugin_matrix.json: ${entry.id} ${field} mancante ${targetWithExtension}`);
            }
        }
    }
}

for (const plugin of communityPlugins) {
    if (!pluginMatrixById.has(plugin)) {
        errors.push(`Plugin matrix: plugin abilitato non mappato ${plugin}`);
    }
}

for (const file of walk(ROOT, file => file.endsWith(".base"))) {
    const source = fs.readFileSync(file, "utf8");
    if (/[^\n]properties:/.test(source)) {
        errors.push(`${rel(file)}: properties incollato alla riga precedente`);
    }
}

for (const file of walk(ROOT, file => /^(z\.automazioni|z\.engine)\//.test(rel(file)) && file.endsWith(".js"))) {
    try {
        const source = fs.readFileSync(file, "utf8").replace(/^#!.*\n/, "");
        new Function(source);
    } catch (error) {
        errors.push(`${rel(file)}: JavaScript non parsabile (${error.message})`);
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
    const fileRel = rel(file);
    const taskLines = text.split(/\r?\n/).filter(line => /^\s*[-*]\s+\[[ xX]\]/.test(line));

    for (const line of taskLines) {
        if (line.includes("#task") && line.includes("🔁") && fileRel !== "z.bacheche/Manutenzione Vault.md") {
            errors.push(`${fileRel}: task ricorrente fuori dalla bacheca manutenzione`);
        }
    }

    let match;

    while ((match = wikiLinkPattern.exec(text))) {
        const target = match[1].trim();
        if (!target || /^[a-z]+:\/\//i.test(target)) continue;

        const normalized = target.replace(/\\/g, "/").replace(/\.(md|canvas|base)$/, "");
        if (isGeneratedTemplatePath(normalized)) continue;
        const basename = path.basename(normalized);

        if (linkableByPath.has(normalized)) continue;

        const matches = linkableByBasename.get(basename) ?? [];

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
        if (template.startsWith("z.modelli/") && !isGeneratedTemplatePath(template)) {
            errors.push(`${rel(file)}: template Meta Bind non generabile da TemplateFactory ${template}`);
            continue;
        }
        if (isGeneratedTemplatePath(template)) continue;
        if (!fs.existsSync(path.join(ROOT, template))) {
            errors.push(`${rel(file)}: template Meta Bind mancante ${template}`);
        }
    }
}

const metaBindConfigPath = path.join(ROOT, ".obsidian/plugins/obsidian-meta-bind-plugin/data.json");
const metaBindConfig = readJson(metaBindConfigPath);
if (metaBindConfig) {
    const buttonTemplates = Array.isArray(metaBindConfig.buttonTemplates) ? metaBindConfig.buttonTemplates : [];
    const inputTemplates = Array.isArray(metaBindConfig.inputFieldTemplates) ? metaBindConfig.inputFieldTemplates : [];
    const buttonIds = new Set();
    const inputTemplateNames = new Set(inputTemplates.map(template => template?.name).filter(Boolean));

    for (const name of REQUIRED_META_BIND_INPUT_TEMPLATES) {
        if (!inputTemplateNames.has(name)) {
            errors.push(`Meta Bind: input template operativo mancante (${name})`);
        }
    }

    for (const button of buttonTemplates) {
        if (!button?.id) {
            errors.push("Meta Bind: button template senza id");
            continue;
        }

        if (buttonIds.has(button.id)) {
            errors.push(`Meta Bind: button template duplicato ${button.id}`);
        }
        buttonIds.add(button.id);

        for (const action of button.actions ?? []) {
            if ((action.type === "templaterCreateNote" || action.type === "runTemplaterFile") && action.templateFile) {
                const template = targetPath(action.templateFile);
                if (template.startsWith("z.modelli/") && !isGeneratedTemplatePath(template)) {
                    errors.push(`Meta Bind: button template ${button.id} usa template non generabile da TemplateFactory ${template}`);
                    continue;
                }
                if (isGeneratedTemplatePath(template)) continue;
                if (!fs.existsSync(path.join(ROOT, template))) {
                    errors.push(`Meta Bind: button template ${button.id} usa template mancante ${template}`);
                }
            }

            if (action.type === "updateMetadata") {
                warnings.push(`Meta Bind: button template ${button.id} modifica frontmatter; usare INPUT inline/blocco`);
            }
        }
    }

    for (const id of REQUIRED_META_BIND_BUTTONS) {
        if (!buttonIds.has(id)) {
            errors.push(`Meta Bind: button operativo mancante (${id})`);
        }
    }

    const inlineButtonPattern = /`BUTTON\[([^\]\n]+)\]`/g;
    for (const file of markdownFiles) {
        const text = fs.readFileSync(file, "utf8");
        let match;

        while ((match = inlineButtonPattern.exec(text))) {
            if (match[1].includes("...")) continue;
            if (!buttonIds.has(match[1])) {
                errors.push(`${rel(file)}: BUTTON senza template Meta Bind (${match[1]})`);
            }
        }
    }
}

const metadataMenuConfig = readJson(path.join(ROOT, ".obsidian/plugins/metadata-menu/data.json"));
if (metadataMenuConfig) {
    const presetNames = new Set((metadataMenuConfig.presetFields ?? []).map(field => field?.name).filter(Boolean));

    for (const name of REQUIRED_METADATA_MENU_PRESETS) {
        if (!presetNames.has(name)) {
            errors.push(`Metadata Menu: preset field operativo mancante (${name})`);
        }
    }
}

for (const file of markdownFiles.filter(file => rel(file).startsWith("z.modelli/"))) {
    const text = fs.readFileSync(file, "utf8");
    if (/```meta-bind-button[\s\S]*?type:\s*updateMetadata[\s\S]*?```/.test(text)) {
        warnings.push(`${rel(file)}: meta-bind-button modifica frontmatter; usare INPUT inline/blocco`);
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

for (const file of markdownFiles.filter(file => /(^|\/)[^/]*Router\.md$/.test(rel(file)))) {
    const text = fs.readFileSync(file, "utf8");
    const fileRel = rel(file);
    if (/^<%\*/m.test(text)) {
        errors.push(`${fileRel}: router con blocco Templater multilinea; usare tp.user.template_router`);
    }
    if (!text.trimStart().startsWith("<% await tp.user.")) {
        errors.push(`${fileRel}: router senza singola entry Templater iniziale`);
    }
}

const operationalViewRoots = /^(z\.modelli|Hub|Risorse|Mondi)\//;
for (const file of markdownFiles.filter(file => operationalViewRoots.test(rel(file)))) {
    const text = fs.readFileSync(file, "utf8");
    if (text.includes('z.automazioni/session_context.js')) {
        errors.push(`${rel(file)}: vista operativa punta a session_context.js; usare z.engine/session_views.js`);
    }
}

const iconConfig = readJson(path.join(ROOT, ".obsidian/plugins/obsidian-icon-folder/data.json"));
if (iconConfig) {
    for (const key of Object.keys(iconConfig)) {
        if (key === "settings") continue;
        if (isGeneratedTemplatePath(key)) continue;
        if (!fs.existsSync(path.join(ROOT, key)) && !fs.existsSync(path.join(ROOT, `${key}.md`))) {
            errors.push(`Iconize punta a un percorso mancante: ${key}`);
        }
    }
}

const workspace = readOptionalJson(path.join(ROOT, ".obsidian/workspace.json"));
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
    .filter(([fileRel]) => !isFolderIndex(fileRel));

const generatedDrafts = realEntries
    .filter(([fileRel, fm]) => isGeneratedFantasyDraft(fileRel, fm) && fm.stato === "bozza");

if (generatedDrafts.length > 12) {
    warnings.push(`Inbox/Generati: ${generatedDrafts.length} bozze generate da smistare`);
}

for (const fileRel of DEMO_REQUIRED_FILES) {
    if (!markdownMeta.has(fileRel)) {
        errors.push(`Demo finale: file mancante ${fileRel}`);
    }
}

const demoSession = markdownMeta.get("Mondi/Sessioni/2026-05-28 - La Campana Nella Nebbia.md");
if (demoSession) {
    if (demoSession.pubblico !== true) {
        errors.push("Demo finale: la sessione demo deve essere pubblica per Vista Giocatori");
    }
    if (!hasValue(demoSession.recap_pubblico)) {
        errors.push("Demo finale: la sessione demo non ha recap_pubblico");
    }
    if (hasPrivatePublicText(demoSession.recap_pubblico)) {
        errors.push("Demo finale: recap_pubblico della sessione contiene termini da DM");
    }
    if (!hasAny(demoSession, ["mappe", "dispense", "missioni", "luoghi"])) {
        errors.push("Demo finale: la sessione non collega mappa, dispensa, missione o luogo");
    }
}

const demoMap = markdownMeta.get("Risorse/Mappe/Mappa Pubblica Di Brumafonda.md");
if (demoMap) {
    if (demoMap.pubblico !== true) {
        errors.push("Demo finale: la mappa demo deve essere pubblica");
    }
    if (!hasAny(demoMap, ["player_safe", "cosa_mostrare", "luoghi", "luogo"])) {
        errors.push("Demo finale: la mappa pubblica non ha testo o luoghi player-safe");
    }
}

const demoHandout = markdownMeta.get("Mondi/Dispense/Avviso Della Dogana Di Brumafonda.md");
if (demoHandout) {
    if (demoHandout.pubblico !== true || demoHandout.stato !== "pronto") {
        errors.push("Demo finale: la dispensa demo deve essere pronta e pubblica");
    }
    if (!hasValue(demoHandout.player_safe)) {
        errors.push("Demo finale: la dispensa pubblica non ha player_safe");
    }
}

for (const fileRel of DEMO_PUBLIC_FILES) {
    const fm = markdownMeta.get(fileRel);
    if (!fm) continue;
    if (hasAny(fm, ["segreti", "prossima_mossa", "mosse_segrete", "verita_nascosta"])) {
        errors.push(`Demo finale: file pubblico con campi DM evidenti ${fileRel}`);
    }
}

const playerViewText = fs.existsSync(path.join(ROOT, "Hub/Vista Giocatori.md"))
    ? fs.readFileSync(path.join(ROOT, "Hub/Vista Giocatori.md"), "utf8")
    : "";
if (!playerViewText.includes("renderPlayerPortalStatus") || !playerViewText.includes("renderPublicSafety")) {
    errors.push("Demo finale: Vista Giocatori non espone stato portale e controllo sicurezza");
}

const activeSessions = realEntries
    .filter(([fileRel, fm]) => fileRel.startsWith("Mondi/Sessioni/") && fm.categoria === "sessione" && fm.attiva === true);

if (activeSessions.length > 1) {
    errors.push(`Sessioni multiple attive: ${activeSessions.map(([fileRel]) => fileRel).join(", ")}`);
}

const gptConnectorIndex = markdownMeta.get("Dev/Indice Connettore GPT.md");
if (gptConnectorIndex?.is_code_search_indexed !== true) {
    errors.push("Dev/Indice Connettore GPT.md: manca is_code_search_indexed: true");
}

const versionText = fs.existsSync(path.join(ROOT, "VERSION.md"))
    ? fs.readFileSync(path.join(ROOT, "VERSION.md"), "utf8")
    : "";
if (!versionText.includes(`Versione: \`${RELEASE_EXPECTED_VERSION}\``)) {
    errors.push(`VERSION.md: versione attesa ${RELEASE_EXPECTED_VERSION}`);
}
if (!versionText.includes(`Data: ${RELEASE_EXPECTED_DATE}`)) {
    errors.push(`VERSION.md: data attesa ${RELEASE_EXPECTED_DATE}`);
}

const changelogText = fs.existsSync(path.join(ROOT, "Dev/CHANGELOG.md"))
    ? fs.readFileSync(path.join(ROOT, "Dev/CHANGELOG.md"), "utf8")
    : "";
for (const marker of RELEASE_CHANGELOG_MARKERS) {
    if (!changelogText.includes(marker)) {
        errors.push(`Dev/CHANGELOG.md: marker release mancante (${marker})`);
    }
}

const cleanReleaseText = fs.existsSync(path.join(ROOT, "Dev/Release Pulita.md"))
    ? fs.readFileSync(path.join(ROOT, "Dev/Release Pulita.md"), "utf8")
    : "";
for (const marker of RELEASE_VERIFICATION_MARKERS) {
    if (!cleanReleaseText.includes(marker)) {
        errors.push(`Dev/Release Pulita.md: verifica release mancante (${marker})`);
    }
}

const startHereText = fs.existsSync(path.join(ROOT, "Inizia Qui.md"))
    ? fs.readFileSync(path.join(ROOT, "Inizia Qui.md"), "utf8")
    : "";
const worldbuildingIndex = startHereText.indexOf("Crea Il Mondo");
const sessionIndex = startHereText.indexOf("Trasforma In Gioco");
if (worldbuildingIndex === -1 || sessionIndex === -1 || worldbuildingIndex > sessionIndex) {
    errors.push("Inizia Qui.md: il flusso deve esporre Crea Il Mondo prima di sessione/gioco");
}

const datedForCalendarium = realEntries.filter(([, fm]) => hasValue(fm["fc-date"]) && fm["fc-ignore"] !== true);
if (communityPlugins.includes("calendarium") && !calendariumCalendars.length && datedForCalendarium.length) {
    warnings.push(`Calendarium installato ma senza calendari salvati; ${datedForCalendarium.length} note hanno fc-date`);
}
if (calendariumCalendars.length) {
    for (const [fileRel, fm] of datedForCalendarium) {
        if (hasValue(fm["fc-calendar"]) && !calendariumNames.has(String(fm["fc-calendar"]).toLowerCase())) {
            warnings.push(`${fileRel}: fc-calendar non configurato in Calendarium (${fm["fc-calendar"]})`);
        }
    }

    for (const [fileRel, fm] of realEntries) {
        if (!["mondo", "campagna"].includes(fm.categoria)) continue;
        if (hasValue(fm.calendario) && !calendariumNames.has(String(fm.calendario).toLowerCase())) {
            warnings.push(`${fileRel}: calendario preferito non configurato in Calendarium (${fm.calendario})`);
        }
    }
}

const gptIndexPath = path.join(ROOT, "Dev/Indice Connettore GPT.md");
if (!fs.existsSync(gptIndexPath)) {
    errors.push("Dev/Indice Connettore GPT.md: file mancante");
} else {
    const gptIndexText = fs.readFileSync(gptIndexPath, "utf8");
    const codePathPattern = /`([^`\n]+\.(?:md|js|json|css))`/g;
    let match;

    while ((match = codePathPattern.exec(gptIndexText))) {
        const referenced = match[1].trim();
        if (!fs.existsSync(path.join(ROOT, referenced))) {
            errors.push(`Dev/Indice Connettore GPT.md: percorso citato mancante ${referenced}`);
        }
    }
}

for (const [fileRel, fm] of realEntries) {
    const text = fs.readFileSync(path.join(ROOT, fileRel), "utf8");

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

    if (fileRel.startsWith("Mondi/") && fm.categoria === "mondo" && fm.fileClass !== "mondo") {
        warnings.push(`${fileRel}: mondo senza fileClass mondo`);
    }

    if (fm.stato === "pronto") {
        const requiredByCategory = {
            mondo: ["luoghi_iconici", "fazioni_principali", "culture_fondative", "misteri_pubblici"],
            sessione: ["mondo", "campagne", "luoghi", "missioni"],
            missione: ["mondo", "luoghi", "fazioni", "committente"],
            incontro: ["luogo", "creature", "missioni", "fazioni"],
            png: ["mondo", "luogo", "fazioni"],
            luogo: ["mondo", "luogo_padre", "fazioni"],
            fazione: ["mondo", "luoghi", "rivali"],
            tracciato: ["mondo", "missioni", "fazioni", "luoghi"]
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

    if (fileRel.startsWith("Mondi/Missioni/") && fm.stato !== "archiviata" && Number(fm.pressione ?? 0) >= 7 && !hasValue(fm.tracciati)) {
        warnings.push(`${fileRel}: missione ad alta pressione senza tracciato collegato`);
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

    if ((fileRel.startsWith("Mondi/Fazioni/") || fileRel.startsWith("Mondi/Religioni/")) && Number(fm.pressione ?? 0) > 0 && !hasAny(fm, ["rivali", "alleati", "relazioni"])) {
        warnings.push(`${fileRel}: potere in pressione senza rivali, alleati o relazioni`);
    }

    if ((fileRel.startsWith("Mondi/Fazioni/") || fileRel.startsWith("Mondi/Religioni/")) && Number(fm.pressione ?? 0) > 0 && !hasAny(fm, ["propaga_a", "conseguenze", "missioni", "tracciati"])) {
        warnings.push(`${fileRel}: fazione in movimento senza propagazione, conseguenze o agganci di campagna`);
    }

    if (fileRel.startsWith("Mondi/Culture/") && fm.categoria === "cultura" && fm.stato !== "archiviata" && !hasAny(fm, ["tensioni", "conflitti_interni", "relazioni_esterne", "relazioni"])) {
        warnings.push(`${fileRel}: cultura senza tensioni o relazioni culturali`);
    }

    if (fileRel.startsWith("Mondi/Religioni/") && fm.categoria === "religione" && fm.stato !== "archiviata" && !hasAny(fm, ["luoghi_sacri", "templi"])) {
        warnings.push(`${fileRel}: religione senza luoghi sacri o templi`);
    }

    if (fileRel.startsWith("Mondi/Relazioni/") && fm.categoria === "relazione" && fm.stato !== "archiviata" && !hasAny(fm, ["conseguenze", "propaga_a", "entita_impattate"])) {
        warnings.push(`${fileRel}: relazione senza conseguenze o propagazione`);
    }

    if (fileRel.startsWith("Mondi/Relazioni/") && fm.categoria === "relazione" && fm.stato !== "archiviata" && Number(fm.pressione ?? 0) >= 6 && !hasValue(fm.prossima_mossa)) {
        warnings.push(`${fileRel}: relazione ad alta pressione senza prossima_mossa`);
    }

    if (fileRel.startsWith("Mondi/Culture/") && fm.categoria === "cultura" && fm.stato === "pronto" && !hasAny(fm, ["tabu", "tabu_sociali", "scelte"])) {
        warnings.push(`${fileRel}: cultura pronta senza tabu o scelte giocabili`);
    }

    if (fileRel.startsWith("Mondi/Religioni/") && fm.categoria === "religione" && fm.stato === "pronto" && !hasAny(fm, ["eresie", "rituali", "calendario_rituale"])) {
        warnings.push(`${fileRel}: religione pronta senza eresie, rituali o calendario rituale`);
    }

    if (fileRel.startsWith("Mondi/Luoghi/") && fm.categoria === "luogo" && ["regno", "impero", "repubblica", "oligarchia", "ducato", "contea", "baronia", "marca", "protettorato"].includes(String(fm.tipo ?? "")) && fm.stato !== "archiviata") {
        if (["regno", "impero", "repubblica", "oligarchia"].includes(String(fm.tipo ?? "")) && !hasValue(fm.capitale)) {
            warnings.push(`${fileRel}: territorio politico maggiore senza capitale`);
        }
        if (!hasAny(fm, ["governante", "fazioni"])) {
            warnings.push(`${fileRel}: territorio politico senza governante o fazioni di potere`);
        }
        if (!hasAny(fm, ["confini", "luogo_padre"])) {
            warnings.push(`${fileRel}: territorio politico senza confini o territorio superiore`);
        }
        if (!hasAny(fm, ["risorse_strategiche", "risorse"])) {
            warnings.push(`${fileRel}: territorio politico senza risorse strategiche`);
        }
    }

    if ((fileRel.startsWith("Mondi/Fazioni/") || fileRel.startsWith("Mondi/Religioni/")) && Number(fm.pressione ?? 0) >= 7 && !hasValue(fm.tracciati)) {
        warnings.push(`${fileRel}: fazione ad alta pressione senza tracciato collegato`);
    }

    if (fileRel.startsWith("Mondi/Tracciati/") && fm.categoria === "tracciato" && fm.stato !== "archiviata") {
        if (!hasValue(fm.innesco)) {
            warnings.push(`${fileRel}: tracciato senza innesco`);
        }
        if (!hasAny(fm, ["missioni", "fazioni", "luoghi"])) {
            warnings.push(`${fileRel}: tracciato senza collegamenti operativi`);
        }
        if (Number(fm.progress_max ?? 0) > 0 && Number(fm.progress_value ?? 0) >= Number(fm.progress_max) - 1 && !hasValue(fm.conseguenze)) {
            warnings.push(`${fileRel}: tracciato vicino al completamento senza conseguenze`);
        }
        if (hasValue(fm.conseguenze) && !hasAny(fm, ["entita_impattate", "propaga_a"])) {
            warnings.push(`${fileRel}: tracciato con conseguenze senza entita_impattate o propaga_a`);
        }
    }

    if (fileRel.startsWith("Mondi/Timeline/") && fm.categoria === "evento storico" && (fm.canonico === true || fm.stato_canonico === "canonico") && !hasValue(fm.conseguenze)) {
        warnings.push(`${fileRel}: evento canonico senza conseguenze`);
    }

    if (fileRel.startsWith("Mondi/Timeline/") && fm.categoria === "evento storico" && (fm.canonico === true || fm.stato_canonico === "canonico") && !hasAny(fm, ["causa", "cause"])) {
        warnings.push(`${fileRel}: evento canonico senza causa`);
    }

    if (fileRel.startsWith("Mondi/Timeline/") && fm.categoria === "evento storico" && hasAny(fm, ["conseguenze", "effetti"]) && !hasAny(fm, ["entita_impattate", "propaga_a", "tracciati"])) {
        warnings.push(`${fileRel}: evento con effetti senza propagazione verso entita o tracciati`);
    }

    if (fileRel.startsWith("Mondi/Timeline/") && fm.categoria === "evento storico" && hasAny(fm, ["effetti", "conseguenze"]) && !hasAny(fm, ["relazioni", "propaga_a", "entita_impattate"])) {
        warnings.push(`${fileRel}: evento con effetti senza relazione o territorio impattato`);
    }

    if (fileRel.startsWith("Inbox/") && fm.categoria === "lore capture" && hasAny(fm, ["impatto", "conseguenze"]) && !hasAny(fm, ["entita_impattate", "propaga_a", "collegamenti"])) {
        warnings.push(`${fileRel}: lore con impatto senza propagazione o collegamenti`);
    }

    if (fileRel.startsWith("Mondi/Luoghi/") && fm.stato === "pronto" && !hasAny(fm, ["pericolo", "stabilita", "pressione"])) {
        warnings.push(`${fileRel}: luogo pronto senza pericolo, stabilita o pressione`);
    }

    const liveCategories = new Set(["luogo", "personaggio", "fazione", "missione", "evento storico", "oggetto", "tracciato", "relazione", "risorsa", "cultura", "religione", "societa"]);
    if (isLiveEntityNote(fileRel) && liveCategories.has(String(fm.categoria ?? "")) && fm.stato !== "archiviata") {
        if (!hasAny(fm, ["gancio", "uso_al_tavolo", "player_safe", "prossima_mossa", "connessioni"])) {
            warnings.push(`${fileRel}: entita viva senza gancio, uso al tavolo, player_safe, prossima_mossa o connessioni`);
        }
        if (text.includes("## Scheda Viva") && !hasAny(fm, ["gancio", "uso_al_tavolo", "player_safe"])) {
            warnings.push(`${fileRel}: Scheda Viva presente ma campi vivi vuoti`);
        }
    }

    if (fm.pubblico === true && !hasValue(fm.player_safe) && isLiveEntityNote(fileRel)) {
        warnings.push(`${fileRel}: pubblico true ma player_safe vuoto`);
    }

    if (fm.pubblico === true && isLiveEntityNote(fileRel) && hasAny(fm, ["segreto", "segreti", "verita_nascosta", "prossima_mossa", "mosse_segrete"])) {
        warnings.push(`${fileRel}: pubblico true con campi DM evidenti`);
    }

    const codexCategories = new Set(["luogo", "personaggio", "fazione", "missione", "tracciato", "relazione", "evento storico", "oggetto", "cultura", "religione", "societa"]);
    if (isLiveEntityNote(fileRel) && codexCategories.has(String(fm.categoria ?? "")) && fm.stato !== "archiviata") {
        const missingCodex = [];
        if (!hasCodexIdentity(fm)) missingCodex.push("identita");
        if (!hasCodexTableUse(fm)) missingCodex.push("al tavolo");
        if (!hasValue(fm.player_safe)) missingCodex.push("player_safe");
        if (!hasCodexDmLayer(fm)) missingCodex.push("DM");
        if (!hasOperationalLinks(fm)) missingCodex.push("connessioni vive");

        if (missingCodex.length) {
            warnings.push(`${fileRel}: articolo Codex incompleto (${missingCodex.join(", ")})`);
        }
    }

    if (fileRel.startsWith("Mondi/Sessioni/") && fm.categoria === "sessione" && ["preparazione", "pronto", "in corso"].includes(String(fm.stato ?? ""))) {
        const playableFields = ["gancio", "scelta", "pressioni", "tracciati", "materiale_pronto", "conseguenze", "recap_pubblico"];
        if (!hasAny(fm, playableFields)) {
            warnings.push(`${fileRel}: sessione non verificabile come giocabile (gancio, scelta, pressione, materiale o output mancanti)`);
        }

        const anchorCount = sessionWorldAnchorCount(fm);
        if (anchorCount < 3) {
            warnings.push(`${fileRel}: sessione senza almeno 3 ancore mondo (${anchorCount}/3 tra mondo, luoghi, poteri/PNG, missioni, clock, mappe/scena)`);
        }
    }

    if (fileRel.startsWith("Mondi/Sessioni/") && fm.categoria === "sessione" && hasValue(fm.recap_pubblico)) {
        if (hasPrivatePublicText(fm.recap_pubblico)) {
            warnings.push(`${fileRel}: recap_pubblico contiene termini da DM o segreti`);
        }

        const publicRecap = normalizedText(fm.recap_pubblico);
        const dmRecap = normalizedText(fm.recap_dm);
        if (publicRecap && dmRecap && publicRecap === dmRecap) {
            warnings.push(`${fileRel}: recap_pubblico identico a recap_dm`);
        }
    }

    if (isGeneratedFantasyDraft(fileRel, fm)) {
        if (fm.canonico === true) {
            errors.push(`${fileRel}: bozza generata marcata canonica prima dello smistamento`);
        }
        if (fm.stato !== "bozza" && fm.stato !== "archiviata") {
            warnings.push(`${fileRel}: bozza generata non spostata dopo lo smistamento (${fm.stato})`);
        }
        if (!hasAny(fm, ["mondo", "luogo", "campagne", "sessioni"])) {
            warnings.push(`${fileRel}: bozza generata senza aggancio a mondo, luogo, campagna o sessione`);
        }

        const age = daysSince(fm.creato);
        if (fm.stato === "bozza" && age !== null && age >= 14) {
            warnings.push(`${fileRel}: bozza generata ferma da ${age} giorni`);
        }
    }

    if (fm.plugin === "fantasy-content-generator" && !fileRel.startsWith("Inbox/Generati/")) {
        if (!hasAny(fm, ["smistato_il", "canonizzato_il"])) {
            warnings.push(`${fileRel}: contenuto generato fuori coda senza data di smistamento`);
        }
        if (fm.canonico === true && fm.stato_canonico !== "canonico") {
            warnings.push(`${fileRel}: contenuto generato canonico senza stato_canonico: canonico`);
        }
    }

    if (fileRel.startsWith("Risorse/Mappe/") && fileRel !== "Risorse/Mappe/Mappe.md" && fm.stato !== "archiviata") {
        const playableMapUses = new Set(["zoom", "esagoni", "dungeon", "scena"]);
        const structuredMapUses = new Set(["fronte", "indizi", "regione"]);
        const mapUse = String(fm.uso ?? "");

        if (!hasAny(fm, ["uso_al_tavolo", "gancio"])) {
            warnings.push(`${fileRel}: mappa senza uso al tavolo o gancio operativo`);
        }

        if (!hasAny(fm, ["player_safe", "cosa_mostrare", "luoghi", "luogo"])) {
            warnings.push(`${fileRel}: mappa senza cosa mostrare o luoghi collegati`);
        }

        if (fm.pubblico !== true && !hasAny(fm, ["cosa_nascondere", "prossima_mossa", "segreti", "versione_giocatori"])) {
            warnings.push(`${fileRel}: mappa DM senza cosa nascondere, prossima_mossa o versione giocatori`);
        }

        if (playableMapUses.has(mapUse) && fm.stato === "pronto") {
            if (!hasValue(fm.mondo)) {
                warnings.push(`${fileRel}: mappa pronta senza mondo`);
            }
            if (!hasAny(fm, ["luogo", "luoghi", "incontri", "missioni"])) {
                warnings.push(`${fileRel}: mappa pronta senza luogo, luoghi, incontri o missioni`);
            }
        }

        if (structuredMapUses.has(mapUse) && fm.stato === "pronto" && !hasAny(fm, ["mondo", "fazioni", "personaggi", "missioni", "luoghi"])) {
            warnings.push(`${fileRel}: mappa strutturale pronta senza collegamenti canonici`);
        }

        if (mapUse === "zoom") {
            const zoomMatch = text.match(/```zoommap([\s\S]*?)```/);
            if (!zoomMatch) {
                warnings.push(`${fileRel}: mappa zoom senza blocco zoommap`);
            } else {
                const imageMatch = zoomMatch[1].match(/^\s*image:\s*(.+?)\s*$/m);
                if (!imageMatch) {
                    warnings.push(`${fileRel}: blocco zoommap senza image`);
                } else if (!fs.existsSync(path.join(ROOT, imageMatch[1].trim()))) {
                    warnings.push(`${fileRel}: immagine zoommap mancante (${imageMatch[1].trim()})`);
                }
            }
        }

        if (fileRel.endsWith(".hexcartographer.md")) {
            if (fm.type !== "hexcartographer") {
                warnings.push(`${fileRel}: file Hex Cartographer senza type: hexcartographer`);
            }
            if (!/```json[\s\S]*?```/.test(text)) {
                warnings.push(`${fileRel}: file Hex Cartographer senza blocco JSON`);
            }
        }

        if (fm.pubblico === true) {
            if (hasAny(fm, ["segreti", "prossima_mossa", "mosse_segrete"])) {
                warnings.push(`${fileRel}: mappa pubblica con campi da GM`);
            }
            if (/\[!segreto\]/i.test(text)) {
                warnings.push(`${fileRel}: mappa pubblica con callout segreto`);
            }
        }
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
