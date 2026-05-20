async function nota_rapida(tp) {
    const helpers = tp.user.helpers;
    const activeContext = helpers.getActiveSessionContext();
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
    const collegamenti = helpers.appendUniqueLink(
        await helpers.chooseNotesByPath(tp, "Mondi", "Collega a una nota del mondo"),
        activeContext.link
    );

    const created = await helpers.moveNote(tp, "Inbox", name);
    // La nota rapida nasce gia nel contesto della sessione, cosi non resta un appunto isolato.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "appunti_live" });

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: nota rapida
tipo: ${selectedType?.id ?? "idea"}
stato: da smistare
mondo: ${activeContext.world ?? ""}
sessioni: ${helpers.inlineYamlList(activeContext.link ? [activeContext.link] : [])}
collegamenti: ${helpers.inlineYamlList(collegamenti)}
---
`;
}

module.exports = nota_rapida;
