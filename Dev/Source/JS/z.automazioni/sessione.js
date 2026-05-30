async function sessione(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("sessione");
    const prompts = profile.prompts ?? {};
    const route = helpers.consumeRoute();
    const titolo = await helpers.promptRequired(tp, "Titolo della sessione", "Sessione");
    const data = await helpers.promptOptional(tp, "Data", tp.date.now("YYYY-MM-DD")) || tp.date.now("YYYY-MM-DD");
    const id = helpers.slugify(`${data}-${titolo}`);
    const creazioneCompleta = await helpers.askYesNo(tp, "Vuoi collegare subito cast, luoghi e materiali? Scegli No per una sessione rapida.");
    const mondo = route.mondo || await helpers.chooseWorld(tp, "Mondo della sessione");
    const context = { world: mondo };
    const routeList = key => helpers.normalizeFieldArray(route[key]);
    const selectedType = await helpers.chooseOptional(
        tp,
        [
            { label: "Sessione di campagna", id: "sessione di campagna" },
            { label: "Sessione zero", id: "sessione zero" },
            { label: "Interludio", id: "interludio" },
            { label: "Downtime", id: "downtime" },
            { label: "Finale", id: "finale" },
            { label: "One-shot", id: "one-shot" }
        ],
        "Tipo di sessione"
    );
    const obiettivo = await helpers.promptOptional(tp, "Obiettivo della sessione", route.obiettivo ?? "");
    const apertura = await helpers.promptOptional(tp, "Prima scena / apertura", route.apertura ?? "");
    const scelta = await helpers.promptOptional(tp, "Scelta concreta per i giocatori");
    const campagneDaRotta = routeList("campagne");
    const luoghiDaRotta = routeList("luoghi");
    const missioniDaRotta = routeList("missioni");
    const tracciatiDaRotta = routeList("tracciati");
    const fazioniDaRotta = routeList("fazioni");
    const campagne = creazioneCompleta ? (campagneDaRotta.length ? campagneDaRotta : await helpers.chooseCampaigns(tp, "Campagne collegate", context)) : [];
    const luoghi = creazioneCompleta ? (luoghiDaRotta.length ? luoghiDaRotta : await helpers.chooseLocations(tp, "Luoghi in scena", context)) : [];
    const personaggi = creazioneCompleta ? await helpers.choosePeople(tp, "Personaggi in scena", context) : [];
    const missioni = creazioneCompleta ? (missioniDaRotta.length ? missioniDaRotta : await helpers.chooseMissions(tp, "Missioni vive", context)) : [];
    const tracciati = creazioneCompleta ? (tracciatiDaRotta.length ? tracciatiDaRotta : await helpers.chooseTracks(tp, "Clock e tracciati attivi", context)) : [];
    const creature = creazioneCompleta ? await helpers.chooseCreatures(tp, "Creature in scena", context) : [];
    const incontri = creazioneCompleta ? await helpers.chooseEncounters(tp, "Incontri previsti", context) : [];
    const dispense = creazioneCompleta ? await helpers.chooseHandouts(tp, "Dispense previste", context) : [];
    const fazioni = creazioneCompleta ? (fazioniDaRotta.length ? fazioniDaRotta : await helpers.chooseFactions(tp, "Fazioni in scena", context)) : [];
    const oggetti = creazioneCompleta ? await helpers.chooseObjects(tp, "Oggetti in scena", context) : [];
    const riferimentiRegola = creazioneCompleta ? await helpers.promptWikilinkTargets(tp, prompts.riferimenti_regola ?? "Riferimenti regola o SRD da tenere aperti") : [];

    await helpers.moveNote(tp, helpers.path("sessioni"), `${data} - ${titolo}`);

    return await helpers.renderFrontmatter("sessione", {
        id: id,
        nome: helpers.yamlQuote(titolo),
        cssclasses: '[tavolo]',
        categoria: 'sessione',
        fileClass: 'sessione',
        tipo: selectedType?.id ?? "",
        data: data,
        data_mondo: "",
        stato: 'preparazione',
        attiva: 'false',
        mondo: mondo,
        campagne: helpers.inlineYamlList(campagne),
        luoghi: helpers.inlineYamlList(luoghi),
        personaggi: helpers.inlineYamlList(personaggi),
        missioni: helpers.inlineYamlList(missioni),
        tracciati: helpers.inlineYamlList(tracciati),
        creature: helpers.inlineYamlList(creature),
        incontri: helpers.inlineYamlList(incontri),
        dispense: helpers.inlineYamlList(dispense),
        fazioni: helpers.inlineYamlList(fazioni),
        oggetti: helpers.inlineYamlList(oggetti),
        appunti_live: '[]',
        scena_corrente: helpers.yamlQuote(apertura),
        decisioni_prese: '[]',
        obiettivo: helpers.yamlQuote(obiettivo),
        apertura: helpers.yamlQuote(apertura),
        scelta: helpers.yamlQuote(scelta),
        scene: '[]',
        ricompense: '[]',
        segreti_rivelabili: '[]',
        domande_al_tavolo: '[]',
        decisioni_attese: '[]',
        pressioni: '[]',
        materiale_pronto: '[]',
        conseguenze: '[]',
        recap_pubblico: '[]',
        recap_dm: '[]',
        prossima_apertura: "",
        output_sessione: '[]',
        fonti: helpers.inlineYamlWikilinkList([...campagne, ...luoghi, ...personaggi, ...missioni, ...tracciati, ...dispense, ...oggetti]),
        riferimenti_srd: helpers.inlineYamlWikilinkList(riferimentiRegola),
        riferimenti_regola: helpers.inlineYamlWikilinkList(riferimentiRegola),
        sezioni_collegate: '[]',
        blocchi_collegati: '[]',
        tabelle_collegate: '[]',
        tags: helpers.inlineYamlTextList(["gdr/bozza"])
    });
}

module.exports = sessione;
