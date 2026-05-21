async function rotta(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("rotta");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome della rotta");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, profile.world_prompt ?? "Mondo della rotta");
    const context = { world: mondo };
    const partenza = await helpers.chooseLocation(tp, prompts.partenza ?? "Luogo di partenza", context);
    const arrivo = await helpers.chooseLocation(tp, prompts.arrivo ?? "Luogo di arrivo", context);
    const regioni = await helpers.chooseLocations(tp, prompts.regioni ?? "Regioni attraversate", context);
    const fazioni = await helpers.chooseFactions(tp, prompts.fazioni ?? "Fazioni controllanti", context);
    const risorse = await helpers.chooseWorldResources(tp, prompts.risorse ?? "Risorse trasportate", context);
    const rischio = await helpers.promptOptional(tp, prompts.rischio ?? "Rischio principale");
    const pedaggio = await helpers.promptOptional(tp, prompts.pedaggio ?? "Pedaggio o costo di passaggio");
    const conseguenza = await helpers.promptOptional(tp, prompts.conseguenza ?? "Conseguenza se bloccata");
    const gancio = await helpers.promptOptional(tp, prompts.gancio ?? "Gancio giocabile della rotta");
    const usoAlTavolo = await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso al tavolo");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Versione player-safe");
    const prossimaMossa = await helpers.promptOptional(tp, prompts.prossima_mossa ?? "Prossima mossa della rotta");
    const connessioni = await helpers.chooseConnections(tp, profile.connection_prompt ?? "Connessioni vive della rotta", context);
    const statoRotta = await helpers.chooseRequired(
        tp,
        profile.status_options ?? [],
        profile.status_prompt ?? "Stato della rotta"
    );

    const created = await helpers.moveNote(tp, helpers.path("rotte"), name);
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: risorsa
fileClass: rotta
tipo: rotta
stato: bozza
stato_rotta: ${statoRotta.id}
mondo: ${mondo}
partenza: ${partenza}
arrivo: ${arrivo}
regioni: ${helpers.inlineYamlList(regioni)}
luoghi: ${helpers.inlineYamlList([partenza, arrivo, ...regioni])}
fazioni_controllanti: ${helpers.inlineYamlList(fazioni)}
fazioni: ${helpers.inlineYamlList(fazioni)}
risorse_trasportate: ${helpers.inlineYamlList(risorse)}
risorse: ${helpers.inlineYamlList(risorse)}
rischi: ${helpers.inlineYamlTextList([rischio])}
pedaggi: ${helpers.inlineYamlTextList([pedaggio])}
conseguenze_se_bloccata: ${helpers.inlineYamlTextList([conseguenza])}
conseguenze: ${helpers.inlineYamlTextList([conseguenza])}
pressione: 0
gancio: ${helpers.yamlQuote(gancio)}
uso_al_tavolo: ${helpers.yamlQuote(usoAlTavolo)}
player_safe: ${helpers.yamlQuote(playerSafe)}
prossima_mossa: ${helpers.yamlQuote(prossimaMossa)}
connessioni: ${helpers.inlineYamlList(connessioni)}
missioni: []
conflitti: []
sessioni: []
mercati: []
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

module.exports = rotta;
