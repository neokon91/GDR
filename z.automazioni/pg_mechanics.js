function proficiencyBonus(level) {
    const numericLevel = Number.parseInt(level, 10);
    if (!Number.isFinite(numericLevel) || numericLevel < 1) {
        return 2;
    }

    return Math.ceil(numericLevel / 4) + 1;
}

function labels(definizione) {
    return Object.entries(definizione ?? {}).map(([id, value]) => ({
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

async function scegliDaLista(tp, titolo, definizione, helpers) {
    const options = labels(definizione);
    const selected = await helpers.chooseOptional(tp, options, titolo);
    return selected?.id ?? "";
}

async function scegliMetodoCaratteristiche(tp, metodi, helpers) {
    const options = Object.entries(metodi ?? {}).map(([id, value]) => ({
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

function talentiOrigine(talenti) {
    return Object.fromEntries(
        Object.entries(talenti ?? {})
            .filter(([, talent]) => talent?.categoria === "origini")
    );
}

async function scegliTalentoOrigine(tp, backgroundDef, talenti, helpers) {
    const talentiDaBackground = backgroundDef?.talento_origine ?? [];
    const origine = talentiOrigine(talenti);

    if (talentiDaBackground.length === 1) {
        const talentoId = talentiDaBackground[0];
        const talento = talenti?.[talentoId];
        if (!talento) return [];

        // Il wizard rende visibile il talento automatico del background invece di nasconderlo nel dato.
        const confermato = await helpers.askYesNo(
            tp,
            `Talento d'origine dal background: ${talento.label ?? talentoId}. Confermi?`
        );
        return confermato ? [talento.label ?? talentoId] : [];
    }

    if (talentiDaBackground.length > 1) {
        const opzioni = Object.fromEntries(
            talentiDaBackground
                .filter(id => talenti?.[id])
                .map(id => [id, talenti[id]])
        );
        const scelto = await scegliDaLista(tp, "Talento d'origine del background", opzioni, helpers);
        return scelto ? [talenti[scelto]?.label ?? scelto] : [];
    }

    const scelto = await scegliDaLista(tp, "Talento d'origine manuale", origine, helpers);
    return scelto ? [origine[scelto]?.label ?? scelto] : [];
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

module.exports = {
    acquistoPunti,
    applicaAumentiBackground,
    assegnaArrayStandard,
    buildAbilitaYaml,
    buildCaratteristicheYaml,
    calcolaPuntiFerita,
    chiediStatistiche,
    chiediStatisticheBase,
    clonaStatistiche,
    gestisciTrattiSpecie,
    inserimentoManuale,
    labelStat,
    labels,
    modificatoreCaratteristica,
    normalizzaNumero,
    proficiencyBonus,
    scegliCompetenzeClasse,
    scegliDaLista,
    scegliMetodoCaratteristiche,
    scegliOpzioneTratto,
    scegliTalentoOrigine,
    talentiOrigine
};
