async function specieDnd(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("specie_dnd");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome della specie D&D");
    const mondo = await helpers.chooseWorld(tp, "Mondo della specie");
    const context = { world: mondo };
    const culture = await helpers.chooseNotesByPath(tp, helpers.path("culture"), prompts.culture ?? "Culture collegate", context);
    const luoghi = await helpers.chooseLocations(tp, prompts.luoghi ?? "Luoghi o regioni di origine", context);
    const riferimentiSrd = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_srd ?? "Riferimenti SRD della specie");
    const riferimentiRegola = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_regola ?? "Riferimenti regola della specie");

    await helpers.moveNote(tp, helpers.path("compendium"), name);

    return await helpers.renderFrontmatter("specie_dnd", {
        id: helpers.slugify(name),
        nome: helpers.yamlQuote(name),
        tipo: "homebrew",
        stato: "bozza",
        fonte: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.fonte ?? "Fonte SRD o homebrew", "homebrew") || "homebrew"),
        specie: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.specie ?? "Nome tecnico della specie", name) || name),
        tratti: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.tratti ?? "Tratti meccanici")]),
        lingue: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.lingue ?? "Lingue tipiche")]),
        mondo,
        culture: helpers.inlineYamlList(culture),
        luoghi: helpers.inlineYamlList(luoghi),
        habitat: helpers.inlineYamlList(luoghi),
        uso_al_tavolo: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Promessa di gioco")),
        player_safe: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.player_safe ?? "Descrizione mostrabile ai giocatori")),
        ...helpers.referenceFields({
            fonti: [...riferimentiSrd, ...riferimentiRegola, ...culture, ...luoghi],
            riferimentiSrd,
            riferimentiRegola,
            tags: ["dnd55/homebrew", "gdr/bozza"]
        })
    });
}

module.exports = specieDnd;
