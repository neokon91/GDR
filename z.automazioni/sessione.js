async function sessione(tp) {
    const helpers = tp.user.helpers;
    const titolo = await helpers.promptRequired(tp, "Titolo della sessione", "Sessione");
    const data = await helpers.promptOptional(tp, "Data", tp.date.now("YYYY-MM-DD")) || tp.date.now("YYYY-MM-DD");
    const id = helpers.slugify(`${data}-${titolo}`);
    const selectedType = await helpers.chooseOptional(
        tp,
        [
            { label: "Sessione di campagna", id: "sessione di campagna" },
            { label: "Sessione zero", id: "sessione zero" },
            { label: "Interludio", id: "interludio" },
            { label: "Downtime", id: "downtime" },
            { label: "Finale", id: "finale" },
            { label: "One-shot", id: "one-shot" }
        ],
        "Tipo di sessione"
    );
    const campagne = await helpers.chooseNotesByPath(tp, "Campagne", "Campagne collegate");
    const luoghi = await helpers.chooseNotesByPath(tp, "Mondi/Luoghi", "Luoghi in scena");
    const personaggi = await helpers.chooseNotesByPath(tp, "Mondi/Personaggi", "Personaggi in scena");
    const creature = await helpers.chooseNotesByPath(tp, "Mondi/Creature", "Creature in scena");
    const incontri = await helpers.chooseNotesByPath(tp, "Mondi/Incontri", "Incontri previsti");
    const dispense = await helpers.chooseNotesByPath(tp, "Mondi/Dispense", "Dispense previste");
    const fazioni = await helpers.chooseNotesByPath(tp, "Mondi/Fazioni", "Fazioni in scena");
    const oggetti = await helpers.chooseNotesByPath(tp, "Mondi/Oggetti", "Oggetti in scena");

    await tp.file.move(`Mondi/Sessioni/${data} - ${titolo}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(titolo)}
cssclasses:
  - tavolo
categoria: sessione
tipo: ${selectedType?.id ?? ""}
data: ${data}
data_mondo:
stato: preparazione
campagne: ${helpers.inlineYamlList(campagne)}
luoghi: ${helpers.inlineYamlList(luoghi)}
personaggi: ${helpers.inlineYamlList(personaggi)}
creature: ${helpers.inlineYamlList(creature)}
incontri: ${helpers.inlineYamlList(incontri)}
dispense: ${helpers.inlineYamlList(dispense)}
fazioni: ${helpers.inlineYamlList(fazioni)}
oggetti: ${helpers.inlineYamlList(oggetti)}
scene: []
ricompense: []
---
`;
}

module.exports = sessione;
