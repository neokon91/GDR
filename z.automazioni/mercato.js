async function mercato(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del mercato o nodo commerciale");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo del nodo");
    const context = { world: mondo };
    const luogo = await helpers.chooseLocation(tp, "Luogo principale", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni che lo controllano", context);
    const risorse = await helpers.chooseWorldResources(tp, "Risorse trattate", context);
    const rischio = await helpers.promptOptional(tp, "Rischio o tensione commerciale");
    const gancio = await helpers.promptOptional(tp, "Gancio giocabile del nodo");
    const usoAlTavolo = await helpers.promptOptional(tp, "Uso al tavolo");
    const playerSafe = await helpers.promptOptional(tp, "Versione player-safe");
    const prossimaMossa = await helpers.promptOptional(tp, "Prossima mossa");
    const connessioni = await helpers.chooseConnections(tp, "Connessioni vive del mercato", context);

    const created = await helpers.moveNote(tp, helpers.path("mercati"), name);
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: risorsa
fileClass: mercato
tipo: mercato
stato: bozza
mondo: ${mondo}
luogo: ${luogo}
luoghi: ${helpers.inlineYamlList([luogo])}
regioni: []
fazioni_controllanti: ${helpers.inlineYamlList(fazioni)}
fazioni: ${helpers.inlineYamlList(fazioni)}
risorse: ${helpers.inlineYamlList(risorse)}
rotte: []
pedaggi: []
rischi: ${helpers.inlineYamlTextList([rischio])}
dipendenze: []
pressione: 0
gancio: ${helpers.yamlQuote(gancio)}
uso_al_tavolo: ${helpers.yamlQuote(usoAlTavolo)}
player_safe: ${helpers.yamlQuote(playerSafe)}
prossima_mossa: ${helpers.yamlQuote(prossimaMossa)}
connessioni: ${helpers.inlineYamlList(connessioni)}
missioni: []
conflitti: []
sessioni: []
mappe: []
coordinate:
mappa:
layer_mappa: commerciale
tipo_mappa: commerciale
propaga_a: []
entita_impattate: []
conseguenze: []
domande_aperte: []
---

`;
}

module.exports = mercato;
