async function nota_rapida(tp) {
    const helpers = tp.user.helpers;
    const name = await tp.system.prompt("Titolo della nota rapida", "Nota rapida");
    const id = helpers.slugify(name);

    await tp.file.move(`Inbox/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: nota rapida
tipo: idea
stato: da smistare
collegamenti: []
---
`;
}

module.exports = nota_rapida;
