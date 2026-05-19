async function campagna(tp) {
    const helpers = tp.user.helpers;
    const name = await tp.system.prompt("Nome della campagna");
    const id = helpers.slugify(name);

    await tp.file.move(`Campagne/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: campagna
tipo:
stato: preparazione
tono:
livello_attuale:
personaggi: []
luoghi: []
fazioni: []
sessioni: []
---
`;
}

module.exports = campagna;
