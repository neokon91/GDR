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
    const mondo = await helpers.chooseNoteByFrontmatter(tp, "categoria", "mondo", "Mondo del PNG");
    const luogo = await helpers.chooseNoteByPath(tp, "Mondi/Luoghi", "Luogo del PNG");
    const fazioni = await helpers.chooseNotesByPath(tp, "Mondi/Fazioni", "Fazioni del PNG");
    const relazioni = await helpers.chooseNotesByPath(tp, "Mondi/Personaggi", "Relazioni del PNG");

    await tp.file.move(`Mondi/Personaggi/${name}`);

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
