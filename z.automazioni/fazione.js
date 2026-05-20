async function fazione(tp, routeOptions = {}) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della fazione");
    const id = helpers.slugify(name);
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
    const leader = await helpers.choosePeople(tp, "Leader della fazione", context);
    const luoghi = await helpers.chooseLocations(tp, "Luoghi controllati o importanti", context);
    const personaggi = await helpers.choosePeople(tp, "Membri, alleati o nemici come PNG", context);
    const missioni = await helpers.chooseMissions(tp, "Missioni collegate alla fazione", context);
    const alleati = await helpers.chooseFactions(tp, "Fazioni alleate", context);
    const rivali = await helpers.chooseFactions(tp, "Fazioni rivali o nemiche", context);
    const obiettivo = await helpers.promptOptional(tp, "Obiettivo pubblico");
    const obiettivoNascosto = await helpers.promptOptional(tp, "Obiettivo nascosto");
    const pressione = await helpers.promptOptional(tp, "Pressione da 0 a 10");
    const prossimaMossa = await helpers.promptOptional(tp, "Prossima mossa se nessuno interviene");
    const scadenzaMondo = await helpers.promptOptional(tp, "Scadenza nel mondo");
    const segreto = await helpers.promptOptional(tp, "Segreto o verità scomoda");
    const domandaAperta = await helpers.promptOptional(tp, "Domanda aperta sulla fazione");

    await helpers.moveNote(tp, helpers.path("fazioni"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: fazione
tipo: ${selectedType?.id ?? ""}
stato: bozza
canonico: false
mondo: ${mondo}
leader: ${helpers.inlineYamlList(leader)}
luoghi: ${helpers.inlineYamlList(luoghi)}
personaggi: ${helpers.inlineYamlList(personaggi)}
missioni: ${helpers.inlineYamlList(missioni)}
obiettivo: ${helpers.yamlQuote(obiettivo)}
obiettivo_nascosto: ${helpers.yamlQuote(obiettivoNascosto)}
influenza:
pressione: ${helpers.yamlNumber(pressione) || 0}
prossima_mossa: ${helpers.yamlQuote(prossimaMossa)}
scadenza_mondo: ${helpers.yamlQuote(scadenzaMondo)}
risorse: []
debolezze: []
alleati: ${helpers.inlineYamlList(alleati)}
rivali: ${helpers.inlineYamlList(rivali)}
conseguenze: []
segreti: ${helpers.inlineYamlTextList([segreto])}
domande_aperte: ${helpers.inlineYamlTextList([domandaAperta])}
---
`;
}

module.exports = fazione;
