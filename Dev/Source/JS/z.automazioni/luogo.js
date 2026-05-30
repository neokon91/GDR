async function luogo(tp, routeOptions = {}){
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("luogo");
    const prompts = profile.prompts ?? {};
    const activeContext = helpers.getActiveSessionContext();
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome del luogo");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, profile.completion_prompt ?? "Vuoi compilare collegamenti e lore ora? Scegli No per un luogo rapido.");
    const route = Object.keys(routeOptions).length ? routeOptions : helpers.consumeRoute();
    const selectedType = await helpers.chooseProfileOption(tp, profile, route);
    const funzioneLuogo = selectedType?.id === "sito di interesse"
        ? await helpers.promptOptional(tp, prompts.funzione_luogo ?? "Funzione del sito (tempio, rovina, dungeon, fortezza, santuario...)")
        : "";
    const selectedBiome = creazioneCompleta ? await helpers.chooseOptional(
        tp,
        profile.biome_options ?? [],
        profile.biome_prompt ?? "Bioma"
    ) : null;
    const mondo = await helpers.chooseWorld(tp, profile.world_prompt ?? "Mondo del luogo");
    const context = { world: mondo };
    const pericolo = await helpers.promptOptional(tp, prompts.pericolo ?? "Pericolo da 0 a 10");
    const gancio = await helpers.promptOptional(tp, prompts.gancio ?? "Gancio giocabile: perche questo luogo importa adesso?");
    const usoAlTavolo = await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso al tavolo: scelta, rischio o scena che produce");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Versione player-safe mostrabile");
    const luogoPadre = creazioneCompleta ? await helpers.chooseLocation(tp, prompts.luogo_padre ?? "Luogo o regione superiore", context) : "";
    const fazioni = creazioneCompleta ? await helpers.chooseFactions(tp, prompts.fazioni ?? "Fazioni presenti o interessate", context) : [];
    const personaggi = creazioneCompleta ? await helpers.choosePeople(tp, prompts.personaggi ?? "PNG collegati al luogo", context) : [];
    const missioni = creazioneCompleta ? await helpers.chooseMissions(tp, prompts.missioni ?? "Missioni collegate al luogo", context) : [];
    const veritaNascosta = creazioneCompleta ? await helpers.promptOptional(tp, prompts.verita_nascosta ?? "Verità nascosta o segreto") : "";
    const connessioni = await helpers.chooseConnections(tp, profile.connection_prompt ?? "Connessioni vive del luogo", context);
    const sessioni = activeContext.link ? [activeContext.link] : [];
    const created = await helpers.moveNote(tp, helpers.path("luoghi"), name);
    // Un luogo creato al volo viene collegato alla sessione per ritrovarlo nella vista del tavolo.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "luoghi" });
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return await helpers.renderFrontmatter("luogo", {
        id,
        nome: helpers.yamlQuote(name),
        famiglia_luogo: route.category ?? "",
        tipo: selectedType?.id ?? "",
        funzione_luogo: helpers.yamlQuote(funzioneLuogo),
        bioma: selectedBiome?.id ?? "",
        mondo,
        luogo_padre: luogoPadre,
        pericolo,
        gancio: helpers.yamlQuote(gancio),
        uso_al_tavolo: helpers.yamlQuote(usoAlTavolo),
        player_safe: helpers.yamlQuote(playerSafe),
        fazioni: helpers.inlineYamlList(fazioni),
        personaggi: helpers.inlineYamlList(personaggi),
        missioni: helpers.inlineYamlList(missioni),
        sessioni: helpers.inlineYamlList(sessioni),
        segreti: helpers.inlineYamlTextList([veritaNascosta]),
        connessioni: helpers.inlineYamlList(connessioni)
    });
}

module.exports = luogo;
