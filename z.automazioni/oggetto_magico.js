async function oggettoMagico(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome dell'oggetto magico");
    const id = helpers.slugify(name);
    const rarita = await helpers.chooseOptional(
        tp,
        [
            { label: "Comune", id: "comune" },
            { label: "Non comune", id: "non comune" },
            { label: "Raro", id: "raro" },
            { label: "Molto raro", id: "molto raro" },
            { label: "Leggendario", id: "leggendario" },
            { label: "Artefatto", id: "artefatto" }
        ],
        "Rarità"
    );
    const mondo = await helpers.chooseWorld(tp, "Mondo dell'oggetto magico");
    const context = { world: mondo };
    const proprietario = await helpers.choosePerson(tp, "Proprietario", context);
    const luogo = await helpers.chooseLocation(tp, "Luogo dell'oggetto magico", context);

    await helpers.moveNote(tp, helpers.path("oggetti"), name);

    return await helpers.renderFrontmatter("oggetto_magico", {
        id: id,
        nome: helpers.yamlQuote(name),
        categoria: 'oggetto',
        tipo: 'oggetto magico',
        rarita: rarita?.id ?? "",
        sintonia: 'false',
        cariche: "",
        maledizione: 'false',
        stato: 'bozza',
        canonico: 'false',
        mondo: mondo,
        proprietario: proprietario,
        luogo: luogo
    });
}

module.exports = oggettoMagico;
