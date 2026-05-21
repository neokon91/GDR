async function pg(tp) {
    const classes = [
        { label: "Barbaro", id: "Barbaro" },
        { label: "Bardo", id: "Bardo" },
        { label: "Chierico", id: "Chierico" },
        { label: "Druido", id: "Druido" },
        { label: "Guerriero", id: "Guerriero" },
        { label: "Ladro", id: "Ladro" },
        { label: "Mago", id: "Mago" },
        { label: "Monaco", id: "Monaco" },
        { label: "Paladino", id: "Paladino" },
        { label: "Ranger", id: "Ranger" },
        { label: "Stregone", id: "Stregone" },
        { label: "Warlock", id: "Warlock" }
    ];

    const species = [
        { label: "Aasimar", id: "Aasimar" },
        { label: "Dragonide", id: "Dragonide" },
        { label: "Elfo", id: "Elfo" },
        { label: "Gnomo", id: "Gnomo" },
        { label: "Goliath", id: "Goliath" },
        { label: "Halfling", id: "Halfling" },
        { label: "Nano", id: "Nano" },
        { label: "Orco", id: "Orco" },
        { label: "Tiefling", id: "Tiefling" },
        { label: "Umano", id: "Umano" }
    ];

    const backgrounds = [
        { label: "Accolito", id: "Accolito" },
        { label: "Artigiano", id: "Artigiano" },
        { label: "Ciarlatano", id: "Ciarlatano" },
        { label: "Criminale", id: "Criminale" },
        { label: "Eremita", id: "Eremita" },
        { label: "Eroe locale", id: "Eroe locale" },
        { label: "Forestiero", id: "Forestiero" },
        { label: "Intrattenitore", id: "Intrattenitore" },
        { label: "Marinaio", id: "Marinaio" },
        { label: "Nobile", id: "Nobile" },
        { label: "Sapiente", id: "Sapiente" },
        { label: "Soldato", id: "Soldato" }
    ];

    function proficiencyBonus(level) {
        const numericLevel = Number.parseInt(level, 10);
        if (!Number.isFinite(numericLevel) || numericLevel < 1) {
            return 2;
        }

        return Math.ceil(numericLevel / 4) + 1;
    }

    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del PG");
    const id = helpers.slugify(name);
    const player = await helpers.promptOptional(tp, "Nome giocatore");
    const selectedClass = await helpers.chooseOptional(tp, classes, "Classe del PG");
    const classe = selectedClass?.id ?? "";
    const subclass = await helpers.promptOptional(tp, "Sottoclasse");
    const livello = await helpers.promptOptional(tp, "Livello", "1") || "1";
    const esperienza = await helpers.promptOptional(tp, "Punti esperienza", "0") || "0";
    const prossimoLivello = await helpers.promptOptional(tp, "Obiettivo prossimo livello o milestone");
    const selectedSpecies = await helpers.chooseOptional(tp, species, "Specie del PG");
    const specie = selectedSpecies?.id ?? "";
    const selectedBackground = await helpers.chooseOptional(tp, backgrounds, "Background del PG");
    const background = selectedBackground?.id ?? "";
    const allineamento = await helpers.promptOptional(tp, "Allineamento");
    const ac = await helpers.promptOptional(tp, "Classe Armatura", "10") || "10";
    const hp = await helpers.promptOptional(tp, "Punti Ferita massimi", "10") || "10";
    const hpTemp = await helpers.promptOptional(tp, "Punti Ferita temporanei", "0") || "0";
    const hitDice = await helpers.promptOptional(tp, "Dadi Vita", "1d8") || "1d8";
    const speed = await helpers.promptOptional(tp, "Velocità", "9 m.") || "9 m.";
    const initiative = await helpers.promptOptional(tp, "Bonus iniziativa", "0") || "0";
    const stats = await helpers.promptOptional(tp, "Caratteristiche D&D: FOR DES COS INT SAG CAR", "10 10 10 10 10 10");
    const mondo = await helpers.chooseWorld(tp, "Mondo del PG");
    const context = { world: mondo };
    const luogo = await helpers.chooseLocation(tp, "Luogo del PG", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni del PG", context);
    const relazioni = await helpers.choosePeople(tp, "Relazioni del PG", context);

    await helpers.moveNote(tp, helpers.path("personaggi"), name);

    return await helpers.renderFrontmatter("pg", {
        id: id,
        nome: helpers.yamlQuote(name),
        categoria: 'personaggio',
        tipo: 'pg',
        giocatore: helpers.yamlQuote(player),
        classe: helpers.yamlQuote(classe),
        sottoclasse: helpers.yamlQuote(subclass),
        classe_srd: classe ? `[[${classe}]]` : "",
        level: helpers.yamlNumber(livello) || 1,
        livello: helpers.yamlNumber(livello) || 1,
        esperienza: helpers.yamlNumber(esperienza) || 0,
        prossimo_livello: helpers.yamlQuote(prossimoLivello),
        milestone: 'false',
        bonus_competenza: proficiencyBonus(helpers.yamlNumber(livello) || 1),
        specie: helpers.yamlQuote(specie),
        background: helpers.yamlQuote(background),
        alignment: helpers.yamlQuote(allineamento),
        allineamento: helpers.yamlQuote(allineamento),
        stato: 'in gioco',
        mondo: mondo,
        luogo: luogo,
        fazioni: helpers.inlineYamlList(fazioni),
        relazioni: helpers.inlineYamlList(relazioni),
        ac: helpers.yamlNumber(ac) || 10,
        hp: helpers.yamlNumber(hp) || 10,
        hp_massimi: helpers.yamlNumber(hp) || 10,
        hp_attuali: helpers.yamlNumber(hp) || 10,
        hp_temporanei: helpers.yamlNumber(hpTemp) || 0,
        hit_dice: helpers.yamlQuote(hitDice),
        dadi_vita_totali: helpers.yamlQuote(hitDice),
        dadi_vita_spesi: '0',
        speed: helpers.yamlQuote(speed),
        velocita: helpers.yamlQuote(speed),
        modifier: helpers.yamlNumber(initiative) || 0,
        iniziativa: helpers.yamlNumber(initiative) || 0,
        stats: helpers.abilityArray(stats),
        ispirazione: 'false',
        successi_morte: '0',
        fallimenti_morte: '0',
        competenze: '[]',
        linguaggi: '[]',
        strumenti: '[]',
        equipaggiamento: '[]',
        incantesimi: '[]',
        privilegi: '[]'
    });
}

module.exports = pg;
