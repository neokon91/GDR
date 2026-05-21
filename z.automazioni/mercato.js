async function mercato(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("mercato");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome del mercato o nodo commerciale");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, profile.world_prompt ?? "Mondo del nodo");
    const context = { world: mondo };
    const luogo = await helpers.chooseLocation(tp, prompts.luogo ?? "Luogo principale", context);
    const fazioni = await helpers.chooseFactions(tp, prompts.fazioni ?? "Fazioni che lo controllano", context);
    const risorse = await helpers.chooseWorldResources(tp, prompts.risorse ?? "Risorse trattate", context);
    const rischio = await helpers.promptOptional(tp, prompts.rischio ?? "Rischio o tensione commerciale");
    const gancio = await helpers.promptOptional(tp, prompts.gancio ?? "Gancio giocabile del nodo");
    const usoAlTavolo = await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso al tavolo");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Versione player-safe");
    const prossimaMossa = await helpers.promptOptional(tp, prompts.prossima_mossa ?? "Prossima mossa");
    const connessioni = await helpers.chooseConnections(tp, profile.connection_prompt ?? "Connessioni vive del mercato", context);

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
