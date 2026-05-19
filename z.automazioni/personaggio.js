async function personaggio(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del personaggio");
    const id = helpers.slugify(name);

    const role = await helpers.promptOptional(tp, "Ruolo o professione");
    const stato = await helpers.chooseOptional(
        tp,
        [
            { label: "Bozza", id: "bozza" },
            { label: "Pronto", id: "pronto" },
            { label: "In gioco", id: "in gioco" },
            { label: "Archiviata", id: "archiviata" }
        ],
        "Stato del personaggio"
    );
    const mondo = await helpers.chooseWorld(tp, "Mondo del personaggio");
    const context = { world: mondo };
    const luogo = await helpers.chooseLocation(tp, "Luogo del personaggio", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni del personaggio", context);
    const relazioni = await helpers.choosePeople(tp, "Relazioni del personaggio", context);

    await helpers.moveNote(tp, helpers.PATHS.personaggi, name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: personaggio
tipo: png
ruolo: ${helpers.yamlQuote(role)}
stato: ${stato?.id ?? "bozza"}
mondo: ${mondo}
fazioni: ${helpers.inlineYamlList(fazioni)}
luogo: ${luogo}
relazioni: ${helpers.inlineYamlList(relazioni)}
hp_massimi:
hp_attuali:
---
`;
}

module.exports = personaggio;
