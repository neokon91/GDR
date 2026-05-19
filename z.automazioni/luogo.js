async function luogo(tp){
    const helpers = tp.user.helpers;
    const name = await tp.system.prompt("Nome del luogo?");
    const id = helpers.slugify(name);
    const route = tp.config.extra ?? {};
    // Tipologie di luogo
    const locationType = route.subtype ?? await tp.system.suggester(
    [
        "Città",
        "Villaggio",
        "Capitale",
        "Porto",
        "Fortezza",
        "Rovina",
        "Dungeon",
        "Regione",
        "Regno",
        "Tempio",
        "Foresta",
        "Montagna"
    ],
    [
        "città",
        "villaggio",
        "capitale",
        "porto",
        "fortezza",
        "rovina",
        "dungeon",
        "regione",
        "regno",
        "tempio",
        "foresta",
        "montagna"
    ]
    );
    // Bioma del luogo
    const biome = await tp.system.suggester(
    [
        "Foresta",
        "Deserto",
        "Montagna",
        "Costa",
        "Palude",
        "Tundra",
        "Sottosuolo"
    ],
    [
        "foresta",
        "deserto",
        "montagna",
        "costa",
        "palude",
        "tundra",
        "sottosuolo"
    ]
    );
    await tp.file.move(`Mondo/Luoghi/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: luogo
tipo: ${locationType}
tipologia: ${locationType}
bioma: ${biome}
stato: bozza
canonico: false
luogo_padre:
governante:
popolazione:
stabilita:
pericolo:
hp_massimi:
hp_attuali:
fazioni: []
religioni: []
risorse: []
problemi: []
---
`
}

module.exports = luogo;
