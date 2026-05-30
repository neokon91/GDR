async function relazione(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("relazione");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome della relazione, patto o rivalità");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, profile.completion_prompt ?? "Vuoi compilare storia, versioni e dipendenze della relazione ora? Scegli No per una relazione rapida.");
    const selectedType = await helpers.chooseProfileOption(tp, profile);
    const mondo = await helpers.chooseWorld(tp, profile.world_prompt ?? "Mondo della relazione");
    const context = { world: mondo };
    const soggetti = creazioneCompleta ? await helpers.chooseNotesByPath(tp, "Mondi", prompts.soggetti ?? "Soggetti coinvolti", context) : [];
    const connessioni = await helpers.chooseConnections(tp, profile.connection_prompt ?? "Connessioni vive della relazione", context);
    const origine = await helpers.promptOptional(tp, prompts.origine ?? "Origine della relazione");
    const posta = await helpers.promptOptional(tp, prompts.posta ?? "Cosa c'è in gioco");
    const gancio = await helpers.promptOptional(tp, prompts.gancio ?? "Gancio giocabile della relazione");
    const usoAlTavolo = await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso al tavolo");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Versione player-safe");
    const prossimaMossa = await helpers.promptOptional(tp, prompts.prossima_mossa ?? "Prossimo deterioramento o sviluppo");
    const versione = creazioneCompleta ? await helpers.promptOptional(tp, prompts.versione ?? "Come la raccontano in modo diverso le parti") : "";
    const dipendenza = creazioneCompleta ? await helpers.promptOptional(tp, prompts.dipendenza ?? "Dipendenza materiale o politica") : "";
    const ferita = creazioneCompleta ? await helpers.promptOptional(tp, prompts.ferita ?? "Ferita aperta") : "";

    const created = await helpers.moveNote(tp, helpers.path("relazioni"), name);
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return await helpers.renderFrontmatter("relazione", {
        id,
        nome: helpers.yamlQuote(name),
        tipo: selectedType?.id ?? "relazione",
        mondo,
        soggetti: helpers.inlineYamlList(soggetti),
        origine: helpers.yamlQuote(origine),
        posta: helpers.yamlQuote(posta),
        gancio: helpers.yamlQuote(gancio),
        uso_al_tavolo: helpers.yamlQuote(usoAlTavolo),
        player_safe: helpers.yamlQuote(playerSafe),
        connessioni: helpers.inlineYamlList(connessioni),
        origine_storica: helpers.inlineYamlTextList([origine]),
        versioni_contrapposte: helpers.inlineYamlTextList([versione]),
        dipendenze_materiali: helpers.inlineYamlTextList([dipendenza]),
        ferite_aperte: helpers.inlineYamlTextList([ferita]),
        prossima_mossa: helpers.yamlQuote(prossimaMossa)
    });
}

module.exports = relazione;
