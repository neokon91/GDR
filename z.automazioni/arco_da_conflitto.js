async function arcoDaConflitto(tp) {
    const helpers = tp.user.helpers;
    const conflitto = await helpers.chooseNoteByPath(tp, helpers.path("conflitti"), "Conflitto da trasformare in arco", "Nessuno");
    const conflittoName = helpers.getLinkTargetName(conflitto);
    const name = await helpers.promptRequired(tp, "Nome dell'arco narrativo", `Arco - ${conflittoName}`);
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo dell'arco");
    const context = { world: mondo };
    const campagna = await helpers.chooseNoteByPath(tp, helpers.path("campagne"), "Campagna collegata", "Nessuna", context);
    const luoghi = await helpers.chooseLocations(tp, "Luoghi dell'arco", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni dell'arco", context);
    const ricompense = await helpers.chooseObjects(tp, "Ricompense possibili", context);
    const posta = await helpers.promptOptional(tp, "Cosa c'è in gioco");
    const prossimaMossa = await helpers.promptOptional(tp, "Prossima mossa se i PG non intervengono");
    const scadenzaMondo = await helpers.promptOptional(tp, "Scadenza nel mondo");
    const calendario = await helpers.promptCalendar(tp, { world: mondo, campaigns: campagna ? [campagna] : [] });

    await helpers.moveNote(tp, helpers.path("missioni"), name);

    return await helpers.renderFrontmatter("arco_da_conflitto", {
        id: id,
        nome: helpers.yamlQuote(name),
        categoria: 'missione',
        tipo: 'arco narrativo',
        stato: 'proposta',
        mondo: mondo,
        campagne: campagna ? `[${campagna}]` : "[]",
        conflitti: conflitto ? `[${conflitto}]` : "[]",
        luoghi: helpers.inlineYamlList(luoghi),
        fazioni: helpers.inlineYamlList(fazioni),
        personaggi: '[]',
        ricompense: helpers.inlineYamlList(ricompense),
        pressione: '5',
        posta: helpers.yamlQuote(posta),
        prossima_mossa: helpers.yamlQuote(prossimaMossa),
        scadenza_mondo: helpers.yamlQuote(scadenzaMondo),
        missioni_figlie: '[]',
        sessioni: '[]',
        domande_aperte: '[]',
        indizi: '[]',
        ostacoli: '[]',
        conseguenze: '[]',
        segreti: '[]',
        fc_calendar: helpers.yamlQuote(calendario),
        fc_date: "",
        fc_category: 'scadenza',
        fc_display_name: helpers.yamlQuote(name),
        fc_end: ""
    });
}

module.exports = arcoDaConflitto;
