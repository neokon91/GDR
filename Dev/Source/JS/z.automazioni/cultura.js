async function cultura(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("cultura");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome della cultura o popolo");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, profile.completion_prompt ?? "Vuoi compilare domande di worldbuilding profondo ora? Scegli No per una cultura rapida.");
    const mondo = await helpers.chooseWorld(tp, profile.world_prompt ?? "Mondo della cultura");
    const context = { world: mondo };
    const luoghi = creazioneCompleta ? await helpers.chooseLocations(tp, prompts.luoghi ?? "Regioni o luoghi dove vive", context) : [];
    const fazioni = creazioneCompleta ? await helpers.chooseFactions(tp, prompts.fazioni ?? "Fazioni collegate", context) : [];
    const religioni = creazioneCompleta ? await helpers.chooseReligions(tp, prompts.religioni ?? "Religioni collegate", context) : [];
    const tratto = await helpers.promptOptional(tp, prompts.tratto ?? "Cosa rende riconoscibile questa cultura");
    const valoreDominante = await helpers.promptOptional(tp, prompts.valore_dominante ?? "Valore dominante");
    const gancio = await helpers.promptOptional(tp, prompts.gancio ?? "Gancio giocabile della cultura");
    const usoAlTavolo = await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso al tavolo");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Versione player-safe");
    const tensione = await helpers.promptOptional(tp, prompts.tensione ?? "Tensione interna o problema");
    const segreto = await helpers.promptOptional(tp, prompts.segreto ?? "Verità nascosta o tabù");
    const prossimaMossa = await helpers.promptOptional(tp, prompts.prossima_mossa ?? "Prossima mossa culturale");
    const connessioni = await helpers.chooseConnections(tp, profile.connection_prompt ?? "Connessioni vive della cultura", context);

    const created = await helpers.moveNote(tp, helpers.path("culture"), name);
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return `${await helpers.renderFrontmatter("cultura", {
        id,
        nome: helpers.yamlQuote(name),
        mondo,
        luoghi: helpers.inlineYamlList(luoghi),
        religioni: helpers.inlineYamlList(religioni),
        fazioni: helpers.inlineYamlList(fazioni),
        valore_dominante: helpers.yamlQuote(valoreDominante),
        tensione_culturale: helpers.yamlQuote(tensione),
        gancio: helpers.yamlQuote(gancio),
        uso_al_tavolo: helpers.yamlQuote(usoAlTavolo),
        player_safe: helpers.yamlQuote(playerSafe),
        tratto_distintivo: helpers.yamlQuote(tratto),
        connessioni: helpers.inlineYamlList(connessioni),
        prossima_mossa: helpers.yamlQuote(prossimaMossa),
        segreti: helpers.inlineYamlTextList([segreto])
    })}
`;
}

module.exports = cultura;
