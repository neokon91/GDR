async function live_nota(tp) {
    const helpers = tp.user.helpers;
    const activeContext = helpers.getActiveSessionContext();
    const name = await helpers.promptRequired(tp, "Titolo nota grezza", "Nota grezza");
    const id = helpers.slugify(name);
    const collegamenti = activeContext.link ? [activeContext.link] : [];

    await helpers.moveNote(tp, "Inbox", name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: nota rapida
tipo: nota grezza
stato: da smistare
mondo: ${activeContext.world ?? ""}
sessioni: ${helpers.inlineYamlList(collegamenti)}
collegamenti: ${helpers.inlineYamlList(collegamenti)}
---
`;
}

module.exports = live_nota;
