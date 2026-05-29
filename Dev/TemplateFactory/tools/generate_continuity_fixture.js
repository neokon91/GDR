#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const FIXTURE_DATE = "2026-05-21";
const DEFAULT_OUT_DIR = "dist/vault-gdr-clean";
const FIXTURE_SCENARIO = {
    name: "Continuita scelta al faro",
    date: FIXTURE_DATE,
    files: {
        mondo: "Mondi/Continuita Fixture.md",
        campagna: "Campagne/Continuita Fixture Campagna.md",
        luogo: "Mondi/Luoghi/Continuita Fixture Faro.md",
        fazione: "Mondi/Fazioni/Continuita Fixture Custodi.md",
        missione: "Mondi/Missioni/Continuita Fixture Campana.md",
        tracciato: "Mondi/Tracciati/Continuita Fixture Marea.md",
        sessione: "Mondi/Sessioni/2026-05-21 - Continuita Fixture Sessione.md",
        incontro: "Mondi/Incontri/Continuita Fixture Scontro Al Faro.md",
        creatura: "Mondi/Creature/Continuita Fixture Vedetta Salmastra.md",
        oggetto: "Mondi/Oggetti/Continuita Fixture Chiave Di Sale.md",
        conseguenza: "Mondi/Storia/Continuita Fixture Conseguenza Faro Acceso.md",
        start: "Continuita Fixture - Start.md"
    },
    choice: "I PG accendono il faro sommerso invece di consegnare la chiave ai Custodi.",
    consequence: "La marea rivela il passaggio sotto il porto e costringe i Custodi ad agire apertamente.",
    nextMove: "I Custodi bloccano il molo prima della prossima alba.",
    requiredCategories: ["mondo", "campagna", "luogo", "fazione", "missione", "tracciato", "sessione", "incontro", "creatura", "oggetto"]
};

function wikilink(file) {
    return `[[${file.replace(/\.md$/, "")}]]`;
}

function quote(value) {
    const text = String(value ?? "");
    return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function scalar(value) {
    if (Array.isArray(value)) return `[${value.map(scalar).join(", ")}]`;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "true" : "false";
    if (value === null || value === undefined) return "";
    return quote(value);
}

function frontmatter(fields) {
    const lines = Object.entries(fields).map(([key, value]) => `${key}: ${scalar(value)}`).join("\n");
    return ["---", lines, "---", ""].join("\n");
}

function note(fields, body = "") {
    const title = fields.nome ?? fields.name ?? fields.id ?? "Fixture";
    return `${frontmatter(fields)}# ${title}\n\n${body.trim()}\n`;
}

function ensureDir(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
}

function writeNote(root, file, fields, body) {
    const target = path.join(root, file);
    ensureDir(target);
    fs.writeFileSync(target, note(fields, body), "utf8");
    return file;
}

function fixtureEntries() {
    const files = FIXTURE_SCENARIO.files;

    const link = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, wikilink(file)]));
    const choice = FIXTURE_SCENARIO.choice;
    const consequence = FIXTURE_SCENARIO.consequence;
    const nextMove = FIXTURE_SCENARIO.nextMove;
    const impacted = [link.luogo, link.fazione, link.missione, link.tracciato];
    const propagatedBy = [link.sessione, link.conseguenza];

    return [
        [files.mondo, {
            id: "continuita-fixture",
            nome: "Continuita Fixture",
            categoria: "mondo",
            fileClass: "mondo",
            stato: "pronto",
            tono: "mistero costiero",
            tema: "scelte pubbliche con costo politico",
            premessa: "Una citta portuale vive sopra rovine sommerse.",
            gancio: "Il faro antico risponde alle scelte dei PG.",
            uso_al_tavolo: "Base di contesto per testare la continuita.",
            player_safe: "Una costa nebbiosa nasconde un faro ancora funzionante.",
            conflitto_centrale: "Chi controlla il faro controlla le maree.",
            luoghi_iconici: [link.luogo],
            fazioni_principali: [link.fazione],
            connessioni: [link.campagna, link.luogo, link.fazione],
            entita_impattate: impacted,
            propaga_a: impacted,
            prossima_mossa: nextMove,
            canonico: true
        }, "Fixture minima generata da script per validare mondo vivo e runtime continuita."],
        [files.campagna, {
            id: "continuita-fixture-campagna",
            nome: "Continuita Fixture Campagna",
            categoria: "campagna",
            tipo: "campagna",
            stato: "preparazione",
            mondo: link.mondo,
            tono: "indagine e pressione di fazione",
            livello_attuale: "3",
            personaggi: [],
            luoghi: [link.luogo],
            fazioni: [link.fazione],
            missioni: [link.missione],
            sessioni: [link.sessione],
            gancio: "La prima scelta pubblica cambia il porto.",
            uso_al_tavolo: "Tiene insieme sessione, missione e clock.",
            player_safe: "La campagna segue il destino del faro sommerso.",
            connessioni: [link.mondo, link.sessione]
        }],
        [files.luogo, {
            id: "continuita-fixture-faro",
            nome: "Continuita Fixture Faro",
            categoria: "luogo",
            fileClass: "luogo",
            tipo: "rovina",
            stato: "pronto",
            mondo: link.mondo,
            pericolo: 4,
            pressione: 2,
            gancio: "Il faro si accende solo con la chiave di sale.",
            uso_al_tavolo: "Scena di scelta: consegnare la chiave o usarla.",
            player_safe: "Un faro spento affiora nella bassa marea.",
            fazioni: [link.fazione],
            missioni: [link.missione],
            tracciati: [link.tracciato],
            connessioni: [link.mondo, link.fazione, link.oggetto],
            propagato_da: propagatedBy,
            propagazione_stato: "da verificare",
            ultima_propagazione: FIXTURE_DATE,
            aggiornamenti_richiesti: [`${FIXTURE_DATE} | ${link.conseguenza} | impatto: ${consequence} | prossima mossa: ${nextMove}`],
            prossima_mossa: nextMove
        }],
        [files.fazione, {
            id: "continuita-fixture-custodi",
            nome: "Continuita Fixture Custodi",
            categoria: "fazione",
            fileClass: "fazione",
            tipo: "ordine rituale",
            stato: "attivo",
            mondo: link.mondo,
            pressione: 5,
            obiettivo: "Tenere segreto il passaggio sotto il porto.",
            agenda: "Controllare accessi e testimonianze.",
            gancio: "Offrono una ricompensa se la chiave resta nascosta.",
            uso_al_tavolo: "Avversario negoziabile con pressione chiara.",
            player_safe: "Un ordine di guardiani controlla i moli.",
            luoghi: [link.luogo],
            missioni: [link.missione],
            tracciati: [link.tracciato],
            connessioni: [link.luogo, link.missione],
            propagato_da: propagatedBy,
            propagazione_stato: "da verificare",
            ultima_propagazione: FIXTURE_DATE,
            aggiornamenti_richiesti: [`${FIXTURE_DATE} | ${link.conseguenza} | impatto: ${consequence} | prossima mossa: ${nextMove}`],
            prossima_mossa: nextMove
        }],
        [files.missione, {
            id: "continuita-fixture-campana",
            nome: "Continuita Fixture Campana",
            categoria: "missione",
            fileClass: "missione",
            tipo: "mistero",
            stato: "in corso",
            mondo: link.mondo,
            pressione: 4,
            gancio: "Recuperare la campana prima che la marea cambi.",
            uso_al_tavolo: "Obiettivo con scelta morale e conseguenza immediata.",
            player_safe: "Trovare una campana perduta sotto il vecchio faro.",
            posta: "Il porto sapra chi comanda davvero le maree.",
            scelta: choice,
            conseguenza_potenziale: consequence,
            prossima_mossa: nextMove,
            luoghi: [link.luogo],
            fazioni: [link.fazione],
            tracciati: [link.tracciato],
            ricompense: [link.oggetto],
            entita_impattate: impacted,
            propaga_a: impacted,
            connessioni: [link.sessione, link.incontro],
            propagato_da: propagatedBy,
            propagazione_stato: "da verificare",
            ultima_propagazione: FIXTURE_DATE
        }],
        [files.tracciato, {
            id: "continuita-fixture-marea",
            nome: "Continuita Fixture Marea",
            categoria: "tracciato",
            fileClass: "tracciato",
            tipo: "clock",
            stato: "attivo",
            mondo: link.mondo,
            pressione: 6,
            progress_value: 2,
            progress_max: 6,
            avanzato_il: FIXTURE_DATE,
            innesco: "Il faro viene acceso pubblicamente.",
            posta: "La rotta sommersa diventa accessibile a tutti.",
            gancio: "Ogni scelta pubblica al porto muove la marea.",
            uso_al_tavolo: "Timer visibile per la pressione fuori scena.",
            player_safe: "La marea sale piu in fretta del previsto.",
            prossima_mossa: nextMove,
            missioni: [link.missione],
            fazioni: [link.fazione],
            luoghi: [link.luogo],
            conseguenze: [link.conseguenza],
            entita_impattate: [link.luogo, link.fazione],
            propaga_a: [link.missione],
            connessioni: [link.sessione],
            propagato_da: propagatedBy,
            propagazione_stato: "da verificare",
            ultima_propagazione: FIXTURE_DATE,
            aggiornamenti_richiesti: [`${FIXTURE_DATE} | ${link.conseguenza} | impatto: avanzare clock di 1 segmento`]
        }],
        [files.sessione, {
            id: "continuita-fixture-sessione",
            nome: "Continuita Fixture Sessione",
            categoria: "sessione",
            fileClass: "sessione",
            tipo: "sessione di campagna",
            data: FIXTURE_DATE,
            stato: "pronto",
            attiva: true,
            mondo: link.mondo,
            campagne: [link.campagna],
            luoghi: [link.luogo],
            fazioni: [link.fazione],
            missioni: [link.missione],
            tracciati: [link.tracciato],
            incontri: [link.incontro],
            creature: [link.creatura],
            oggetti: [link.oggetto],
            obiettivo: "Testare una scelta che cambia lo stato del mondo.",
            apertura: "Il faro affiora nella nebbia.",
            scelta: choice,
            materiale_pronto: [link.incontro, link.creatura, link.oggetto],
            decisioni_prese: [choice],
            conseguenze: [consequence, link.conseguenza],
            output_sessione: [`${FIXTURE_DATE} | scelta: ${choice} | conseguenza: ${consequence} | bersagli: ${impacted.join(", ")} | prossima mossa: ${nextMove}`],
            entita_impattate: impacted,
            applicata_a: impacted,
            propaga_a: impacted,
            propagazione_stato: "applicata",
            ultima_propagazione: FIXTURE_DATE,
            prossima_mossa: nextMove,
            recap_pubblico: ["Il faro si e acceso e la bassa marea ha rivelato una via sommersa."],
            recap_dm: ["I Custodi ora devono muoversi apertamente."]
        }, "## Vista continuita leggibile\n\n- scelta -> conseguenza -> entita_impattate -> propagazione_stato -> tracciato avanzato.\n- Usa `renderContinuityChain`, `renderDnd55MaterialPipeline` e `renderCombatReadiness` nelle dashboard."],
        [files.incontro, {
            id: "continuita-fixture-scontro-al-faro",
            nome: "Continuita Fixture Scontro Al Faro",
            categoria: "incontro",
            fileClass: "incontro",
            tipo: "combattimento",
            stato: "pronto",
            mondo: link.mondo,
            luogo: link.luogo,
            missioni: [link.missione],
            fazioni: [link.fazione],
            creature: [link.creatura],
            encounter_creatures: ["Continuita Fixture Vedetta Salmastra"],
            ricompense: [link.oggetto],
            pericolo: 3,
            gancio: "La vedetta prova a spegnere il faro.",
            uso_al_tavolo: "Combattimento breve con posta narrativa.",
            player_safe: "Una guardia salmastra emerge tra le rovine.",
            prossima_mossa: "Se evitata, la vedetta avvisa i Custodi.",
            sessioni: [link.sessione],
            fonti: [link.sessione, link.luogo, link.missione],
            riferimenti_regola: ["[[SRD/Glossario/Iniziativa]]"]
        }, "```encounter\nplayers: []\ncreatures:\n  - Continuita Fixture Vedetta Salmastra\n```"],
        [files.creatura, {
            id: "continuita-fixture-vedetta-salmastra",
            statblock: true,
            name: "Continuita Fixture Vedetta Salmastra",
            nome: "Continuita Fixture Vedetta Salmastra",
            categoria: "creatura",
            fileClass: "creatura",
            tipo: "umanoide",
            type: "umanoide",
            stato: "pronto",
            mondo: link.mondo,
            size: "media",
            alignment: "neutrale",
            ac: 14,
            hp: 18,
            speed: "9 m.",
            cr: "1/2",
            stats: "[12, 14, 12, 10, 11, 10]",
            habitat: "rovine costiere",
            luoghi: [link.luogo],
            fazioni: [link.fazione],
            missioni: [link.missione],
            sessioni: [link.sessione],
            gancio: "Vuole impedire che la chiave apra il faro.",
            uso_al_tavolo: "Minaccia tattica legata alla fazione.",
            player_safe: "Una sentinella con sale secco sull'armatura.",
            prossima_mossa: "Ritira e chiama rinforzi.",
            connessioni: [link.incontro, link.oggetto],
            tags: ["dnd55/creatura", "dnd55/homebrew", "gdr/bozza"]
        }, "```statblock\nmonster: Continuita Fixture Vedetta Salmastra\n```"],
        [files.oggetto, {
            id: "continuita-fixture-chiave-di-sale",
            nome: "Continuita Fixture Chiave Di Sale",
            categoria: "oggetto",
            fileClass: "oggetto",
            tipo: "chiave",
            stato: "pronto",
            mondo: link.mondo,
            luogo: link.luogo,
            missioni: [link.missione],
            sessioni: [link.sessione],
            gancio: "Apre il faro ma denuncia chi la usa.",
            uso_al_tavolo: "Oggetto-scelta: usarlo, cederlo o spezzarlo.",
            player_safe: "Una chiave ruvida fatta di sale indurito.",
            prossima_mossa: "Se usata, il faro rivela il passaggio.",
            connessioni: [link.luogo, link.fazione, link.incontro],
            entita_impattate: [link.luogo, link.fazione]
        }],
        [files.conseguenza, {
            id: "continuita-fixture-conseguenza-faro-acceso",
            nome: "Continuita Fixture Conseguenza Faro Acceso",
            categoria: "evento storico",
            tipo: "conseguenza",
            stato: "collegata",
            mondo: link.mondo,
            data_mondo: FIXTURE_DATE,
            causa: choice,
            effetti: [consequence],
            gancio: "La conseguenza rende pubblico il conflitto.",
            uso_al_tavolo: "Aggiorna bersagli e prossima apertura.",
            player_safe: "Il faro si accende e mostra una via sommersa.",
            entita_impattate: impacted,
            propaga_a: impacted,
            applicata_a: impacted,
            propagazione_stato: "applicata",
            applicata_il: FIXTURE_DATE,
            ultima_propagazione: FIXTURE_DATE,
            aggiornamenti_richiesti: [`${FIXTURE_DATE} | ${link.sessione} | impatto: ${consequence}`],
            prossima_mossa: nextMove,
            sessioni: [link.sessione],
            connessioni: [link.missione, link.tracciato]
        }],
        [files.start, {
            id: "continuita-fixture-start",
            nome: "Continuita Fixture - Start",
            categoria: "risorsa",
            tipo: "guida",
            stato: "pronto",
            mondo: link.mondo,
            connessioni: [link.sessione, link.conseguenza, link.tracciato],
            player_safe: "Indice locale per smoke visuale della fixture continuita."
        }, `## Percorso Smoke

Apri in ordine:

- ${link.sessione}
- ${link.conseguenza}
- ${link.tracciato}
- ${link.incontro}
- [[Hub/Durante il Gioco]]
- [[Risorse/Post Sessione Guidato]]
- [[Hub/Motore Mondo Vivo]]

## Cosa Verificare

- La sessione mostra scelta, conseguenza, bersagli e materiale pronto.
- La conseguenza e applicata e punta alle entita impattate.
- Il tracciato ha \`progress_value\` avanzato e aggiornamenti richiesti.
- L'incontro di combattimento ha \`encounter_creatures\`.
- Creatura e oggetto non sono isolati dal mondo operativo.
`]
    ];
}

function generateContinuityFixture(options = {}) {
    const root = path.resolve(options.root ?? process.cwd(), options.outDir ?? DEFAULT_OUT_DIR);
    if (!fs.existsSync(root)) {
        if (options.create) {
            fs.mkdirSync(root, { recursive: true });
        } else {
        throw new Error(`Destinazione fixture inesistente: ${root}. Genera prima la release con npm run release:clean o passa --create.`);
        }
    }
    if (fs.existsSync(root)) {
        const hasExistingFixture = fixtureEntries().some(([file]) => fs.existsSync(path.join(root, file)));
        if (hasExistingFixture && !options.force) {
            throw new Error(`Fixture gia esistente in ${root}. Usa --force per rigenerarla.`);
        }
        if (hasExistingFixture) {
            for (const [file] of fixtureEntries()) {
                fs.rmSync(path.join(root, file), { force: true });
            }
        }
    }

    for (const [file, fields, body] of fixtureEntries()) {
        writeNote(root, file, fields, body);
    }

    return {
        root,
        files: fixtureEntries().map(([file]) => file)
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
    const options = parseArgs(process.argv.slice(2));
    if (options.create && options.outDir) fs.mkdirSync(path.resolve(process.cwd(), options.outDir), { recursive: true });
    const result = generateContinuityFixture(options);
    console.log(`Fixture continuita generata in ${result.root}`);
    for (const file of result.files) console.log(`- ${file}`);
}

module.exports = {
    DEFAULT_OUT_DIR,
    FIXTURE_DATE,
    FIXTURE_SCENARIO,
    fixtureEntries,
    generateContinuityFixture
};
