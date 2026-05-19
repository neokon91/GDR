async function oneShot(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della one-shot");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseNoteByFrontmatter(tp, "categoria", "mondo", "Mondo della one-shot");
    const livello = await helpers.promptOptional(tp, "Livello");
    const durata = await helpers.promptOptional(tp, "Durata prevista");
    const luoghi = await helpers.chooseNotesByPath(tp, "Mondi/Luoghi", "Luoghi della one-shot");
    const incontri = await helpers.chooseNotesByPath(tp, "Mondi/Incontri", "Incontri della one-shot");
    const personaggi = await helpers.chooseNotesByPath(tp, "Mondi/Personaggi", "PNG o PG collegati");

    await tp.file.move(`Mondi/Missioni/${name}`);

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
