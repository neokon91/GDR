async function luogo(tp, routeOptions = {}){
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del luogo");
    const id = helpers.slugify(name);
    const route = Object.keys(routeOptions).length ? routeOptions : helpers.consumeRoute();
    const selectedType = route.subtype ? { id: route.subtype } : await helpers.chooseOptional(
        tp,
        [
            { label: "Città", id: "città" },
            { label: "Villaggio", id: "villaggio" },
            { label: "Capitale", id: "capitale" },
            { label: "Porto", id: "porto" },
            { label: "Fortezza", id: "fortezza" },
            { label: "Rovina", id: "rovina" },
            { label: "Dungeon", id: "dungeon" },
            { label: "Regione", id: "regione" },
            { label: "Regno", id: "regno" },
            { label: "Tempio", id: "tempio" },
            { label: "Foresta", id: "foresta" },
            { label: "Montagna", id: "montagna" }
        ],
        "Tipo di luogo"
    );
    const selectedBiome = await helpers.chooseOptional(
        tp,
        [
            { label: "Foresta", id: "foresta" },
            { label: "Deserto", id: "deserto" },
            { label: "Montagna", id: "montagna" },
            { label: "Costa", id: "costa" },
            { label: "Palude", id: "palude" },
            { label: "Tundra", id: "tundra" },
            { label: "Sottosuolo", id: "sottosuolo" }
        ],
        "Bioma"
    );
    const mondo = await helpers.chooseWorld(tp, "Mondo del luogo");
    const context = { world: mondo };
    const luogoPadre = await helpers.chooseLocation(tp, "Luogo o regione superiore", context);
    const governante = await helpers.choosePerson(tp, "Governante o referente", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni presenti o interessate", context);
    const personaggi = await helpers.choosePeople(tp, "PNG collegati al luogo", context);
    const missioni = await helpers.chooseMissions(tp, "Missioni collegate al luogo", context);
    const pericolo = await helpers.promptOptional(tp, "Pericolo da 0 a 10");
    const impressione = await helpers.promptOptional(tp, "Prima impressione");
    const addLore = await helpers.askYesNo(tp, "Vuoi aggiungere profondità lore al luogo?");
    const funzioneNarrativa = addLore ? await helpers.promptOptional(tp, "Funzione narrativa del luogo") : "";
    const tensione = addLore ? await helpers.promptOptional(tp, "Tensione o conflitto locale") : "";
    const veritaNascosta = addLore ? await helpers.promptOptional(tp, "Verità nascosta o segreto") : "";
    const domandaAperta = addLore ? await helpers.promptOptional(tp, "Domanda aperta da esplorare al tavolo") : "";
    await helpers.moveNote(tp, helpers.path("luoghi"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: luogo
fileClass: luogo
famiglia_luogo: ${route.category ?? ""}
tipo: ${selectedType?.id ?? ""}
sottotipo: ${selectedType?.id ?? ""}
tipologia: ${selectedType?.id ?? ""}
bioma: ${selectedBiome?.id ?? ""}
stato: bozza
canonico: false
mondo: ${mondo}
luogo_padre: ${luogoPadre}
governante: ${governante}
popolazione:
stabilita:
pericolo: ${pericolo}
impressione: ${helpers.yamlQuote(impressione)}
funzione_narrativa: ${helpers.yamlQuote(funzioneNarrativa)}
tensione: ${helpers.yamlQuote(tensione)}
hp_massimi:
hp_attuali:
fazioni: ${helpers.inlineYamlList(fazioni)}
religioni: []
personaggi: ${helpers.inlineYamlList(personaggi)}
missioni: ${helpers.inlineYamlList(missioni)}
risorse: []
problemi: []
conseguenze: []
segreti: ${helpers.inlineYamlTextList([veritaNascosta])}
indizi: []
voci: []
scene: []
domande_aperte: ${helpers.inlineYamlTextList([domandaAperta])}
collegamenti_mancanti: []
---
`
}

module.exports = luogo;
