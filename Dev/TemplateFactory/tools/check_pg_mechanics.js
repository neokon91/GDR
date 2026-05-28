#!/usr/bin/env node

const path = require("path");
const mechanics = require("../../../z.automazioni/pg_mechanics");
const { readJson } = require("./node_utils");

const ROOT = path.resolve(__dirname, "../../..");
const CORE = readJson(path.join(ROOT, "z.automazioni/data/srd/core.json"));
const OPTIONS = readJson(path.join(ROOT, "z.automazioni/data/srd/opzioni_personaggio.json"));
const errors = [];

function fail(message) {
    errors.push(message);
}

function stable(value) {
    return JSON.stringify(value);
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        fail(`${message}: atteso ${stable(expected)}, ottenuto ${stable(actual)}`);
    }
}

function assertDeepEqual(actual, expected, message) {
    if (stable(actual) !== stable(expected)) {
        fail(`${message}: atteso ${stable(expected)}, ottenuto ${stable(actual)}`);
    }
}

function assertHas(value, message) {
    if (!value) fail(message);
}

function selectQueued(kind, queue, options, title) {
    if (!queue.length) {
        throw new Error(`Nessuna scelta ${kind} disponibile per: ${title}`);
    }

    const wanted = queue.shift();
    if (wanted === null || wanted === undefined || wanted === "") return null;

    const selected = options.find(option => String(option.id) === String(wanted));
    if (!selected) {
        const available = options.map(option => option.id).join(", ");
        throw new Error(`Scelta ${kind} non valida per ${title}: ${wanted}. Disponibili: ${available}`);
    }

    return selected;
}

function queuedHelpers(choices = {}) {
    const required = [...(choices.required ?? [])];
    const optional = [...(choices.optional ?? [])];
    const yesNo = [...(choices.yesNo ?? [])];

    return {
        askYesNo: async () => yesNo.length ? Boolean(yesNo.shift()) : true,
        chooseOptional: async (tp, options, title) => selectQueued("opzionale", optional, options, title),
        chooseRequired: async (tp, options, title) => selectQueued("obbligatoria", required, options, title),
        promptOptional: async () => ""
    };
}

function pointBuyCost(stats, costs) {
    return Object.values(stats).reduce((total, value) => total + Number(costs[value] ?? costs[String(value)] ?? 0), 0);
}

function validateGeneratedDataShape() {
    assertHas(CORE, "Dati core SRD mancanti: esegui npm run sync:sources");
    assertHas(OPTIONS, "Dati opzioni PG SRD mancanti: esegui npm run sync:sources");
    if (!CORE || !OPTIONS) return;

    assertDeepEqual(
        CORE.statistiche,
        ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"],
        "Ordine statistiche SRD"
    );
    assertHas(CORE.generazione_caratteristiche?.metodi?.point_buy, "Configurazione point-buy mancante");
    assertHas(OPTIONS.classi?.guerriero, "Classe guerriero mancante nelle opzioni PG");
    assertHas(OPTIONS.classi?.bardo, "Classe bardo mancante nelle opzioni PG");
    assertHas(OPTIONS.background?.criminale, "Background criminale mancante nelle opzioni PG");
    assertHas(OPTIONS.background?.soldato, "Background soldato mancante nelle opzioni PG");
    assertHas(OPTIONS.specie?.elfo, "Specie elfo mancante nelle opzioni PG");
    assertHas(OPTIONS.talenti?.allerta, "Talento origine Allerta mancante nelle opzioni PG");
}

function validateNumericRules() {
    const proficiencyCases = [
        [1, 2],
        [4, 2],
        [5, 3],
        [8, 3],
        [9, 4],
        [12, 4],
        [13, 5],
        [16, 5],
        [17, 6],
        [20, 6],
        [0, 2],
        ["non-numero", 2]
    ];

    for (const [level, expected] of proficiencyCases) {
        assertEqual(mechanics.proficiencyBonus(level), expected, `Bonus competenza livello ${level}`);
    }

    assertEqual(mechanics.normalizzaNumero("15"), 15, "normalizzaNumero conserva numeri stringa");
    assertEqual(mechanics.normalizzaNumero("x", 12), 12, "normalizzaNumero usa fallback");
    assertEqual(mechanics.modificatoreCaratteristica(8), -1, "Modificatore caratteristica 8");
    assertEqual(mechanics.modificatoreCaratteristica(10), 0, "Modificatore caratteristica 10");
    assertEqual(mechanics.modificatoreCaratteristica(15), 2, "Modificatore caratteristica 15");
    assertEqual(mechanics.modificatoreCaratteristica(20), 5, "Modificatore caratteristica 20");
}

async function validatePointBuyAndBackground() {
    const pointBuy = CORE.generazione_caratteristiche.metodi.point_buy;
    const baseStats = await mechanics.acquistoPunti(
        null,
        pointBuy,
        CORE.statistiche,
        queuedHelpers({ required: [15, 14, 13, 12, 10, 8] })
    );
    const expectedBase = {
        forza: 15,
        destrezza: 14,
        costituzione: 13,
        intelligenza: 12,
        saggezza: 10,
        carisma: 8
    };

    assertDeepEqual(baseStats, expectedBase, "Point-buy assegna caratteristiche nella sequenza scelta");
    assertEqual(pointBuyCost(baseStats, pointBuy.costi), 27, "Point-buy consuma il budget SRD atteso");

    const boostedStats = await mechanics.applicaAumentiBackground(
        null,
        baseStats,
        "criminale",
        OPTIONS.background,
        queuedHelpers({ required: ["+2/+1", "destrezza", "costituzione"] })
    );

    assertDeepEqual(
        boostedStats,
        {
            forza: 15,
            destrezza: 16,
            costituzione: 14,
            intelligenza: 12,
            saggezza: 10,
            carisma: 8
        },
        "Background criminale applica schema +2/+1 sulle opzioni consentite"
    );
    assertDeepEqual(baseStats, expectedBase, "Aumento background non muta le statistiche base");

    return boostedStats;
}

async function validateClassSkillsAndYaml(boostedStats) {
    const classSkills = await mechanics.scegliCompetenzeClasse(
        null,
        "guerriero",
        OPTIONS.classi,
        CORE.abilita,
        queuedHelpers({ optional: ["atletica", "percezione"] })
    );
    assertDeepEqual(classSkills, ["atletica", "percezione"], "Competenze guerriero scelte senza duplicati");

    const bardSkills = await mechanics.scegliCompetenzeClasse(
        null,
        "bardo",
        OPTIONS.classi,
        CORE.abilita,
        queuedHelpers({ optional: ["arcano", "storia", "persuasione"] })
    );
    assertDeepEqual(bardSkills, ["arcano", "storia", "persuasione"], "Competenze bardo supportano opzioni qualsiasi");

    const competenzeFinali = Array.from(new Set([
        ...classSkills,
        ...(OPTIONS.background.soldato.competenze_abilita ?? [])
    ]));
    const characteristicsYaml = mechanics.buildCaratteristicheYaml(
        boostedStats,
        OPTIONS.classi.guerriero.save_prof
    );
    const skillsYaml = mechanics.buildAbilitaYaml(CORE.abilita, competenzeFinali);

    assertEqual(characteristicsYaml.forza.stat, 15, "YAML caratteristiche conserva valore forza");
    assertEqual(characteristicsYaml.forza.save_prof, 1, "YAML caratteristiche marca tiro salvezza forza");
    assertEqual(characteristicsYaml.costituzione.save_prof, 1, "YAML caratteristiche marca tiro salvezza costituzione");
    assertEqual(characteristicsYaml.destrezza.save_prof, 0, "YAML caratteristiche non marca tiro salvezza destrezza per guerriero");
    assertEqual(skillsYaml.atletica.prof, 1, "YAML abilita marca competenza atletica");
    assertEqual(skillsYaml.percezione.prof, 1, "YAML abilita marca competenza percezione");
    assertEqual(skillsYaml.intimidire.prof, 1, "YAML abilita include competenza da background");
    assertEqual(skillsYaml.arcano.prof, 0, "YAML abilita lascia non competente arcano");
}

async function validateHpTalentsAndSpecies(boostedStats) {
    assertEqual(
        mechanics.calcolaPuntiFerita("guerriero", boostedStats, OPTIONS.classi),
        12,
        "PF livello 1 guerriero usa dado vita e modificatore costituzione"
    );
    assertEqual(
        mechanics.calcolaPuntiFerita("mago", { costituzione: 1 }, OPTIONS.classi),
        1,
        "PF minimi non scendono sotto 1"
    );
    assertEqual(
        mechanics.calcolaPuntiFerita("classe_ignota", { costituzione: 10 }, OPTIONS.classi),
        8,
        "PF classe ignota usa dado vita fallback"
    );

    const backgroundTalent = await mechanics.scegliTalentoOrigine(
        null,
        OPTIONS.background.criminale,
        OPTIONS.talenti,
        queuedHelpers({ yesNo: [true] })
    );
    assertDeepEqual(backgroundTalent, ["Allerta"], "Talento origine automatico da background");

    const manualTalent = await mechanics.scegliTalentoOrigine(
        null,
        {},
        OPTIONS.talenti,
        queuedHelpers({ optional: ["abile"] })
    );
    assertDeepEqual(manualTalent, ["Abile"], "Talento origine manuale usa solo talenti categoria origini");

    const speciesTraits = await mechanics.gestisciTrattiSpecie(
        null,
        "elfo",
        OPTIONS.specie,
        queuedHelpers({ optional: ["alto_elfo"] })
    );
    assertDeepEqual(
        speciesTraits,
        {
            tratti: ["lignaggio_elfico", "scurovisione"],
            scelte_tratti: { lignaggio_elfico: "alto_elfo" }
        },
        "Tratti specie conservano tratti fissi e scelta di lignaggio"
    );
}

async function main() {
    validateGeneratedDataShape();
    if (errors.length) return;

    validateNumericRules();
    const boostedStats = await validatePointBuyAndBackground();
    await validateClassSkillsAndYaml(boostedStats);
    await validateHpTalentsAndSpecies(boostedStats);
}

main()
    .then(() => {
        if (errors.length) {
            console.error("PG mechanics non valido:");
            for (const error of errors) console.error(`- ${error}`);
            process.exit(1);
        }

        console.log("PG mechanics OK: point-buy, background, PF, competenze, YAML, talenti e tratti specie verificati.");
    })
    .catch(error => {
        console.error(`PG mechanics non valido: ${error.message}`);
        process.exit(1);
    });
