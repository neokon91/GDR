async function cosmologia(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del piano, reame o principio cosmico");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, "Vuoi compilare leggi metafisiche e conseguenze cosmologiche ora? Scegli No per una cosmologia rapida.");
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
    const origine = creazioneCompleta ? await helpers.promptOptional(tp, "Origine o funzione cosmologica") : "";
    const soglia = creazioneCompleta ? await helpers.promptOptional(tp, "Soglia o modo di accesso") : "";
    const aldila = creazioneCompleta ? await helpers.promptOptional(tp, "Cosa dice dei morti o dell'aldilà") : "";
    const fenomeno = creazioneCompleta ? await helpers.promptOptional(tp, "Fenomeno visibile nel mondo") : "";

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
origine_funzione: ${helpers.inlineYamlTextList([origine])}
leggi_metafisiche: ${helpers.inlineYamlTextList([regola])}
soglie_accesso: ${helpers.inlineYamlTextList([soglia])}
morte_aldila: ${helpers.inlineYamlTextList([aldila])}
dottrine_religiose: []
effetti_su_magia: []
effetti_su_culture: []
fenomeni_visibili: ${helpers.inlineYamlTextList([fenomeno])}
scene_cosmiche: []
indizi_cosmici: []
misteri: []
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
