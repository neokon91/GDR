async function oggetto(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("oggetto");
    const prompts = profile.prompts ?? {};
    const activeContext = helpers.getActiveSessionContext();
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome dell'oggetto");
    const id = helpers.slugify(name);
    const selectedType = await helpers.chooseProfileOption(tp, profile);
    const selectedRarity = await helpers.chooseOptional(
        tp,
        profile.rarity_options ?? [],
        profile.rarity_prompt ?? "Rarità"
    );
    const mondo = await helpers.chooseWorld(tp, profile.world_prompt ?? "Mondo dell'oggetto");
    const context = { world: mondo };
    const proprietario = await helpers.choosePerson(tp, prompts.proprietario ?? "Proprietario", context);
    const luogo = await helpers.chooseLocation(tp, prompts.luogo ?? "Luogo dell'oggetto", context);
    const gancio = await helpers.promptOptional(tp, prompts.gancio ?? "Gancio giocabile dell'oggetto");
    const usoAlTavolo = await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso al tavolo");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Versione player-safe");
    const prossimaMossa = await helpers.promptOptional(tp, prompts.prossima_mossa ?? "Cosa cambia se viene usato, perso o ignorato");
    const connessioni = await helpers.chooseConnections(tp, profile.connection_prompt ?? "Connessioni vive dell'oggetto", context);

    const sessioni = activeContext.link ? [activeContext.link] : [];
    const created = await helpers.moveNote(tp, helpers.path("oggetti"), name);
    // Oggetti e ricompense creati al tavolo restano collegati alla sessione che li ha introdotti.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "oggetti" });
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return await helpers.renderFrontmatter("oggetto", {
        id,
        nome: helpers.yamlQuote(name),
        tipo: selectedType?.id ?? "",
        rarita: selectedRarity?.id ?? "",
        mondo,
        proprietario,
        luogo,
        gancio: helpers.yamlQuote(gancio),
        uso_al_tavolo: helpers.yamlQuote(usoAlTavolo),
        player_safe: helpers.yamlQuote(playerSafe),
        prossima_mossa: helpers.yamlQuote(prossimaMossa),
        connessioni: helpers.inlineYamlList(connessioni),
        sessioni: helpers.inlineYamlList(sessioni)
    });
}

module.exports = oggetto;
