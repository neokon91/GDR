async function avventura(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome dell'avventura");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo dell'avventura");
    const context = { world: mondo };
    const campagne = await helpers.chooseCampaigns(tp, "Campagne collegate", context);
    const luoghi = await helpers.chooseLocations(tp, "Luoghi dell'avventura", context);
    const missioni = await helpers.chooseMissions(tp, "Missioni collegate", context);
    const incontri = await helpers.chooseEncounters(tp, "Incontri collegati", context);
    const ricompense = await helpers.chooseObjects(tp, "Ricompense", context);

    await helpers.moveNote(tp, helpers.PATHS.missioni, name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: avventura
tipo: avventura
stato: bozza
mondo: ${mondo}
campagne: ${helpers.inlineYamlList(campagne)}
luoghi: ${helpers.inlineYamlList(luoghi)}
missioni: ${helpers.inlineYamlList(missioni)}
incontri: ${helpers.inlineYamlList(incontri)}
ricompense: ${helpers.inlineYamlList(ricompense)}
---
`;
}

module.exports = avventura;
