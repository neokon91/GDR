async function lore_capture(tp, routeOptions = {}) {
    const helpers = tp.user.helpers;
    const route = Object.keys(routeOptions).length ? routeOptions : helpers.consumeRoute();
    const activeContext = helpers.getActiveSessionContext();
    const name = await helpers.promptRequired(tp, "Titolo evento o appunto lore", route.defaultName ?? "Evento emerso");
    const id = helpers.slugify(name);
    const selectedType = route.tipo
        ? { id: route.tipo }
        : await helpers.chooseOptional(
        tp,
        [
            { label: "Evento", id: "evento" },
            { label: "PNG improvvisato", id: "png improvvisato" },
            { label: "Luogo improvvisato", id: "luogo improvvisato" },
            { label: "Dialogo", id: "dialogo" },
            { label: "Conseguenza", id: "conseguenza" },
            { label: "Idea", id: "idea" }
        ],
        "Tipo di lore"
    );
    const mondo = route.useActiveSession && activeContext.world
        ? activeContext.world
        : await helpers.chooseWorld(tp, "Mondo di riferimento");
    const context = { world: mondo };
    const sessioni = route.useActiveSession && activeContext.link
        ? [activeContext.link]
        : await helpers.chooseSessions(tp, "Sessione collegata", context);
    const collegamenti = await helpers.chooseNotesByPath(tp, "Mondi", "Collega a mondo, PNG, luogo, missione o fazione", context);

    await helpers.moveNote(tp, "Inbox", name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: lore capture
tipo: ${selectedType?.id ?? "evento"}
stato: da smistare
stato_canonico: rumor
canonico: false
mondo: ${mondo}
sessioni: ${helpers.inlineYamlList(sessioni)}
collegamenti: ${helpers.inlineYamlList(collegamenti)}
data_mondo:
fc-calendar:
fc-date:
fc-category: conseguenza
fc-display-name: ${helpers.yamlQuote(name)}
impatto: []
azioni: []
canonizza_evento: false
collega_al_mondo: false
aggiorna_png: false
aggiorna_luogo: false
aggiorna_missione: false
archivia_appunto: false
---
`;
}

module.exports = lore_capture;
