async function mondo(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del mondo");
    const id = helpers.slugify(name);
    const tono = await helpers.promptOptional(tp, "Tono");
    const tema = await helpers.promptOptional(tp, "Tema");
    const tecnologia = await helpers.promptOptional(tp, "Tecnologia");
    const magia = await helpers.promptOptional(tp, "Magia");

    await helpers.moveNote(tp, helpers.PATHS.mondi, name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: mondo
stato: bozza
tono: ${helpers.yamlQuote(tono)}
tema: ${helpers.yamlQuote(tema)}
tecnologia: ${helpers.yamlQuote(tecnologia)}
magia: ${helpers.yamlQuote(magia)}
continenti: []
fazioni: []
religioni: []
campagne: []
canonico: false
---
`;
}

module.exports = mondo;
