async function rotta(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della rotta");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo della rotta");
    const context = { world: mondo };
    const partenza = await helpers.chooseLocation(tp, "Luogo di partenza", context);
    const arrivo = await helpers.chooseLocation(tp, "Luogo di arrivo", context);
    const regioni = await helpers.chooseLocations(tp, "Regioni attraversate", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni controllanti", context);
    const risorse = await helpers.chooseWorldResources(tp, "Risorse trasportate", context);
    const rischio = await helpers.promptOptional(tp, "Rischio principale");
    const pedaggio = await helpers.promptOptional(tp, "Pedaggio o costo di passaggio");
    const conseguenza = await helpers.promptOptional(tp, "Conseguenza se bloccata");
    const prossimaMossa = await helpers.promptOptional(tp, "Prossima mossa della rotta");
    const statoRotta = await helpers.chooseRequired(
        tp,
        [
            { label: "Aperta", id: "aperta" },
            { label: "Chiusa", id: "chiusa" },
            { label: "Contesa", id: "contesa" },
            { label: "Maledetta", id: "maledetta" },
            { label: "Interrotta", id: "interrotta" }
        ],
        "Stato della rotta"
    );

    await helpers.moveNote(tp, helpers.path("rotte"), name);

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
prossima_mossa: ${helpers.yamlQuote(prossimaMossa)}
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
