async function oggettoMagico(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("oggetto_magico");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome dell'oggetto magico");
    const id = helpers.slugify(name);
    const rarita = await helpers.chooseOptional(
        tp,
        profile.rarity_options ?? [
            { label: "Comune", id: "comune" },
            { label: "Non comune", id: "non comune" },
            { label: "Raro", id: "raro" },
            { label: "Molto raro", id: "molto raro" },
            { label: "Leggendario", id: "leggendario" },
            { label: "Artefatto", id: "artefatto" }
        ],
        prompts.rarita ?? "Rarità"
    );
    const booleanOptions = profile.boolean_options ?? [
        { label: "No", id: "false" },
        { label: "Si", id: "true" }
    ];
    const sintonia = await helpers.chooseOptional(tp, booleanOptions, prompts.sintonia ?? "Richiede sintonia");
    const cariche = await helpers.promptOptional(tp, prompts.cariche ?? "Cariche o usi");
    const maledizione = await helpers.chooseOptional(tp, booleanOptions, prompts.maledizione ?? "Ha una maledizione");
    const mondo = await helpers.chooseWorld(tp, prompts.mondo ?? "Mondo dell'oggetto magico");
    const context = { world: mondo };
    const proprietario = await helpers.choosePerson(tp, prompts.proprietario ?? "Proprietario", context);
    const luogo = await helpers.chooseLocation(tp, prompts.luogo ?? "Luogo dell'oggetto magico", context);
    const gancio = await helpers.promptOptional(tp, prompts.gancio ?? "Perche entra in gioco");
    const usoAlTavolo = await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso concreto al tavolo");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Descrizione mostrabile ai giocatori");
    const pressione = await helpers.promptOptional(tp, prompts.pressione ?? "Pressione da 0 a 10");
    const prossimaMossa = await helpers.promptOptional(tp, prompts.prossima_mossa ?? "Cosa cambia se viene usato, perso o ignorato");
    const connessioni = await helpers.chooseConnections(tp, prompts.connessioni ?? "Connessioni a missioni, luoghi, PNG o fazioni", context);
    const sessioni = await helpers.chooseSessions(tp, prompts.sessioni ?? "Sessioni collegate", context);
    const fonti = await helpers.promptWikilinkTargets(tp, prompts.fonti ?? "Fonti granulari dell'oggetto magico");
    const riferimentiSrd = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_srd ?? "Riferimenti SRD dell'oggetto magico");
    const riferimentiRegola = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_regola ?? "Riferimenti regola dell'oggetto magico");

    await helpers.moveNote(tp, helpers.path("oggetti"), name);

    return await helpers.renderFrontmatter("oggetto_magico", {
        id: id,
        nome: helpers.yamlQuote(name),
        categoria: 'oggetto',
        tipo: 'oggetto magico',
        rarita: rarita?.id ?? "",
        sintonia: sintonia?.id ?? 'false',
        cariche: helpers.yamlQuote(cariche),
        maledizione: maledizione?.id ?? 'false',
        stato: 'bozza',
        canonico: 'false',
        mondo: mondo,
        proprietario: proprietario,
        luogo: luogo,
        gancio: helpers.yamlQuote(gancio),
        uso_al_tavolo: helpers.yamlQuote(usoAlTavolo),
        player_safe: helpers.yamlQuote(playerSafe),
        pressione: pressione,
        prossima_mossa: helpers.yamlQuote(prossimaMossa),
        connessioni: helpers.inlineYamlList(connessioni),
        sessioni: helpers.inlineYamlList(sessioni),
        ...helpers.referenceFields({
            fonti: [...fonti, ...riferimentiSrd, ...riferimentiRegola, proprietario, luogo, ...connessioni],
            riferimentiSrd,
            riferimentiRegola,
            tags: ["dnd55/oggetto-magico", "dnd55/homebrew", "gdr/bozza"]
        })
    });
}

module.exports = oggettoMagico;
