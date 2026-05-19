async function oneShot(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della one-shot");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo della one-shot");
    const context = { world: mondo };
    const livello = await helpers.promptOptional(tp, "Livello");
    const durata = await helpers.promptOptional(tp, "Durata prevista");
    const luoghi = await helpers.chooseLocations(tp, "Luoghi della one-shot", context);
    const incontri = await helpers.chooseEncounters(tp, "Incontri della one-shot", context);
    const personaggi = await helpers.choosePeople(tp, "PNG o PG collegati", context);

    await helpers.moveNote(tp, helpers.path("missioni"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: avventura
tipo: one-shot
stato: bozza
mondo: ${mondo}
livello: ${livello}
durata: ${helpers.yamlQuote(durata)}
luoghi: ${helpers.inlineYamlList(luoghi)}
incontri: ${helpers.inlineYamlList(incontri)}
personaggi: ${helpers.inlineYamlList(personaggi)}
---
`;
}

module.exports = oneShot;
