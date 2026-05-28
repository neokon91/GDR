#!/usr/bin/env node

const {
    applyContinuityImpact,
    buildContinuityEvent,
    continuityEntry,
    continuityEventEntry,
    continuityEventUpdateText,
    registerWorldChoice,
    validateContinuityEvent
} = require("../../../z.automazioni/continuity_state");

const errors = [];

function fail(message) {
    errors.push(message);
}

function stable(value) {
    return JSON.stringify(value);
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) fail(`${message}: atteso ${stable(expected)}, ottenuto ${stable(actual)}`);
}

function assertIncludes(value, expected, message) {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    if (!values.some(entry => String(entry).includes(expected))) {
        fail(`${message}: ${stable(value)} non contiene ${stable(expected)}`);
    }
}

function assertNoErrors(value, message) {
    if (value.length) fail(`${message}: ${value.join("; ")}`);
}

function wikilink(path) {
    return `[[${path.replace(/\.md$/, "")}]]`;
}

function validateEventShape() {
    const event = buildContinuityEvent({
        today: "2026-05-28",
        sourceKey: "Mondi/Sessioni/Sessione Faro.md",
        sourceLink: "[[Mondi/Sessioni/Sessione Faro]]",
        choice: "Accendere il faro sommerso",
        consequenceText: "La marea rivela il passaggio",
        targets: [
            "[[Mondi/Tracciati/Marea]]",
            {
                key: "Mondi/Fazioni/Custodi.md",
                link: "[[Mondi/Fazioni/Custodi]]"
            }
        ],
        nextMove: "I Custodi chiudono il molo",
        pressureDelta: "2",
        trackStep: "1",
        visibility: "player_safe"
    });

    assertEqual(event.date, "2026-05-28", "Evento: data normalizzata");
    assertEqual(event.source.key, "Mondi/Sessioni/Sessione Faro.md", "Evento: source key");
    assertEqual(event.source.link, "[[Mondi/Sessioni/Sessione Faro]]", "Evento: source link");
    assertEqual(event.cause, "Accendere il faro sommerso", "Evento: causa");
    assertEqual(event.consequence, "La marea rivela il passaggio", "Evento: conseguenza");
    assertEqual(event.targets[0].key, "Mondi/Tracciati/Marea.md", "Evento: target string normalizzato a path");
    assertEqual(event.targets[1].link, "[[Mondi/Fazioni/Custodi]]", "Evento: target oggetto conserva link");
    assertEqual(event.state, "aperta", "Evento: stato default");
    assertEqual(event.visibility, "player_safe", "Evento: visibility esplicita");
    assertEqual(event.pressure_delta, 2, "Evento: pressione numerica");
    assertEqual(event.track_step, 1, "Evento: avanzamento numerico");
    assertNoErrors(validateContinuityEvent(event), "Evento valido");

    const entry = continuityEventEntry(event);
    assertIncludes(entry, "scelta: Accendere il faro sommerso", "Evento: entry include scelta");
    assertIncludes(entry, "conseguenza: La marea rivela il passaggio", "Evento: entry include conseguenza");
    assertIncludes(entry, "bersagli:", "Evento: entry include bersagli");
    assertIncludes(entry, "prossima mossa: I Custodi chiudono il molo", "Evento: entry include prossima mossa");

    const legacyEntry = continuityEntry({
        today: "2026-05-28",
        choice: "Aprire la porta",
        targets: ["[[Mondi/Luoghi/Cripta]]"]
    });
    if (legacyEntry.includes("conseguenza:")) fail("Legacy continuityEntry non deve inventare una conseguenza");
}

function validateReducer() {
    const sessionPath = "Mondi/Sessioni/Sessione Faro.md";
    const trackPath = "Mondi/Tracciati/Marea Nera.md";
    const factionPath = "Mondi/Fazioni/Custodi.md";
    const records = new Map([
        [sessionPath, { frontmatter: { categoria: "sessione" } }],
        [trackPath, { frontmatter: { categoria: "tracciato", progress_value: 1, progress_max: 3, pressione: 0 } }],
        [factionPath, { frontmatter: { categoria: "fazione", pressione: 1 } }]
    ]);

    const result = registerWorldChoice(records, sessionPath, {
        today: "2026-05-28",
        sourceLink: wikilink(sessionPath),
        choice: "Accendere il faro sommerso",
        consequenceText: "La marea rivela il passaggio",
        targets: [
            { key: trackPath, link: wikilink(trackPath) },
            { key: factionPath, link: wikilink(factionPath) }
        ],
        nextMove: "I Custodi chiudono il molo",
        pressureDelta: 2,
        trackStep: 1
    });

    const session = records.get(sessionPath).frontmatter;
    const track = records.get(trackPath).frontmatter;
    const faction = records.get(factionPath).frontmatter;

    assertEqual(result.event.state, "applicata", "Reducer: evento applicato");
    assertIncludes(result.entry, "bersagli:", "Reducer: entry restituita");
    assertIncludes(session.decisioni_prese, "Accendere il faro sommerso", "Reducer: scelta sulla sorgente");
    assertIncludes(session.conseguenze, "La marea rivela il passaggio", "Reducer: conseguenza sulla sorgente");
    assertIncludes(session.applicata_a, wikilink(trackPath), "Reducer: sorgente applicata al tracciato");
    assertEqual(session.propagazione_stato, "applicata", "Reducer: sorgente marcata applicata");
    assertEqual(track.progress_value, 2, "Reducer: tracciato avanzato");
    assertEqual(track.pressione, 2, "Reducer: pressione tracciato aumentata");
    assertEqual(track.avanzato_il, "2026-05-28", "Reducer: data avanzamento tracciato");
    assertIncludes(track.impatto, "La marea rivela il passaggio", "Reducer: impatto tracciato");
    assertEqual(faction.pressione, 3, "Reducer: pressione fazione aumentata");
    assertIncludes(faction.propagato_da, wikilink(sessionPath), "Reducer: target collegato alla sorgente");
}

function validateLegacyImpactAdapter() {
    const sourcePath = "Mondi/Missioni/Campana Sommersa.md";
    const targetPath = "Mondi/Luoghi/Molo Vecchio.md";
    const records = new Map([
        [targetPath, { frontmatter: { categoria: "luogo" } }]
    ]);

    const applied = applyContinuityImpact(records, targetPath, {
        sourceKey: sourcePath,
        sourceLink: wikilink(sourcePath),
        targetLink: wikilink(targetPath),
        consequenceText: "Il molo diventa sorvegliato",
        nextMove: "Una ronda ferma chi arriva",
        today: "2026-05-28",
        mode: "propagazione"
    });

    const target = records.get(targetPath).frontmatter;
    assertEqual(applied, true, "Compat: applicazione legacy riuscita");
    assertIncludes(target.connessioni, wikilink(sourcePath), "Compat: propagazione usa connessioni");
    assertIncludes(target.aggiornamenti_richiesti, "Una ronda ferma chi arriva", "Compat: update text conserva prossima mossa");
    assertIncludes(continuityEventUpdateText(buildContinuityEvent({
        today: "2026-05-28",
        sourceLink: wikilink(sourcePath),
        consequenceText: "Delta",
        nextMove: "Mossa"
    })), "impatto: Delta", "Compat: update text usa impatto");
}

validateEventShape();
validateReducer();
validateLegacyImpactAdapter();

if (errors.length) {
    console.error("Continuity event model check failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Continuity event model OK: eventi, reducer e compatibilita legacy verificati.");
