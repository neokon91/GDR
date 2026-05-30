async function incantesimo(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("incantesimo");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome dell'incantesimo");
    const id = helpers.slugify(name);
    const livello = await helpers.promptOptional(tp, prompts.livello_incantesimo ?? "Livello dell'incantesimo", "1") || "1";
    const scuola = await helpers.promptOptional(tp, prompts.scuola ?? "Scuola di magia");
    const tempoLancio = await helpers.promptOptional(tp, prompts.tempo_lancio ?? "Tempo di lancio", "Azione");
    const gittata = await helpers.promptOptional(tp, prompts.gittata ?? "Gittata");
    const componenti = await helpers.promptOptional(tp, prompts.componenti ?? "Componenti");
    const durata = await helpers.promptOptional(tp, prompts.durata ?? "Durata");
    const classi = await helpers.promptOptional(tp, prompts.classi ?? "Classi che lo usano, separate da virgola");
    const fonte = await helpers.promptOptional(tp, prompts.fonte ?? "Fonte SRD o homebrew", "homebrew") || "homebrew";
    const effetti = await helpers.promptOptional(tp, prompts.effetti ?? "Effetti meccanici e fictionali");
    const limiti = await helpers.promptOptional(tp, prompts.limiti ?? "Limiti, costi o rischi");
    const mondo = await helpers.chooseWorld(tp, "Mondo dell'incantesimo");
    const context = { world: mondo };
    const culture = await helpers.chooseNotesByPath(tp, helpers.path("culture"), "Culture che conoscono l'incantesimo", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni che lo insegnano o vietano", context);
    const connessioni = await helpers.chooseConnections(tp, "Connessioni vive dell'incantesimo", context);
    const riferimentiSrd = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_srd ?? "Riferimenti SRD granulari dell'incantesimo");
    const riferimentiRegola = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_regola ?? "Riferimenti regola granulari dell'incantesimo");
    const usoAlTavolo = await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso concreto al tavolo");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Descrizione mostrabile ai giocatori");

    await helpers.moveNote(tp, helpers.path("compendium"), name);

    return await helpers.renderFrontmatter("incantesimo", {
        id,
        nome: helpers.yamlQuote(name),
        tipo: "incantesimo",
        stato: "bozza",
        fonte: helpers.yamlQuote(fonte),
        livello_incantesimo: helpers.yamlQuote(livello),
        scuola: helpers.yamlQuote(scuola),
        tempo_lancio: helpers.yamlQuote(tempoLancio),
        gittata: helpers.yamlQuote(gittata),
        componenti: helpers.yamlQuote(componenti),
        durata: helpers.yamlQuote(durata),
        classi: helpers.inlineYamlTextList(classi.split(/[,;]+/)),
        effetti: helpers.inlineYamlTextList([effetti]),
        limiti: helpers.inlineYamlTextList([limiti]),
        mondo,
        culture: helpers.inlineYamlList(culture),
        fazioni: helpers.inlineYamlList(fazioni),
        uso_al_tavolo: helpers.yamlQuote(usoAlTavolo),
        player_safe: helpers.yamlQuote(playerSafe),
        connessioni: helpers.inlineYamlList(connessioni),
        ...helpers.referenceFields({
            fonti: [...riferimentiSrd, ...riferimentiRegola, ...connessioni],
            riferimentiSrd,
            riferimentiRegola,
            tags: ["dnd55/incantesimo", "dnd55/homebrew", "gdr/bozza"]
        })
    });
}

module.exports = incantesimo;
