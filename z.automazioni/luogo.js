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
    const selectedBiome = creazioneCompleta ? await helpers.chooseOptional(
        tp,
        profile.biome_options ?? [],
        profile.biome_prompt ?? "Bioma"
    ) : null;
    const mondo = await helpers.chooseWorld(tp, profile.world_prompt ?? "Mondo del luogo");
    const context = { world: mondo };
    const pericolo = await helpers.promptOptional(tp, prompts.pericolo ?? "Pericolo da 0 a 10");
    const origine = await helpers.promptOptional(tp, prompts.origine ?? "Origine storica, fisica o mitica del luogo");
    const gancio = await helpers.promptOptional(tp, prompts.gancio ?? "Gancio giocabile: perche questo luogo importa adesso?");
    const impressione = await helpers.promptOptional(tp, prompts.impressione ?? "Prima impressione");
    const tensione = await helpers.promptOptional(tp, prompts.tensione ?? "Tensione o conflitto locale");
    const dipendenze = creazioneCompleta ? await helpers.promptOptional(tp, prompts.dipendenze ?? "Dipendenze materiali, politiche o naturali del luogo") : "";
    const simboliVisibili = creazioneCompleta ? await helpers.promptOptional(tp, prompts.simboli_visibili ?? "Segni visibili, suoni, rituali o architetture distintive") : "";
    const bisognoQuotidiano = await helpers.promptOptional(tp, prompts.bisogno_quotidiano ?? "Bisogno quotidiano che rende vivo il luogo");
    const costoSociale = await helpers.promptOptional(tp, prompts.costo_sociale ?? "Chi soffre se il luogo cambia o resta com'e");
    const evoluzioneSeIgnorata = await helpers.promptOptional(tp, prompts.evoluzione_se_ignorata ?? "Come evolve se nessuno interviene");
    const usoAlTavolo = await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso al tavolo: scelta, rischio o scena che produce");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Versione player-safe mostrabile");
    const luogoPadre = creazioneCompleta ? await helpers.chooseLocation(tp, prompts.luogo_padre ?? "Luogo o regione superiore", context) : "";
    const governante = creazioneCompleta ? await helpers.choosePerson(tp, prompts.governante ?? "Governante o referente", context) : "";
    const fazioni = creazioneCompleta ? await helpers.chooseFactions(tp, prompts.fazioni ?? "Fazioni presenti o interessate", context) : [];
    const personaggi = creazioneCompleta ? await helpers.choosePeople(tp, prompts.personaggi ?? "PNG collegati al luogo", context) : [];
    const missioni = creazioneCompleta ? await helpers.chooseMissions(tp, prompts.missioni ?? "Missioni collegate al luogo", context) : [];
    const funzioneNarrativa = creazioneCompleta ? await helpers.promptOptional(tp, prompts.funzione_narrativa ?? "Funzione narrativa del luogo") : "";
    const veritaNascosta = creazioneCompleta ? await helpers.promptOptional(tp, prompts.verita_nascosta ?? "Verità nascosta o segreto") : "";
    const domandaAperta = creazioneCompleta ? await helpers.promptOptional(tp, prompts.domanda_aperta ?? "Domanda aperta da esplorare al tavolo") : "";
    const connessioni = await helpers.chooseConnections(tp, profile.connection_prompt ?? "Connessioni vive del luogo", context);
    const sessioni = activeContext.link ? [activeContext.link] : [];
    const created = await helpers.moveNote(tp, helpers.path("luoghi"), name);
    // Un luogo creato al volo viene collegato alla sessione per ritrovarlo nel cockpit.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "luoghi" });
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return await helpers.renderFrontmatter("luogo", {
        id,
        nome: helpers.yamlQuote(name),
        famiglia_luogo: route.category ?? "",
        tipo: selectedType?.id ?? "",
        sottotipo: selectedType?.id ?? "",
        tipologia: selectedType?.id ?? "",
        bioma: selectedBiome?.id ?? "",
        mondo,
        luogo_padre: luogoPadre,
        governante,
        pericolo,
        impressione: helpers.yamlQuote(impressione),
        origine: helpers.yamlQuote(origine),
        gancio: helpers.yamlQuote(gancio),
        uso_al_tavolo: helpers.yamlQuote(usoAlTavolo),
        player_safe: helpers.yamlQuote(playerSafe),
        funzione_narrativa: helpers.yamlQuote(funzioneNarrativa),
        tensione: helpers.yamlQuote(tensione),
        dipendenze: helpers.inlineYamlTextList([dipendenze]),
        simboli_visibili: helpers.inlineYamlTextList([simboliVisibili]),
        bisogno_quotidiano: helpers.yamlQuote(bisognoQuotidiano),
        costo_sociale: helpers.yamlQuote(costoSociale),
        evoluzione_se_ignorata: helpers.yamlQuote(evoluzioneSeIgnorata),
        fazioni: helpers.inlineYamlList(fazioni),
        personaggi: helpers.inlineYamlList(personaggi),
        missioni: helpers.inlineYamlList(missioni),
        sessioni: helpers.inlineYamlList(sessioni),
        segreti: helpers.inlineYamlTextList([veritaNascosta]),
        domande_aperte: helpers.inlineYamlTextList([domandaAperta]),
        connessioni: helpers.inlineYamlList(connessioni)
    });
}

module.exports = luogo;
