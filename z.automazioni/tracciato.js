async function tracciato(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("tracciato");
    const prompts = profile.prompts ?? {};
    const activeContext = helpers.getActiveSessionContext();
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome del clock o tracciato");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, profile.completion_prompt ?? "Vuoi collegare subito missioni, fazioni, luoghi e PNG? Scegli No per un clock rapido.");
    const selectedType = await helpers.chooseProfileOption(tp, profile);
    const mondo = await helpers.chooseWorld(tp, profile.world_prompt ?? "Mondo del tracciato");
    const context = { world: mondo };
    const progressMax = await helpers.promptOptional(tp, prompts.progress_max ?? "Segmenti totali", profile.progress_max_default ?? "6") || "6";
    const progressValue = await helpers.promptOptional(tp, prompts.progress_value ?? "Segmenti gia segnati", profile.progress_value_default ?? "0") || "0";
    const posta = await helpers.promptOptional(tp, prompts.posta ?? "Cosa succede quando si riempie");
    const gancio = await helpers.promptOptional(tp, prompts.gancio ?? "Gancio giocabile");
    const usoAlTavolo = await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso al tavolo");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Versione player-safe");
    const prossimaMossa = await helpers.promptOptional(tp, prompts.prossima_mossa ?? "Prossima mossa");
    const innesco = await helpers.promptOptional(tp, prompts.innesco ?? "Quando avanza");
    const campagne = creazioneCompleta ? await helpers.chooseCampaigns(tp, prompts.campagne ?? "Campagne collegate", context) : [];
    const missioni = creazioneCompleta ? await helpers.chooseMissions(tp, prompts.missioni ?? "Missioni collegate", context) : [];
    const fazioni = creazioneCompleta ? await helpers.chooseFactions(tp, prompts.fazioni ?? "Fazioni collegate", context) : [];
    const luoghi = creazioneCompleta ? await helpers.chooseLocations(tp, prompts.luoghi ?? "Luoghi collegati", context) : [];
    const personaggi = creazioneCompleta ? await helpers.choosePeople(tp, prompts.personaggi ?? "PNG o PG collegati", context) : [];
    const connessioni = await helpers.chooseConnections(tp, profile.connection_prompt ?? "Connessioni vive del tracciato", context);

    const sessioni = activeContext.link ? [activeContext.link] : [];
    const created = await helpers.moveNote(tp, helpers.path("tracciati"), name);
    // Un clock creato al tavolo deve comparire tra le pressioni della sessione senza lavoro manuale.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "tracciati" });
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return await helpers.renderFrontmatter("tracciato", {
        id,
        nome: helpers.yamlQuote(name),
        tipo: selectedType?.id ?? "clock",
        mondo,
        campagne: helpers.inlineYamlList(campagne),
        missioni: helpers.inlineYamlList(missioni),
        fazioni: helpers.inlineYamlList(fazioni),
        luoghi: helpers.inlineYamlList(luoghi),
        personaggi: helpers.inlineYamlList(personaggi),
        sessioni: helpers.inlineYamlList(sessioni),
        progress_value: helpers.yamlNumber(progressValue) || 0,
        progress_max: helpers.yamlNumber(progressMax) || 6,
        gancio: helpers.yamlQuote(gancio),
        uso_al_tavolo: helpers.yamlQuote(usoAlTavolo),
        player_safe: helpers.yamlQuote(playerSafe),
        posta: helpers.yamlQuote(posta),
        prossima_mossa: helpers.yamlQuote(prossimaMossa),
        innesco: helpers.yamlQuote(innesco),
        connessioni: helpers.inlineYamlList(connessioni)
    });
}

module.exports = tracciato;
