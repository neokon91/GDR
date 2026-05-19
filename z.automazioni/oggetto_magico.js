async function oggettoMagico(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome dell'oggetto magico");
    const id = helpers.slugify(name);
    const rarita = await helpers.chooseOptional(
        tp,
        [
            { label: "Comune", id: "comune" },
            { label: "Non comune", id: "non comune" },
            { label: "Raro", id: "raro" },
            { label: "Molto raro", id: "molto raro" },
            { label: "Leggendario", id: "leggendario" },
            { label: "Artefatto", id: "artefatto" }
        ],
        "Rarità"
    );
    const mondo = await helpers.chooseNoteByFrontmatter(tp, "categoria", "mondo", "Mondo dell'oggetto magico");
    const proprietario = await helpers.chooseNoteByPath(tp, "Mondi/Personaggi", "Proprietario");
    const luogo = await helpers.chooseNoteByPath(tp, "Mondi/Luoghi", "Luogo dell'oggetto magico");

    await tp.file.move(`Mondi/Oggetti/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: oggetto
tipo: oggetto magico
rarita: ${rarita?.id ?? ""}
sintonia: false
cariche:
maledizione: false
stato: bozza
canonico: false
mondo: ${mondo}
proprietario: ${proprietario}
luogo: ${luogo}
---
`;
}

module.exports = oggettoMagico;
