async function evento_storico(tp) {
    const helpers = tp.user.helpers;
    const activeContext = helpers.getActiveSessionContext();
    const name = await helpers.promptRequired(tp, "Titolo evento storico", "Evento storico");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, "Vuoi compilare memoria, versioni e conseguenze storiche ora? Scegli No per un evento rapido.");
    const mondo = await helpers.chooseWorld(tp, "Mondo dell'evento");
    const context = { world: mondo };
    const luoghi = creazioneCompleta ? await helpers.chooseLocations(tp, "Luoghi coinvolti", context) : [];
    const personaggi = creazioneCompleta ? await helpers.choosePeople(tp, "Personaggi coinvolti", context) : [];
    const fazioni = creazioneCompleta ? await helpers.chooseFactions(tp, "Fazioni coinvolte", context) : [];
    const sessioni = helpers.appendUniqueLink(
        creazioneCompleta ? await helpers.chooseSessions(tp, "Sessioni collegate", context) : [],
        activeContext.link
    );
    const dataMondo = await helpers.promptOptional(tp, "Data nel mondo");
    const causa = await helpers.promptOptional(tp, "Causa principale");
    const memoria = creazioneCompleta ? await helpers.promptOptional(tp, "Come viene ricordato") : "";
    const cambiamento = await helpers.promptOptional(tp, "Cosa cambia nella vita quotidiana");
    const versione = creazioneCompleta ? await helpers.promptOptional(tp, "Versione alternativa o contestata") : "";

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
causa: ${helpers.yamlQuote(causa)}
cause: []
effetti: []
entita_impattate: []
propaga_a: []
stato_mondo: []
fatti_accertati: []
memoria_pubblica: ${helpers.inlineYamlTextList([memoria])}
versioni_alternative: ${helpers.inlineYamlTextList([versione])}
cambiamenti_quotidiani: ${helpers.inlineYamlTextList([cambiamento])}
eredita_materiali: []
conseguenze: ${helpers.inlineYamlTextList([cambiamento])}
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
