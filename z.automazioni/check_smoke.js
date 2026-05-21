#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const errors = [];

const DEMO_REQUIRED_FILES = [
    "Dev/Demo Finale.md",
    "Hub/Vista Giocatori.md",
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

const PUBLIC_DEMO_FILES = [
    "Risorse/Mappe/Mappa Pubblica Di Brumafonda.md",
    "Mondi/Dispense/Avviso Della Dogana Di Brumafonda.md",
    "Mondi/Sessioni/2026-05-28 - La Campana Nella Nebbia.md"
];

const privatePublicPattern = /\b(dm|segreto|segreti|nascost[oaie]?|verita|verità|prossima mossa|mosse segrete|retroscena|non rivelare)\b/i;

function filePath(relPath) {
    return path.join(ROOT, relPath);
}

function read(relPath) {
    return fs.readFileSync(filePath(relPath), "utf8");
}

function parseFrontmatter(text) {
    if (!text.startsWith("---\n")) return {};
    const end = text.indexOf("\n---", 4);
    if (end === -1) return {};

    const frontmatter = {};
    for (const line of text.slice(4, end).split(/\r?\n/)) {
        const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (!match) continue;

        const [, key, rawValue] = match;
        const value = rawValue.trim();
        if (value === "true") {
            frontmatter[key] = true;
        } else if (value === "false") {
            frontmatter[key] = false;
        } else if (value.startsWith("[") && value.endsWith("]")) {
            frontmatter[key] = value
                .slice(1, -1)
                .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
                .map(item => item.trim().replace(/^["']|["']$/g, ""))
                .filter(Boolean);
        } else {
            frontmatter[key] = value.replace(/^["']|["']$/g, "");
        }
    }
    return frontmatter;
}

function hasValue(value) {
    if (value === undefined || value === null || value === false) return false;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).trim().length > 0;
}

function hasAny(frontmatter, fields) {
    return fields.some(field => hasValue(frontmatter[field]));
}

for (const relPath of DEMO_REQUIRED_FILES) {
    if (!fs.existsSync(filePath(relPath))) {
        errors.push(`Smoke demo: file obbligatorio mancante ${relPath}`);
    }
}

const demoDoc = fs.existsSync(filePath("Dev/Demo Finale.md")) ? read("Dev/Demo Finale.md") : "";
for (const marker of ["[[Brumafonda Demo]]", "[[Campagna - Sale Sotto La Nebbia]]", "[[2026-05-28 - La Campana Nella Nebbia]]", "[[Vista Giocatori]]"]) {
    if (!demoDoc.includes(marker)) {
        errors.push(`Smoke demo: Dev/Demo Finale.md non contiene ${marker}`);
    }
}

const playerView = fs.existsSync(filePath("Hub/Vista Giocatori.md")) ? read("Hub/Vista Giocatori.md") : "";
for (const marker of ["renderPlayerPortalStatus", "renderPlayerRecap", "renderPublicSafety"]) {
    if (!playerView.includes(marker)) {
        errors.push(`Smoke demo: Vista Giocatori non contiene ${marker}`);
    }
}

const sessionPath = "Mondi/Sessioni/2026-05-28 - La Campana Nella Nebbia.md";
if (fs.existsSync(filePath(sessionPath))) {
    const session = parseFrontmatter(read(sessionPath));
    if (session.pubblico !== true) errors.push("Smoke demo: la sessione demo deve avere pubblico: true");
    if (!hasValue(session.recap_pubblico)) errors.push("Smoke demo: la sessione demo non ha recap_pubblico");
    if (privatePublicPattern.test(String(session.recap_pubblico))) {
        errors.push("Smoke demo: recap_pubblico contiene termini da DM o segreti");
    }
    if (!hasAny(session, ["mappe", "dispense", "missioni", "luoghi"])) {
        errors.push("Smoke demo: la sessione demo non collega mappa, dispensa, missione o luogo");
    }
}

const mapPath = "Risorse/Mappe/Mappa Pubblica Di Brumafonda.md";
if (fs.existsSync(filePath(mapPath))) {
    const map = parseFrontmatter(read(mapPath));
    if (map.pubblico !== true) errors.push("Smoke demo: la mappa demo deve avere pubblico: true");
    if (!hasAny(map, ["player_safe", "cosa_mostrare", "luoghi", "luogo"])) {
        errors.push("Smoke demo: la mappa pubblica non ha testo o luoghi player-safe");
    }
}

const handoutPath = "Mondi/Dispense/Avviso Della Dogana Di Brumafonda.md";
if (fs.existsSync(filePath(handoutPath))) {
    const handout = parseFrontmatter(read(handoutPath));
    if (handout.pubblico !== true || handout.stato !== "pronto") {
        errors.push("Smoke demo: la dispensa demo deve essere pronta e pubblica");
    }
    if (!hasValue(handout.player_safe)) {
        errors.push("Smoke demo: la dispensa pubblica non ha player_safe");
    }
}

for (const relPath of PUBLIC_DEMO_FILES) {
    if (!fs.existsSync(filePath(relPath))) continue;
    const frontmatter = parseFrontmatter(read(relPath));
    for (const privateField of ["segreti", "prossima_mossa", "mosse_segrete", "verita_nascosta"]) {
        if (hasValue(frontmatter[privateField])) {
            errors.push(`Smoke demo: file pubblico con campo DM ${privateField}: ${relPath}`);
        }
    }
}

const smokeDoc = fs.existsSync(filePath("Dev/Smoke Demo Finale.md")) ? read("Dev/Smoke Demo Finale.md") : "";
for (const marker of ["Smoke visuale Obsidian ancora da eseguire", "Screenshot/GIF di evidenza ancora da acquisire"]) {
    if (!smokeDoc.includes(marker)) {
        errors.push(`Smoke demo: stato manuale mancante in Dev/Smoke Demo Finale.md (${marker})`);
    }
}

if (errors.length) {
    console.error("Errori smoke statico:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`Smoke statico OK: ${DEMO_REQUIRED_FILES.length} file demo, ${PUBLIC_DEMO_FILES.length} file pubblici controllati.`);
