#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DEFAULT_OUT_DIR = "dist/vault-gdr-clean";
const DEMO_WORLD_FILE = "Mondi/[Demo] Regno di Prova.md";
const DEMO_FILES = [
    DEMO_WORLD_FILE,
    "Campagne/[Demo] Sale Sotto La Nebbia.md",
    "Mondi/Luoghi/[Demo] Porto Di Brumafonda.md",
    "Mondi/Fazioni/[Demo] Consorzio Del Sale Nero.md",
    "Mondi/Missioni/[Demo] Recuperare La Campana Sommersa.md",
    "Mondi/Sessioni/[Demo] 2026-05-28 - La Campana Nella Nebbia.md",
    "Mondi/Tracciati/[Demo] Marea Della Lanterna Bassa.md",
    "Mondi/Incontri/[Demo] Scontro Alla Banchina.md",
    "Mondi/Creature/[Demo] Vedetta Salmastra.md",
    "Mondi/Oggetti/[Demo] Chiave Di Sale.md",
    "Mondi/Timeline/[Demo] Il Faro Vecchio Si Riaccende.md",
    "Mondi/Dispense/[Demo] Avviso Della Dogana.md",
    "Demo Regno Di Prova.md"
];

function ensureDir(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
}

function yamlValue(value) {
    if (Array.isArray(value)) {
        if (!value.length) return "[]";
        return `\n${value.map(item => `  - ${yamlValue(item)}`).join("\n")}`;
    }
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number") return String(value);
    const text = String(value ?? "");
    if (!text) return '""';
    return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function note(fields, body = "") {
    const frontmatter = Object.entries(fields)
        .map(([key, value]) => `${key}: ${yamlValue(value)}`)
        .join("\n");
    return `---\n${frontmatter}\n---\n\n${body.trim()}\n`;
}

function demoWorldEntries() {
    const world = "[[Mondi/[Demo] Regno di Prova|Regno di Prova]]";
    const campaign = "[[Campagne/[Demo] Sale Sotto La Nebbia|Sale Sotto La Nebbia]]";
    const place = "[[Mondi/Luoghi/[Demo] Porto Di Brumafonda|Porto Di Brumafonda]]";
    const faction = "[[Mondi/Fazioni/[Demo] Consorzio Del Sale Nero|Consorzio Del Sale Nero]]";
    const mission = "[[Mondi/Missioni/[Demo] Recuperare La Campana Sommersa|Recuperare La Campana Sommersa]]";
    const session = "[[Mondi/Sessioni/[Demo] 2026-05-28 - La Campana Nella Nebbia|La Campana Nella Nebbia]]";
    const clock = "[[Mondi/Tracciati/[Demo] Marea Della Lanterna Bassa|Marea Della Lanterna Bassa]]";
    const encounter = "[[Mondi/Incontri/[Demo] Scontro Alla Banchina|Scontro Alla Banchina]]";
    const creature = "[[Mondi/Creature/[Demo] Vedetta Salmastra|Vedetta Salmastra]]";
    const item = "[[Mondi/Oggetti/[Demo] Chiave Di Sale|Chiave Di Sale]]";
    const event = "[[Mondi/Timeline/[Demo] Il Faro Vecchio Si Riaccende|Il Faro Vecchio Si Riaccende]]";
    const handout = "[[Mondi/Dispense/[Demo] Avviso Della Dogana|Avviso Della Dogana]]";

    return [
        [DEMO_WORLD_FILE, note({
            id: "demo-regno-di-prova",
            nome: "Regno di Prova",
            categoria: "mondo",
            fileClass: "mondo",
            stato: "pronto",
            tono: "avventura leggera",
            tema: "esplorazione e prime scelte",
            premessa: "Un regno costiero in cui ogni scelta del party lascia un segno visibile.",
            gancio: "Il faro spento sulla costa nasconde un passaggio dimenticato.",
            conflitto_centrale: "Chi controlla il porto controlla le rotte del sale.",
            luoghi_iconici: [place],
            fazioni_principali: [faction],
            misteri_pubblici: ["Perche il faro si accende solo durante la marea bassa?"],
            campagne: [campaign],
            missioni: [mission],
            player_safe: "Una costa nebbiosa con un faro antico, un porto inquieto e voci di una campana sommersa.",
            pubblico: true,
            tags: ["demo", "mondo/lore"]
        }, `
# Regno di Prova

> [!scena] Demo minima
> Scenario neutro generato per provare il vault senza contenuti protetti. Apri [[Inizia Qui]], seleziona questo mondo nei filtri e segui il percorso Prepara -> Gioca -> Aggiorna.

## Cosa Mostra

- un mondo pronto ma piccolo;
- una campagna collegata;
- una missione con clock, incontro, oggetto e conseguenza;
- materiale player-safe da verificare in [[Hub/Vista Giocatori]].
`)],
        ["Campagne/[Demo] Sale Sotto La Nebbia.md", note({
            id: "demo-sale-sotto-la-nebbia",
            nome: "Sale Sotto La Nebbia",
            categoria: "campagna",
            fileClass: "campagna",
            stato: "pronto",
            mondo: world,
            luogo_iniziale: place,
            fazioni: [faction],
            missioni: [mission],
            sessioni: [session],
            tracciati: [clock],
            profilo: "demo primo utilizzo",
            player_safe: "Il party arriva a Brumafonda mentre il porto discute il ritorno della campana sommersa.",
            pubblico: true
        }, "# Sale Sotto La Nebbia\n\nCampagna dimostrativa breve: una pressione economica, una fazione e una prima sessione pronta.")],
        ["Mondi/Luoghi/[Demo] Porto Di Brumafonda.md", note({
            id: "demo-porto-di-brumafonda",
            nome: "Porto Di Brumafonda",
            categoria: "luogo",
            tipo: "porto",
            fileClass: "luogo",
            stato: "pronto",
            mondo: world,
            campagne: [campaign],
            fazioni: [faction],
            missioni: [mission],
            pericolo: 2,
            tensione: "La dogana blocca merci e persone finche la campana non viene recuperata.",
            gancio: "Ogni nave sente un rintocco sotto la chiglia durante la nebbia.",
            player_safe: "Porto umido e affollato, pieno di mercanti nervosi e corde salate.",
            pubblico: true
        }, "# Porto Di Brumafonda\n\nLuogo demo con pressione economica e aggancio alla prima missione.")],
        ["Mondi/Fazioni/[Demo] Consorzio Del Sale Nero.md", note({
            id: "demo-consorzio-del-sale-nero",
            nome: "Consorzio Del Sale Nero",
            categoria: "fazione",
            tipo: "gilda",
            fileClass: "fazione",
            stato: "pronto",
            mondo: world,
            campagne: [campaign],
            luoghi: [place],
            missioni: [mission],
            obiettivo: "Controllare il recupero della campana e riaprire le rotte alle proprie condizioni.",
            pressione: 3,
            prossima_mossa: "Assumere il party prima che lo faccia la dogana.",
            player_safe: "Mercanti influenti con sigilli neri sulle casse di sale.",
            pubblico: true
        }, "# Consorzio Del Sale Nero\n\nFazione demo: abbastanza chiara da muovere la sessione, non abbastanza forte da chiudere tutte le scelte.")],
        ["Mondi/Missioni/[Demo] Recuperare La Campana Sommersa.md", note({
            id: "demo-recuperare-la-campana-sommersa",
            nome: "Recuperare La Campana Sommersa",
            categoria: "missione",
            fileClass: "missione",
            stato: "pronto",
            mondo: world,
            campagne: [campaign],
            luogo: place,
            fazioni: [faction],
            sessioni: [session],
            tracciati: [clock],
            incontri: [encounter],
            ricompense: [item],
            obiettivo: "Recuperare la campana prima che la marea chiuda il passaggio.",
            scelta: "Consegnarla alla dogana, al Consorzio o tenerla nascosta.",
            conseguenza: "La scelta decide chi controlla le rotte del sale.",
            entita_impattate: [place, faction, clock],
            propaga_a: [event],
            propagazione_stato: "aperta",
            player_safe: "Una missione di recupero sotto il porto durante la bassa marea.",
            pubblico: true
        }, "# Recuperare La Campana Sommersa\n\nMissione demo che collega scelta, conseguenza e propagazione.")],
        ["Mondi/Sessioni/[Demo] 2026-05-28 - La Campana Nella Nebbia.md", note({
            id: "demo-sessione-campana-nebbia",
            nome: "La Campana Nella Nebbia",
            categoria: "sessione",
            fileClass: "sessione",
            stato: "pronto",
            attiva: true,
            mondo: world,
            campagne: [campaign],
            luoghi: [place],
            fazioni: [faction],
            missioni: [mission],
            tracciati: [clock],
            incontri: [encounter],
            dispense: [handout],
            obiettivo: "Portare il party dalla richiesta del Consorzio alla scelta sulla campana.",
            apertura: "La nebbia spegne le lanterne e una campana suona sotto il molo.",
            pressione: 2,
            segreti_rivelabili: ["La campana non e perduta: e stata nascosta per fermare le rotte."],
            player_safe: "Prima sessione demo pronta da aprire in Durante il Gioco.",
            pubblico: false
        }, "# La Campana Nella Nebbia\n\nSessione demo pronta: apertura, pressione, incontro e ricompensa.")],
        ["Mondi/Tracciati/[Demo] Marea Della Lanterna Bassa.md", note({
            id: "demo-marea-lanterna-bassa",
            nome: "Marea Della Lanterna Bassa",
            categoria: "tracciato",
            fileClass: "tracciato",
            stato: "attivo",
            mondo: world,
            campagne: [campaign],
            missioni: [mission],
            progress_value: 2,
            progress_max: 6,
            pressione: 2,
            innesco: "Ogni scena lunga fa risalire la marea.",
            posta: "Il passaggio sotto il porto si chiude.",
            prossima_mossa: "La marea copre il vecchio accesso della dogana.",
            player_safe: "La marea sta salendo.",
            pubblico: true
        }, "# Marea Della Lanterna Bassa\n\nClock demo per mostrare pressione visibile.")],
        ["Mondi/Incontri/[Demo] Scontro Alla Banchina.md", note({
            id: "demo-scontro-alla-banchina",
            nome: "Scontro Alla Banchina",
            categoria: "incontro",
            fileClass: "incontro",
            stato: "pronto",
            tipo: "combattimento",
            mondo: world,
            campagne: [campaign],
            luogo: place,
            missioni: [mission],
            creature: [creature],
            encounter_creatures: ["1: Vedetta Salmastra"],
            prossima_mossa: "Se il party perde tempo, il Consorzio manda altri uomini.",
            player_safe: "Guardie nervose bloccano la banchina nella nebbia.",
            pubblico: false
        }, "```encounter\nplayers: []\ncreatures:\n  - 1: Vedetta Salmastra\n```")],
        ["Mondi/Creature/[Demo] Vedetta Salmastra.md", note({
            id: "demo-vedetta-salmastra",
            name: "Vedetta Salmastra",
            nome: "Vedetta Salmastra",
            categoria: "creatura",
            fileClass: "creatura",
            stato: "pronto",
            mondo: world,
            habitat: [place],
            missioni: [mission],
            fazioni: [faction],
            statblock: true,
            ac: 13,
            hp: 11,
            speed: "30 ft.",
            uso_al_tavolo: "Avversario semplice per testare incontro e statblock.",
            player_safe: "Una sentinella coperta di sale e alghe.",
            pubblico: false
        }, "```statblock\nmonster: Vedetta Salmastra\n```")],
        ["Mondi/Oggetti/[Demo] Chiave Di Sale.md", note({
            id: "demo-chiave-di-sale",
            nome: "Chiave Di Sale",
            categoria: "oggetto",
            fileClass: "oggetto",
            stato: "pronto",
            mondo: world,
            luogo: place,
            missioni: [mission],
            proprietario: faction,
            uso_al_tavolo: "Apre la grata sotto la dogana solo durante la bassa marea.",
            entita_impattate: [place, faction],
            propaga_a: [event],
            player_safe: "Una chiave ruvida incrostata di sale nero.",
            pubblico: true
        }, "# Chiave Di Sale\n\nRicompensa demo con uso concreto e bersagli di propagazione.")],
        ["Mondi/Timeline/[Demo] Il Faro Vecchio Si Riaccende.md", note({
            id: "demo-faro-vecchio-si-riaccende",
            nome: "Il Faro Vecchio Si Riaccende",
            categoria: "evento storico",
            fileClass: "evento_storico",
            stato: "bozza",
            mondo: world,
            campagne: [campaign],
            luoghi: [place],
            fazioni: [faction],
            missioni: [mission],
            causa: "La campana viene recuperata o nascosta.",
            conseguenze: ["Le rotte del sale cambiano proprietario."],
            entita_impattate: [place, faction],
            propagazione_stato: "aperta",
            player_safe: "Il faro torna visibile nella nebbia.",
            pubblico: true
        }, "# Il Faro Vecchio Si Riaccende\n\nEvento demo da applicare dopo la sessione.")],
        ["Mondi/Dispense/[Demo] Avviso Della Dogana.md", note({
            id: "demo-avviso-dogana",
            nome: "Avviso Della Dogana",
            categoria: "dispensa",
            fileClass: "dispensa",
            stato: "pronto",
            mondo: world,
            campagne: [campaign],
            sessioni: [session],
            player_safe: "Per ordine della dogana, nessuna nave salpa finche la campana sommersa non viene dichiarata recuperata.",
            pubblico: true
        }, "# Avviso Della Dogana\n\nMateriale mostrabile ai giocatori.")],
        ["Demo Regno Di Prova.md", note({
            id: "demo-regno-di-prova-start",
            nome: "Demo Regno Di Prova",
            categoria: "indice",
            stato: "pronto",
            mondo: world,
            campagne: [campaign],
            player_safe: "Indice demo locale."
        }, `
# Demo Regno Di Prova

Apri in ordine:

1. ${world}
2. ${campaign}
3. ${session}
4. [[Hub/Durante il Gioco]]
5. [[Risorse/Post Sessione Guidato]]
`)]
    ];
}

function generateDemoWorld(options = {}) {
    const root = path.resolve(options.root ?? process.cwd(), options.outDir ?? DEFAULT_OUT_DIR);
    if (!fs.existsSync(root)) {
        if (options.create) fs.mkdirSync(root, { recursive: true });
        else throw new Error(`Destinazione demo inesistente: ${root}. Genera prima la release con npm run release:clean o passa --create.`);
    }

    for (const [relPath] of demoWorldEntries()) {
        const target = path.join(root, relPath);
        if (fs.existsSync(target) && !options.force) {
            throw new Error(`Demo gia esistente: ${target}. Usa --force per rigenerarla.`);
        }
    }

    for (const [relPath, text] of demoWorldEntries()) {
        const target = path.join(root, relPath);
        ensureDir(target);
        fs.writeFileSync(target, text, "utf8");
    }

    return {
        root,
        files: demoWorldEntries().map(([relPath]) => relPath)
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
    DEMO_FILES,
    DEMO_WORLD_FILE,
    demoWorldEntries,
    generateDemoWorld
};
