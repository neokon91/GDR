async function missione(tp) {
    const helpers = tp.user.helpers;
    const name = await tp.system.prompt("Nome della missione");
    const id = helpers.slugify(name);

    await tp.file.move(`Mondo/Missioni/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: missione
tipo:
stato: proposta
committente:
luoghi: []
personaggi: []
fazioni: []
ricompense: []
---
`;
}

module.exports = missione;
