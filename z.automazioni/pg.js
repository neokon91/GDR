const fs = require("fs");
const path = require("path");

const SRD_DIR = "z.automazioni/data/srd";
const CORE_FILE = `${SRD_DIR}/core.json`;
const OPTIONS_FILE = `${SRD_DIR}/opzioni_personaggio.json`;
const {
    buildAbilitaYaml,
    buildCaratteristicheYaml,
    calcolaPuntiFerita,
    chiediStatistiche,
    gestisciTrattiSpecie,
    normalizzaNumero,
    proficiencyBonus,
    scegliCompetenzeClasse,
    scegliDaLista,
    scegliTalentoOrigine
} = require("./pg_mechanics");

function inlineYamlQuotedList(values, helpers) {
    const filtered = (values ?? []).filter(Boolean);
    return filtered.length ? `[${filtered.map(value => helpers.yamlQuote(value)).join(", ")}]` : "[]";
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
            "Dati SRD PG mancanti. Esegui `npm run sync:sources` nel repository e riapri il vault."
        );
    }
}

async function pg(tp) {
    const helpers = tp.user.helpers;
    const { core, opzioni } = await loadSrdData(tp);
    const classi = opzioni.classi ?? {};
    const specie = opzioni.specie ?? {};
    const backgrounds = opzioni.background ?? {};
    const talentiSrd = opzioni.talenti ?? {};
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
    let talenti = [];
    let trattiSpecie = { tratti: [], scelte_tratti: {} };
    let hp = 10;

    if (buildMeccanico) {
        trattiSpecie = await gestisciTrattiSpecie(tp, specieId, specie, helpers);
        talenti = await scegliTalentoOrigine(tp, backgrounds[background], talentiSrd, helpers);
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
        talenti: inlineYamlQuotedList(talenti, helpers),
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
