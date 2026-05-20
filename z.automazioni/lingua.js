async function lingua(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della lingua");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo della lingua");
    const luoghi = await helpers.chooseLocations(tp, "Dove si parla", { world: mondo });
    const origine = await helpers.promptOptional(tp, "Origine o famiglia linguistica");
    const uso = await helpers.promptOptional(tp, "Dove si usa al tavolo");

    await helpers.moveNote(tp, helpers.path("lingue"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: lingua
tipo: lingua
stato: bozza
canonico: false
mondo: ${mondo}
culture: []
luoghi: ${helpers.inlineYamlList(luoghi)}
origine: ${helpers.yamlQuote(origine)}
usi: ${helpers.inlineYamlTextList([uso])}
alfabeto:
parole_note: []
segreti: []
---

`;
}

module.exports = lingua;
