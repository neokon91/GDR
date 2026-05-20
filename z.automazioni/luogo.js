async function luogo(tp, routeOptions = {}){
    const helpers = tp.user.helpers;
    const activeContext = helpers.getActiveSessionContext();
    const name = await helpers.promptRequired(tp, "Nome del luogo");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, "Vuoi compilare collegamenti e lore ora? Scegli No per un luogo rapido.");
    const route = Object.keys(routeOptions).length ? routeOptions : helpers.consumeRoute();
    const selectedType = route.subtype ? { id: route.subtype } : await helpers.chooseOptional(
        tp,
        [
            { label: "Città", id: "città" },
            { label: "Villaggio", id: "villaggio" },
            { label: "Capitale", id: "capitale" },
            { label: "Porto", id: "porto" },
            { label: "Fortezza", id: "fortezza" },
            { label: "Rovina", id: "rovina" },
            { label: "Dungeon", id: "dungeon" },
            { label: "Regione", id: "regione" },
            { label: "Regno", id: "regno" },
            { label: "Tempio", id: "tempio" },
            { label: "Foresta", id: "foresta" },
            { label: "Montagna", id: "montagna" }
        ],
        "Tipo di luogo"
    );
    const selectedBiome = creazioneCompleta ? await helpers.chooseOptional(
        tp,
        [
            { label: "Foresta", id: "foresta" },
            { label: "Deserto", id: "deserto" },
            { label: "Montagna", id: "montagna" },
            { label: "Costa", id: "costa" },
            { label: "Palude", id: "palude" },
            { label: "Tundra", id: "tundra" },
            { label: "Sottosuolo", id: "sottosuolo" }
        ],
        "Bioma"
    ) : null;
    const mondo = await helpers.chooseWorld(tp, "Mondo del luogo");
    const context = { world: mondo };
    const pericolo = await helpers.promptOptional(tp, "Pericolo da 0 a 10");
    const impressione = await helpers.promptOptional(tp, "Prima impressione");
    const tensione = await helpers.promptOptional(tp, "Tensione o conflitto locale");
    const luogoPadre = creazioneCompleta ? await helpers.chooseLocation(tp, "Luogo o regione superiore", context) : "";
    const governante = creazioneCompleta ? await helpers.choosePerson(tp, "Governante o referente", context) : "";
    const fazioni = creazioneCompleta ? await helpers.chooseFactions(tp, "Fazioni presenti o interessate", context) : [];
    const personaggi = creazioneCompleta ? await helpers.choosePeople(tp, "PNG collegati al luogo", context) : [];
    const missioni = creazioneCompleta ? await helpers.chooseMissions(tp, "Missioni collegate al luogo", context) : [];
    const funzioneNarrativa = creazioneCompleta ? await helpers.promptOptional(tp, "Funzione narrativa del luogo") : "";
    const veritaNascosta = creazioneCompleta ? await helpers.promptOptional(tp, "Verità nascosta o segreto") : "";
    const domandaAperta = creazioneCompleta ? await helpers.promptOptional(tp, "Domanda aperta da esplorare al tavolo") : "";
    const sessioni = activeContext.link ? [activeContext.link] : [];
    const created = await helpers.moveNote(tp, helpers.path("luoghi"), name);
    // Un luogo creato al volo viene collegato alla sessione per ritrovarlo nel cockpit.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "luoghi" });

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: luogo
fileClass: luogo
famiglia_luogo: ${route.category ?? ""}
tipo: ${selectedType?.id ?? ""}
sottotipo: ${selectedType?.id ?? ""}
tipologia: ${selectedType?.id ?? ""}
bioma: ${selectedBiome?.id ?? ""}
stato: bozza
canonico: false
stato_canonico: canonico
mondo: ${mondo}
luogo_padre: ${luogoPadre}
governante: ${governante}
popolazione:
stabilita:
pericolo: ${pericolo}
pressione: 0
legittimita:
capitale:
impressione: ${helpers.yamlQuote(impressione)}
funzione_narrativa: ${helpers.yamlQuote(funzioneNarrativa)}
tensione: ${helpers.yamlQuote(tensione)}
promessa_al_tavolo:
confini: []
vassalli: []
alleati: []
rivali: []
relazioni: []
culture: []
risorse_strategiche: []
eserciti: []
crisi_interne: []
scelte: []
rischi: []
ricompense: []
hp_massimi:
hp_attuali:
fazioni: ${helpers.inlineYamlList(fazioni)}
religioni: []
personaggi: ${helpers.inlineYamlList(personaggi)}
missioni: ${helpers.inlineYamlList(missioni)}
sessioni: ${helpers.inlineYamlList(sessioni)}
risorse: []
problemi: []
conseguenze: []
segreti: ${helpers.inlineYamlTextList([veritaNascosta])}
indizi: []
voci: []
scene: []
prossima_mossa:
domande_aperte: ${helpers.inlineYamlTextList([domandaAperta])}
collegamenti_mancanti: []
---
`
}

module.exports = luogo;
