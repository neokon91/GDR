async function tesoro(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("tesoro");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome del tesoro");
    const luogo = await helpers.chooseLocation(tp, prompts.luogo ?? "Luogo dove si trova");
    const proprietario = await helpers.choosePerson(tp, prompts.proprietario ?? "Proprietario attuale o legittimo");
    const ricompense = await helpers.chooseObjects(tp, prompts.ricompense ?? "Ricompense contenute");
    const riferimentiSrd = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_srd ?? "Riferimenti SRD del tesoro");
    const riferimentiRegola = await helpers.promptWikilinkTargets(tp, prompts.riferimenti_regola ?? "Riferimenti regola del tesoro");

    await helpers.moveNote(tp, helpers.path("oggetti"), name);

    return await helpers.renderFrontmatter("tesoro", {
        id: helpers.slugify(name),
        nome: helpers.yamlQuote(name),
        tipo: "tesoro",
        stato: "bozza",
        fonte: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.fonte ?? "Fonte SRD o homebrew", "homebrew") || "homebrew"),
        rarita: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.rarita ?? "Rarita")),
        valore: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.valore ?? "Valore")),
        ricompense: helpers.inlineYamlList(ricompense),
        proprietario,
        luogo,
        gancio: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.gancio ?? "Perche interessa ai PG")),
        player_safe: helpers.yamlQuote(await helpers.promptOptional(tp, prompts.player_safe ?? "Descrizione mostrabile ai giocatori")),
        ...helpers.referenceFields({
            fonti: [...riferimentiSrd, ...riferimentiRegola, proprietario, luogo, ...ricompense],
            riferimentiSrd,
            riferimentiRegola,
            tabelle: ["[[Risorse/Tabelle/Tabelle#^complicazioni]]"],
            tags: ["dnd55/homebrew", "gdr/bozza"]
        })
    });
}

module.exports = tesoro;
