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
    const gancio = await helpers.promptOptional(tp, prompts.gancio ?? "Gancio giocabile della cultura");
    const usoAlTavolo = await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso al tavolo");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Versione player-safe");
    const tensione = await helpers.promptOptional(tp, prompts.tensione ?? "Tensione interna o problema");
    const segreto = await helpers.promptOptional(tp, prompts.segreto ?? "Verità nascosta o tabù");
    const prossimaMossa = await helpers.promptOptional(tp, prompts.prossima_mossa ?? "Prossima mossa culturale");
    const connessioni = await helpers.chooseConnections(tp, profile.connection_prompt ?? "Connessioni vive della cultura", context);
    const mitoOrigine = creazioneCompleta ? await helpers.promptOptional(tp, prompts.mito_origine ?? "Mito d'origine") : "";
    const sacro = creazioneCompleta ? await helpers.promptOptional(tp, prompts.sacro ?? "Cosa considera sacro") : "";
    const proibito = creazioneCompleta ? await helpers.promptOptional(tp, prompts.proibito ?? "Cosa considera proibito o mostruoso") : "";
    const vitaQuotidiana = creazioneCompleta ? await helpers.promptOptional(tp, prompts.vita_quotidiana ?? "Dettaglio di vita quotidiana") : "";
    const rapportoStranieri = creazioneCompleta ? await helpers.promptOptional(tp, prompts.rapporto_stranieri ?? "Rapporto con stranieri o vicini") : "";

    const created = await helpers.moveNote(tp, helpers.path("culture"), name);
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return `${await helpers.renderFrontmatter("cultura", {
        id,
        nome: helpers.yamlQuote(name),
        mondo,
        luoghi: helpers.inlineYamlList(luoghi),
        religioni: helpers.inlineYamlList(religioni),
        fazioni: helpers.inlineYamlList(fazioni),
        mito_origine: helpers.inlineYamlTextList([mitoOrigine]),
        cose_sacre: helpers.inlineYamlTextList([sacro]),
        cose_proibite: helpers.inlineYamlTextList([proibito]),
        famiglia_casa_ruoli: helpers.inlineYamlTextList([vitaQuotidiana]),
        rapporto_stranieri: helpers.inlineYamlTextList([rapportoStranieri]),
        gancio: helpers.yamlQuote(gancio),
        uso_al_tavolo: helpers.yamlQuote(usoAlTavolo),
        player_safe: helpers.yamlQuote(playerSafe),
        tratto_distintivo: helpers.yamlQuote(tratto),
        connessioni: helpers.inlineYamlList(connessioni),
        prossima_mossa: helpers.yamlQuote(prossimaMossa),
        tensioni: helpers.inlineYamlTextList([tensione]),
        segreti: helpers.inlineYamlTextList([segreto])
    })}
`;
}

module.exports = cultura;
