const fs = require("fs");
const path = require("path");

const SRD_DIR = "z.automazioni/data/srd";
const CORE_FILE = `${SRD_DIR}/core.json`;
const OPTIONS_FILE = `${SRD_DIR}/opzioni_personaggio.json`;

function proficiencyBonus(level) {
    const numericLevel = Number.parseInt(level, 10);
    if (!Number.isFinite(numericLevel) || numericLevel < 1) {
        return 2;
    }

    return Math.ceil(numericLevel / 4) + 1;
}

function labels(definizione) {
    return Object.entries(definizione).map(([id, value]) => ({
        label: value?.label ?? id,
        id
    }));
}

function normalizzaNumero(value, fallback = 10) {
    const numero = Number.parseInt(value, 10);
    return Number.isFinite(numero) ? numero : fallback;
}

function modificatoreCaratteristica(value) {
    return Math.floor((normalizzaNumero(value, 10) - 10) / 2);
}

function labelStat(stat) {
    return stat.charAt(0).toUpperCase() + stat.slice(1);
}

async function loadSrdData(tp) {
    const read = typeof app !== "undefined" && app?.vault?.adapter?.read
        ? path => app.vault.adapter.read(path)
        : async filePath => fs.promises.readFile(filePath, "utf8");

    try {
        const [rawCore, rawOpzioni] = await Promise.all([
            read(CORE_FILE),
            read(OPTIONS_FILE)
        ]);

        return {
            core: JSON.parse(rawCore),
            opzioni: JSON.parse(rawOpzioni)
        };
    } catch (error) {
        throw new Error(
            "Dati SRD PG mancanti. Esegui `npm run import:srd-data` nel repository e riapri il vault."
        );
    }
}

async function scegliDaLista(tp, titolo, definizione, helpers) {
    const options = labels(definizione);
    const selected = await helpers.chooseOptional(tp, options, titolo);
    return selected?.id ?? "";
}

async function scegliMetodoCaratteristiche(tp, metodi, helpers) {
    const options = Object.entries(metodi).map(([id, value]) => ({
        id,
        label: value?.label ?? id
    }));
    const selected = await helpers.chooseOptional(tp, options, "Metodo generazione caratteristiche");
    return selected?.id ?? "manuale";
}

async function assegnaArrayStandard(tp, config, statistiche, helpers) {
    const valori = [...(config?.valori ?? [15, 14, 13, 12, 10, 8])];
    const stats = {};

    for (const stat of statistiche) {
        const scelta = await helpers.chooseRequired(
            tp,
            valori.map(value => ({ label: String(value), id: value })),
            `Assegna valore a ${labelStat(stat)}`
        );
        stats[stat] = scelta.id;
        valori.splice(valori.indexOf(scelta.id), 1);
    }

    return stats;
}

async function acquistoPunti(tp, config, statistiche, helpers) {
    const puntiMassimi = config?.punti ?? 27;
    const minimo = config?.minimo ?? 8;
    const massimo = config?.massimo ?? 15;
    const costi = config?.costi ?? {};
    const stats = {};
    let puntiSpesi = 0;

    for (const stat of statistiche) {
        const opzioni = [];

        for (let valore = minimo; valore <= massimo; valore += 1) {
            const costo = Number(costi[valore] ?? costi[String(valore)] ?? 0);
            if (puntiSpesi + costo <= puntiMassimi) {
                opzioni.push({ label: `${valore} (costo ${costo})`, id: valore });
            }
        }

        const scelta = await helpers.chooseRequired(
            tp,
            opzioni,
            `Acquisto punti: ${labelStat(stat)} (${puntiMassimi - puntiSpesi} rimasti)`
        );
        stats[stat] = scelta.id;
        puntiSpesi += Number(costi[scelta.id] ?? costi[String(scelta.id)] ?? 0);
    }

    return stats;
}

async function inserimentoManuale(tp, statistiche, helpers) {
    const stats = {};

    for (const stat of statistiche) {
        const risposta = await helpers.promptOptional(tp, labelStat(stat), "10");
        stats[stat] = normalizzaNumero(risposta, 10);
    }

    return stats;
}

async function chiediStatisticheBase(tp, core, helpers) {
    const metodi = core.generazione_caratteristiche?.metodi ?? {};
    const statistiche = core.statistiche ?? [];
    const metodo = (await scegliMetodoCaratteristiche(tp, metodi, helpers)) ?? "manuale";

    if (metodo === "array_standard") {
        return assegnaArrayStandard(tp, metodi.array_standard, statistiche, helpers);
    }

    if (metodo === "point_buy") {
        return acquistoPunti(tp, metodi.point_buy, statistiche, helpers);
    }

    return inserimentoManuale(tp, statistiche, helpers);
}

function clonaStatistiche(statistiche) {
    return Object.fromEntries(
        Object.entries(statistiche).map(([stat, value]) => [stat, normalizzaNumero(value, 10)])
    );
}

async function applicaAumentiBackground(tp, statistiche, backgroundId, backgrounds, helpers) {
    const config = backgrounds?.[backgroundId]?.aumento_caratteristiche;
    if (!config || config.tipo !== "scelta") {
        return clonaStatistiche(statistiche);
    }

    const risultato = clonaStatistiche(statistiche);
    const opzioni = [...(config.opzioni ?? Object.keys(risultato))];
    const schemaOptions = (config.schema ?? ["+2/+1", "+1/+1/+1"]).map(value => ({
        label: value,
        id: value
    }));
    const schema = await helpers.chooseRequired(
        tp,
        schemaOptions,
        "Aumento caratteristiche del background"
    );
    const bonus = schema?.id === "+1/+1/+1" ? [1, 1, 1] : [2, 1];
    const disponibili = [...opzioni];

    for (const valoreBonus of bonus) {
        const scelta = await helpers.chooseRequired(
            tp,
            disponibili.map(stat => ({ label: labelStat(stat), id: stat })),
            `Assegna +${valoreBonus}`
        );
        risultato[scelta.id] += valoreBonus;
        disponibili.splice(disponibili.indexOf(scelta.id), 1);
    }

    return risultato;
}

async function chiediStatistiche(tp, core, backgroundId, backgrounds, helpers) {
    const base = await chiediStatisticheBase(tp, core, helpers);
    return applicaAumentiBackground(tp, base, backgroundId, backgrounds, helpers);
}

function calcolaPuntiFerita(classeId, statistiche, classi) {
    const dadoVita = classi?.[classeId]?.dadi_vita ?? 8;
    return Math.max(1, dadoVita + modificatoreCaratteristica(statistiche.costituzione));
}

async function scegliCompetenzeClasse(tp, classeId, classi, abilita, helpers) {
    const config = classi?.[classeId]?.abilita;
    if (!config?.scelte) {
        return [];
    }

    const opzioni = config.opzioni === "qualsiasi"
        ? Object.fromEntries(Object.keys(abilita).map(id => [id, abilita[id]]))
        : Object.fromEntries(
            (config.opzioni ?? [])
                .filter(id => abilita[id])
                .map(id => [id, abilita[id]])
        );

    const scelte = [];
    const disponibili = { ...opzioni };

    for (let index = 0; index < config.scelte; index += 1) {
        const scelta = await scegliDaLista(
            tp,
            `Competenza abilità di classe (${index + 1}/${config.scelte})`,
            disponibili,
            helpers
        );
        if (!scelta) {
            break;
        }
        scelte.push(scelta);
        delete disponibili[scelta];
    }

    return scelte;
}

function normalizzaOpzioniScelta(opzioni) {
    if (!opzioni) {
        return {};
    }

    if (Array.isArray(opzioni)) {
        return Object.fromEntries(opzioni.map(id => [id, { label: id }]));
    }

    return opzioni;
}

async function scegliOpzioneTratto(tp, trattoDef, helpers) {
    const opzioni = normalizzaOpzioniScelta(
        trattoDef.opzioni ?? trattoDef.scelte ?? trattoDef.varianti
    );

    if (!Object.keys(opzioni).length) {
        return null;
    }

    return scegliDaLista(
        tp,
        `Opzione tratto: ${trattoDef.label ?? "tratto"}`,
        opzioni,
        helpers
    );
}

async function gestisciTrattiSpecie(tp, specieId, specie, helpers) {
    const trattiDef = specie?.[specieId]?.tratti ?? {};
    const tratti = Object.keys(trattiDef);
    const scelteTratti = {};

    for (const trattoId of tratti) {
        const trattoDef = trattiDef[trattoId] ?? {};
        if (trattoDef.tipo !== "scelta") {
            continue;
        }

        const scelta = await scegliOpzioneTratto(tp, trattoDef, helpers);
        if (scelta) {
            scelteTratti[trattoId] = scelta;
        }
    }

    return { tratti, scelte_tratti: scelteTratti };
}

function buildCaratteristicheYaml(statistiche, saveProf) {
    const output = {};

    for (const [stat, value] of Object.entries(statistiche)) {
        output[stat] = {
            stat: normalizzaNumero(value, 10),
            save_prof: saveProf.includes(stat) ? 1 : 0
        };
    }

    return output;
}

function buildAbilitaYaml(abilita, competenze) {
    const output = {};

    for (const [id, skill] of Object.entries(abilita ?? {})) {
        output[id] = {
            stat: skill.stat,
            prof: competenze.includes(id) ? 1 : 0
        };
    }

    return output;
}

async function pg(tp) {
    const helpers = tp.user.helpers;
    const { core, opzioni } = await loadSrdData(tp);
    const classi = opzioni.classi ?? {};
    const specie = opzioni.specie ?? {};
    const backgrounds = opzioni.background ?? {};
    const sottospecieMap = opzioni.sottospecie ?? {};
    const abilita = core.abilita ?? {};

    const name = await helpers.promptRequired(tp, "Nome del PG");
    const id = helpers.slugify(name);
    const player = await helpers.promptOptional(tp, "Nome giocatore");

    const selectedClass = await scegliDaLista(tp, "Classe del PG", classi, helpers);
    const classe = selectedClass ?? "";
    const subclass = await helpers.promptOptional(tp, "Sottoclasse");
    const livello = await helpers.promptOptional(tp, "Livello", "1") || "1";
    const esperienza = await helpers.promptOptional(tp, "Punti esperienza", "0") || "0";
    const prossimoLivello = await helpers.promptOptional(tp, "Obiettivo prossimo livello o milestone");

    const selectedSpecies = await scegliDaLista(tp, "Specie del PG", specie, helpers);
    const specieId = selectedSpecies ?? "";

    let sottospecie = "";
    if (specieId && sottospecieMap[specieId]) {
        sottospecie = (await scegliDaLista(tp, "Sottospecie", sottospecieMap[specieId], helpers)) ?? "";
    }

    const selectedBackground = await scegliDaLista(tp, "Background del PG", backgrounds, helpers);
    const background = selectedBackground ?? "";
    const allineamento = await helpers.promptOptional(tp, "Allineamento");

    const buildMeccanico = await helpers.askYesNo(
        tp,
        "Vuoi configurare ora la scheda meccanica (caratteristiche, PF, competenze)?"
    );

    let statistiche = {};
    let competenze = [];
    let trattiSpecie = { tratti: [], scelte_tratti: {} };
    let hp = 10;

    if (buildMeccanico) {
        trattiSpecie = await gestisciTrattiSpecie(tp, specieId, specie, helpers);
        competenze = await scegliCompetenzeClasse(tp, classe, classi, abilita, helpers);
        statistiche = await chiediStatistiche(tp, core, background, backgrounds, helpers);
        hp = calcolaPuntiFerita(classe, statistiche, classi);
    } else {
        const statsLine = await helpers.promptOptional(
            tp,
            "Caratteristiche D&D: FOR DES COS INT SAG CAR",
            "10 10 10 10 10 10"
        );
        const order = core.statistiche ?? ["forza", "destrezza", "costituzione", "intelligenza", "saggezza", "carisma"];
        const values = helpers.parseAbilityScores(statsLine);
        order.forEach((stat, index) => {
            statistiche[stat] = values[index] ?? 10;
        });
        hp = await helpers.promptOptional(tp, "Punti Ferita massimi", "10") || "10";
        hp = normalizzaNumero(hp, 10);
    }

    const classeDef = classi[classe] ?? {};
    const backgroundDef = backgrounds[background] ?? {};
    const saveProf = classeDef.save_prof ?? [];
    const competenzeFinali = Array.from(new Set([
        ...competenze,
        ...(backgroundDef.competenze_abilita ?? [])
    ]));
    const talenti = backgroundDef.talento_origine ?? [];
    const armature = classeDef.addestramento_armature ?? [];
    const armi = classeDef.addestramento_armi ?? [];

    const ac = await helpers.promptOptional(tp, "Classe Armatura", "10") || "10";
    const hpTemp = await helpers.promptOptional(tp, "Punti Ferita temporanei", "0") || "0";
    const hitDice = await helpers.promptOptional(
        tp,
        "Dadi Vita",
        classeDef.dadi_vita ? `1d${classeDef.dadi_vita}` : "1d8"
    ) || (classeDef.dadi_vita ? `1d${classeDef.dadi_vita}` : "1d8");
    const speed = await helpers.promptOptional(tp, "Velocità", "9 m.") || "9 m.";
    const initiative = await helpers.promptOptional(tp, "Bonus iniziativa", "0") || "0";

    const mondo = await helpers.chooseWorld(tp, "Mondo del PG");
    const context = { world: mondo };
    const luogo = await helpers.chooseLocation(tp, "Luogo del PG", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni del PG", context);
    const relazioni = await helpers.choosePeople(tp, "Relazioni del PG", context);

    await helpers.moveNote(tp, helpers.path("personaggi"), name);

    const classeLabel = classeDef.label ?? classe;
    const specieLabel = specie[specieId]?.label ?? specieId;
    const backgroundLabel = backgroundDef.label ?? background;
    const numericHp = normalizzaNumero(hp, 10);
    const numericLevel = helpers.yamlNumber(livello) || 1;

    const flatFrontmatter = await helpers.renderFrontmatter("pg", {
        id,
        nome: helpers.yamlQuote(name),
        categoria: "personaggio",
        tipo: "pg",
        giocatore: helpers.yamlQuote(player),
        classe: helpers.yamlQuote(classeLabel),
        sottoclasse: helpers.yamlQuote(subclass),
        classe_srd: classeLabel ? `[[${classeLabel}]]` : "",
        level: numericLevel,
        livello: numericLevel,
        esperienza: helpers.yamlNumber(esperienza) || 0,
        prossimo_livello: helpers.yamlQuote(prossimoLivello),
        milestone: "false",
        bonus_competenza: proficiencyBonus(numericLevel),
        proficiency_bonus: proficiencyBonus(numericLevel),
        specie: helpers.yamlQuote(specieLabel),
        sottospecie: helpers.yamlQuote(sottospecie),
        background: helpers.yamlQuote(backgroundLabel),
        alignment: helpers.yamlQuote(allineamento),
        allineamento: helpers.yamlQuote(allineamento),
        stato: "in gioco",
        mondo,
        luogo,
        fazioni: helpers.inlineYamlList(fazioni),
        relazioni: helpers.inlineYamlList(relazioni),
        ac: helpers.yamlNumber(ac) || 10,
        hp: numericHp,
        hp_massimi: numericHp,
        hp_attuali: numericHp,
        punti_ferita_attuali: numericHp,
        punti_ferita_massimi: numericHp,
        hp_temporanei: helpers.yamlNumber(hpTemp) || 0,
        hit_dice: helpers.yamlQuote(hitDice),
        dadi_vita_totali: helpers.yamlQuote(hitDice),
        dadi_vita_spesi: "0",
        speed: helpers.yamlQuote(speed),
        velocita: helpers.yamlQuote(speed),
        modifier: helpers.yamlNumber(initiative) || 0,
        iniziativa: helpers.yamlNumber(initiative) || 0,
        stats: helpers.abilityArray(
            (core.statistiche ?? []).map(stat => statistiche[stat] ?? 10).join(" ")
        ),
        ispirazione: "false",
        successi_morte: "0",
        fallimenti_morte: "0",
        competenze: helpers.inlineYamlList(competenzeFinali),
        linguaggi: "[]",
        strumenti: "[]",
        equipaggiamento: "[]",
        incantesimi: "[]",
        privilegi: "[]",
        talenti: helpers.inlineYamlList(talenti),
        tratti: helpers.inlineYamlList(trattiSpecie.tratti),
        scelte_tratti: "{}"
    });

    const nested = {
        punti_ferita: {
            attuali: numericHp,
            massimi: numericHp
        },
        caratteristiche: buildCaratteristicheYaml(statistiche, saveProf),
        abilita: buildAbilitaYaml(abilita, competenzeFinali),
        scelte_tratti: trattiSpecie.scelte_tratti,
        addestramento: {
            armature,
            armi
        }
    };

    return helpers.mergeFrontmatterNested(flatFrontmatter, nested);
}

module.exports = pg;
