#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { generateDemoFixture } = require("./generate_demo_fixture");
const { registerWorldChoice } = require("./m11_state");
const { hasAny, hasValue, parseFrontmatter, readTextRel } = require("./node_utils");

const errors = [];

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

function clearFields(frontmatter, fields) {
    for (const field of fields) delete frontmatter[field];
}

function validateM11BeforeAfter(pages) {
    const records = new Map([...pages.entries()].map(([key, page]) => [
        key,
        { rel: key, frontmatter: clone(page.frontmatter) }
    ]));
    const sessionKey = "Mondi/Sessioni/2026-05-21 - M11 Demo Sessione.md";
    const targetKeys = [
        "Mondi/Luoghi/M11 Demo Faro.md",
        "Mondi/Fazioni/M11 Demo Custodi.md",
        "Mondi/Missioni/M11 Demo Campana.md",
        "Mondi/Tracciati/M11 Demo Marea.md"
    ];
    const session = records.get(sessionKey)?.frontmatter;
    const track = records.get("Mondi/Tracciati/M11 Demo Marea.md")?.frontmatter;
    const choice = "I PG accendono il faro sommerso invece di consegnare la chiave ai Custodi.";
    const consequenceText = "La marea rivela il passaggio sotto il porto e costringe i Custodi ad agire apertamente.";
    const nextMove = "I Custodi bloccano il molo prima della prossima alba.";

    if (!session || !track) {
        fail("M11 before/after: sorgente o tracciato mancanti");
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

    for (const key of targetKeys) {
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

    registerWorldChoice(records, sessionKey, {
        today: "2026-05-21",
        choice,
        consequenceText,
        targets: targetKeys.map(key => ({ key, link: wikilink(key) })),
        nextMove,
        pressureDelta: 0,
        trackStep: 1,
        sourceLink: wikilink(sessionKey)
    });

    if (!asArray(session.decisioni_prese).includes(choice)) fail("M11 before/after: scelta non scritta sulla sessione");
    if (!asArray(session.conseguenze).includes(consequenceText)) fail("M11 before/after: conseguenza non scritta sulla sessione");
    if (session.propagazione_stato !== "applicata") fail("M11 before/after: sessione non marcata applicata");
    if (Number(track.progress_value) !== 2) fail("M11 before/after: tracciato non avanzato da 1 a 2");
    if (track.avanzato_il !== "2026-05-21") fail("M11 before/after: avanzato_il non aggiornato");

    for (const key of targetKeys) {
        const fm = records.get(key)?.frontmatter;
        if (!fm) {
            fail(`M11 before/after: bersaglio mancante ${key}`);
            continue;
        }
        if (!hasValue(fm.propagato_da)) fail(`M11 before/after: ${key} senza propagato_da`);
        if (!hasValue(fm.aggiornamenti_richiesti)) fail(`M11 before/after: ${key} senza aggiornamenti_richiesti`);
        if (fm.propagazione_stato !== "da verificare") fail(`M11 before/after: ${key} non da verificare`);
    }
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

const tempParent = fs.mkdtempSync(path.join(os.tmpdir(), "gdr-m11-fixture-"));

try {
    const result = generateDemoFixture({
        root: tempParent,
        outDir: "fixture",
        create: true,
        force: true
    });
    const pages = loadFixture(result.root);
    validateM11BeforeAfter(pages);

    for (const expected of ["mondo", "campagna", "luogo", "fazione", "missione", "tracciato", "sessione", "incontro", "creatura", "oggetto"]) {
        if (![...pages.values()].some(page => page.frontmatter.categoria === expected)) {
            fail(`Fixture M11: categoria mancante (${expected})`);
        }
    }

    const consequence = findByCategory(pages, "evento storico", "conseguenza");
    if (!consequence) fail("Fixture M11: conseguenza mancante");

    const session = findByCategory(pages, "sessione");
    const track = findByCategory(pages, "tracciato");
    const encounter = findByCategory(pages, "incontro");
    const creature = findByCategory(pages, "creatura");
    const object = findByCategory(pages, "oggetto");

    for (const [label, page] of Object.entries({ session, track, encounter, creature, object })) {
        if (!page) fail(`Fixture M11: ${label} mancante`);
    }

    if (session) {
        const fm = session.frontmatter;
        if (!hasValue(fm.decisioni_prese)) fail(`${session.rel}: scelta non registrata`);
        if (!hasValue(fm.conseguenze)) fail(`${session.rel}: conseguenza non registrata`);
        if (!hasValue(fm.entita_impattate)) fail(`${session.rel}: entita_impattate vuoto`);
        if (fm.propagazione_stato !== "applicata") fail(`${session.rel}: propagazione_stato non applicata`);
        if (!includesLink(fm.tracciati, "M11 Demo Marea")) fail(`${session.rel}: tracciato non collegato`);
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

    const start = pages.get("M11 Demo - Start.md");
    if (!start) fail("Fixture M11: indice visuale M11 Demo - Start.md mancante");
    if (start && !start.text.includes("Hub/Durante il Gioco")) fail(`${start.rel}: link smoke Durante il Gioco mancante`);
    if (start && !start.text.includes("Risorse/Post Sessione Guidato")) fail(`${start.rel}: link smoke Post Sessione mancante`);

    const runtime = readTextRel(process.cwd(), "z.engine/session_views.js");
    for (const marker of ["renderM11ContinuityChain", "renderDnd55MaterialPipeline", "renderCombatReadiness"]) {
        if (!runtime.includes(marker)) fail(`Runtime M11: vista mancante ${marker}`);
    }

    const liveHub = readTextRel(process.cwd(), "Hub/Durante il Gioco.md");
    const postSession = readTextRel(process.cwd(), "Risorse/Post Sessione Guidato.md");
    if (!liveHub.includes("renderM11ContinuityChain")) fail("Durante il Gioco: catena M11 non leggibile");
    if (!postSession.includes("renderConsequenceCards")) fail("Post Sessione Guidato: carte conseguenze non leggibili");
} finally {
    fs.rmSync(tempParent, { recursive: true, force: true });
}

if (errors.length) {
    console.error("Errori fixture M11:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Fixture M11 OK: scelta, conseguenza, propagazione, clock avanzato, viste e gate D&D verificati.");
