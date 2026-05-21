async function luogo(tp, routeOptions = {}){
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("luogo");
    const prompts = profile.prompts ?? {};
    const activeContext = helpers.getActiveSessionContext();
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome del luogo");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, profile.completion_prompt ?? "Vuoi compilare collegamenti e lore ora? Scegli No per un luogo rapido.");
    const route = Object.keys(routeOptions).length ? routeOptions : helpers.consumeRoute();
    const selectedType = await helpers.chooseProfileOption(tp, profile, route);
    const selectedBiome = creazioneCompleta ? await helpers.chooseOptional(
        tp,
        profile.biome_options ?? [],
        profile.biome_prompt ?? "Bioma"
    ) : null;
    const mondo = await helpers.chooseWorld(tp, profile.world_prompt ?? "Mondo del luogo");
    const context = { world: mondo };
    const pericolo = await helpers.promptOptional(tp, prompts.pericolo ?? "Pericolo da 0 a 10");
    const gancio = await helpers.promptOptional(tp, prompts.gancio ?? "Gancio giocabile: perche questo luogo importa adesso?");
    const impressione = await helpers.promptOptional(tp, prompts.impressione ?? "Prima impressione");
    const tensione = await helpers.promptOptional(tp, prompts.tensione ?? "Tensione o conflitto locale");
    const usoAlTavolo = await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso al tavolo: scelta, rischio o scena che produce");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Versione player-safe mostrabile");
    const luogoPadre = creazioneCompleta ? await helpers.chooseLocation(tp, prompts.luogo_padre ?? "Luogo o regione superiore", context) : "";
    const governante = creazioneCompleta ? await helpers.choosePerson(tp, prompts.governante ?? "Governante o referente", context) : "";
    const fazioni = creazioneCompleta ? await helpers.chooseFactions(tp, prompts.fazioni ?? "Fazioni presenti o interessate", context) : [];
    const personaggi = creazioneCompleta ? await helpers.choosePeople(tp, prompts.personaggi ?? "PNG collegati al luogo", context) : [];
    const missioni = creazioneCompleta ? await helpers.chooseMissions(tp, prompts.missioni ?? "Missioni collegate al luogo", context) : [];
    const funzioneNarrativa = creazioneCompleta ? await helpers.promptOptional(tp, prompts.funzione_narrativa ?? "Funzione narrativa del luogo") : "";
    const veritaNascosta = creazioneCompleta ? await helpers.promptOptional(tp, prompts.verita_nascosta ?? "Verità nascosta o segreto") : "";
    const domandaAperta = creazioneCompleta ? await helpers.promptOptional(tp, prompts.domanda_aperta ?? "Domanda aperta da esplorare al tavolo") : "";
    const connessioni = await helpers.chooseConnections(tp, profile.connection_prompt ?? "Connessioni vive del luogo", context);
    const sessioni = activeContext.link ? [activeContext.link] : [];
    const created = await helpers.moveNote(tp, helpers.path("luoghi"), name);
    // Un luogo creato al volo viene collegato alla sessione per ritrovarlo nel cockpit.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "luoghi" });
    await helpers.linkCreatedNoteToConnections(created, connessioni);

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
gancio: ${helpers.yamlQuote(gancio)}
uso_al_tavolo: ${helpers.yamlQuote(usoAlTavolo)}
player_safe: ${helpers.yamlQuote(playerSafe)}
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
connessioni: ${helpers.inlineYamlList(connessioni)}
collegamenti_mancanti: []
---
`
}

module.exports = luogo;
