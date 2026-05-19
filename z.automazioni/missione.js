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
    const mondo = await helpers.chooseWorld(tp, "Mondo della missione");
    const context = { world: mondo };
    const committente = await helpers.choosePerson(tp, "Committente", context);
    const luoghi = await helpers.chooseLocations(tp, "Luoghi della missione", context);
    const personaggi = await helpers.choosePeople(tp, "Personaggi coinvolti", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni coinvolte", context);
    const ricompense = await helpers.chooseObjects(tp, "Ricompense", context);

    await helpers.moveNote(tp, helpers.PATHS.missioni, name);

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
