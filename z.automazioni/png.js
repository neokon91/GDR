async function png(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del PNG");
    const id = helpers.slugify(name);
    const role = await helpers.promptOptional(tp, "Ruolo o professione");
    const atteggiamento = await helpers.promptOptional(tp, "Atteggiamento iniziale");
    const stato = await helpers.chooseOptional(
        tp,
        [
            { label: "Bozza", id: "bozza" },
            { label: "Pronto", id: "pronto" },
            { label: "In gioco", id: "in gioco" },
            { label: "Archiviata", id: "archiviata" }
        ],
        "Stato del PNG"
    );
    const mondo = await helpers.chooseWorld(tp, "Mondo del PNG");
    const context = { world: mondo };
    const luogo = await helpers.chooseLocation(tp, "Luogo del PNG", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni del PNG", context);
    const relazioni = await helpers.choosePeople(tp, "Relazioni del PNG", context);

    await helpers.moveNote(tp, helpers.path("personaggi"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: personaggio
tipo: png
ruolo: ${helpers.yamlQuote(role)}
stato: ${stato?.id ?? "bozza"}
mondo: ${mondo}
luogo: ${luogo}
fazioni: ${helpers.inlineYamlList(fazioni)}
relazioni: ${helpers.inlineYamlList(relazioni)}
segreto:
atteggiamento: ${helpers.yamlQuote(atteggiamento)}
hp_massimi:
hp_attuali:
---
`;
}

module.exports = png;
