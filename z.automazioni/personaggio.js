async function personaggio(tp) {
    const helpers = tp.user.helpers;
    const name = await tp.system.prompt("Nome del personaggio");
    const id = helpers.slugify(name);

    const role = await tp.system.prompt("Ruolo o professione", "");
    const stato = await tp.system.suggester(
        ["Bozza", "Pronto", "In gioco", "Archiviata"],
        ["bozza", "pronto", "in gioco", "archiviata"],
        false,
        "Stato del personaggio"
    );

    await tp.file.move(`Mondo/Personaggi/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: personaggio
tipo: png
ruolo: ${helpers.yamlQuote(role)}
stato: ${stato}
fazioni: []
luogo:
relazioni: []
hp_massimi:
hp_attuali:
---
`;
}

module.exports = personaggio;
