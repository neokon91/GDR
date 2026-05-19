async function nota_rapida(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Titolo della nota rapida", "Nota rapida");
    const id = helpers.slugify(name);
    const selectedType = await helpers.chooseOptional(
        tp,
        [
            { label: "Idea", id: "idea" },
            { label: "Appunto", id: "appunto" },
            { label: "Spunto", id: "spunto" },
            { label: "Domanda", id: "domanda" },
            { label: "Promemoria", id: "promemoria" }
        ],
        "Tipo di nota rapida"
    );
    const collegamenti = await helpers.chooseNotesByPath(tp, "Mondi", "Collega a una nota del mondo");

    await helpers.moveNote(tp, "Inbox", name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: nota rapida
tipo: ${selectedType?.id ?? "idea"}
stato: da smistare
collegamenti: ${helpers.inlineYamlList(collegamenti)}
---
`;
}

module.exports = nota_rapida;
