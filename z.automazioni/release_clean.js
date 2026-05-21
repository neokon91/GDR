#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { readJson, rel: relativePath, repoPath } = require("./node_utils");

const ROOT = process.cwd();
const DIST = repoPath(ROOT, "dist");
const OUT = repoPath(DIST, "vault-gdr-clean");
const ZIP = repoPath(DIST, "vault-gdr-clean.zip");

const INCLUDED_ROOTS = new Set([
    ".obsidian",
    "Campagne",
    "Giocatori",
    "Hub",
    "Inbox",
    "Mondi",
    "Risorse",
    "SRD",
    "z.automazioni",
    "z.engine",
    "z.bacheche",
    "z.fileclass",
    "z.modelli"
]);

const INCLUDED_ROOT_FILES = new Set([
    "Inizia Qui.md",
    "LICENSE.md",
    "VERSION.md",
]);

const EXCLUDED_DIRS = new Set([".git", ".github", "Dev", "dist", "docs", "Import", "node_modules"]);
const EXCLUDED_ROOT_FILES = new Set([".gitignore", "CHANGELOG.md", "CONTRIBUTING.md", "RELEASE.md", "Repository.md", "package.json"]);
const EXCLUDED_RISORSE = new Set([
    "Callout GDR.md",
    "Checklist Lore Professionale.md",
    "Confine Release Repository.md",
    "Consegna Nuovo DM.md",
    "Guida Lore Professionale.md",
    "Indice Connettore GPT.md",
    "Importare Mappe.md",
    "Integrazioni Plugin.md",
    "Media Scene.md",
    "Modello Entità.md",
    "Preset Calendario.md",
    "Profili Campagna.md",
    "Recap Plugin Installati.md",
    "Release Pulita.md",
    "Roadmap",
    "Smoke 1.0 Professionale.md",
    "Strumenti Attivi.md",
    "Studio Iron Vault.md",
    "Sviluppo Vault.md",
    "Worldbuilding Tassonomico.md"
]);
const EXCLUDED_AUTOMAZIONI = new Set([
    "check_vault.js",
    "check_smoke.js",
    "check_release.js",
    "import_azgaar_geojson.js",
    "import_srd.js",
    "LICENSE.md",
    "node_utils.js",
    "release_beta.js",
    "release_clean.js",
    "README.md",
    "template_factory_utils.py"
]);
const EXCLUDED_FILES = new Set([".DS_Store"]);
const REQUIRED_RELEASE_FILES = [
    "Inizia Qui.md",
    "VERSION.md",
    "LEGGIMI.md",
    "Demo Brumafonda.md",
    ".obsidian/community-plugins.json",
    ".obsidian/snippets/gdr-vault.css",
    "Hub/Vista Giocatori.md",
    "Hub/Atlante del Mondo.md",
    "Hub/Durante il Gioco.md",
    "Risorse/Setup Guidato.md",
    "Risorse/Controllo Vault.md",
    "Risorse/Quality Report.md",
    "Mondi/Brumafonda Demo.md",
    "Campagne/Campagna - Sale Sotto La Nebbia.md",
    "Mondi/Sessioni/2026-05-28 - La Campana Nella Nebbia.md",
    "Risorse/Mappe/Mappa Pubblica Di Brumafonda.md",
    "z.engine/session_views.js",
    "z.automazioni/helpers.js",
    "z.modelli/.templatefactory-manifest.json"
];
const GENERATED_RELEASE_NOTES = {
    "LEGGIMI.md": `# Vault GDR

Questa cartella contiene il vault pronto per l'utente finale.

Apri questa cartella in Obsidian come vault e parti da \`Inizia Qui.md\`.

## Cosa Include

- dashboard operative per preparazione, sessione, post-sessione e worldbuilding;
- \`Vista Giocatori\` per recap, handout, mappe pubbliche e materiale condivisibile;
- \`Party Control\` per PG, HP, missioni, inventario e flags;
- \`Quality Report\` per copertura, buchi operativi e controllo anti-segreti;
- atlante, mappe, template, automazioni e plugin abilitati necessari ai pulsanti;
- SRD 5.2.1 italiano come modulo regolamentare separato.

## Primo Avvio

1. Apri Obsidian.
2. Scegli \`Apri cartella come vault\`.
3. Se Obsidian chiede conferma per gli strumenti inclusi, abilitali solo se hai scaricato il vault dalla release ufficiale.
4. Apri \`Inizia Qui.md\`.
5. Se vuoi vedere una demo gia pronta, apri \`Demo Brumafonda.md\`.
6. Apri \`Risorse/Setup Guidato.md\` per controllare plugin, pulsanti e dashboard.

## Cosa Non Include

Questa copia non include materiali di sviluppo repository, issue template GitHub, roadmap interne, script CLI di import/release o plugin non abilitati.
`,
    "Demo Brumafonda.md": `---
cssclasses:
  - dashboard
categoria: risorsa
tipo: demo
stato: pronto
pubblico: true
---

# Demo Brumafonda

Questa pagina esiste solo nella release utente. Serve a provare il vault senza aprire documentazione di sviluppo.

## Percorso Demo

1. Apri [[Brumafonda Demo]] per vedere il mondo demo.
2. Apri [[Campagna - Sale Sotto La Nebbia]] per vedere come il mondo diventa campagna.
3. Apri [[2026-05-28 - La Campana Nella Nebbia]] per vedere una sessione demo gia giocata.
4. Apri [[Mappa Pubblica Di Brumafonda]] e [[Avviso Della Dogana Di Brumafonda]] per controllare materiale player-safe.
5. Apri [[Vista Giocatori]] per vedere recap, mappa e materiale condivisibile.

## Pagine Da Provare

- [[Inizia Qui]]
- [[Worldbuilder Dashboard]]
- [[Atlante del Mondo]]
- [[Campagna da Ambientazione]]
- [[Durante il Gioco]]
- [[Vista Giocatori]]
- [[Risorse/Controllo Vault]]

## Cosa Verificare

- Nessun blocco Dataview o DataviewJS mostra errori.
- I pulsanti principali sono visibili.
- La vista giocatori non mostra campi DM o segreti.
- La mappa e la dispensa pubblica sono raggiungibili.
`
};

const enabledPlugins = new Set(readJson(repoPath(ROOT, ".obsidian/community-plugins.json"), []));

function rel(file) {
    return relativePath(ROOT, file);
}

function topSegment(relPath) {
    return relPath.split("/")[0];
}

function shouldIncludeRoot(relPath, entry) {
    const top = topSegment(relPath);
    if (INCLUDED_ROOTS.has(top) && !EXCLUDED_DIRS.has(top)) return true;
    if (entry.isDirectory()) return false;
    return INCLUDED_ROOT_FILES.has(relPath) && !EXCLUDED_ROOT_FILES.has(relPath);
}

function shouldSkip(relPath, entry) {
    if (EXCLUDED_FILES.has(entry.name)) return true;
    const top = topSegment(relPath);
    if (EXCLUDED_DIRS.has(top)) return true;
    if (!shouldIncludeRoot(relPath, entry)) return true;

    if (relPath.startsWith(".obsidian/plugins/")) {
        const pluginId = relPath.split("/")[2];
        if (pluginId && !enabledPlugins.has(pluginId)) return true;
    }

    if (relPath === ".obsidian/workspace.json") return true;

    if (relPath.startsWith("Risorse/")) {
        const first = relPath.slice("Risorse/".length).split("/")[0];
        if (EXCLUDED_RISORSE.has(first)) return true;
    }

    if (relPath.startsWith("z.automazioni/")) {
        const first = relPath.slice("z.automazioni/".length).split("/")[0];
        if (EXCLUDED_AUTOMAZIONI.has(first)) return true;
    }

    if (relPath === "z.modelli/README.md" || relPath === "z.bacheche/README.md") return true;

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

function writeGeneratedReleaseNotes() {
    for (const [file, text] of Object.entries(GENERATED_RELEASE_NOTES)) {
        fs.writeFileSync(repoPath(OUT, file), text);
    }
}

function walkRelease(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(OUT, fullPath).replace(/\\/g, "/");
        files.push(relPath);
        if (entry.isDirectory()) {
            walkRelease(fullPath, files);
        }
    }
    return files;
}

function validateRelease() {
    const errors = [];

    for (const file of REQUIRED_RELEASE_FILES) {
        if (!fs.existsSync(repoPath(OUT, file))) {
            errors.push(`file release obbligatorio mancante: ${file}`);
        }
    }

    const releaseEntries = walkRelease(OUT);
    for (const forbidden of [...EXCLUDED_DIRS, ...EXCLUDED_ROOT_FILES]) {
        if (releaseEntries.some(entry => entry === forbidden || entry.startsWith(`${forbidden}/`))) {
            errors.push(`percorso non ammesso nella release pulita: ${forbidden}`);
        }
    }

    const pluginRoot = repoPath(OUT, ".obsidian/plugins");
    if (fs.existsSync(pluginRoot)) {
        const bundledPlugins = fs.readdirSync(pluginRoot, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);

        for (const pluginId of bundledPlugins) {
            if (!enabledPlugins.has(pluginId)) {
                errors.push(`plugin non abilitato incluso nella release: ${pluginId}`);
            }
        }
    }

    if (errors.length) {
        console.error("Release pulita non valida:");
        for (const error of errors) console.error(`- ${error}`);
        process.exit(1);
    }

    console.log(`Release pulita verificata: ${releaseEntries.length} percorsi controllati.`);
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
writeGeneratedReleaseNotes();
validateRelease();

const zipped = zipIfAvailable();
console.log(`Release utente creata: ${rel(OUT)}`);
if (zipped) {
    console.log(`Zip utente creato: ${rel(ZIP)}`);
} else {
    console.log("Zip utente non creato: comando zip non disponibile.");
}
