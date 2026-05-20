async function eraStorica(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome dell'era, epoca o guerra");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo");
    const tipo = await helpers.chooseOptional(
        tp,
        [
            { label: "Era", id: "era" },
            { label: "Epoca", id: "epoca" },
            { label: "Guerra", id: "guerra" },
            { label: "Catastrofe", id: "catastrofe" },
            { label: "Fondazione", id: "fondazione" }
        ],
        "Tipo storico"
    );
    const dataMondo = await helpers.promptOptional(tp, "Quando nel mondo");
    const causa = await helpers.promptOptional(tp, "Causa principale");
    const conseguenza = await helpers.promptOptional(tp, "Conseguenza principale");

    await helpers.moveNote(tp, helpers.path("storia"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: evento storico
tipo: ${tipo?.id ?? "era"}
stato: canonico
stato_canonico: canonico
canonico: true
mondo: ${mondo}
data_mondo: ${helpers.yamlQuote(dataMondo)}
causa: ${helpers.yamlQuote(causa)}
conseguenze: ${helpers.inlineYamlTextList([conseguenza])}
luoghi: []
fazioni: []
culture: []
religioni: []
sessioni: []
segreti: []
---

`;
}

module.exports = eraStorica;
