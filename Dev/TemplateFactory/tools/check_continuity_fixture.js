#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { FIXTURE_SCENARIO, generateDemoFixture } = require("./generate_demo_fixture");
const { registerWorldChoice } = require("../../../z.automazioni/continuity_state");
const { hasAny, hasValue, parseFrontmatter, readTextRel } = require("./node_utils");

const errors = [];

const SCENARIO = {
    name: FIXTURE_SCENARIO.name,
    date: FIXTURE_SCENARIO.date,
    session: FIXTURE_SCENARIO.files.sessione,
    consequence: FIXTURE_SCENARIO.files.conseguenza,
    targets: [
        FIXTURE_SCENARIO.files.luogo,
        FIXTURE_SCENARIO.files.fazione,
        FIXTURE_SCENARIO.files.missione,
        FIXTURE_SCENARIO.files.tracciato
    ],
    track: FIXTURE_SCENARIO.files.tracciato,
    encounter: FIXTURE_SCENARIO.files.incontro,
    creature: FIXTURE_SCENARIO.files.creatura,
    object: FIXTURE_SCENARIO.files.oggetto,
    start: FIXTURE_SCENARIO.files.start,
    choice: FIXTURE_SCENARIO.choice,
    consequenceText: FIXTURE_SCENARIO.consequence,
    nextMove: FIXTURE_SCENARIO.nextMove,
    requiredCategories: FIXTURE_SCENARIO.requiredCategories
};

function fail(message) {
    errors.push(message);
}

function asArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (hasValue(value)) return [value];
    return [];
}

function loadFixture(root) {
    const pages = new Map();
    const stack = [root];

    while (stack.length) {
        const dir = stack.pop();
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
                continue;
            }
            if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

            const rel = path.relative(root, fullPath).replace(/\\/g, "/");
            const text = fs.readFileSync(fullPath, "utf8");
            const frontmatter = parseFrontmatter(text);
            pages.set(rel, { rel, text, frontmatter });
        }
    }

    return pages;
}

function findByCategory(pages, category, type = "") {
    return [...pages.values()].find(page => {
        const fm = page.frontmatter;
        return fm.categoria === category && (!type || fm.tipo === type);
    });
}

function includesLink(value, target) {
    return asArray(value).some(entry => String(entry).includes(target));
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function wikilink(fileRel) {
    return `[[${fileRel.replace(/\.md$/, "")}]]`;
}

function requirePage(pages, key, label = key) {
    const page = pages.get(key);
    if (!page) fail(`Fixture continuita: ${label} mancante (${key})`);
    return page;
}

function clearFields(frontmatter, fields) {
    for (const field of fields) delete frontmatter[field];
}

function validateContinuityBeforeAfter(pages) {
    const records = new Map([...pages.entries()].map(([key, page]) => [
        key,
        { rel: key, frontmatter: clone(page.frontmatter) }
    ]));
    const session = records.get(SCENARIO.session)?.frontmatter;
    const track = records.get(SCENARIO.track)?.frontmatter;

    if (!session || !track) {
        fail("Continuita before/after: sorgente o tracciato mancanti");
        return;
    }

    clearFields(session, [
        "decisioni_prese",
        "conseguenze",
        "output_sessione",
        "applicata_a",
        "propagazione_stato",
        "ultima_propagazione"
    ]);

    for (const key of SCENARIO.targets) {
        const fm = records.get(key)?.frontmatter;
        if (!fm) continue;
        clearFields(fm, [
            "propagato_da",
            "aggiornamenti_richiesti",
            "ultima_propagazione",
            "avanzato_il",
            "impatto"
        ]);
    }
    track.progress_value = 1;

    registerWorldChoice(records, SCENARIO.session, {
        today: SCENARIO.date,
        choice: SCENARIO.choice,
        consequenceText: SCENARIO.consequenceText,
        targets: SCENARIO.targets.map(key => ({ key, link: wikilink(key) })),
        nextMove: SCENARIO.nextMove,
        pressureDelta: 0,
        trackStep: 1,
        sourceLink: wikilink(SCENARIO.session)
    });

    if (!asArray(session.decisioni_prese).includes(SCENARIO.choice)) fail("Continuita before/after: scelta non scritta sulla sessione");
    if (!asArray(session.conseguenze).includes(SCENARIO.consequenceText)) fail("Continuita before/after: conseguenza non scritta sulla sessione");
    if (session.propagazione_stato !== "applicata") fail("Continuita before/after: sessione non marcata applicata");
    if (Number(track.progress_value) !== 2) fail("Continuita before/after: tracciato non avanzato da 1 a 2");
    if (track.avanzato_il !== SCENARIO.date) fail("Continuita before/after: avanzato_il non aggiornato");

    for (const key of SCENARIO.targets) {
        const fm = records.get(key)?.frontmatter;
        if (!fm) {
            fail(`Continuita before/after: bersaglio mancante ${key}`);
            continue;
        }
        if (!hasValue(fm.propagato_da)) fail(`Continuita before/after: ${key} senza propagato_da`);
        if (!hasValue(fm.aggiornamenti_richiesti)) fail(`Continuita before/after: ${key} senza aggiornamenti_richiesti`);
        if (fm.propagazione_stato !== "da verificare") fail(`Continuita before/after: ${key} non da verificare`);
    }
}

function validateScenarioContract(pages) {
    const session = requirePage(pages, SCENARIO.session, "sessione scenario")?.frontmatter;
    const consequence = requirePage(pages, SCENARIO.consequence, "conseguenza scenario")?.frontmatter;
    const track = requirePage(pages, SCENARIO.track, "tracciato scenario")?.frontmatter;
    const encounter = requirePage(pages, SCENARIO.encounter, "incontro scenario")?.frontmatter;
    const creature = requirePage(pages, SCENARIO.creature, "creatura scenario")?.frontmatter;
    const object = requirePage(pages, SCENARIO.object, "oggetto scenario")?.frontmatter;

    if (!session || !consequence || !track || !encounter || !creature || !object) return;

    if (!asArray(session.decisioni_prese).includes(SCENARIO.choice)) fail(`${SCENARIO.session}: scelta scenario non registrata`);
    if (!asArray(session.conseguenze).some(value => String(value).includes(SCENARIO.consequenceText) || String(value).includes("Continuita Demo Conseguenza"))) {
        fail(`${SCENARIO.session}: conseguenza scenario non collegata`);
    }
    if (session.propagazione_stato !== "applicata") fail(`${SCENARIO.session}: propagazione_stato scenario non applicata`);
    if (!SCENARIO.targets.every(target => includesLink(session.entita_impattate, target.replace(/^Mondi\//, "").replace(/\.md$/, "")))) {
        fail(`${SCENARIO.session}: non tutti i bersagli scenario sono in entita_impattate`);
    }

    if (consequence.causa !== SCENARIO.choice) fail(`${SCENARIO.consequence}: causa scenario non coerente`);
    if (!asArray(consequence.effetti).includes(SCENARIO.consequenceText)) fail(`${SCENARIO.consequence}: effetto scenario non coerente`);
    if (consequence.propagazione_stato !== "applicata") fail(`${SCENARIO.consequence}: conseguenza non applicata`);

    if (!(Number(track.progress_value) >= 2)) fail(`${SCENARIO.track}: clock non avanzato nello scenario`);
    if (track.avanzato_il !== SCENARIO.date) fail(`${SCENARIO.track}: data avanzamento scenario non coerente`);
    if (!hasValue(track.aggiornamenti_richiesti)) fail(`${SCENARIO.track}: aggiornamento richiesto del clock mancante`);

    if (encounter.tipo === "combattimento" && !hasValue(encounter.encounter_creatures)) {
        fail(`${SCENARIO.encounter}: incontro scenario senza creature pronte`);
    }
    if (!hasAny(creature, ["missioni", "fazioni", "luoghi", "luogo"])) fail(`${SCENARIO.creature}: creatura scenario isolata`);
    if (!hasAny(object, ["uso_al_tavolo", "gancio", "prossima_mossa", "conseguenza_potenziale"])) fail(`${SCENARIO.object}: oggetto scenario senza uso narrativo`);
}

function validateDndHardening(page, kind) {
    const fm = page.frontmatter;
    if (kind === "incontro") {
        if (fm.tipo === "combattimento" && !hasValue(fm.encounter_creatures)) {
            fail(`${page.rel}: combattimento senza encounter_creatures`);
        }
    }

    if (kind === "creatura") {
        if (!hasAny(fm, ["missioni", "fazioni", "luoghi", "luogo"])) {
            fail(`${page.rel}: creatura senza missione/fazione/luogo`);
        }
    }

    if (kind === "oggetto") {
        if (!hasAny(fm, ["uso_al_tavolo", "gancio", "prossima_mossa", "conseguenza_potenziale"])) {
            fail(`${page.rel}: oggetto senza uso narrativo`);
        }
    }

    if (kind === "sessione") {
        if (hasValue(fm.incontri) && !hasValue(fm.materiale_pronto)) {
            fail(`${page.rel}: sessione con incontro ma senza materiale_pronto`);
        }
    }
}

const tempParent = fs.mkdtempSync(path.join(os.tmpdir(), "gdr-continuity-fixture-"));

try {
    const result = generateDemoFixture({
        root: tempParent,
        outDir: "fixture",
        create: true,
        force: true
    });
    const pages = loadFixture(result.root);
    validateContinuityBeforeAfter(pages);

    validateScenarioContract(pages);

    for (const expected of SCENARIO.requiredCategories) {
        if (![...pages.values()].some(page => page.frontmatter.categoria === expected)) {
            fail(`Fixture continuita: categoria mancante (${expected})`);
        }
    }

    const consequence = findByCategory(pages, "evento storico", "conseguenza");
    if (!consequence) fail("Fixture continuita: conseguenza mancante");

    const session = findByCategory(pages, "sessione");
    const track = findByCategory(pages, "tracciato");
    const encounter = findByCategory(pages, "incontro");
    const creature = findByCategory(pages, "creatura");
    const object = findByCategory(pages, "oggetto");

    for (const [label, page] of Object.entries({ session, track, encounter, creature, object })) {
        if (!page) fail(`Fixture continuita: ${label} mancante`);
    }

    if (session) {
        const fm = session.frontmatter;
        if (!hasValue(fm.decisioni_prese)) fail(`${session.rel}: scelta non registrata`);
        if (!hasValue(fm.conseguenze)) fail(`${session.rel}: conseguenza non registrata`);
        if (!hasValue(fm.entita_impattate)) fail(`${session.rel}: entita_impattate vuoto`);
        if (fm.propagazione_stato !== "applicata") fail(`${session.rel}: propagazione_stato non applicata`);
        if (!includesLink(fm.tracciati, "Continuita Demo Marea")) fail(`${session.rel}: tracciato non collegato`);
        validateDndHardening(session, "sessione");
    }

    if (consequence) {
        const fm = consequence.frontmatter;
        if (!hasValue(fm.causa)) fail(`${consequence.rel}: causa mancante`);
        if (!hasValue(fm.effetti)) fail(`${consequence.rel}: effetti mancanti`);
        if (!hasValue(fm.entita_impattate)) fail(`${consequence.rel}: entita_impattate mancante`);
        if (!hasValue(fm.propaga_a)) fail(`${consequence.rel}: propaga_a mancante`);
        if (fm.propagazione_stato !== "applicata") fail(`${consequence.rel}: propagazione_stato non applicata`);
    }

    if (track) {
        const fm = track.frontmatter;
        if (!(Number(fm.progress_value) > 0)) fail(`${track.rel}: tracciato non avanzato`);
        if (!hasValue(fm.avanzato_il)) fail(`${track.rel}: avanzato_il mancante`);
        if (!hasValue(fm.propagato_da)) fail(`${track.rel}: propagato_da mancante`);
    }

    for (const page of pages.values()) {
        const fm = page.frontmatter;
        if (["luogo", "fazione", "missione", "tracciato"].includes(fm.categoria)) {
            if (!hasValue(fm.propagato_da)) fail(`${page.rel}: bersaglio senza propagato_da`);
            if (!hasValue(fm.aggiornamenti_richiesti) && fm.categoria !== "missione") {
                fail(`${page.rel}: bersaglio senza aggiornamenti_richiesti`);
            }
        }
    }

    if (encounter) validateDndHardening(encounter, "incontro");
    if (creature) validateDndHardening(creature, "creatura");
    if (object) validateDndHardening(object, "oggetto");

    const start = pages.get(SCENARIO.start);
    if (!start) fail("Fixture continuita: indice visuale Continuita Demo - Start.md mancante");
    if (start && !start.text.includes("Hub/Durante il Gioco")) fail(`${start.rel}: link smoke Durante il Gioco mancante`);
    if (start && !start.text.includes("Risorse/Post Sessione Guidato")) fail(`${start.rel}: link smoke Post Sessione mancante`);

    const runtime = [
        "z.engine/session_views.js",
        "z.engine/session_continuity.js",
        "z.engine/session_dnd.js"
    ].map(file => readTextRel(process.cwd(), file)).join("\n");
    for (const marker of ["renderContinuityChain", "renderDnd55MaterialPipeline", "renderCombatReadiness"]) {
        if (!runtime.includes(marker)) fail(`Runtime continuita: vista mancante ${marker}`);
    }

    const liveHub = readTextRel(process.cwd(), "Hub/Durante il Gioco.md");
    const postSession = readTextRel(process.cwd(), "Risorse/Post Sessione Guidato.md");
    if (!liveHub.includes("renderContinuityChain")) fail("Durante il Gioco: catena continuita non leggibile");
    for (const marker of ["renderPostSessionClosureQueues", "renderPostSessionPropagationQueues"]) {
        if (!postSession.includes(marker)) fail(`Post Sessione Guidato: cockpit conseguenze non leggibile (${marker})`);
    }
} finally {
    fs.rmSync(tempParent, { recursive: true, force: true });
}

if (errors.length) {
    console.error("Errori fixture continuita:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Fixture continuita OK: scelta, conseguenza, propagazione, clock avanzato, viste e gate D&D verificati.");
