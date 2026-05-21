async function classeDnd(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("classe_dnd");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome della classe D&D");
    const mondo = await helpers.chooseWorld(tp, "Mondo della classe");
    const context = { world: mondo };
    const culture = await helpers.chooseNotesByPath(tp, helpers.path("culture"), prompts.culture ?? "Culture o societa dove e comune", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni o scuole collegate", context);
    const riferimentiSrd = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_srd ?? "Riferimenti SRD della classe");
    const riferimentiRegola = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_regola ?? "Riferimenti regola della classe");

    await helpers.moveNote(tp, helpers.path("compendium"), name);

    return await helpers.renderFrontmatter("classe_dnd", {
        id: helpers.slugify(name),
        nome: helpers.yamlQuote(name),
        tipo: "homebrew",
        stato: "bozza",
        fonte: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.fonte ?? "Fonte SRD o homebrew", "homebrew") || "homebrew"),
        classe: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.classe ?? "Nome tecnico della classe", name) || name),
        sottoclasse: "",
        level: "",
        privilegi: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.privilegi ?? "Privilegi chiave")]),
        competenze: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.competenze ?? "Competenze iniziali")]),
        equipaggiamento: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.equipaggiamento ?? "Equipaggiamento iniziale")]),
        incantesimi: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.incantesimi ?? "Regole di magia o lista incantesimi")]),
        mondo,
        culture: helpers.inlineYamlList(culture),
        fazioni: helpers.inlineYamlList(fazioni),
        uso_al_tavolo: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Promessa di gioco")),
        player_safe: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.player_safe ?? "Descrizione mostrabile ai giocatori")),
        ...helpers.referenceFields({
            fonti: [...riferimentiSrd, ...riferimentiRegola, ...culture, ...fazioni],
            riferimentiSrd,
            riferimentiRegola,
            tags: ["dnd55/homebrew", "gdr/bozza"]
        })
    });
}

module.exports = classeDnd;
