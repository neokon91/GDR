#!/usr/bin/env node

const { existsRel, hasAny, hasValue, parseFrontmatter, readTextRel } = require("./node_utils");

const ROOT = process.cwd();
const errors = [];

const DEMO_REQUIRED_FILES = [
    "Hub/Vista Giocatori.md",
    "Mondi/Brumafonda Demo.md",
    "Campagne/Sale Sotto La Nebbia/Sale Sotto La Nebbia.md",
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
const PRIVATE_PUBLIC_FIELDS = ["segreti", "prossima_mossa", "mosse_segrete", "verita_nascosta"];

function frontmatterRel(relPath) {
    return existsRel(ROOT, relPath) ? parseFrontmatter(readTextRel(ROOT, relPath)) : null;
}

for (const relPath of DEMO_REQUIRED_FILES) {
    if (!existsRel(ROOT, relPath)) {
        errors.push(`Smoke demo: file obbligatorio mancante ${relPath}`);
    }
}

const demoWorld = readTextRel(ROOT, "Mondi/Brumafonda Demo.md");
for (const marker of ["[[Sale Sotto La Nebbia]]", "[[Mappa Pubblica Di Brumafonda]]"]) {
    if (!demoWorld.includes(marker)) {
        errors.push(`Smoke demo: Brumafonda Demo non contiene ${marker}`);
    }
}

const playerView = readTextRel(ROOT, "Hub/Vista Giocatori.md");
for (const marker of ["renderPlayerPortalStatus", "renderPlayerRecap", "renderPublicSafety"]) {
    if (!playerView.includes(marker)) {
        errors.push(`Smoke demo: Vista Giocatori non contiene ${marker}`);
    }
}

const sessionPath = "Mondi/Sessioni/2026-05-28 - La Campana Nella Nebbia.md";
const session = frontmatterRel(sessionPath);
if (session) {
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
const map = frontmatterRel(mapPath);
if (map) {
    if (map.pubblico !== true) errors.push("Smoke demo: la mappa demo deve avere pubblico: true");
    if (!hasAny(map, ["player_safe", "cosa_mostrare", "luoghi", "luogo"])) {
        errors.push("Smoke demo: la mappa pubblica non ha testo o luoghi player-safe");
    }
}

const handoutPath = "Mondi/Dispense/Avviso Della Dogana Di Brumafonda.md";
const handout = frontmatterRel(handoutPath);
if (handout) {
    if (handout.pubblico !== true || handout.stato !== "pronto") {
        errors.push("Smoke demo: la dispensa demo deve essere pronta e pubblica");
    }
    if (!hasValue(handout.player_safe)) {
        errors.push("Smoke demo: la dispensa pubblica non ha player_safe");
    }
}

for (const relPath of PUBLIC_DEMO_FILES) {
    const frontmatter = frontmatterRel(relPath);
    if (!frontmatter) continue;
    for (const privateField of PRIVATE_PUBLIC_FIELDS) {
        if (hasValue(frontmatter[privateField])) {
            errors.push(`Smoke demo: file pubblico con campo DM ${privateField}: ${relPath}`);
        }
    }
}

const smokeDoc = readTextRel(ROOT, "Dev/Smoke Demo Finale.md");
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

console.log(`Smoke statico OK: ${DEMO_REQUIRED_FILES.length} file demo sorgente, ${PUBLIC_DEMO_FILES.length} file pubblici controllati.`);
