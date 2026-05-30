async function trappola(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("trappola");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome della trappola");
    const luogo = await helpers.chooseLocation(tp, "Luogo della trappola");
    const riferimentiSrd = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_srd ?? "Riferimenti SRD della trappola");
    const riferimentiRegola = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_regola ?? "Riferimenti regola della trappola");

    await helpers.moveNote(tp, helpers.path("incontri"), name);

    return await helpers.renderFrontmatter("trappola", {
        id: helpers.slugify(name),
        nome: helpers.yamlQuote(name),
        tipo: "trappola",
        stato: "bozza",
        fonte: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.fonte ?? "Fonte SRD o homebrew", "homebrew") || "homebrew"),
        pericolo: helpers.yamlNumber(await helpers.promptOptional(tp, prompts.pericolo ?? "Pericolo da 0 a 10")) || 0,
        innesco: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.innesco ?? "Innesco")),
        cd: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.cd ?? "CD per notarla, evitarla o disattivarla")),
        danno: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.danno ?? "Danno o effetto")),
        contromisure: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.contromisure ?? "Contromisure")]),
        conseguenze: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.conseguenze ?? "Conseguenze")]),
        luogo,
        uso_al_tavolo: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso concreto al tavolo")),
        player_safe: "",
        ...helpers.referenceFields({
            fonti: [...riferimentiSrd, ...riferimentiRegola, luogo],
            riferimentiSrd,
            riferimentiRegola,
            tabelle: [],
            tags: ["dnd55/homebrew", "gdr/bozza"]
        })
    });
}

module.exports = trappola;
