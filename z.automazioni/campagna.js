async function campagna(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della campagna");
    const id = helpers.slugify(name);
    const tono = await helpers.promptOptional(tp, "Tono della campagna");
    const livello = await helpers.promptOptional(tp, "Livello attuale");
    const personaggi = await helpers.chooseNotesByPath(tp, "Mondi/Personaggi", "Aggiungi PG o PNG alla campagna");
    const luoghi = await helpers.chooseNotesByPath(tp, "Mondi/Luoghi", "Aggiungi luoghi principali");
    const fazioni = await helpers.chooseNotesByPath(tp, "Mondi/Fazioni", "Aggiungi fazioni in gioco");

    await tp.file.move(`Campagne/${name}`);

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
