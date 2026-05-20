async function mappa(tp) {
    const helpers = tp.user.helpers;
    const route = helpers.consumeRoute();
    const name = await helpers.promptRequired(tp, "Nome della mappa");
    const world = await helpers.chooseWorld(tp, "Mondo della mappa");
    const context = { world };
    const usage = await helpers.promptOptional(tp, "Uso della mappa", route.uso ?? "");
    const place = await helpers.chooseLocation(tp, "Luogo principale", context);
    const places = await helpers.chooseLocations(tp, "Luoghi collegati", context);
    const factions = await helpers.chooseFactions(tp, "Fazioni collegate", context);
    const missions = await helpers.chooseMissions(tp, "Missioni collegate", context);

    await helpers.moveNote(tp, helpers.path("mappe"), name);

    return `---
id: ${helpers.yamlQuote(helpers.slugify(name))}
nome: ${helpers.yamlQuote(name)}
categoria: mappa
tipo: ${helpers.yamlQuote(route.tipo ?? "mappa")}
uso: ${helpers.yamlQuote(usage)}
stato: bozza
mondo: ${world}
luogo: ${place}
luoghi: ${helpers.inlineYamlList(places)}
fazioni: ${helpers.inlineYamlList(factions)}
missioni: ${helpers.inlineYamlList(missions)}
coordinates:
layer_mappa:
tipo_mappa:
pubblico: false
player_safe:
segreto:
cosa_mostra:
cosa_nascondere:
layer_dm: []
layer_pubblico: []
connessioni: []
---
`;
}

module.exports = mappa;
