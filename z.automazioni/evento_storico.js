async function evento_storico(tp) {
    const helpers = tp.user.helpers;
    const activeContext = helpers.getActiveSessionContext();
    const name = await helpers.promptRequired(tp, "Titolo evento storico", "Evento storico");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo dell'evento");
    const context = { world: mondo };
    const luoghi = await helpers.chooseLocations(tp, "Luoghi coinvolti", context);
    const personaggi = await helpers.choosePeople(tp, "Personaggi coinvolti", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni coinvolte", context);
    const sessioni = helpers.appendUniqueLink(
        await helpers.chooseSessions(tp, "Sessioni collegate", context),
        activeContext.link
    );
    const dataMondo = await helpers.promptOptional(tp, "Data nel mondo");

    const created = await helpers.moveNote(tp, "Mondi/Timeline", name);
    // Un evento storico creato dal gioco diventa conseguenza della sessione attiva.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "conseguenze" });

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: evento storico
tipo: evento
stato: canonico
stato_canonico: canonico
canonico: true
fonte: prep
fonte_note:
grado_certezza: alto
contraddice: []
retcon_di: []
retcon_motivo:
mondo: ${mondo}
data_mondo: ${helpers.yamlQuote(dataMondo)}
data_reale:
fc-calendar:
fc-date:
fc-category: conseguenza
fc-display-name: ${helpers.yamlQuote(name)}
luoghi: ${helpers.inlineYamlList(luoghi)}
personaggi: ${helpers.inlineYamlList(personaggi)}
fazioni: ${helpers.inlineYamlList(fazioni)}
missioni: []
tracciati: []
sessioni: ${helpers.inlineYamlList(sessioni)}
causa:
cause: []
effetti: []
entita_impattate: []
propaga_a: []
stato_mondo: []
conseguenze: []
prossima_mossa:
giocabile: false
scelte: []
rischi: []
indizi: []
png_coinvolti: []
ricompense: []
---
`;
}

module.exports = evento_storico;
