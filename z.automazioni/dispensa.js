async function dispensa(tp) {
    const helpers = tp.user.helpers;
    const name = await tp.system.prompt("Titolo dispensa");
    const id = helpers.slugify(name);

    await tp.file.move(`Mondo/Dispense/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: dispensa
tipo:
stato: bozza
luogo:
personaggi: []
sessioni: []
---
`;
}

module.exports = dispensa;
