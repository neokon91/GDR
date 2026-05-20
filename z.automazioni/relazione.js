async function relazione(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della relazione, patto o rivalità");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, "Vuoi compilare storia, versioni e dipendenze della relazione ora? Scegli No per una relazione rapida.");
    const selectedType = await helpers.chooseOptional(
        tp,
        [
            { label: "Alleanza", id: "alleanza" },
            { label: "Rivalità", id: "rivalità" },
            { label: "Guerra fredda", id: "guerra fredda" },
            { label: "Vassallaggio", id: "vassallaggio" },
            { label: "Trattato", id: "trattato" },
            { label: "Debito", id: "debito" },
            { label: "Faida", id: "faida" },
            { label: "Patto religioso", id: "patto religioso" },
            { label: "Tradimento", id: "tradimento" }
        ],
        "Tipo di relazione"
    );
    const mondo = await helpers.chooseWorld(tp, "Mondo della relazione");
    const context = { world: mondo };
    const soggetti = creazioneCompleta ? await helpers.chooseNotesByPath(tp, "Mondi", "Soggetti coinvolti", context) : [];
    const connessioni = await helpers.chooseConnections(tp, "Connessioni vive della relazione", context);
    const origine = await helpers.promptOptional(tp, "Origine della relazione");
    const posta = await helpers.promptOptional(tp, "Cosa c'è in gioco");
    const gancio = await helpers.promptOptional(tp, "Gancio giocabile della relazione");
    const usoAlTavolo = await helpers.promptOptional(tp, "Uso al tavolo");
    const playerSafe = await helpers.promptOptional(tp, "Versione player-safe");
    const prossimaMossa = await helpers.promptOptional(tp, "Prossimo deterioramento o sviluppo");
    const versione = creazioneCompleta ? await helpers.promptOptional(tp, "Come la raccontano in modo diverso le parti") : "";
    const dipendenza = creazioneCompleta ? await helpers.promptOptional(tp, "Dipendenza materiale o politica") : "";
    const ferita = creazioneCompleta ? await helpers.promptOptional(tp, "Ferita aperta") : "";

    const created = await helpers.moveNote(tp, helpers.path("relazioni"), name);
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: relazione
tipo: ${selectedType?.id ?? "relazione"}
stato: bozza
canonico: false
stato_canonico: canonico
mondo: ${mondo}
soggetti: ${helpers.inlineYamlList(soggetti)}
origine: ${helpers.yamlQuote(origine)}
posta: ${helpers.yamlQuote(posta)}
gancio: ${helpers.yamlQuote(gancio)}
uso_al_tavolo: ${helpers.yamlQuote(usoAlTavolo)}
player_safe: ${helpers.yamlQuote(playerSafe)}
connessioni: ${helpers.inlineYamlList(connessioni)}
origine_storica: ${helpers.inlineYamlTextList([origine])}
versioni_contrapposte: ${helpers.inlineYamlTextList([versione])}
simboli_riti_trattati: []
dipendenze_materiali: ${helpers.inlineYamlTextList([dipendenza])}
ferite_aperte: ${helpers.inlineYamlTextList([ferita])}
intensita: 3
pressione: 0
stabilita:
prossima_mossa: ${helpers.yamlQuote(prossimaMossa)}
innesco:
eventi: []
trattati: []
conseguenze: []
entita_impattate: []
propaga_a: []
scelte: []
rischi: []
indizi: []
segreti: []
---
`;
}

module.exports = relazione;
