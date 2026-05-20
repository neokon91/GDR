async function fazione(tp, routeOptions = {}) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della fazione");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, "Vuoi compilare rete, luoghi e relazioni ora? Scegli No per una fazione rapida.");
    const route = Object.keys(routeOptions).length ? routeOptions : helpers.consumeRoute();
    const selectedType = route.tipoFazione ? { id: route.tipoFazione } : await helpers.chooseOptional(
        tp,
        [
            { label: "Gilda", id: "gilda" },
            { label: "Confraternita", id: "confraternita" },
            { label: "Casata", id: "casata" },
            { label: "Ordine militare", id: "ordine militare" },
            { label: "Compagnia mercantile", id: "compagnia mercantile" },
            { label: "Banda criminale", id: "banda criminale" },
            { label: "Movimento ribelle", id: "movimento ribelle" },
            { label: "Governo", id: "governo" },
            { label: "Culto politico", id: "culto politico" }
        ],
        "Tipo di fazione"
    );
    const mondo = await helpers.chooseWorld(tp, "Mondo della fazione");
    const context = { world: mondo };
    const obiettivo = await helpers.promptOptional(tp, "Obiettivo pubblico");
    const obiettivoNascosto = await helpers.promptOptional(tp, "Obiettivo nascosto");
    const pressione = await helpers.promptOptional(tp, "Pressione da 0 a 10");
    const prossimaMossa = await helpers.promptOptional(tp, "Prossima mossa se nessuno interviene");
    const segreto = await helpers.promptOptional(tp, "Segreto o verità scomoda");
    const leader = creazioneCompleta ? await helpers.choosePeople(tp, "Leader della fazione", context) : [];
    const luoghi = creazioneCompleta ? await helpers.chooseLocations(tp, "Luoghi controllati o importanti", context) : [];
    const personaggi = creazioneCompleta ? await helpers.choosePeople(tp, "Membri, alleati o nemici come PNG", context) : [];
    const missioni = creazioneCompleta ? await helpers.chooseMissions(tp, "Missioni collegate alla fazione", context) : [];
    const alleati = creazioneCompleta ? await helpers.chooseFactions(tp, "Fazioni alleate", context) : [];
    const rivali = creazioneCompleta ? await helpers.chooseFactions(tp, "Fazioni rivali o nemiche", context) : [];
    const scadenzaMondo = creazioneCompleta ? await helpers.promptOptional(tp, "Scadenza nel mondo") : "";
    const domandaAperta = creazioneCompleta ? await helpers.promptOptional(tp, "Domanda aperta sulla fazione") : "";

    await helpers.moveNote(tp, helpers.path("fazioni"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: fazione
fileClass: fazione
tipo: ${selectedType?.id ?? ""}
stato: bozza
canonico: false
stato_canonico: canonico
mondo: ${mondo}
leader: ${helpers.inlineYamlList(leader)}
luoghi: ${helpers.inlineYamlList(luoghi)}
personaggi: ${helpers.inlineYamlList(personaggi)}
missioni: ${helpers.inlineYamlList(missioni)}
obiettivo: ${helpers.yamlQuote(obiettivo)}
obiettivo_nascosto: ${helpers.yamlQuote(obiettivoNascosto)}
agenda: ${helpers.yamlQuote(obiettivo)}
influenza:
pressione: ${helpers.yamlNumber(pressione) || 0}
prossima_mossa: ${helpers.yamlQuote(prossimaMossa)}
scadenza_mondo: ${helpers.yamlQuote(scadenzaMondo)}
progress_value: 0
progress_max: 6
innesco: ${helpers.yamlQuote(prossimaMossa ? "Tempo, fallimento dei PG o vantaggio della fazione" : "")}
escalation: []
posta: ${helpers.yamlQuote(obiettivo)}
mosse_visibili: []
mosse_segrete: []
scelte: []
rischi: []
indizi: []
ricompense: []
risorse: []
debolezze: []
alleati: ${helpers.inlineYamlList(alleati)}
rivali: ${helpers.inlineYamlList(rivali)}
trattati: []
relazioni: []
eventi: []
propaga_a: []
conseguenze: []
segreti: ${helpers.inlineYamlTextList([segreto])}
domande_aperte: ${helpers.inlineYamlTextList([domandaAperta])}
---
`;
}

module.exports = fazione;
