async function missione(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della missione");
    const id = helpers.slugify(name);
    const selectedType = await helpers.chooseOptional(
        tp,
        [
            { label: "Incarico", id: "incarico" },
            { label: "Ricerca", id: "ricerca" },
            { label: "Mistero", id: "mistero" },
            { label: "Salvataggio", id: "salvataggio" },
            { label: "Caccia", id: "caccia" },
            { label: "Viaggio", id: "viaggio" },
            { label: "Fronte", id: "fronte" },
            { label: "Trama personale", id: "trama personale" },
            { label: "Missione di fazione", id: "missione di fazione" }
        ],
        "Tipo di missione"
    );
    const mondo = await helpers.chooseNoteByFrontmatter(tp, "categoria", "mondo", "Mondo della missione");
    const committente = await helpers.chooseNoteByPath(tp, "Mondi/Personaggi", "Committente");
    const luoghi = await helpers.chooseNotesByPath(tp, "Mondi/Luoghi", "Luoghi della missione");
    const personaggi = await helpers.chooseNotesByPath(tp, "Mondi/Personaggi", "Personaggi coinvolti");
    const fazioni = await helpers.chooseNotesByPath(tp, "Mondi/Fazioni", "Fazioni coinvolte");
    const ricompense = await helpers.chooseNotesByPath(tp, "Mondi/Oggetti", "Ricompense");

    await tp.file.move(`Mondi/Missioni/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: missione
tipo: ${selectedType?.id ?? ""}
stato: proposta
mondo: ${mondo}
committente: ${committente}
luoghi: ${helpers.inlineYamlList(luoghi)}
personaggi: ${helpers.inlineYamlList(personaggi)}
fazioni: ${helpers.inlineYamlList(fazioni)}
ricompense: ${helpers.inlineYamlList(ricompense)}
---
`;
}

module.exports = missione;
