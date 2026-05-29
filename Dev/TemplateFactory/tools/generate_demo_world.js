#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DEFAULT_OUT_DIR = "dist/vault-gdr-clean";
const DEMO_WORLD_FILE = "Mondi/[Demo] Regno di Prova.md";
const DEMO_FILES = [
    DEMO_WORLD_FILE,
    "Campagne/[Demo] Sale Sotto La Nebbia.md",
    "Mondi/Luoghi/[Demo] Costa Delle Lanterne.md",
    "Mondi/Luoghi/[Demo] Porto Di Prova.md",
    "Mondi/Luoghi/[Demo] Faro Vecchio.md",
    "Mondi/Luoghi/[Demo] Saline Bianche.md",
    "Mondi/Culture/[Demo] Gente Della Soglia Salata.md",
    "Mondi/Fazioni/[Demo] Consorzio Del Sale Nero.md",
    "Mondi/Fazioni/[Demo] Dogana Delle Lanterne.md",
    "Mondi/Fazioni/[Demo] Custodi Delle Saline.md",
    "Mondi/Conflitti/[Demo] Blocco Delle Rotte Del Sale.md",
    "Mondi/Segreti/[Demo] Patto Della Campana Sommersa.md",
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
    const region = "[[Mondi/Luoghi/[Demo] Costa Delle Lanterne|Costa Delle Lanterne]]";
    const place = "[[Mondi/Luoghi/[Demo] Porto Di Prova|Porto Di Prova]]";
    const lighthouse = "[[Mondi/Luoghi/[Demo] Faro Vecchio|Faro Vecchio]]";
    const saltFlats = "[[Mondi/Luoghi/[Demo] Saline Bianche|Saline Bianche]]";
    const faction = "[[Mondi/Fazioni/[Demo] Consorzio Del Sale Nero|Consorzio Del Sale Nero]]";
    const customs = "[[Mondi/Fazioni/[Demo] Dogana Delle Lanterne|Dogana Delle Lanterne]]";
    const custodians = "[[Mondi/Fazioni/[Demo] Custodi Delle Saline|Custodi Delle Saline]]";
    const culture = "[[Mondi/Culture/[Demo] Gente Della Soglia Salata|Gente Della Soglia Salata]]";
    const conflict = "[[Mondi/Conflitti/[Demo] Blocco Delle Rotte Del Sale|Blocco Delle Rotte Del Sale]]";
    const secret = "[[Mondi/Segreti/[Demo] Patto Della Campana Sommersa|Patto Della Campana Sommersa]]";
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
            luoghi_iconici: [region, place, lighthouse, saltFlats],
            fazioni_principali: [faction, customs, custodians],
            culture: [culture],
            conflitti: [conflict],
            segreti: [secret],
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
- una regione giocabile con tre luoghi, tre poteri, cultura locale, conflitto e segreto;
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
            regione: region,
            luogo_iniziale: place,
            luoghi: [region, place, lighthouse, saltFlats],
            fazioni: [faction, customs, custodians],
            culture: [culture],
            conflitti: [conflict],
            segreti: [secret],
            missioni: [mission],
            sessioni: [session],
            tracciati: [clock],
            profilo: "demo primo utilizzo",
            player_safe: "Il party arriva a Porto di Prova mentre il porto discute il ritorno della campana sommersa.",
            pubblico: true
        }, "# Sale Sotto La Nebbia\n\nCampagna dimostrativa breve: una pressione economica, una fazione e una prima sessione pronta.")],
        ["Mondi/Luoghi/[Demo] Costa Delle Lanterne.md", note({
            id: "demo-costa-delle-lanterne",
            nome: "Costa Delle Lanterne",
            categoria: "luogo",
            tipo: "regione",
            subtype: "regione",
            fileClass: "luogo",
            stato: "pronto",
            mondo: world,
            campagne: [campaign],
            regione_starter: true,
            luoghi: [place, lighthouse, saltFlats],
            fazioni: [faction, customs, custodians],
            culture: [culture],
            conflitti: [conflict],
            missioni: [mission],
            tracciati: [clock],
            segreti: [secret],
            pericolo: 3,
            tensione: "Il blocco delle rotte del sale rende ogni approdo politico.",
            origine: "Tre fari costieri furono costruiti dopo un patto antico con la marea.",
            dipendenze: ["sale nero", "lanterne rituali", "bassa marea"],
            simboli_visibili: ["sigilli neri sulle casse", "lanterne spente al mattino", "corde salate sui moli"],
            bisogno_quotidiano: "Tenere aperte rotte, saline e dogana senza far collassare il porto.",
            costo_sociale: "Chi infrange il patto perde accesso a lavoro, passaggio e protezione.",
            evoluzione_se_ignorata: "La Dogana chiude le banchine e il Consorzio prende il controllo delle scorte.",
            prossima_mossa: "La marea espone il passaggio sotto il Faro Vecchio per una sola notte.",
            uso_al_tavolo: "Regione starter per prima sessione, mini-campagna e Vista Giocatori.",
            player_safe: "Una costa di fari spenti, saline bianche e porti bloccati dove la nebbia porta rintocchi dal mare.",
            pubblico: true
        }, `
# Costa Delle Lanterne

Regione demo completa: usala per provare [[Risorse/Regione Giocabile]] senza scrivere lore a mano.

## Pronta Per Il Tavolo

- luogo sicuro: ${place};
- luogo instabile: ${saltFlats};
- luogo proibito: ${lighthouse};
- poteri in attrito: ${faction}, ${customs}, ${custodians};
- pressione: ${conflict};
- segreto DM: ${secret};
- uscita immediata: ${mission}.
`)],
        ["Mondi/Luoghi/[Demo] Porto Di Prova.md", note({
            id: "demo-porto-di-prova",
            nome: "Porto Di Prova",
            categoria: "luogo",
            tipo: "porto",
            fileClass: "luogo",
            stato: "pronto",
            mondo: world,
            campagne: [campaign],
            regione: region,
            luogo_padre: region,
            regione_starter: true,
            fazioni: [faction, customs],
            conflitti: [conflict],
            missioni: [mission],
            segreti: [secret],
            pericolo: 2,
            tensione: "La dogana blocca merci e persone finche la campana non viene recuperata.",
            gancio: "Ogni nave sente un rintocco sotto la chiglia durante la nebbia.",
            prossima_mossa: "La Dogana chiude un altro molo se nessuno porta notizie dal faro.",
            player_safe: "Porto umido e affollato, pieno di mercanti nervosi e corde salate.",
            pubblico: true
        }, "# Porto Di Prova\n\nLuogo demo con pressione economica e aggancio alla prima missione.")],
        ["Mondi/Luoghi/[Demo] Faro Vecchio.md", note({
            id: "demo-faro-vecchio",
            nome: "Faro Vecchio",
            categoria: "luogo",
            tipo: "rovina",
            fileClass: "luogo",
            stato: "pronto",
            mondo: world,
            campagne: [campaign],
            regione: region,
            luogo_padre: region,
            regione_starter: true,
            fazioni: [custodians],
            conflitti: [conflict],
            missioni: [mission],
            segreti: [secret],
            pericolo: 4,
            tensione: "La luce torna solo quando qualcuno mente sul patto della campana.",
            gancio: "Sotto la lanterna esiste un passaggio che la marea apre per pochi minuti.",
            prossima_mossa: "Una lanterna si accende e indica una porta sotto le alghe.",
            player_safe: "Un faro inclinato, spento da anni, che rintocca quando arriva la nebbia.",
            pubblico: true
        }, "# Faro Vecchio\n\nLuogo proibito della regione starter: contiene segreto, pericolo e uscita verso la missione.")],
        ["Mondi/Luoghi/[Demo] Saline Bianche.md", note({
            id: "demo-saline-bianche",
            nome: "Saline Bianche",
            categoria: "luogo",
            tipo: "saline",
            fileClass: "luogo",
            stato: "pronto",
            mondo: world,
            campagne: [campaign],
            regione: region,
            luogo_padre: region,
            regione_starter: true,
            fazioni: [faction, custodians],
            culture: [culture],
            conflitti: [conflict],
            missioni: [mission],
            pericolo: 1,
            tensione: "Il lavoro si ferma quando il sale diventa nero prima dell'alba.",
            gancio: "I custodi conoscono una filastrocca che indica il vecchio accesso della campana.",
            prossima_mossa: "I Custodi nascondono i figli e chiedono al party di non fidarsi dei sigilli neri.",
            player_safe: "Vasche bianche, mulini bassi e lavoratori che coprono le lanterne anche di giorno.",
            pubblico: true
        }, "# Saline Bianche\n\nLuogo instabile della regione starter: mostra vita quotidiana, cultura e costo sociale.")],
        ["Mondi/Culture/[Demo] Gente Della Soglia Salata.md", note({
            id: "demo-gente-della-soglia-salata",
            nome: "Gente Della Soglia Salata",
            categoria: "cultura",
            fileClass: "cultura",
            stato: "pronto",
            mondo: world,
            regione: region,
            regione_starter: true,
            luoghi: [place, saltFlats],
            fazioni: [custodians],
            lingue: ["parlata delle lanterne"],
            tensioni: ["La dogana chiama superstizione cio che i custodi chiamano memoria."],
            simboli_visibili: ["corde annodate", "sale sulle soglie", "lanterne coperte"],
            costo_sociale: "Chi vende il sale nero senza rito perde protezione e fiducia.",
            player_safe: "Abitanti delle saline che leggono la marea come un calendario morale.",
            pubblico: true
        }, "# Gente Della Soglia Salata\n\nCultura demo: una pratica locale cambia scene sociali, indizi e costo delle scelte.")],
        ["Mondi/Fazioni/[Demo] Consorzio Del Sale Nero.md", note({
            id: "demo-consorzio-del-sale-nero",
            nome: "Consorzio Del Sale Nero",
            categoria: "fazione",
            tipo: "gilda",
            fileClass: "fazione",
            stato: "pronto",
            mondo: world,
            campagne: [campaign],
            regione: region,
            regione_starter: true,
            luoghi: [place, saltFlats],
            conflitti: [conflict],
            missioni: [mission],
            obiettivo: "Controllare il recupero della campana e riaprire le rotte alle proprie condizioni.",
            pressione: 3,
            prossima_mossa: "Assumere il party prima che lo faccia la dogana.",
            dipendenze: ["rotte del sale", "sigilli commerciali", "credito dei mercanti"],
            simboli_visibili: ["casse con sale nero", "guanti cerati", "contratti legati con corda scura"],
            costo_sociale: "Chi accetta il loro aiuto diventa debitore davanti al porto.",
            player_safe: "Mercanti influenti con sigilli neri sulle casse di sale.",
            pubblico: true
        }, "# Consorzio Del Sale Nero\n\nFazione demo: abbastanza chiara da muovere la sessione, non abbastanza forte da chiudere tutte le scelte.")],
        ["Mondi/Fazioni/[Demo] Dogana Delle Lanterne.md", note({
            id: "demo-dogana-delle-lanterne",
            nome: "Dogana Delle Lanterne",
            categoria: "fazione",
            tipo: "autorita",
            fileClass: "fazione",
            stato: "pronto",
            mondo: world,
            campagne: [campaign],
            regione: region,
            regione_starter: true,
            luoghi: [place, lighthouse],
            conflitti: [conflict],
            missioni: [mission],
            obiettivo: "Mantenere il blocco finche la campana non viene registrata come bene della corona.",
            obiettivo_nascosto: "Nascondere che un ispettore ha gia venduto il vecchio patto.",
            pressione: 4,
            prossima_mossa: "Confiscare le barche piccole e accusare i Custodi di sabotaggio.",
            player_safe: "Funzionari con lanterne blu che controllano moli, sigilli e passaggi.",
            pubblico: true
        }, "# Dogana Delle Lanterne\n\nAutorita demo: pressione legittima, conflitto sociale e reazione fuori scena.")],
        ["Mondi/Fazioni/[Demo] Custodi Delle Saline.md", note({
            id: "demo-custodi-delle-saline",
            nome: "Custodi Delle Saline",
            categoria: "fazione",
            tipo: "confraternita",
            fileClass: "fazione",
            stato: "pronto",
            mondo: world,
            campagne: [campaign],
            regione: region,
            regione_starter: true,
            luoghi: [saltFlats, lighthouse],
            culture: [culture],
            conflitti: [conflict],
            segreti: [secret],
            obiettivo: "Proteggere il patto della campana anche se il porto li accusa di sabotaggio.",
            pressione: 2,
            prossima_mossa: "Offrire al party un indizio in cambio di silenzio sulla porta sotto il faro.",
            player_safe: "Lavoratori delle saline che parlano poco e coprono le lanterne con stoffa bianca.",
            pubblico: true
        }, "# Custodi Delle Saline\n\nFazione demo: memoria locale, bisogno quotidiano e segreto DM.")],
        ["Mondi/Conflitti/[Demo] Blocco Delle Rotte Del Sale.md", note({
            id: "demo-blocco-delle-rotte-del-sale",
            nome: "Blocco Delle Rotte Del Sale",
            categoria: "conflitto",
            fileClass: "conflitto",
            stato: "attivo",
            mondo: world,
            campagne: [campaign],
            regione: region,
            regione_starter: true,
            luoghi: [place, lighthouse, saltFlats],
            fazioni: [faction, customs, custodians],
            culture: [culture],
            missioni: [mission],
            tracciati: [clock],
            segreti: [secret],
            pressione: 4,
            posta: "Chi controlla la campana decide quali navi possono lasciare la costa.",
            prossima_mossa: "La Dogana sigilla i magazzini e il Consorzio offre una via illegale.",
            conseguenza: "Una scelta dei PG cambia prezzi, accessi e alleanze nella regione.",
            player_safe: "Le rotte del sale sono ferme e ogni fazione accusa le altre.",
            pubblico: true
        }, "# Blocco Delle Rotte Del Sale\n\nConflitto demo: converte geografia, fazioni e cultura in pressione da tavolo.")],
        ["Mondi/Segreti/[Demo] Patto Della Campana Sommersa.md", note({
            id: "demo-patto-della-campana-sommersa",
            nome: "Patto Della Campana Sommersa",
            categoria: "segreto",
            fileClass: "segreto",
            stato: "bozza",
            stato_canonico: "segreto",
            canonico: false,
            mondo: world,
            campagne: [campaign],
            regione: region,
            regione_starter: true,
            luoghi: [lighthouse, saltFlats],
            fazioni: [customs, custodians],
            missioni: [mission],
            verita: "La campana fu affondata per impedire alla marea di reclamare il porto.",
            indizi: ["il sale nero compare solo vicino alle corde rituali", "i Custodi non entrano mai nel faro a mani vuote", "la Dogana ha registri con una pagina strappata"],
            player_safe: "Rumor: la campana canta solo quando qualcuno mente sul faro.",
            pubblico: false
        }, "# Patto Della Campana Sommersa\n\nSegreto demo: tre indizi rivelabili, verita DM e separazione player-safe.")],
        ["Mondi/Missioni/[Demo] Recuperare La Campana Sommersa.md", note({
            id: "demo-recuperare-la-campana-sommersa",
            nome: "Recuperare La Campana Sommersa",
            categoria: "missione",
            fileClass: "missione",
            stato: "pronto",
            mondo: world,
            campagne: [campaign],
            regione: region,
            regione_starter: true,
            luogo: lighthouse,
            luoghi: [place, lighthouse],
            fazioni: [faction, customs, custodians],
            conflitti: [conflict],
            sessioni: [session],
            tracciati: [clock],
            incontri: [encounter],
            ricompense: [item],
            segreti: [secret],
            obiettivo: "Recuperare la campana prima che la marea chiuda il passaggio.",
            scelta: "Consegnarla alla dogana, al Consorzio o tenerla nascosta.",
            conseguenza: "La scelta decide chi controlla le rotte del sale.",
            entita_impattate: [region, place, lighthouse, faction, customs, custodians, clock],
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
            regione: region,
            regione_starter: true,
            luoghi: [place, lighthouse],
            fazioni: [faction, customs, custodians],
            conflitti: [conflict],
            missioni: [mission],
            tracciati: [clock],
            incontri: [encounter],
            dispense: [handout],
            obiettivo: "Portare il party dalla richiesta del Consorzio alla scelta sulla campana.",
            apertura: "La nebbia spegne le lanterne e una campana suona sotto il molo.",
            pressione: 2,
            segreti: [secret],
            segreti_rivelabili: ["La campana non e perduta: e stata nascosta per fermare le rotte.", "La Dogana ha gia venduto una copia del registro.", "I Custodi proteggono il patto, non la campana."],
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
            regione: region,
            regione_starter: true,
            luoghi: [place, lighthouse],
            fazioni: [customs, faction],
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
            regione: region,
            regione_starter: true,
            luogo: place,
            luoghi: [place],
            fazioni: [customs, faction],
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
            regione: region,
            regione_starter: true,
            habitat: [place, lighthouse],
            missioni: [mission],
            fazioni: [customs, faction],
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
            regione: region,
            regione_starter: true,
            luogo: lighthouse,
            missioni: [mission],
            proprietario: faction,
            uso_al_tavolo: "Apre la grata sotto la dogana solo durante la bassa marea.",
            entita_impattate: [region, place, lighthouse, faction, customs],
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
            regione: region,
            regione_starter: true,
            luoghi: [place, lighthouse, saltFlats],
            fazioni: [faction, customs, custodians],
            conflitti: [conflict],
            missioni: [mission],
            causa: "La campana viene recuperata o nascosta.",
            conseguenze: ["Le rotte del sale cambiano proprietario."],
            entita_impattate: [region, place, faction, customs, custodians],
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
            regione: region,
            regione_starter: true,
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
            regione: region,
            player_safe: "Indice demo locale."
        }, `
# Demo Regno Di Prova

Apri in ordine:

1. ${world}
2. ${region}
3. [[Risorse/Regione Giocabile]]
4. ${campaign}
5. ${session}
6. [[Hub/Durante il Gioco]]
7. [[Risorse/Post Sessione Guidato]]
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
