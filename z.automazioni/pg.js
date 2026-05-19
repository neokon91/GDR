async function pg(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del PG");
    const id = helpers.slugify(name);
    const player = await helpers.promptOptional(tp, "Nome giocatore");
    const classe = await helpers.promptOptional(tp, "Classe");
    const livello = await helpers.promptOptional(tp, "Livello");
    const specie = await helpers.promptOptional(tp, "Specie");
    const background = await helpers.promptOptional(tp, "Background");
    const mondo = await helpers.chooseWorld(tp, "Mondo del PG");
    const context = { world: mondo };
    const luogo = await helpers.chooseLocation(tp, "Luogo del PG", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni del PG", context);
    const relazioni = await helpers.choosePeople(tp, "Relazioni del PG", context);

    await helpers.moveNote(tp, helpers.PATHS.personaggi, name);

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
