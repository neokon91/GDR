async function missione(tp) {
    const helpers = tp.user.helpers;
    const activeContext = helpers.getActiveSessionContext();
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
    const tracciati = await helpers.chooseTracks(tp, "Clock o tracciati collegati", context);
    const ricompense = await helpers.chooseObjects(tp, "Ricompense", context);
    const pressione = await helpers.promptOptional(tp, "Pressione da 0 a 10", "3") || "3";
    const prossimaMossa = await helpers.promptOptional(tp, "Prossima mossa se ignorata");
    const scadenzaMondo = await helpers.promptOptional(tp, "Scadenza nel mondo");
    const indizio = await helpers.promptOptional(tp, "Indizio iniziale");
    const ostacolo = await helpers.promptOptional(tp, "Ostacolo principale");
    const conseguenza = await helpers.promptOptional(tp, "Conseguenza se fallisce o viene ignorata");
    const segreto = await helpers.promptOptional(tp, "Segreto dietro la missione");
    const domandaAperta = await helpers.promptOptional(tp, "Domanda aperta della missione");

    const sessioni = activeContext.link ? [activeContext.link] : [];
    const created = await helpers.moveNote(tp, helpers.path("missioni"), name);
    // Una missione creata mentre prepari o giochi entra subito tra le missioni della sessione attiva.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "missioni" });

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: missione
fileClass: missione
tipo: ${selectedType?.id ?? ""}
stato: proposta
mondo: ${mondo}
committente: ${committente}
luoghi: ${helpers.inlineYamlList(luoghi)}
personaggi: ${helpers.inlineYamlList(personaggi)}
fazioni: ${helpers.inlineYamlList(fazioni)}
tracciati: ${helpers.inlineYamlList(tracciati)}
ricompense: ${helpers.inlineYamlList(ricompense)}
sessioni: ${helpers.inlineYamlList(sessioni)}
progress_value: 0
progress_max: 6
pressione: ${helpers.yamlNumber(pressione) || 3}
prossima_mossa: ${helpers.yamlQuote(prossimaMossa)}
domande_aperte: ${helpers.inlineYamlTextList([domandaAperta])}
indizi: ${helpers.inlineYamlTextList([indizio])}
ostacoli: ${helpers.inlineYamlTextList([ostacolo])}
scene_pronte: []
decisioni: []
conseguenze: ${helpers.inlineYamlTextList([conseguenza])}
segreti: ${helpers.inlineYamlTextList([segreto])}
scadenza_mondo: ${helpers.yamlQuote(scadenzaMondo)}
fc-calendar:
fc-date:
fc-category: scadenza
fc-display-name: ${helpers.yamlQuote(name)}
fc-end:
---
`;
}

module.exports = missione;
