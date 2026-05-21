async function backgroundDnd(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("background_dnd");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome del background D&D");
    const mondo = await helpers.chooseWorld(tp, "Mondo del background");
    const context = { world: mondo };
    const fazioni = await helpers.chooseFactions(tp, prompts.fazioni ?? "Fazioni collegate", context);
    const culture = await helpers.chooseNotesByPath(tp, helpers.path("culture"), prompts.culture ?? "Culture collegate", context);
    const luoghi = await helpers.chooseLocations(tp, "Luoghi dove e comune", context);
    const riferimentiSrd = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_srd ?? "Riferimenti SRD del background");
    const riferimentiRegola = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_regola ?? "Riferimenti regola del background");

    await helpers.moveNote(tp, helpers.path("compendium"), name);

    return await helpers.renderFrontmatter("background_dnd", {
        id: helpers.slugify(name),
        nome: helpers.yamlQuote(name),
        tipo: "homebrew",
        stato: "bozza",
        fonte: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.fonte ?? "Fonte SRD o homebrew", "homebrew") || "homebrew"),
        background: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.background ?? "Nome tecnico del background", name) || name),
        competenze: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.competenze ?? "Competenze")]),
        strumenti: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.strumenti ?? "Strumenti")]),
        equipaggiamento: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.equipaggiamento ?? "Equipaggiamento")]),
        mondo,
        fazioni: helpers.inlineYamlList(fazioni),
        culture: helpers.inlineYamlList(culture),
        luoghi: helpers.inlineYamlList(luoghi),
        uso_al_tavolo: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Gancio per campagna")),
        player_safe: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.player_safe ?? "Descrizione mostrabile ai giocatori")),
        ...helpers.referenceFields({
            fonti: [...riferimentiSrd, ...riferimentiRegola, ...fazioni, ...culture, ...luoghi],
            riferimentiSrd,
            riferimentiRegola,
            tags: ["dnd55/homebrew", "gdr/bozza"]
        })
    });
}

module.exports = backgroundDnd;
