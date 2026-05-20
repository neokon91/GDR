async function cultura(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della cultura o popolo");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, "Vuoi compilare domande di worldbuilding profondo ora? Scegli No per una cultura rapida.");
    const mondo = await helpers.chooseWorld(tp, "Mondo della cultura");
    const context = { world: mondo };
    const luoghi = creazioneCompleta ? await helpers.chooseLocations(tp, "Regioni o luoghi dove vive", context) : [];
    const fazioni = creazioneCompleta ? await helpers.chooseFactions(tp, "Fazioni collegate", context) : [];
    const religioni = creazioneCompleta ? await helpers.chooseReligions(tp, "Religioni collegate", context) : [];
    const tratto = await helpers.promptOptional(tp, "Cosa rende riconoscibile questa cultura");
    const gancio = await helpers.promptOptional(tp, "Gancio giocabile della cultura");
    const usoAlTavolo = await helpers.promptOptional(tp, "Uso al tavolo");
    const playerSafe = await helpers.promptOptional(tp, "Versione player-safe");
    const tensione = await helpers.promptOptional(tp, "Tensione interna o problema");
    const segreto = await helpers.promptOptional(tp, "Verità nascosta o tabù");
    const prossimaMossa = await helpers.promptOptional(tp, "Prossima mossa culturale");
    const connessioni = await helpers.chooseConnections(tp, "Connessioni vive della cultura", context);
    const mitoOrigine = creazioneCompleta ? await helpers.promptOptional(tp, "Mito d'origine") : "";
    const sacro = creazioneCompleta ? await helpers.promptOptional(tp, "Cosa considera sacro") : "";
    const proibito = creazioneCompleta ? await helpers.promptOptional(tp, "Cosa considera proibito o mostruoso") : "";
    const vitaQuotidiana = creazioneCompleta ? await helpers.promptOptional(tp, "Dettaglio di vita quotidiana") : "";
    const rapportoStranieri = creazioneCompleta ? await helpers.promptOptional(tp, "Rapporto con stranieri o vicini") : "";

    const created = await helpers.moveNote(tp, helpers.path("culture"), name);
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: cultura
tipo: cultura
stato: bozza
canonico: false
stato_canonico: canonico
mondo: ${mondo}
luoghi: ${helpers.inlineYamlList(luoghi)}
lingue: []
religioni: ${helpers.inlineYamlList(religioni)}
fazioni: ${helpers.inlineYamlList(fazioni)}
usi: []
tabu: []
feste: []
valori: []
estetica: []
onore:
tabu_sociali: []
autorita_riconosciute: []
pratiche_visibili: []
mito_origine: ${helpers.inlineYamlTextList([mitoOrigine])}
cose_sacre: ${helpers.inlineYamlTextList([sacro])}
cose_proibite: ${helpers.inlineYamlTextList([proibito])}
contraddizioni_interne: []
famiglia_casa_ruoli: ${helpers.inlineYamlTextList([vitaQuotidiana])}
cibo_vestiario_materiali: []
educazione_memoria: []
economia_mestieri: []
rapporto_stranieri: ${helpers.inlineYamlTextList([rapportoStranieri])}
relazioni_esterne: []
conflitti_interni: []
relazioni: []
gancio: ${helpers.yamlQuote(gancio)}
uso_al_tavolo: ${helpers.yamlQuote(usoAlTavolo)}
player_safe: ${helpers.yamlQuote(playerSafe)}
tratto_distintivo: ${helpers.yamlQuote(tratto)}
connessioni: ${helpers.inlineYamlList(connessioni)}
propaga_a: []
entita_impattate: []
promesse_al_tavolo: []
scelte: []
rischi: []
indizi: []
png_coinvolti: []
ricompense: []
conseguenze: []
prossima_mossa: ${helpers.yamlQuote(prossimaMossa)}
leggi: []
risorse: []
tensioni: ${helpers.inlineYamlTextList([tensione])}
segreti: ${helpers.inlineYamlTextList([segreto])}
domande_aperte: []
---

`;
}

module.exports = cultura;
