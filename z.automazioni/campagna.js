async function campagna(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della campagna");
    const id = helpers.slugify(name);
    const tono = await helpers.promptOptional(tp, "Tono della campagna");
    const livello = await helpers.promptOptional(tp, "Livello attuale");
    const personaggi = await helpers.choosePeople(tp, "Aggiungi PG o PNG alla campagna");
    const luoghi = await helpers.chooseLocations(tp, "Aggiungi luoghi principali");
    const fazioni = await helpers.chooseFactions(tp, "Aggiungi fazioni in gioco");

    await helpers.moveNote(tp, helpers.PATHS.campagne, name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: campagna
tipo:
stato: preparazione
tono: ${helpers.yamlQuote(tono)}
livello_attuale: ${livello}
personaggi: ${helpers.inlineYamlList(personaggi)}
luoghi: ${helpers.inlineYamlList(luoghi)}
fazioni: ${helpers.inlineYamlList(fazioni)}
sessioni: []
---
`;
}

module.exports = campagna;
