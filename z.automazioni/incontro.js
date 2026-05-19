async function incontro(tp) {
    const helpers = tp.user.helpers;
    const name = await tp.system.prompt("Nome dell'incontro");
    const id = helpers.slugify(name);

    await tp.file.move(`Mondo/Incontri/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: incontro
tipo:
stato: bozza
luogo:
creature: []
personaggi: []
pericolo:
ricompense: []
---
`;
}

module.exports = incontro;
