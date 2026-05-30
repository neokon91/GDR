async function incontro(tp, routeOptions = {}) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("incontro");
    const prompts = profile.prompts ?? {};
    const activeContext = helpers.getActiveSessionContext();
    const encounterName = value => {
        const raw = String(value ?? "").trim();
        const match = raw.match(/^\[\[([^|\]]+)(?:\|[^\]]+)?\]\]$/);
        const target = match ? match[1] : raw;
        return target.replace(/\.md$/, "").split("/").pop();
    };
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome dell'incontro");
    const id = helpers.slugify(name);
    const route = Object.keys(routeOptions).length ? routeOptions : helpers.consumeRoute();
    const forcedType = route.tipoIncontro ?? (["trappola", "pericolo ambientale"].includes(route.contentType) ? route.contentType : "");
    const selectedType = forcedType ? { id: forcedType } : await helpers.chooseProfileOption(
        tp,
        profile,
        route
    );
    const luogo = await helpers.chooseLocation(tp, prompts.luogo ?? "Luogo dell'incontro");
    const context = { world: helpers.getWorldFromLink(luogo) };
    const pericolo = await helpers.promptOptional(tp, prompts.pericolo ?? "Pericolo da 0 a 10");
    const missioni = await helpers.chooseMissions(tp, prompts.missioni ?? "Missioni collegate", context);
    const fazioni = await helpers.chooseFactions(tp, prompts.fazioni ?? "Fazioni collegate", context);
    const creature = await helpers.chooseCreatures(tp, prompts.creature ?? "Creature coinvolte", context);
    const personaggi = await helpers.choosePeople(tp, prompts.personaggi ?? "Personaggi coinvolti", context);
    const ricompense = await helpers.chooseObjects(tp, prompts.ricompense ?? "Ricompense", context);
    const gancio = await helpers.promptOptional(tp, prompts.gancio ?? "Perche questo incontro entra in scena");
    const usoAlTavolo = await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso al tavolo");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Versione player-safe");
    const prossimaMossa = await helpers.promptOptional(tp, prompts.prossima_mossa ?? "Cosa cambia se l'incontro viene evitato, perso o vinto");
    const riferimentiRegola = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_regola ?? "Riferimenti regola dell'incontro");
    const encounterCreatures = creature.map(link => helpers.yamlQuote(encounterName(link)));

    const sessioni = activeContext.link ? [activeContext.link] : [];
    const created = await helpers.moveNote(tp, helpers.path("incontri"), name);
    // L'incontro appena creato diventa subito disponibile in Durante il Gioco.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "incontri" });
    await helpers.linkCreatedNoteToConnections(created, [luogo, ...missioni, ...fazioni, ...creature, ...ricompense].filter(Boolean));

    return await helpers.renderFrontmatter("incontro", {
        id,
        nome: helpers.yamlQuote(name),
        tipo: selectedType?.id ?? "",
        mondo: context.world,
        luogo,
        missioni: helpers.inlineYamlList(missioni),
        fazioni: helpers.inlineYamlList(fazioni),
        creature: helpers.inlineYamlList(creature),
        personaggi: helpers.inlineYamlList(personaggi),
        sessioni: helpers.inlineYamlList(sessioni),
        pericolo,
        ricompense: helpers.inlineYamlList(ricompense),
        gancio: helpers.yamlQuote(gancio),
        uso_al_tavolo: helpers.yamlQuote(usoAlTavolo),
        player_safe: helpers.yamlQuote(playerSafe),
        prossima_mossa: helpers.yamlQuote(prossimaMossa),
        encounter_creatures: helpers.inlineYamlList(encounterCreatures),
        fonti: helpers.inlineYamlWikilinkList([...sessioni, luogo, ...missioni, ...fazioni, ...creature, ...ricompense]),
        riferimenti_srd: '[]',
        riferimenti_regola: helpers.inlineYamlWikilinkList(riferimentiRegola),
        sezioni_collegate: '[]',
        blocchi_collegati: '[]',
        tabelle_collegate: '[]',
        tags: helpers.inlineYamlTextList(["gdr/bozza"])
    });
}

module.exports = incontro;
