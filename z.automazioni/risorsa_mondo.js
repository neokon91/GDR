async function risorsa_mondo(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della risorsa");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo della risorsa");
    const context = { world: mondo };
    const luoghi = await helpers.chooseLocations(tp, "Luoghi di origine o estrazione", context);
    const fazioni = await helpers.chooseFactions(tp, "Controllori o pretendenti", context);
    const uso = await helpers.promptOptional(tp, "Uso narrativo o strategico");
    const scarsita = await helpers.promptOptional(tp, "Scarsita, monopolio o problema");
    const conseguenza = await helpers.promptOptional(tp, "Conseguenza se manca");

    await helpers.moveNote(tp, helpers.path("risorse_mondo"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: risorsa
fileClass: risorsa
tipo: risorsa
stato: bozza
mondo: ${mondo}
luoghi: ${helpers.inlineYamlList(luoghi)}
regioni: ${helpers.inlineYamlList(luoghi)}
fazioni_controllanti: ${helpers.inlineYamlList(fazioni)}
fazioni: ${helpers.inlineYamlList(fazioni)}
uso_narrativo: ${helpers.yamlQuote(uso)}
usi: ${helpers.inlineYamlTextList([uso])}
scarsita: ${helpers.yamlQuote(scarsita)}
rischi: []
dipendenze: []
luoghi_dipendenti: []
rotte: []
mercati: []
conseguenze_se_bloccata: ${helpers.inlineYamlTextList([conseguenza])}
conseguenze: ${helpers.inlineYamlTextList([conseguenza])}
pressione: 0
prossima_mossa:
missioni: []
conflitti: []
sessioni: []
culture: []
eventi: []
mappe: []
coordinate:
mappa:
layer_mappa: commerciale
tipo_mappa: commerciale
propaga_a: []
entita_impattate: []
domande_aperte: []
---

`;
}

module.exports = risorsa_mondo;
