async function dispensa(tp) {
    const helpers = tp.user.helpers;
    const activeContext = helpers.getActiveSessionContext();
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
    const mondo = await helpers.chooseWorld(tp, "Mondo della dispensa");
    const context = { world: mondo };
    const luogo = await helpers.chooseLocation(tp, "Luogo collegato", context);
    const personaggi = await helpers.choosePeople(tp, "Personaggi collegati", context);
    const sessioni = helpers.appendUniqueLink(
        await helpers.chooseSessions(tp, "Sessioni collegate", context),
        activeContext.link
    );

    const created = await helpers.moveNote(tp, helpers.path("dispense"), name);
    // La dispensa appena creata compare nei materiali della sessione attiva.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "dispense" });

    return await helpers.renderFrontmatter("dispensa", {
        id: id,
        nome: helpers.yamlQuote(name),
        categoria: 'dispensa',
        tipo: selectedType?.id ?? "",
        stato: 'bozza',
        mondo: mondo,
        luogo: luogo,
        personaggi: helpers.inlineYamlList(personaggi),
        sessioni: helpers.inlineYamlList(sessioni)
    });
}

module.exports = dispensa;
