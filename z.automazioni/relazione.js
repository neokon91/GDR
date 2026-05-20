async function relazione(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della relazione, patto o rivalità");
    const id = helpers.slugify(name);
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
    const soggetti = await helpers.chooseNotesByPath(tp, "Mondi", "Soggetti coinvolti", context);
    const origine = await helpers.promptOptional(tp, "Origine della relazione");
    const posta = await helpers.promptOptional(tp, "Cosa c'è in gioco");
    const prossimaMossa = await helpers.promptOptional(tp, "Prossimo deterioramento o sviluppo");

    await helpers.moveNote(tp, helpers.path("relazioni"), name);

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
