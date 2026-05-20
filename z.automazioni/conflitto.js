async function conflitto(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del conflitto");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, "Vuoi compilare cause profonde, ferite e possibili paci ora? Scegli No per un conflitto rapido.");
    const mondo = await helpers.chooseWorld(tp, "Mondo del conflitto");
    const context = { world: mondo };
    const fazioni = creazioneCompleta ? await helpers.chooseFactions(tp, "Fazioni coinvolte", context) : [];
    const luoghi = creazioneCompleta ? await helpers.chooseLocations(tp, "Luoghi coinvolti", context) : [];
    const posta = await helpers.promptOptional(tp, "Cosa c'è in gioco");
    const prossimaMossa = await helpers.promptOptional(tp, "Prossima mossa se nessuno interviene");
    const causaProfonda = await helpers.promptOptional(tp, "Causa profonda");
    const feritaStorica = creazioneCompleta ? await helpers.promptOptional(tp, "Ferita storica") : "";
    const risorsaContesa = creazioneCompleta ? await helpers.promptOptional(tp, "Risorsa contesa") : "";
    const pacePossibile = creazioneCompleta ? await helpers.promptOptional(tp, "Possibile pace o compromesso") : "";

    await helpers.moveNote(tp, helpers.path("conflitti"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: conflitto
tipo: conflitto
stato: in corso
canonico: true
mondo: ${mondo}
pressione: 5
posta: ${helpers.yamlQuote(posta)}
prossima_mossa: ${helpers.yamlQuote(prossimaMossa)}
progress_value: 0
progress_max: 6
innesco: "una fazione ottiene un vantaggio, i PG falliscono o passa tempo"
cause_profonde: ${helpers.inlineYamlTextList([causaProfonda])}
pretesti_pubblici: []
ferite_storiche: ${helpers.inlineYamlTextList([feritaStorica])}
risorse_contese: ${helpers.inlineYamlTextList([risorsaContesa])}
popolazioni_coinvolte: []
fasi_del_conflitto: []
punti_di_non_ritorno: []
possibili_paci: ${helpers.inlineYamlTextList([pacePossibile])}
cause: ${helpers.inlineYamlTextList([causaProfonda])}
effetti: []
entita_impattate: []
propaga_a: []
fazioni: ${helpers.inlineYamlList(fazioni)}
luoghi: ${helpers.inlineYamlList(luoghi)}
culture: []
religioni: []
missioni: []
scelte: []
rischi: []
indizi: []
png_coinvolti: []
ricompense: []
conseguenze: []
segreti: []
domande_aperte: []
---

`;
}

module.exports = conflitto;
