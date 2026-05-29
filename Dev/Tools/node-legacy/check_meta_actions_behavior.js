#!/usr/bin/env node

const metaActions = require("../../../z.automazioni/meta_actions");
const continuity = require("../../../z.automazioni/continuity_state");

const TODAY = "2026-05-28";
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

function assertMissing(value, message) {
    if (Array.isArray(value) ? value.length : value !== undefined && value !== null && String(value).trim()) {
        fail(`${message}: valore inatteso ${stable(value)}`);
    }
}

function file(path) {
    return { path, basename: path.split("/").pop().replace(/\.md$/, ""), stat: { mtime: Date.now() } };
}

function linkFor(path) {
    return `[[${path.replace(/\.md$/, "")}]]`;
}

function pathFromLink(link) {
    const raw = String(link ?? "").trim();
    const match = raw.match(/^\[\[([^\]]+)\]\]$/);
    const target = (match ? match[1] : raw).split("|")[0].split("#")[0].trim();
    return target.endsWith(".md") ? target : `${target}.md`;
}

function parseYamlScalar(value) {
    const text = String(value ?? "").trim();
    if (text === "true") return true;
    if (text === "false") return false;
    if (text === "[]") return [];
    if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
    if ((text.startsWith("\"") && text.endsWith("\"")) || (text.startsWith("'") && text.endsWith("'"))) {
        try {
            return JSON.parse(text);
        } catch {
            return text.slice(1, -1);
        }
    }
    return text;
}

function parseFrontmatter(markdown) {
    const match = String(markdown ?? "").match(/^---\n([\s\S]*?)\n---\n?/);
    if (!match) return {};

    const frontmatter = {};
    let currentKey = "";

    for (const rawLine of match[1].split(/\r?\n/)) {
        const listMatch = rawLine.match(/^\s+-\s*(.*)$/);
        if (listMatch && currentKey) {
            if (!Array.isArray(frontmatter[currentKey])) frontmatter[currentKey] = [];
            frontmatter[currentKey].push(parseYamlScalar(listMatch[1]));
            continue;
        }

        const keyMatch = rawLine.match(/^([^:]+):(?:\s*(.*))?$/);
        if (!keyMatch) continue;

        currentKey = keyMatch[1].trim();
        const rawValue = keyMatch[2] ?? "";
        frontmatter[currentKey] = rawValue === "" ? [] : parseYamlScalar(rawValue);
    }

    return frontmatter;
}

function renderYamlScalar(value) {
    if (value === true) return "true";
    if (value === false) return "false";
    if (value === null || value === undefined) return "\"\"";
    if (typeof value === "number") return String(value);
    if (Array.isArray(value)) {
        if (!value.length) return "[]";
        return `\n${value.map(item => `  - ${renderYamlScalar(item)}`).join("\n")}`;
    }
    const text = String(value);
    if (!text) return "\"\"";
    if (/[:#\[\]{}&,*?|>!%@`"']/.test(text) || /^\s|\s$/.test(text)) {
        return `"${text.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
    }
    return text;
}

function renderYamlObject(data) {
    return Object.entries(data ?? {}).map(([key, value]) => {
        const rendered = renderYamlScalar(value);
        return rendered.startsWith("\n") ? `${key}:${rendered}` : `${key}: ${rendered}`;
    });
}

function slugify(value) {
    return String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

function createHarness(records, activePath, options = {}) {
    const store = new Map(Object.entries(records).map(([path, frontmatter]) => [
        path,
        { file: file(path), frontmatter }
    ]));
    const notices = [];
    const prompts = [...(options.prompts ?? [])];
    const yesNo = [...(options.yesNo ?? [])];
    const chosenConnections = [...(options.connections ?? [])];
    const chosenNotes = [...(options.noteChoices ?? [])];

    function recordForPath(path) {
        return store.get(path);
    }

    function getFileFromLink(link) {
        const direct = pathFromLink(link);
        if (store.has(direct)) return store.get(direct).file;
        const basename = direct.split("/").pop();
        return [...store.values()].find(record => record.file.path.endsWith(`/${basename}`))?.file ?? null;
    }

    const helpers = {
        appendUniqueLink: (value, entry) => continuity.appendUnique(value, entry),
        askYesNo: async () => yesNo.length ? Boolean(yesNo.shift()) : true,
        chooseNoteByPath: async () => chosenNotes.shift() ?? "",
        chooseConnections: async () => chosenConnections,
        ensureFolder: async () => {},
        fileLink: value => linkFor(value.path),
        getActiveSessionContext: () => {
            const session = [...store.values()].find(record => record.frontmatter.categoria === "sessione" && record.frontmatter.attiva === true);
            return session ? { file: session.file, frontmatter: session.frontmatter } : {};
        },
        getFileByPathOrBasename: value => recordForPath(value)?.file ?? [...store.values()].find(record => record.file.basename === value)?.file ?? null,
        getFileFromLink,
        normalizeFieldArray: continuity.normalizeFieldArray,
        path: name => ({
            fazioni: "Mondi/Fazioni",
            luoghi: "Mondi/Luoghi",
            missioni: "Mondi/Missioni",
            oggetti: "Mondi/Oggetti",
            personaggi: "Mondi/Personaggi",
            religioni: "Mondi/Religioni",
            sessioni: "Mondi/Sessioni",
            tracciati: "Mondi/Tracciati"
        }[name] ?? name),
        processFrontmatter: async (targetFile, updater) => {
            const record = recordForPath(targetFile.path);
            if (!record) throw new Error(`File non trovato nel mock: ${targetFile.path}`);
            updater(record.frontmatter);
        },
        promptOptional: async (_tp, _message, defaultValue = "") => prompts.length ? prompts.shift() : defaultValue,
        renderYamlObject,
        slugify
    };

    global.Notice = class Notice {
        constructor(message) {
            notices.push(String(message));
        }
    };
    global.app = {
        metadataCache: {
            getFileCache: targetFile => ({ frontmatter: recordForPath(targetFile.path)?.frontmatter ?? {} })
        },
        vault: {
            create: async (targetPath, content) => {
                const created = file(targetPath);
                store.set(targetPath, {
                    file: created,
                    frontmatter: parseFrontmatter(content),
                    body: String(content ?? "").replace(/^---\n[\s\S]*?\n---\n?/, "")
                });
                return created;
            },
            getAbstractFileByPath: targetPath => recordForPath(targetPath)?.file ?? null,
            getMarkdownFiles: () => [...store.values()].map(record => record.file)
        },
        workspace: {
            getActiveFile: () => recordForPath(activePath)?.file ?? null
        }
    };

    return {
        notices,
        get records() {
            return Object.fromEntries([...store.entries()].map(([path, record]) => [path, record.frontmatter]));
        },
        tp: {
            config: {},
            date: { now: () => TODAY },
            user: {
                continuity_state: continuity,
                helpers
            }
        }
    };
}

async function runAction(records, activePath, action, options = {}) {
    const harness = createHarness(records, activePath, options);
    await metaActions(harness.tp, action);
    return harness;
}

async function validateRegisterWorldChoice() {
    const sessionPath = "Mondi/Sessioni/Sessione Faro.md";
    const luogoPath = "Mondi/Luoghi/Faro Sommerso.md";
    const trackPath = "Mondi/Tracciati/Marea Nera.md";
    const relationPath = "Mondi/Relazioni/Patto Di Sale.md";
    const factionPath = "Mondi/Fazioni/Custodi.md";
    const targetLinks = [linkFor(luogoPath), linkFor(trackPath), linkFor(relationPath)];
    const result = await runAction({
        [sessionPath]: {
            categoria: "sessione",
            attiva: true,
            entita_impattate: targetLinks,
            mondo: linkFor("Mondi/Mondo Test.md")
        },
        [luogoPath]: { categoria: "luogo", pressione: 1 },
        [trackPath]: { categoria: "tracciato", progress_value: 1, progress_max: 4, pressione: 0 },
        [relationPath]: { categoria: "relazione", soggetti: [linkFor(factionPath)] },
        [factionPath]: { categoria: "fazione" }
    }, sessionPath, "registra_scelta_mondo", {
        yesNo: [true],
        prompts: [
            "Accendere il faro sommerso",
            "La marea rivela il passaggio",
            "I Custodi chiudono il molo",
            "2",
            "2"
        ]
    });

    const session = result.records[sessionPath];
    const luogo = result.records[luogoPath];
    const track = result.records[trackPath];
    const relation = result.records[relationPath];
    const faction = result.records[factionPath];

    assertIncludes(session.decisioni_prese, "Accendere il faro sommerso", "registra_scelta_mondo registra scelta sulla sessione");
    assertIncludes(session.conseguenze, "La marea rivela il passaggio", "registra_scelta_mondo registra conseguenza sulla sessione");
    assertIncludes(session.output_sessione, "bersagli:", "registra_scelta_mondo registra output_sessione sintetico");
    assertIncludes(session.applicata_a, linkFor(trackPath), "registra_scelta_mondo aggiorna applicata_a");
    assertEqual(session.propagazione_stato, "applicata", "registra_scelta_mondo marca sessione applicata");
    assertEqual(session.ultima_propagazione, TODAY, "registra_scelta_mondo aggiorna data propagazione sessione");

    assertIncludes(luogo.propagato_da, linkFor(sessionPath), "registra_scelta_mondo aggiorna propagato_da sul luogo");
    assertIncludes(luogo.aggiornamenti_richiesti, "La marea rivela il passaggio", "registra_scelta_mondo scrive aggiornamento richiesto");
    assertEqual(luogo.propagazione_stato, "da verificare", "registra_scelta_mondo marca bersaglio da verificare");
    assertEqual(luogo.pressione, 3, "registra_scelta_mondo applica pressione ai bersagli");

    assertEqual(track.progress_value, 3, "registra_scelta_mondo avanza tracciato bersaglio");
    assertEqual(track.avanzato_il, TODAY, "registra_scelta_mondo marca avanzato_il sul tracciato");
    assertIncludes(track.impatto, "La marea rivela il passaggio", "registra_scelta_mondo registra impatto sul tracciato");

    assertIncludes(relation.relazioni, linkFor(relationPath), "registra_scelta_mondo aggiorna relazione bersaglio");
    assertIncludes(faction.relazioni, linkFor(relationPath), "registra_scelta_mondo propaga relazione ai soggetti");
    assertIncludes(faction.propagato_da, linkFor(sessionPath), "registra_scelta_mondo marca soggetti della relazione");
    assertIncludes(result.notices, "Scelta registrata", "registra_scelta_mondo notifica successo");
}

async function validateApplyConsequence() {
    const sourcePath = "Mondi/Storia/Faro Acceso.md";
    const targetPath = "Mondi/Fazioni/Custodi.md";
    const result = await runAction({
        [sourcePath]: {
            categoria: "evento storico",
            stato: "da smistare",
            entita_impattate: [linkFor(targetPath)],
            nome: "Faro Acceso"
        },
        [targetPath]: { categoria: "fazione", pressione: 1 }
    }, sourcePath, "applica_conseguenza", {
        yesNo: [true],
        prompts: [
            "I Custodi devono esporsi",
            "Mandano una pattuglia al molo",
            "1"
        ]
    });

    const source = result.records[sourcePath];
    const target = result.records[targetPath];

    assertEqual(source.stato, "collegata", "applica_conseguenza promuove nota da smistare a collegata");
    assertEqual(source.applicata_il, TODAY, "applica_conseguenza registra applicata_il");
    assertIncludes(source.applicata_a, linkFor(targetPath), "applica_conseguenza registra applicata_a");
    assertIncludes(source.effetti, "I Custodi devono esporsi", "applica_conseguenza registra effetti");
    assertEqual(source.propagazione_stato, "applicata", "applica_conseguenza marca sorgente applicata");
    assertIncludes(target.conseguenze, linkFor(sourcePath), "applica_conseguenza collega conseguenza sul bersaglio");
    assertIncludes(target.aggiornamenti_richiesti, "Mandano una pattuglia al molo", "applica_conseguenza scrive prossima mossa nel delta");
    assertEqual(target.pressione, 2, "applica_conseguenza applica pressione");
}

async function validatePropagateEntity() {
    const sourcePath = "Mondi/Missioni/Campana Sommersa.md";
    const targetPath = "Mondi/Luoghi/Molo Vecchio.md";
    const result = await runAction({
        [sourcePath]: {
            categoria: "missione",
            propaga_a: [linkFor(targetPath)],
            impatto: "Il molo diventa sorvegliato"
        },
        [targetPath]: { categoria: "luogo" }
    }, sourcePath, "propaga_entita", {
        yesNo: [true],
        prompts: [
            "Il molo diventa sorvegliato",
            "Una ronda ferma chi arriva"
        ]
    });

    const source = result.records[sourcePath];
    const target = result.records[targetPath];

    assertEqual(source.propagato_il, TODAY, "propaga_entita registra propagato_il");
    assertEqual(source.propagazione_stato, "propagata", "propaga_entita marca sorgente propagata");
    assertIncludes(source.aggiornamenti_richiesti, "Il molo diventa sorvegliato", "propaga_entita registra aggiornamento sulla sorgente");
    assertIncludes(target.connessioni, linkFor(sourcePath), "propaga_entita collega la sorgente al bersaglio");
    assertIncludes(target.aggiornamenti_richiesti, "Una ronda ferma chi arriva", "propaga_entita scrive prossima mossa nel delta");
    assertEqual(target.propagazione_stato, "da verificare", "propaga_entita marca bersaglio da verificare");
}

async function validatePublicRecapSafety() {
    const sessionPath = "Mondi/Sessioni/Recap.md";
    const rejected = await runAction({
        [sessionPath]: { categoria: "sessione", attiva: true }
    }, sessionPath, "prepara_recap_pubblico", {
        prompts: ["Il DM tiene segreto il vero mandante"]
    });

    assertMissing(rejected.records[sessionPath].recap_pubblico, "prepara_recap_pubblico non salva recap con segreti");
    assertIncludes(rejected.notices, "Recap pubblico non salvato", "prepara_recap_pubblico notifica rifiuto player-safe");

    const accepted = await runAction({
        [sessionPath]: { categoria: "sessione", attiva: true }
    }, sessionPath, "prepara_recap_pubblico", {
        prompts: ["Il faro si e acceso e il porto ha visto la bassa marea"]
    });

    assertIncludes(accepted.records[sessionPath].recap_pubblico, "Il faro si e acceso", "prepara_recap_pubblico salva recap sicuro");
    assertEqual(accepted.records[sessionPath].recap_pubblico_preparato_il, TODAY, "prepara_recap_pubblico registra data recap");
}

async function validateCloseLiveSession() {
    const sessionPath = "Mondi/Sessioni/Faro Live.md";
    const trackPath = "Mondi/Tracciati/Marea Nera.md";
    const result = await runAction({
        [sessionPath]: {
            categoria: "sessione",
            attiva: true,
            stato: "in corso",
            entita_impattate: [linkFor(trackPath)],
            mondo: linkFor("Mondi/Mondo Test.md")
        },
        [trackPath]: { categoria: "tracciato", progress_value: 1, progress_max: 3, pressione: 1 }
    }, sessionPath, "chiudi_sessione_viva", {
        yesNo: [true],
        prompts: [
            "Il faro si accende e il porto vede la bassa marea",
            "Il vero mandante resta nascosto",
            "Accendere il faro",
            "La marea rivela una via sotto il molo",
            "I Custodi arrivano prima dell'alba",
            "Il porto si sveglia con il molo chiuso",
            "1",
            "1"
        ]
    });

    const session = result.records[sessionPath];
    const track = result.records[trackPath];

    assertEqual(session.stato, "giocata", "chiudi_sessione_viva marca la sessione giocata");
    assertEqual(session.attiva, false, "chiudi_sessione_viva disattiva la sessione");
    assertEqual(session.chiusa_il, TODAY, "chiudi_sessione_viva registra chiusa_il");
    assertIncludes(session.recap_pubblico, "Il faro si accende", "chiudi_sessione_viva salva recap pubblico");
    assertIncludes(session.recap_dm, "Il vero mandante", "chiudi_sessione_viva salva recap DM");
    assertEqual(session.prossima_apertura, "Il porto si sveglia con il molo chiuso", "chiudi_sessione_viva registra prossima apertura");
    assertIncludes(session.decisioni_prese, "Accendere il faro", "chiudi_sessione_viva registra scelta");
    assertIncludes(session.conseguenze, "La marea rivela", "chiudi_sessione_viva registra conseguenza");
    assertIncludes(session.output_sessione, "prossima apertura", "chiudi_sessione_viva sintetizza output sessione");
    assertEqual(session.propagazione_stato, "applicata", "chiudi_sessione_viva applica propagazione alla sessione");
    assertEqual(track.progress_value, 2, "chiudi_sessione_viva avanza tracciato bersaglio");
    assertEqual(track.pressione, 2, "chiudi_sessione_viva applica pressione al bersaglio");
    assertIncludes(track.aggiornamenti_richiesti, "I Custodi arrivano", "chiudi_sessione_viva scrive prossima mossa sul bersaglio");
    assertIncludes(result.notices, "Sessione chiusa", "chiudi_sessione_viva notifica chiusura");
}

async function validateOpenNextLiveSession() {
    const resourcePath = "Risorse/Post Sessione Guidato.md";
    const sourcePath = "Mondi/Sessioni/Faro Live.md";
    const oldActivePath = "Mondi/Sessioni/Vecchia Attiva.md";
    const trackPath = "Mondi/Tracciati/Marea Nera.md";
    const factionPath = "Mondi/Fazioni/Custodi.md";
    const newPath = "Mondi/Sessioni/2026-06-04 - Sessione del Molo Chiuso.md";
    const result = await runAction({
        [resourcePath]: { categoria: "risorsa" },
        [sourcePath]: {
            categoria: "sessione",
            attiva: false,
            stato: "giocata",
            chiusa_il: TODAY,
            tipo: "sessione di campagna",
            mondo: linkFor("Mondi/Mondo Test.md"),
            campagne: [linkFor("Campagne/Sale Nero.md")],
            entita_impattate: [linkFor(trackPath), linkFor(factionPath)],
            recap_pubblico: ["Il faro si accende e il porto vede la bassa marea"],
            recap_dm: ["Il vero mandante resta nascosto"],
            conseguenze: ["La marea rivela una via sotto il molo"],
            output_sessione: ["scelta: Accendere il faro | conseguenza: La marea rivela una via"],
            prossima_apertura: "Il porto si sveglia con il molo chiuso"
        },
        [oldActivePath]: {
            categoria: "sessione",
            attiva: true,
            stato: "preparazione",
            mondo: linkFor("Mondi/Mondo Test.md")
        },
        [trackPath]: {
            categoria: "tracciato",
            aggiornamenti_richiesti: ["La Marea Nera avanza al porto"],
            prossima_mossa: "Il molo viene sigillato"
        },
        [factionPath]: {
            categoria: "fazione",
            aggiornamenti_richiesti: ["I Custodi interrogano i marinai"]
        }
    }, resourcePath, "apri_prossima_sessione_viva", {
        yesNo: [true],
        prompts: [
            "Sessione del Molo Chiuso",
            "2026-06-04",
            "Il porto si sveglia con il molo chiuso",
            "Capire chi controlla il molo"
        ]
    });

    const source = result.records[sourcePath];
    const oldActive = result.records[oldActivePath];
    const next = result.records[newPath];

    if (!next) {
        fail("apri_prossima_sessione_viva crea la nuova nota sessione");
        return;
    }

    assertEqual(next.categoria, "sessione", "apri_prossima_sessione_viva crea una sessione");
    assertEqual(next.stato, "preparazione", "apri_prossima_sessione_viva prepara la nuova sessione");
    assertEqual(next.attiva, true, "apri_prossima_sessione_viva attiva la nuova sessione");
    assertEqual(oldActive.attiva, false, "apri_prossima_sessione_viva disattiva le altre sessioni");
    assertEqual(next.mondo, linkFor("Mondi/Mondo Test.md"), "apri_prossima_sessione_viva eredita il mondo");
    assertIncludes(next.campagne, linkFor("Campagne/Sale Nero.md"), "apri_prossima_sessione_viva eredita campagne");
    assertIncludes(next.tracciati, linkFor(trackPath), "apri_prossima_sessione_viva porta i tracciati impattati");
    assertIncludes(next.fazioni, linkFor(factionPath), "apri_prossima_sessione_viva porta le fazioni impattate");
    assertIncludes(next.recap_pubblico, "Il faro si accende", "apri_prossima_sessione_viva porta il recap pubblico");
    assertIncludes(next.conseguenze, "La marea rivela", "apri_prossima_sessione_viva porta conseguenze");
    assertIncludes(next.pressioni, "La Marea Nera avanza", "apri_prossima_sessione_viva porta aggiornamenti bersaglio");
    assertEqual(next.apertura, "Il porto si sveglia con il molo chiuso", "apri_prossima_sessione_viva imposta apertura");
    assertEqual(next.obiettivo, "Capire chi controlla il molo", "apri_prossima_sessione_viva imposta obiettivo");
    assertIncludes(next.output_sessione, "Preparata da", "apri_prossima_sessione_viva mantiene origine");
    assertIncludes(source.sezioni_collegate, linkFor(newPath), "apri_prossima_sessione_viva collega la sorgente alla nuova sessione");
    assertIncludes(source.output_sessione, "Prossima sessione aperta", "apri_prossima_sessione_viva aggiorna output sorgente");
    assertIncludes(result.notices, "Prossima sessione viva aperta", "apri_prossima_sessione_viva notifica successo");
}

async function main() {
    await validateRegisterWorldChoice();
    await validateApplyConsequence();
    await validatePropagateEntity();
    await validatePublicRecapSafety();
    await validateCloseLiveSession();
    await validateOpenNextLiveSession();
}

main()
    .then(() => {
        if (errors.length) {
            console.error("Meta actions non valide:");
            for (const error of errors) console.error(`- ${error}`);
            process.exit(1);
        }
        console.log("Meta actions OK: continuita, propagazione e recap player-safe verificati con frontmatter mockato.");
    })
    .catch(error => {
        console.error(`Meta actions non valide: ${error.stack ?? error.message}`);
        process.exit(1);
    });
