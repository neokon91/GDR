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
    const mondo = await helpers.chooseWorld(tp, "Mondo dell'oggetto");
    const context = { world: mondo };
    const proprietario = await helpers.choosePerson(tp, "Proprietario", context);
    const luogo = await helpers.chooseLocation(tp, "Luogo dell'oggetto", context);

    await helpers.moveNote(tp, helpers.path("oggetti"), name);

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
