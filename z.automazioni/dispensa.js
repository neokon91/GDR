async function dispensa(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Titolo dispensa");
    const id = helpers.slugify(name);
    const selectedType = await helpers.chooseOptional(
        tp,
        [
            { label: "Lettera", id: "lettera" },
            { label: "Diario", id: "diario" },
            { label: "Mappa", id: "mappa" },
            { label: "Profezia", id: "profezia" },
            { label: "Contratto", id: "contratto" },
            { label: "Indizio", id: "indizio" },
            { label: "Documento", id: "documento" }
        ],
        "Tipo di dispensa"
    );
    const mondo = await helpers.chooseNoteByFrontmatter(tp, "categoria", "mondo", "Mondo della dispensa");
    const luogo = await helpers.chooseNoteByPath(tp, "Mondi/Luoghi", "Luogo collegato");
    const personaggi = await helpers.chooseNotesByPath(tp, "Mondi/Personaggi", "Personaggi collegati");
    const sessioni = await helpers.chooseNotesByPath(tp, "Mondi/Sessioni", "Sessioni collegate");

    await tp.file.move(`Mondi/Dispense/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: dispensa
tipo: ${selectedType?.id ?? ""}
stato: bozza
mondo: ${mondo}
luogo: ${luogo}
personaggi: ${helpers.inlineYamlList(personaggi)}
sessioni: ${helpers.inlineYamlList(sessioni)}
---
`;
}

module.exports = dispensa;
