async function collectSharedAdventureContext(tp, config) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, config.namePrompt);
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, config.worldPrompt);
    const context = { world: mondo };

    return { context, helpers, id, mondo, name };
}

async function createAdventure(tp) {
    const { context, helpers, id, mondo, name } = await collectSharedAdventureContext(tp, {
        namePrompt: "Nome dell'avventura",
        worldPrompt: "Mondo dell'avventura"
    });
    const campagne = await helpers.chooseCampaigns(tp, "Campagne collegate", context);
    const luoghi = await helpers.chooseLocations(tp, "Luoghi dell'avventura", context);
    const missioni = await helpers.chooseMissions(tp, "Missioni collegate", context);
    const incontri = await helpers.chooseEncounters(tp, "Incontri collegati", context);
    const ricompense = await helpers.chooseObjects(tp, "Ricompense", context);

    await helpers.moveNote(tp, helpers.path("missioni"), name);

    return await helpers.renderFrontmatter("adventure", {
        id: id,
        nome: helpers.yamlQuote(name),
        categoria: 'avventura',
        tipo: 'avventura',
        stato: 'bozza',
        mondo: mondo,
        campagne: helpers.inlineYamlList(campagne),
        luoghi: helpers.inlineYamlList(luoghi),
        missioni: helpers.inlineYamlList(missioni),
        incontri: helpers.inlineYamlList(incontri),
        ricompense: helpers.inlineYamlList(ricompense)
    });
}

async function createOneShot(tp) {
    const { context, helpers, id, mondo, name } = await collectSharedAdventureContext(tp, {
        namePrompt: "Nome della one-shot",
        worldPrompt: "Mondo della one-shot"
    });
    const livello = await helpers.promptOptional(tp, "Livello");
    const durata = await helpers.promptOptional(tp, "Durata prevista");
    const luoghi = await helpers.chooseLocations(tp, "Luoghi della one-shot", context);
    const incontri = await helpers.chooseEncounters(tp, "Incontri della one-shot", context);
    const personaggi = await helpers.choosePeople(tp, "PNG o PG collegati", context);

    await helpers.moveNote(tp, helpers.path("missioni"), name);

    return await helpers.renderFrontmatter("one_shot", {
        id: id,
        nome: helpers.yamlQuote(name),
        categoria: 'avventura',
        tipo: 'one-shot',
        stato: 'bozza',
        mondo: mondo,
        livello: livello,
        durata: helpers.yamlQuote(durata),
        luoghi: helpers.inlineYamlList(luoghi),
        incontri: helpers.inlineYamlList(incontri),
        personaggi: helpers.inlineYamlList(personaggi)
    });
}

module.exports = {
    createAdventure,
    createOneShot
};
