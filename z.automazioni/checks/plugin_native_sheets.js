const REQUIRED_PLUGIN_NATIVE_USER_PAGES = [
    "Risorse/Setup Guidato.md",
    "Risorse/Se Qualcosa Non Funziona.md",
    "Risorse/Prima Sessione In 15 Minuti.md",
    "Risorse/Materiali Al Tavolo.md",
    "Risorse/Importare Mappe.md",
    "Risorse/Mappe/Mappe.md"
];

const REQUIRED_HUB_EXPERIENCE = [
    ["Hub/1. DM Dashboard.md", "gdr-dm-dashboard", ["Regia DM", "renderActions", "Durante il Gioco"]],
    ["Hub/Worldbuilder Dashboard.md", "gdr-worldbuilder-dashboard", ["Scriptorium del Mondo", "renderWorldCreationStatus", "Campagna"]],
    ["Hub/Atlante del Mondo.md", "gdr-atlante-dashboard", ["mappa", "luoghi", "rotte"]],
    ["Hub/Bibbia del Mondo.md", "gdr-world-bible", ["World Anvil locale", "Codex", "renderCodexEditorial"]],
    ["Hub/Campagna da Ambientazione.md", "gdr-campaign-builder", ["campagne", "archi narrativi", "Opportunità"]],
    ["Hub/Durante il Gioco.md", "gdr-tavolo-dashboard", ["Schermo del DM", "Sessione Attiva", "renderTableCockpit"]],
    ["Hub/Cosa Succede Fuori Scena.md", "gdr-offscreen-dashboard", ["Motore Fuori Scena", "renderContinuityGaps", "campagne_attive"]],
    ["Hub/Motore Mondo Vivo.md", "gdr-living-world-engine", ["Campaign + Living World Engine", "renderContinuityQueue", "renderPropagationTargets"]],
    ["Hub/Party Control.md", "gdr-party-control", ["Cockpit rapido", "renderPartyControl", "durante-il-gioco"]],
    ["Hub/Vista Giocatori.md", "gdr-player-view", ["Portale condivisibile", "renderPlayerRecap", "renderPublicSafety"]],
    ["Hub/Lore Hub.md", "gdr-lore-hub", ["Hub visuale", "Atlante", "card"]],
    ["Hub/Controllo Worldbuilding.md", "gdr-worldbuilding-control", ["Coerenza", "Buchi", "INPUT["]],
    ["Hub/Controllo Canone.md", "gdr-canon-control", ["Controllo Canone", "INPUT[", "dataviewjs"]],
    ["Hub/Revisione Lore.md", "gdr-lore-review", ["Revisione Lore", "INPUT[", "dataviewjs"]],
    ["Hub/Geopolitical Dashboard.md", "gdr-geopolitical-dashboard", ["Geopolitica operativa", "INPUT[", "dataviewjs"]],
    ["Hub/Economia E Rotte.md", "gdr-economia-rotte", ["Sistema commerciale", "INPUT[", "dataviewjs"]],
    ["Hub/Compendium Del Mondo.md", "gdr-compendium-dashboard", ["Originale, non-SRD", "Compendium", "tab:"]]
];

function hasPluginNativeSheet(text) {
    const hasTabs = text.includes("````tabs");
    const hasCallout = /> \[![^\]]+\]/.test(text);
    const hasDynamicBlock = /```dataview|```dataviewjs|```tasks|```meta-bind|INPUT\[|BUTTON\[|dice:/.test(text);
    const hasFallback = /Fallback Markdown/i.test(text);
    return hasTabs && hasCallout && hasDynamicBlock && hasFallback;
}

function cssClasses(frontmatter) {
    const value = frontmatter.cssclasses;
    if (Array.isArray(value)) return value.map(String);
    return String(value ?? "").split(/[\s,]+/).filter(Boolean);
}

function includesAllMarkers(text, markers) {
    return markers.every(marker => text.includes(marker));
}

function validatePluginNativeExperience({ errors, markdownMeta, readRel, warnings }) {
    for (const fileRel of REQUIRED_PLUGIN_NATIVE_USER_PAGES) {
        const text = readRel(fileRel);
        if (!hasPluginNativeSheet(text)) {
            warnings.push(`${fileRel}: pagina utente chiave senza struttura plugin-native completa`);
        }
    }

    const seenHubClasses = new Map();
    for (const [fileRel, uniqueClass, markers] of REQUIRED_HUB_EXPERIENCE) {
        const text = readRel(fileRel);
        const fm = markdownMeta.get(fileRel) ?? {};
        const classes = cssClasses(fm);

        if (!text) {
            errors.push(`Hub experience: file mancante ${fileRel}`);
            continue;
        }
        if (fm.categoria !== "risorsa" || fm.stato !== "pronto") {
            warnings.push(`${fileRel}: hub senza frontmatter operativo categoria: risorsa e stato: pronto`);
        }
        if (!classes.includes("dashboard") || !classes.includes(uniqueClass)) {
            warnings.push(`${fileRel}: hub senza cssclasses dashboard + ${uniqueClass}`);
        }
        if (seenHubClasses.has(uniqueClass)) {
            warnings.push(`${fileRel}: cssclass hub duplicata con ${seenHubClasses.get(uniqueClass)} (${uniqueClass})`);
        }
        seenHubClasses.set(uniqueClass, fileRel);
        if (!/> \[![^\]]+\]/.test(text)) {
            warnings.push(`${fileRel}: hub senza callout di orientamento o controllo`);
        }
        if (!/```dataview|```dataviewjs|INPUT\[|BUTTON\[/.test(text)) {
            warnings.push(`${fileRel}: hub senza vista, input o azione plugin-native`);
        }
        if (!includesAllMarkers(text, markers)) {
            warnings.push(`${fileRel}: hub senza marker funzionali richiesti (${markers.join(", ")})`);
        }
    }
}

module.exports = {
    hasPluginNativeSheet,
    validatePluginNativeExperience
};
