#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
    hasAny,
    hasValue,
    parseFrontmatter,
    readJson: readJsonFile,
    existsRel: existsRelFromUtils,
    readTextRel,
    repoPath: repoPathFromUtils,
    rel: relativePath,
    walk: walkFiles
} = require("./node_utils");
const { validatePluginControls } = require("./checks/plugin_controls");
const { validateRequiredFiles } = require("./checks/required_files");
const { validateSyntaxControls } = require("./checks/syntax_controls");
const { validateMarkdownLinks } = require("./checks/markdown_links");
const { validateMetaBindControls } = require("./checks/metabind_controls");
const { validateObsidianConfig } = require("./checks/obsidian_config");

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
    "Dev/TemplateFactory/modules/frontmatter_profiles.yaml",
    "Dev/TemplateFactory/modules/runtime_profiles.yaml",
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
    "z.automazioni/check_release.js",
    "z.automazioni/audit_template_migration.py",
    "z.automazioni/check_template_factory.py",
    "z.automazioni/render_template_factory.py",
    "z.automazioni/template_factory_utils.py",
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
const LIVE_ENTITY_CATEGORIES = new Set(["luogo", "personaggio", "fazione", "missione", "evento storico", "oggetto", "tracciato", "relazione", "risorsa", "cultura", "religione", "societa"]);
const CODEX_CATEGORIES = new Set(["luogo", "personaggio", "fazione", "missione", "tracciato", "relazione", "evento storico", "oggetto", "cultura", "religione", "societa"]);
const PLAYABLE_MAP_USES = new Set(["zoom", "esagoni", "dungeon", "scena"]);
const STRUCTURED_MAP_USES = new Set(["fronte", "indizi", "regione"]);
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
    return relativePath(ROOT, file);
}

function walk(dir, predicate = () => true) {
    return walkFiles(dir, { ignoredDirs: IGNORED_DIRS, predicate });
}

const repoPath = (...parts) => repoPathFromUtils(ROOT, ...parts);
const existsRel = file => existsRelFromUtils(ROOT, file);
const readRel = (file, fallback = "") => readTextRel(ROOT, file, fallback);

function readJson(file) {
    return readJsonFile(file, null, error => {
        errors.push(`${rel(file)}: JSON non valido (${error.message})`);
    });
}

const readOptionalJson = file => fs.existsSync(file) ? readJson(file) : null;
const readOptionalJsonRel = file => readOptionalJson(repoPath(file));

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
        "Mondi/Calendario.md",
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

function isReleaseContentNote(fileRel) {
    return /^(Mondi|Campagne)\//.test(fileRel)
        && !isIndexLikeNote(fileRel)
        && !fileRel.startsWith("Mondi/SRD/");
}

function hasPluginNativeSheet(text) {
    const hasTabs = text.includes("````tabs");
    const hasCallout = /> \[![^\]]+\]/.test(text);
    const hasDynamicBlock = /```dataview|```dataviewjs|```tasks|```meta-bind|INPUT\[|BUTTON\[|dice:/.test(text);
    const hasFallback = /Fallback Markdown/i.test(text);
    return hasTabs && hasCallout && hasDynamicBlock && hasFallback;
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

const templateFactoryManifest = readOptionalJsonRel("z.modelli/.templatefactory-manifest.json");
for (const entry of templateFactoryManifest?.files ?? []) {
    addGeneratedTemplatePath(entry?.path);
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
const markdownTextByPath = new Map();
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
    markdownTextByPath.set(fileRel, text);
    markdownMeta.set(fileRel, parseFrontmatter(text));
}

function markdownText(file) {
    const fileRel = rel(file);
    return markdownTextByPath.get(fileRel) ?? fs.readFileSync(file, "utf8");
}

const modelMarkdownFiles = markdownFiles.filter(file => rel(file).startsWith("z.modelli/"));

for (const file of walk(ROOT, file => file.endsWith(".json"))) {
    readJson(file);
}

const communityPlugins = readJson(repoPath(".obsidian/community-plugins.json")) ?? [];
const tasksConfig = readOptionalJsonRel(".obsidian/plugins/obsidian-tasks-plugin/data.json") ?? {};
const calendariumData = readOptionalJsonRel(".obsidian/plugins/calendarium/data.json") ?? {};
const calendariumCalendars = Array.isArray(calendariumData.calendars)
    ? calendariumData.calendars
    : Object.values(calendariumData.calendars ?? {});
const calendariumNames = new Set(calendariumCalendars
    .flatMap(calendar => [calendar?.name, calendar?.id])
    .filter(Boolean)
    .map(value => String(value).toLowerCase()));

validateRequiredFiles({
    errors,
    existsRel,
    requiredBaseFiles: REQUIRED_BASE_FILES,
    requiredFiles: REQUIRED_FILES,
    requiredLayerFiles: REQUIRED_LAYER_FILES
});

const pluginMatrixPath = repoPath("Dev/plugin_matrix.json");
const pluginMatrix = readJson(pluginMatrixPath) ?? [];
validatePluginControls({
    communityPlugins,
    errors,
    existsRel,
    hasValue,
    isGeneratedTemplatePath,
    pluginMatrix,
    repoPath,
    requiredPlugins: REQUIRED_PLUGINS,
    targetPath,
    tasksConfig
});

validateSyntaxControls({
    errors,
    rel,
    repoPath,
    requiredSnippets: REQUIRED_SNIPPETS,
    root: ROOT,
    walk
});

validateMarkdownLinks({
    errors,
    isGeneratedTemplatePath,
    linkableByBasename,
    linkableByPath,
    markdownFiles,
    markdownText,
    rel,
    warnings
});

const metaBindConfigPath = repoPath(".obsidian/plugins/obsidian-meta-bind-plugin/data.json");
const metaBindConfig = readJson(metaBindConfigPath);
validateMetaBindControls({
    errors,
    existsRel,
    isGeneratedTemplatePath,
    markdownFiles,
    markdownText,
    metaBindConfig,
    modelMarkdownFiles,
    rel,
    repoPath,
    requiredButtons: REQUIRED_META_BIND_BUTTONS,
    requiredInputTemplates: REQUIRED_META_BIND_INPUT_TEMPLATES,
    targetPath,
    walk,
    warnings
});

const metadataMenuConfig = readJson(repoPath(".obsidian/plugins/metadata-menu/data.json"));
const iconConfig = readJson(repoPath(".obsidian/plugins/obsidian-icon-folder/data.json"));
const workspace = readOptionalJsonRel(".obsidian/workspace.json");
validateObsidianConfig({
    errors,
    existsRel,
    iconConfig,
    isGeneratedTemplatePath,
    markdownFiles,
    markdownText,
    metadataMenuConfig,
    rel,
    requiredMetadataMenuPresets: REQUIRED_METADATA_MENU_PRESETS,
    workspace
});

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

const playerViewText = readRel("Hub/Vista Giocatori.md");
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

const startHereText = readRel("Inizia Qui.md");
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

const gptIndexRel = "Dev/Indice Connettore GPT.md";
if (!existsRel(gptIndexRel)) {
    errors.push("Dev/Indice Connettore GPT.md: file mancante");
} else {
    const gptIndexText = readRel(gptIndexRel);
    const codePathPattern = /`([^`\n]+\.(?:md|js|json|css))`/g;
    let match;

    while ((match = codePathPattern.exec(gptIndexText))) {
        const referenced = match[1].trim();
        if (!existsRel(referenced)) {
            errors.push(`Dev/Indice Connettore GPT.md: percorso citato mancante ${referenced}`);
        }
    }
}

for (const [fileRel, fm] of realEntries) {
    const text = readRel(fileRel);

    if (isReleaseContentNote(fileRel) && !hasPluginNativeSheet(text)) {
        warnings.push(`${fileRel}: nota di release senza scheda plugin-native completa (tabs, callout, controlli dinamici, fallback)`);
    }

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

    if (hasAny(fm, ["conseguenze", "impatto", "conseguenza_potenziale", "aggiornamenti_richiesti"]) && !hasAny(fm, ["entita_impattate", "propaga_a", "applicata_a"])) {
        warnings.push(`${fileRel}: continuita M6 con impatto ma senza bersagli`);
    }

    if (String(fm.propagazione_stato ?? "") === "applicata" && !hasAny(fm, ["applicata_a", "propaga_a", "entita_impattate"])) {
        warnings.push(`${fileRel}: propagazione_stato applicata senza bersagli applicati`);
    }

    if (String(fm.propagazione_stato ?? "") === "da verificare" && !hasAny(fm, ["aggiornamenti_richiesti", "prossima_mossa", "impatto"])) {
        warnings.push(`${fileRel}: propagazione da verificare senza aggiornamento richiesto`);
    }

    if (fileRel.startsWith("Mondi/Luoghi/") && fm.stato === "pronto" && !hasAny(fm, ["pericolo", "stabilita", "pressione"])) {
        warnings.push(`${fileRel}: luogo pronto senza pericolo, stabilita o pressione`);
    }

    if (isLiveEntityNote(fileRel) && LIVE_ENTITY_CATEGORIES.has(String(fm.categoria ?? "")) && fm.stato !== "archiviata") {
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

    if (isLiveEntityNote(fileRel) && CODEX_CATEGORIES.has(String(fm.categoria ?? "")) && fm.stato !== "archiviata") {
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

        if (PLAYABLE_MAP_USES.has(mapUse) && fm.stato === "pronto") {
            if (!hasValue(fm.mondo)) {
                warnings.push(`${fileRel}: mappa pronta senza mondo`);
            }
            if (!hasAny(fm, ["luogo", "luoghi", "incontri", "missioni"])) {
                warnings.push(`${fileRel}: mappa pronta senza luogo, luoghi, incontri o missioni`);
            }
        }

        if (STRUCTURED_MAP_USES.has(mapUse) && fm.stato === "pronto" && !hasAny(fm, ["mondo", "fazioni", "personaggi", "missioni", "luoghi"])) {
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
                } else if (!existsRel(imageMatch[1].trim())) {
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
    console.error("Avvisi bloccanti:");
    for (const warning of warnings) console.error(`- ${warning}`);
}

if (errors.length) {
    console.error("Errori:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

if (warnings.length) {
    process.exit(1);
}

console.log(`Vault OK: ${markdownFiles.length} note, ${communityPlugins.length} plugin community abilitati.`);
