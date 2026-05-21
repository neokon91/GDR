async function missione(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("missione");
    const prompts = profile.prompts ?? {};
    const activeContext = helpers.getActiveSessionContext();
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome della missione");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, profile.completion_prompt ?? "Vuoi compilare collegamenti e dettagli ora? Scegli No per una missione rapida.");
    const selectedType = await helpers.chooseProfileOption(tp, profile);
    const mondo = await helpers.chooseWorld(tp, profile.world_prompt ?? "Mondo della missione");
    const context = { world: mondo };
    const pressione = await helpers.promptOptional(tp, prompts.pressione ?? "Pressione da 0 a 10", profile.pressure_default ?? "3") || "3";
    const posta = await helpers.promptOptional(tp, prompts.posta ?? "Posta: cosa cambia se riesce o fallisce?");
    const scelta = await helpers.promptOptional(tp, prompts.scelta ?? "Scelta concreta per i giocatori");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Versione player-safe dell'obiettivo");
    const prossimaMossa = await helpers.promptOptional(tp, prompts.prossima_mossa ?? "Prossima mossa se ignorata");
    const indizio = await helpers.promptOptional(tp, prompts.indizio ?? "Indizio iniziale");
    const conseguenza = await helpers.promptOptional(tp, prompts.conseguenza ?? "Conseguenza se fallisce o viene ignorata");
    const committente = creazioneCompleta ? await helpers.choosePerson(tp, prompts.committente ?? "Committente", context) : "";
    const luoghi = creazioneCompleta ? await helpers.chooseLocations(tp, prompts.luoghi ?? "Luoghi della missione", context) : [];
    const personaggi = creazioneCompleta ? await helpers.choosePeople(tp, prompts.personaggi ?? "Personaggi coinvolti", context) : [];
    const fazioni = creazioneCompleta ? await helpers.chooseFactions(tp, prompts.fazioni ?? "Fazioni coinvolte", context) : [];
    const tracciati = creazioneCompleta ? await helpers.chooseTracks(tp, prompts.tracciati ?? "Clock o tracciati collegati", context) : [];
    const ricompense = creazioneCompleta ? await helpers.chooseObjects(tp, prompts.ricompense ?? "Ricompense", context) : [];
    const scadenzaMondo = creazioneCompleta ? await helpers.promptOptional(tp, prompts.scadenza_mondo ?? "Scadenza nel mondo") : "";
    const calendario = await helpers.promptCalendar(tp, { world: mondo }, prompts.calendario ?? "Calendario Calendarium");
    const ostacolo = creazioneCompleta ? await helpers.promptOptional(tp, prompts.ostacolo ?? "Ostacolo principale") : "";
    const segreto = await helpers.promptOptional(tp, prompts.segreto ?? "Segreto dietro la missione");
    const domandaAperta = creazioneCompleta ? await helpers.promptOptional(tp, prompts.domanda_aperta ?? "Domanda aperta della missione") : "";
    const connessioni = await helpers.chooseConnections(tp, profile.connection_prompt ?? "Connessioni vive della missione", context);

    const sessioni = activeContext.link ? [activeContext.link] : [];
    const created = await helpers.moveNote(tp, helpers.path("missioni"), name);
    // Una missione creata mentre prepari o giochi entra subito tra le missioni della sessione attiva.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "missioni" });
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return await helpers.renderFrontmatter("missione", {
        id,
        nome: helpers.yamlQuote(name),
        tipo: selectedType?.id ?? "",
        mondo,
        committente,
        luoghi: helpers.inlineYamlList(luoghi),
        personaggi: helpers.inlineYamlList(personaggi),
        fazioni: helpers.inlineYamlList(fazioni),
        tracciati: helpers.inlineYamlList(tracciati),
        ricompense: helpers.inlineYamlList(ricompense),
        sessioni: helpers.inlineYamlList(sessioni),
        pressione: helpers.yamlNumber(pressione) || 3,
        posta: helpers.yamlQuote(posta),
        scelta: helpers.yamlQuote(scelta),
        gancio: helpers.yamlQuote(playerSafe || indizio),
        uso_al_tavolo: helpers.yamlQuote(scelta || prossimaMossa),
        player_safe: helpers.yamlQuote(playerSafe),
        prossima_mossa: helpers.yamlQuote(prossimaMossa),
        domande_aperte: helpers.inlineYamlTextList([domandaAperta]),
        indizi: helpers.inlineYamlTextList([indizio]),
        ostacoli: helpers.inlineYamlTextList([ostacolo]),
        conseguenze: helpers.inlineYamlTextList([conseguenza]),
        segreti: helpers.inlineYamlTextList([segreto]),
        connessioni: helpers.inlineYamlList(connessioni),
        scadenza_mondo: helpers.yamlQuote(scadenzaMondo),
        fc_calendar: helpers.yamlQuote(calendario),
        fc_display_name: helpers.yamlQuote(name)
    });
}

module.exports = missione;
