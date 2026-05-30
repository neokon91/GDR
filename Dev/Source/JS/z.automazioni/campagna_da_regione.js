async function campagnaDaRegione(tp) {
    const helpers = tp.user.helpers;
    const regione = await helpers.chooseLocation(tp, "Regione o luogo da trasformare in campagna");
    const regioneName = helpers.getLinkTargetName(regione);
    const name = await helpers.promptRequired(tp, "Nome della campagna", `Campagna - ${regioneName}`);
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo della campagna");
    const context = { world: mondo };
    const profilo = await helpers.chooseOptional(
        tp,
        [
            { label: "Sandbox", id: "sandbox" },
            { label: "Investigativo", id: "investigativo" },
            { label: "Politico", id: "politico" },
            { label: "Esplorazione", id: "esplorazione" },
            { label: "Guerra", id: "guerra" }
        ],
        "Profilo della campagna"
    );
    const fazioni = await helpers.chooseFactions(tp, "Poteri in gioco", context);
    const culture = await helpers.chooseNotesByPath(tp, helpers.path("culture"), "Culture coinvolte", context);
    const conflitti = await helpers.chooseNotesByPath(tp, helpers.path("conflitti"), "Conflitti collegati", context);
    const tono = await helpers.promptOptional(tp, "Tono della campagna");
    const promessa = await helpers.promptOptional(tp, "Promessa al tavolo");
    const calendario = await helpers.promptCalendar(tp, { world: mondo }, "Calendario Calendarium della campagna");

    await helpers.moveNote(tp, helpers.path("campagne"), name);

    return await helpers.renderFrontmatter("campagna_da_regione", {
        id: id,
        nome: helpers.yamlQuote(name),
        categoria: 'campagna',
        tipo: 'campagna',
        stato: 'preparazione',
        profilo: helpers.yamlQuote(profilo?.id ?? ""),
        tono: helpers.yamlQuote(tono),
        promessa: helpers.yamlQuote(promessa),
        calendario: helpers.yamlQuote(calendario),
        mondo: mondo,
        regione: regione,
        luoghi: `[${regione}]`,
        culture: helpers.inlineYamlList(culture),
        fazioni: helpers.inlineYamlList(fazioni),
        conflitti: helpers.inlineYamlList(conflitti),
        missioni: '[]',
        sessioni: '[]',
        ricompense: '[]',
        domande_campagna: '[]'
    });
}

module.exports = campagnaDaRegione;
