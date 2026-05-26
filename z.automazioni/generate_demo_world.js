#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DEFAULT_OUT_DIR = "dist/vault-gdr-clean";
const DEMO_WORLD_FILE = "Mondi/[Demo] Regno di Prova.md";

function ensureDir(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
}

function demoWorldNote() {
    return `---
id: demo-regno-di-prova
nome: "Regno di Prova"
categoria: mondo
fileClass: mondo
stato: bozza
tono: avventura leggera
tema: esplorazione e prime scelte
premessa: Un regno costiero in cui ogni scelta del party lascia un segno visibile.
gancio: Il faro spento sulla costa nasconde un passaggio dimenticato.
conflitto_centrale: Chi controlla il porto controlla le rotte del sale.
uso_al_tavolo: Mondo dimostrativo per esplorare Codex, dashboard e wizard senza campagna completa.
player_safe: Una costa nebbiosa con un faro antico ancora in piedi.
fonti: []
riferimenti_srd: []
riferimenti_regola: []
sezioni_collegate: []
blocchi_collegati: []
tabelle_collegate: []
tags:
  - dnd55/homebrew
  - mondo/lore
  - gdr/bozza
---

# Regno di Prova

> [!scena] Demo minima
> Usa questo mondo per provare filtri, [[Hub/Bibbia del Mondo|Codex]] e [[Worldbuilder Dashboard]]. Completa luoghi iconici e fazioni principali, poi crea campagna o sessione dal wizard.

\`\`\`\`tabs
tab: Identita

## Identita

- **Tono:** avventura leggera, mistero costiero
- **Promessa:** ogni sessione cambia almeno un luogo o un potere visibile al party

tab: Prontezza

\`\`\`dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCreationFeedback(dv);
gdr.renderWorldCreationStatus(dv, dv.current().file.path);
\`\`\`

tab: Passi

## Prossimi passi

1. Aggiungi un luogo in \`Mondi/Luoghi/\` e collegalo qui.
2. Crea una fazione in \`Mondi/Fazioni/\`.
3. Apri [[Risorse/Preparazione Sessione]] quando sei pronto al tavolo.
\`\`\`\`

## Fallback Markdown

Se Dataview o Meta Bind non sono attivi, compila i campi in Properties e usa [[Worldbuilder Dashboard]] per il filtro mondo.
`;
}

function generateDemoWorld(options = {}) {
    const root = path.resolve(options.root ?? process.cwd(), options.outDir ?? DEFAULT_OUT_DIR);
    if (!fs.existsSync(root)) {
        if (options.create) fs.mkdirSync(root, { recursive: true });
        else throw new Error(`Destinazione demo inesistente: ${root}. Genera prima la release con npm run release:clean o passa --create.`);
    }

    const target = path.join(root, DEMO_WORLD_FILE);
    if (fs.existsSync(target) && !options.force) {
        throw new Error(`Demo gia esistente: ${target}. Usa --force per rigenerarla.`);
    }

    ensureDir(target);
    fs.writeFileSync(target, demoWorldNote(), "utf8");

    return {
        root,
        files: [DEMO_WORLD_FILE]
    };
}

function parseArgs(argv) {
    const options = {};
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === "--force") options.force = true;
        if (arg === "--create") options.create = true;
        if (arg === "--out") {
            options.outDir = argv[i + 1];
            i += 1;
        }
    }
    return options;
}

if (require.main === module) {
    const result = generateDemoWorld(parseArgs(process.argv.slice(2)));
    console.log(`Demo world generato in ${result.root}`);
    for (const file of result.files) console.log(`- ${file}`);
}

module.exports = {
    DEFAULT_OUT_DIR,
    DEMO_WORLD_FILE,
    demoWorldNote,
    generateDemoWorld
};
