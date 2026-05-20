async function cultura(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della cultura o popolo");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo della cultura");
    const context = { world: mondo };
    const luoghi = await helpers.chooseLocations(tp, "Regioni o luoghi dove vive", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni collegate", context);
    const religioni = await helpers.chooseReligions(tp, "Religioni collegate", context);
    const tratto = await helpers.promptOptional(tp, "Cosa rende riconoscibile questa cultura");
    const tensione = await helpers.promptOptional(tp, "Tensione interna o problema");
    const segreto = await helpers.promptOptional(tp, "Verità nascosta o tabù");

    await helpers.moveNote(tp, helpers.path("culture"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: cultura
tipo: cultura
stato: bozza
canonico: false
mondo: ${mondo}
luoghi: ${helpers.inlineYamlList(luoghi)}
lingue: []
religioni: ${helpers.inlineYamlList(religioni)}
fazioni: ${helpers.inlineYamlList(fazioni)}
usi: []
tabu: []
feste: []
leggi: []
risorse: []
tensioni: ${helpers.inlineYamlTextList([tensione])}
segreti: ${helpers.inlineYamlTextList([segreto])}
domande_aperte: []
---

`;
}

module.exports = cultura;
