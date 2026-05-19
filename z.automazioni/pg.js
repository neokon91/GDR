async function pg(tp) {
    const helpers = tp.user.helpers;
    const name = await tp.system.prompt("Nome del PG");
    const id = helpers.slugify(name);
    const player = await tp.system.prompt("Nome giocatore", "");

    await tp.file.move(`Mondo/Personaggi/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: personaggio
tipo: pg
giocatore: ${helpers.yamlQuote(player)}
classe:
livello:
specie:
background:
stato: in gioco
luogo:
fazioni: []
relazioni: []
hp_massimi:
hp_attuali:
---
`;
}

module.exports = pg;
