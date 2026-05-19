async function pg(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del PG");
    const id = helpers.slugify(name);
    const player = await helpers.promptOptional(tp, "Nome giocatore");
    const classe = await helpers.promptOptional(tp, "Classe");
    const livello = await helpers.promptOptional(tp, "Livello");
    const specie = await helpers.promptOptional(tp, "Specie");
    const background = await helpers.promptOptional(tp, "Background");
    const mondo = await helpers.chooseNoteByFrontmatter(tp, "categoria", "mondo", "Mondo del PG");
    const luogo = await helpers.chooseNoteByPath(tp, "Mondi/Luoghi", "Luogo del PG");
    const fazioni = await helpers.chooseNotesByPath(tp, "Mondi/Fazioni", "Fazioni del PG");
    const relazioni = await helpers.chooseNotesByPath(tp, "Mondi/Personaggi", "Relazioni del PG");

    await tp.file.move(`Mondi/Personaggi/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: personaggio
tipo: pg
giocatore: ${helpers.yamlQuote(player)}
classe: ${helpers.yamlQuote(classe)}
livello: ${livello}
specie: ${helpers.yamlQuote(specie)}
background: ${helpers.yamlQuote(background)}
stato: in gioco
mondo: ${mondo}
luogo: ${luogo}
fazioni: ${helpers.inlineYamlList(fazioni)}
relazioni: ${helpers.inlineYamlList(relazioni)}
hp_massimi:
hp_attuali:
---
`;
}

module.exports = pg;
