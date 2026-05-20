async function conflitto(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del conflitto");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo del conflitto");
    const context = { world: mondo };
    const fazioni = await helpers.chooseFactions(tp, "Fazioni coinvolte", context);
    const luoghi = await helpers.chooseLocations(tp, "Luoghi coinvolti", context);
    const posta = await helpers.promptOptional(tp, "Cosa c'è in gioco");
    const prossimaMossa = await helpers.promptOptional(tp, "Prossima mossa se nessuno interviene");

    await helpers.moveNote(tp, helpers.path("conflitti"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: conflitto
tipo: conflitto
stato: in corso
canonico: true
mondo: ${mondo}
pressione: 5
posta: ${helpers.yamlQuote(posta)}
prossima_mossa: ${helpers.yamlQuote(prossimaMossa)}
fazioni: ${helpers.inlineYamlList(fazioni)}
luoghi: ${helpers.inlineYamlList(luoghi)}
culture: []
religioni: []
missioni: []
conseguenze: []
segreti: []
domande_aperte: []
---

`;
}

module.exports = conflitto;
