async function regolaDnd(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("regola_dnd");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome della regola D&D");
    const riferimentiSrd = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_srd ?? "Riferimenti SRD della regola");
    const riferimentiRegola = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_regola ?? "Riferimenti regola correlati");

    await helpers.moveNote(tp, helpers.path("compendium"), name);

    return await helpers.renderFrontmatter("regola_dnd", {
        id: helpers.slugify(name),
        nome: helpers.yamlQuote(name),
        tipo: "homebrew",
        stato: "bozza",
        fonte: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.fonte ?? "Fonte SRD o homebrew", "homebrew") || "homebrew"),
        regola: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.regola ?? "Regola sintetica")),
        limiti: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.limiti ?? "Limiti o interpretazioni")]),
        effetti: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.effetti ?? "Effetti pratici")]),
        uso_al_tavolo: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Quando serve al tavolo")),
        player_safe: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.player_safe ?? "Versione leggibile ai giocatori")),
        ...helpers.referenceFields({
            fonti: [...riferimentiSrd, ...riferimentiRegola],
            riferimentiSrd,
            riferimentiRegola,
            tags: ["dnd55/regola", "dnd55/homebrew", "gdr/bozza"]
        })
    });
}

module.exports = regolaDnd;
