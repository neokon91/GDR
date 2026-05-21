async function pericoloAmbientale(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("pericolo_ambientale");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome del pericolo ambientale");
    const mondo = await helpers.chooseWorld(tp, "Mondo del pericolo");
    const context = { world: mondo };
    const luoghi = await helpers.chooseLocations(tp, "Luoghi interessati", context);
    const riferimentiSrd = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_srd ?? "Riferimenti SRD del pericolo ambientale");
    const riferimentiRegola = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_regola ?? "Riferimenti regola del pericolo ambientale");

    await helpers.moveNote(tp, helpers.path("incontri"), name);

    return await helpers.renderFrontmatter("pericolo_ambientale", {
        id: helpers.slugify(name),
        nome: helpers.yamlQuote(name),
        tipo: "pericolo ambientale",
        stato: "bozza",
        bioma: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.bioma ?? "Bioma o ambiente")),
        pericolo: helpers.yamlNumber(await helpers.promptOptional(tp, prompts.pericolo ?? "Pericolo da 0 a 10")) || 0,
        cd: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.cd ?? "CD rilevante")),
        danno: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.danno ?? "Danno o effetto")),
        segnali: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.segnali ?? "Segnali percepibili prima del rischio")]),
        contromisure: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.contromisure ?? "Contromisure")]),
        conseguenze: helpers.inlineYamlTextList([await helpers.promptOptional(tp, prompts.conseguenze ?? "Conseguenze")]),
        luoghi: helpers.inlineYamlList(luoghi),
        uso_al_tavolo: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.uso_al_tavolo ?? "Uso concreto al tavolo")),
        player_safe: "",
        ...helpers.referenceFields({
            fonti: [...riferimentiSrd, ...riferimentiRegola, ...luoghi],
            riferimentiSrd,
            riferimentiRegola,
            tabelle: ["[[Risorse/Tabelle/Tabelle#^complicazioni]]"],
            tags: ["dnd55/homebrew", "gdr/bozza"]
        })
    });
}

module.exports = pericoloAmbientale;
