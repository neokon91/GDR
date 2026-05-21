async function lore_capture(tp, routeOptions = {}) {
    const helpers = tp.user.helpers;
    const route = Object.keys(routeOptions).length ? routeOptions : helpers.consumeRoute();
    const activeContext = helpers.getActiveSessionContext();
    const name = await helpers.promptRequired(tp, "Titolo evento o appunto lore", route.defaultName ?? "Evento emerso");
    const id = helpers.slugify(name);
    const selectedType = route.tipo
        ? { id: route.tipo }
        : await helpers.chooseOptional(
        tp,
        [
            { label: "Evento", id: "evento" },
            { label: "PNG improvvisato", id: "png improvvisato" },
            { label: "Luogo improvvisato", id: "luogo improvvisato" },
            { label: "Dialogo", id: "dialogo" },
            { label: "Conseguenza", id: "conseguenza" },
            { label: "Idea", id: "idea" }
        ],
        "Tipo di lore"
    );
    const mondo = route.useActiveSession && activeContext.world
        ? activeContext.world
        : await helpers.chooseWorld(tp, "Mondo di riferimento");
    const context = { world: mondo };
    const sessioni = route.useActiveSession && activeContext.link
        ? [activeContext.link]
        : await helpers.chooseSessions(tp, "Sessione collegata", context);
    const collegamenti = await helpers.chooseCoreConnection(tp, "Collega l'appunto a luogo, PNG, fazione, missione, clock o mappa", context);
    const entitaImpattate = selectedType?.id === "conseguenza"
        ? await helpers.chooseConnections(tp, "Entita impattate dalla conseguenza", context)
        : collegamenti;
    const propagaA = selectedType?.id === "conseguenza"
        ? await helpers.chooseConnections(tp, "Dove deve propagarsi", context)
        : [];
    const calendario = await helpers.promptCalendar(tp, { world: mondo });

    const created = await helpers.moveNote(tp, "Inbox", name);
    // Gli eventi live devono tornare nella sessione attiva per il post-sessione e la canonizzazione.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "appunti_live" });
    await helpers.linkCreatedNoteToConnections(created, [...collegamenti, ...entitaImpattate, ...propagaA]);

    return await helpers.renderFrontmatter("lore_capture", {
        id: id,
        nome: helpers.yamlQuote(name),
        categoria: 'lore capture',
        tipo: selectedType?.id ?? "evento",
        stato: 'da smistare',
        stato_canonico: 'rumor',
        canonico: 'false',
        fonte: 'sessione',
        fonte_note: "",
        grado_certezza: 'medio',
        contraddice: '[]',
        retcon_di: '[]',
        retcon_motivo: "",
        mondo: mondo,
        sessioni: helpers.inlineYamlList(sessioni),
        collegamenti: helpers.inlineYamlList(collegamenti),
        entita_impattate: helpers.inlineYamlList(entitaImpattate),
        propaga_a: helpers.inlineYamlList(propagaA),
        data_mondo: "",
        data_reale: "",
        fc_calendar: helpers.yamlQuote(calendario),
        fc_date: "",
        fc_category: 'conseguenza',
        fc_display_name: helpers.yamlQuote(name),
        giocabile: 'false',
        causa: "",
        stato_mondo: '[]',
        scelte: '[]',
        rischi: '[]',
        indizi: '[]',
        png_coinvolti: '[]',
        ricompense: '[]',
        conseguenze: '[]',
        prossima_mossa: "",
        impatto: '[]',
        azioni: '[]',
        canonizza_evento: 'false',
        collega_al_mondo: 'false',
        aggiorna_png: 'false',
        aggiorna_luogo: 'false',
        aggiorna_missione: 'false',
        aggiorna_tracciato: 'false',
        archivia_appunto: 'false'
    });
}

module.exports = lore_capture;
