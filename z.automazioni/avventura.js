async function avventura(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome dell'avventura");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseNoteByFrontmatter(tp, "categoria", "mondo", "Mondo dell'avventura");
    const campagne = await helpers.chooseNotesByPath(tp, "Campagne", "Campagne collegate");
    const luoghi = await helpers.chooseNotesByPath(tp, "Mondi/Luoghi", "Luoghi dell'avventura");
    const missioni = await helpers.chooseNotesByPath(tp, "Mondi/Missioni", "Missioni collegate");
    const incontri = await helpers.chooseNotesByPath(tp, "Mondi/Incontri", "Incontri collegati");
    const ricompense = await helpers.chooseNotesByPath(tp, "Mondi/Oggetti", "Ricompense");

    await tp.file.move(`Mondi/Missioni/${name}`);

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
