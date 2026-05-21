async function talentoDnd(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("talento_dnd");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome del talento D&D");
    const mondo = await helpers.chooseWorld(tp, "Mondo del talento");
    const context = { world: mondo };
    const culture = await helpers.chooseNotesByPath(tp, helpers.path("culture"), prompts.culture ?? "Culture dove e comune", context);
    const fazioni = await helpers.chooseFactions(tp, prompts.fazioni ?? "Fazioni che lo insegnano", context);
    const riferimentiSrd = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_srd ?? "Riferimenti SRD del talento");
    const riferimentiRegola = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_regola ?? "Riferimenti regola del talento");

    await helpers.moveNote(tp, helpers.path("compendium"), name);

    return await helpers.renderFrontmatter("talento_dnd", {
        id: helpers.slugify(name),
        nome: helpers.yamlQuote(name),
        tipo: "homebrew",
        stato: "bozza",
        fonte: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.fonte ?? "Fonte SRD o homebrew", "homebrew") || "homebrew"),
        talento: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.talento ?? "Nome tecnico del talento", name) || name),
        prerequisito: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.prerequisito ?? "Prerequisito")),
        beneficio: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.beneficio ?? "Beneficio meccanico")]),
        mondo,
        culture: helpers.inlineYamlList(culture),
        fazioni: helpers.inlineYamlList(fazioni),
        uso_al_tavolo: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso concreto al tavolo")),
        player_safe: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.player_safe ?? "Descrizione mostrabile ai giocatori")),
        ...helpers.referenceFields({
            fonti: [...riferimentiSrd, ...riferimentiRegola, ...culture, ...fazioni],
            riferimentiSrd,
            riferimentiRegola,
            tags: ["dnd55/homebrew", "gdr/bozza"]
        })
    });
}

module.exports = talentoDnd;
