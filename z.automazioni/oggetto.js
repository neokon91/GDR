async function oggetto(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome dell'oggetto");
    const id = helpers.slugify(name);
    const selectedType = await helpers.chooseOptional(
        tp,
        [
            { label: "Oggetto comune", id: "oggetto comune" },
            { label: "Reliquia", id: "reliquia" },
            { label: "Indizio fisico", id: "indizio fisico" },
            { label: "Chiave", id: "chiave" },
            { label: "Tesoro", id: "tesoro" },
            { label: "Artefatto", id: "artefatto" }
        ],
        "Tipo di oggetto"
    );
    const selectedRarity = await helpers.chooseOptional(
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
    const mondo = await helpers.chooseNoteByFrontmatter(tp, "categoria", "mondo", "Mondo dell'oggetto");
    const proprietario = await helpers.chooseNoteByPath(tp, "Mondi/Personaggi", "Proprietario");
    const luogo = await helpers.chooseNoteByPath(tp, "Mondi/Luoghi", "Luogo dell'oggetto");

    await tp.file.move(`Mondi/Oggetti/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: oggetto
tipo: ${selectedType?.id ?? ""}
rarita: ${selectedRarity?.id ?? ""}
stato: bozza
canonico: false
mondo: ${mondo}
proprietario: ${proprietario}
luogo: ${luogo}
---
`;
}

module.exports = oggetto;
