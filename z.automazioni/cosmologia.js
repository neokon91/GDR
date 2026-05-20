async function cosmologia(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del piano, reame o principio cosmico");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo");
    const tipo = await helpers.chooseOptional(
        tp,
        [
            { label: "Piano", id: "piano" },
            { label: "Reame divino", id: "reame divino" },
            { label: "Aldilà", id: "aldilà" },
            { label: "Principio cosmico", id: "principio cosmico" },
            { label: "Soglia", id: "soglia" }
        ],
        "Tipo cosmologico"
    );
    const regola = await helpers.promptOptional(tp, "Regola che lo rende diverso dal mondo normale");
    const pericolo = await helpers.promptOptional(tp, "Pericolo o costo per entrarci");

    await helpers.moveNote(tp, helpers.path("cosmologia"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: cosmologia
tipo: ${helpers.yamlQuote(tipo?.id ?? "piano")}
stato: bozza
canonico: false
mondo: ${mondo}
regola: ${helpers.yamlQuote(regola)}
pericolo: ${helpers.yamlQuote(pericolo)}
divinita: []
religioni: []
luoghi_collegati: []
creature: []
segreti: []
domande_aperte: []
---

`;
}

module.exports = cosmologia;
