async function mondo(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del mondo");
    const id = helpers.slugify(name);
    const tono = await helpers.promptOptional(tp, "Tono");
    const tema = await helpers.promptOptional(tp, "Tema");
    const premessa = await helpers.promptOptional(tp, "Promessa del mondo");

    await helpers.moveNote(tp, helpers.path("mondi"), name);

    return await helpers.renderFrontmatter("mondo", {
        id: id,
        nome: helpers.yamlQuote(name),
        categoria: 'mondo',
        fileClass: 'mondo',
        stato: 'bozza',
        canonico: 'false',
        tono: helpers.yamlQuote(tono),
        tema: helpers.yamlQuote(tema),
        premessa: helpers.yamlQuote(premessa),
        gancio: helpers.yamlQuote(premessa),
        campagne: '[]',
        cosmologie: '[]',
        regioni: '[]',
        culture_fondative: '[]',
        fonti: '[]',
        connessioni: '[]',
        segreti: '[]',
    });
}

module.exports = mondo;
