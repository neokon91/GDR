async function culto(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della religione, divinità o culto");
    const id = helpers.slugify(name);
    const selectedSubtype = await helpers.chooseOptional(
        tp,
        [
            { label: "Religione", id: "religione" },
            { label: "Culto", id: "culto" },
            { label: "Divinità", id: "divinità" },
            { label: "Entità", id: "entità" }
        ],
        "Sottotipo"
    );
    const tipo = await helpers.promptOptional(tp, "Tipo o dominio");
    const mondo = await helpers.chooseWorld(tp, "Mondo della religione");
    const context = { world: mondo };
    const templi = await helpers.chooseLocations(tp, "Templi collegati", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni collegate", context);

    await helpers.moveNote(tp, helpers.path("religioni"), name);

    return await helpers.renderFrontmatter("culto", {
        id: id,
        nome: helpers.yamlQuote(name),
        categoria: 'religione',
        tipo: helpers.yamlQuote(tipo),
        sottotipo: selectedSubtype?.id ?? "",
        stato: 'bozza',
        canonico: 'false',
        stato_canonico: 'canonico',
        mondo: mondo,
        divinita: '[]',
        templi: helpers.inlineYamlList(templi),
        luoghi_sacri: helpers.inlineYamlList(templi),
        fazioni: helpers.inlineYamlList(fazioni),
        pressione: '0',
        prossima_mossa: "",
        eresie: '[]',
        calendario_rituale: '[]',
        influenza_politica: "",
        relazioni: '[]',
        propaga_a: '[]',
        entita_impattate: '[]',
        dogmi: '[]',
        rituali: '[]',
        misteri: '[]',
        indizi: '[]',
        scelte: '[]',
        rischi: '[]',
        ricompense: '[]',
        conseguenze: '[]',
        segreti: '[]'
    });
}

module.exports = culto;
