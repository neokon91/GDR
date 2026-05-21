async function fazione(tp, routeOptions = {}) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("fazione");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome della fazione");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, profile.completion_prompt ?? "Vuoi compilare rete, luoghi e relazioni ora? Scegli No per una fazione rapida.");
    const route = Object.keys(routeOptions).length ? routeOptions : helpers.consumeRoute();
    const selectedType = await helpers.chooseProfileOption(tp, profile, route);
    const mondo = await helpers.chooseWorld(tp, profile.world_prompt ?? "Mondo della fazione");
    const context = { world: mondo };
    const obiettivo = await helpers.promptOptional(tp, prompts.obiettivo ?? "Obiettivo pubblico");
    const gancio = await helpers.promptOptional(tp, prompts.gancio ?? "Gancio giocabile: perche questa fazione entra in scena?");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Versione player-safe mostrabile");
    const obiettivoNascosto = await helpers.promptOptional(tp, prompts.obiettivo_nascosto ?? "Obiettivo nascosto");
    const pressione = await helpers.promptOptional(tp, prompts.pressione ?? "Pressione da 0 a 10");
    const prossimaMossa = await helpers.promptOptional(tp, prompts.prossima_mossa ?? "Prossima mossa se nessuno interviene");
    const segreto = await helpers.promptOptional(tp, prompts.segreto ?? "Segreto o verità scomoda");
    const leader = creazioneCompleta ? await helpers.choosePeople(tp, prompts.leader ?? "Leader della fazione", context) : [];
    const luoghi = creazioneCompleta ? await helpers.chooseLocations(tp, prompts.luoghi ?? "Luoghi controllati o importanti", context) : [];
    const personaggi = creazioneCompleta ? await helpers.choosePeople(tp, prompts.personaggi ?? "Membri, alleati o nemici come PNG", context) : [];
    const missioni = creazioneCompleta ? await helpers.chooseMissions(tp, prompts.missioni ?? "Missioni collegate alla fazione", context) : [];
    const alleati = creazioneCompleta ? await helpers.chooseFactions(tp, prompts.alleati ?? "Fazioni alleate", context) : [];
    const rivali = creazioneCompleta ? await helpers.chooseFactions(tp, prompts.rivali ?? "Fazioni rivali o nemiche", context) : [];
    const scadenzaMondo = creazioneCompleta ? await helpers.promptOptional(tp, prompts.scadenza_mondo ?? "Scadenza nel mondo") : "";
    const domandaAperta = creazioneCompleta ? await helpers.promptOptional(tp, prompts.domanda_aperta ?? "Domanda aperta sulla fazione") : "";
    const connessioni = await helpers.chooseConnections(tp, profile.connection_prompt ?? "Connessioni vive della fazione", context);

    const created = await helpers.moveNote(tp, helpers.path("fazioni"), name);
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return await helpers.renderFrontmatter("fazione", {
        id,
        nome: helpers.yamlQuote(name),
        tipo: selectedType?.id ?? "",
        mondo,
        leader: helpers.inlineYamlList(leader),
        luoghi: helpers.inlineYamlList(luoghi),
        personaggi: helpers.inlineYamlList(personaggi),
        missioni: helpers.inlineYamlList(missioni),
        obiettivo: helpers.yamlQuote(obiettivo),
        gancio: helpers.yamlQuote(gancio),
        uso_al_tavolo: helpers.yamlQuote(prossimaMossa || obiettivo),
        player_safe: helpers.yamlQuote(playerSafe),
        obiettivo_nascosto: helpers.yamlQuote(obiettivoNascosto),
        agenda: helpers.yamlQuote(obiettivo),
        pressione: helpers.yamlNumber(pressione) || 0,
        prossima_mossa: helpers.yamlQuote(prossimaMossa),
        scadenza_mondo: helpers.yamlQuote(scadenzaMondo),
        innesco: helpers.yamlQuote(prossimaMossa ? "Tempo, fallimento dei PG o vantaggio della fazione" : ""),
        posta: helpers.yamlQuote(obiettivo),
        alleati: helpers.inlineYamlList(alleati),
        rivali: helpers.inlineYamlList(rivali),
        segreti: helpers.inlineYamlTextList([segreto]),
        domande_aperte: helpers.inlineYamlTextList([domandaAperta]),
        connessioni: helpers.inlineYamlList(connessioni)
    });
}

module.exports = fazione;
