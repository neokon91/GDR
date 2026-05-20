async function tracciato(tp) {
    const helpers = tp.user.helpers;
    const activeContext = helpers.getActiveSessionContext();
    const name = await helpers.promptRequired(tp, "Nome del clock o tracciato");
    const id = helpers.slugify(name);
    const selectedType = await helpers.chooseOptional(
        tp,
        [
            { label: "Clock", id: "clock" },
            { label: "Progress track", id: "progress track" },
            { label: "Fronte", id: "fronte" },
            { label: "Rituale", id: "rituale" },
            { label: "Minaccia", id: "minaccia" },
            { label: "Viaggio", id: "viaggio" },
            { label: "Progetto", id: "progetto" }
        ],
        "Tipo di tracciato"
    );
    const mondo = await helpers.chooseWorld(tp, "Mondo del tracciato");
    const context = { world: mondo };
    const campagne = await helpers.chooseCampaigns(tp, "Campagne collegate", context);
    const missioni = await helpers.chooseMissions(tp, "Missioni collegate", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni collegate", context);
    const luoghi = await helpers.chooseLocations(tp, "Luoghi collegati", context);
    const personaggi = await helpers.choosePeople(tp, "PNG o PG collegati", context);
    const progressMax = await helpers.promptOptional(tp, "Segmenti totali", "6") || "6";
    const progressValue = await helpers.promptOptional(tp, "Segmenti gia segnati", "0") || "0";
    const posta = await helpers.promptOptional(tp, "Cosa succede quando si riempie");
    const prossimaMossa = await helpers.promptOptional(tp, "Prossima mossa");
    const innesco = await helpers.promptOptional(tp, "Quando avanza");

    const sessioni = activeContext.link ? [activeContext.link] : [];
    const created = await helpers.moveNote(tp, helpers.path("tracciati"), name);
    // Un clock creato al tavolo deve comparire tra le pressioni della sessione senza lavoro manuale.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "tracciati" });

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: tracciato
fileClass: tracciato
tipo: ${selectedType?.id ?? "clock"}
stato: attivo
mondo: ${mondo}
campagne: ${helpers.inlineYamlList(campagne)}
missioni: ${helpers.inlineYamlList(missioni)}
fazioni: ${helpers.inlineYamlList(fazioni)}
luoghi: ${helpers.inlineYamlList(luoghi)}
personaggi: ${helpers.inlineYamlList(personaggi)}
sessioni: ${helpers.inlineYamlList(sessioni)}
progress_value: ${helpers.yamlNumber(progressValue) || 0}
progress_max: ${helpers.yamlNumber(progressMax) || 6}
pressione: 0
posta: ${helpers.yamlQuote(posta)}
prossima_mossa: ${helpers.yamlQuote(prossimaMossa)}
innesco: ${helpers.yamlQuote(innesco)}
conseguenze: []
---
`;
}

module.exports = tracciato;
