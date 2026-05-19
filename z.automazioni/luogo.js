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
    const pericolo = await helpers.promptOptional(tp, "Pericolo da 0 a 10");
    const impressione = await helpers.promptOptional(tp, "Prima impressione");
    await helpers.moveNote(tp, helpers.path("luoghi"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: luogo
tipo: ${selectedType?.id ?? ""}
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
hp_massimi:
hp_attuali:
fazioni: []
religioni: []
risorse: []
problemi: []
segreti: []
indizi: []
voci: []
scene: []
collegamenti_mancanti: []
---
`
}

module.exports = luogo;
