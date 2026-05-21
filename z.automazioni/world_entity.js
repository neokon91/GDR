async function world_entity(tp) {
    const helpers = tp.user.helpers;
    const route = helpers.consumeRoute();
    const name = await helpers.promptRequired(tp, "Nome");
    const world = await helpers.chooseWorld(tp, "Mondo di riferimento");
    const identity = await helpers.promptOptional(tp, "Identita in una frase");
    const tableUse = await helpers.promptOptional(tp, "Uso al tavolo");
    const playerSafe = await helpers.promptOptional(tp, "Versione player-safe");
    const secret = await helpers.promptOptional(tp, "Segreto o livello DM");
    const consequence = await helpers.promptOptional(tp, "Conseguenza potenziale");
    const connections = await helpers.chooseConnections(tp, "Scegli almeno due connessioni vive", { world });
    const folder = helpers.path(route.folder ?? "compendium");

    await helpers.moveNote(tp, folder, name);

    return await helpers.renderFrontmatter("world_entity", {
        id: helpers.yamlQuote(helpers.slugify(name)),
        nome: helpers.yamlQuote(name),
        categoria: helpers.yamlQuote(route.category ?? "compendium"),
        tipo: helpers.yamlQuote(route.subtype ?? route.family ?? "voce"),
        famiglia_creativa: helpers.yamlQuote(route.family ?? ""),
        stato: 'bozza',
        mondo: helpers.yamlQuote(world),
        gancio: helpers.yamlQuote(identity),
        identita: helpers.yamlQuote(identity),
        uso_al_tavolo: helpers.yamlQuote(tableUse),
        player_safe: helpers.yamlQuote(playerSafe),
        segreto: helpers.yamlQuote(secret),
        conseguenza_potenziale: helpers.yamlQuote(consequence),
        connessioni: helpers.inlineYamlList(connections),
        propaga_a: '[]',
        entita_impattate: '[]',
        pressione: '0',
        prossima_mossa: '""',
        pubblico: 'false',
        canonico: 'false'
    });
}

module.exports = world_entity;
