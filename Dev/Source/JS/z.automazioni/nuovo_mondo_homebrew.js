async function nuovo_mondo_homebrew(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del mondo");
    const preset = await helpers.chooseRequired(tp, [
        { label: "Dark fantasy", id: "dark fantasy" },
        { label: "Fiaba crudele", id: "fiaba crudele" },
        { label: "Sword & sorcery", id: "sword & sorcery" },
        { label: "Low magic", id: "low magic" },
        { label: "Weird fantasy", id: "weird fantasy" },
        { label: "Political fantasy", id: "political fantasy" },
        { label: "Esplorazione", id: "esplorazione" },
        { label: "Mitico", id: "mitico" },
        { label: "Gotico", id: "gotico" },
        { label: "Marittimo", id: "marittimo" }
    ], "Preset creativo");
    const promise = await helpers.promptRequired(tp, "Promessa del mondo");
    const tone = await helpers.promptRequired(tp, "Tono");
    const locations = [];
    const cosmologies = [];
    const cultures = [];

    for (let index = 1; index <= 3; index += 1) {
        locations.push(await helpers.promptRequired(tp, `Luogo fondativo ${index}`));
    }

    for (let index = 1; index <= 3; index += 1) {
        cosmologies.push(await helpers.promptRequired(tp, `Legge cosmica, divinita o piano fondativo ${index}`));
    }

    for (let index = 1; index <= 2; index += 1) {
        cultures.push(await helpers.promptRequired(tp, `Cultura fondativa ${index}`));
    }

    const worldFolder = helpers.path("mondi");
    await helpers.moveNote(tp, worldFolder, name);

    async function createSeed(folderKey, seedName, category, type, extra = {}) {
        const folder = helpers.path(folderKey);
        const fileClassByCategory = {
            cultura: "cultura",
            cosmologia: "cosmologia",
            luogo: "luogo"
        };
        await helpers.ensureFolder(folder);
        const filePath = `${folder}/${seedName}.md`;
        if (app.vault.getAbstractFileByPath(filePath)) return `[[${seedName}]]`;

        const lines = [
            "---",
            `nome: ${helpers.yamlQuote(seedName)}`,
            `categoria: ${helpers.yamlQuote(category)}`,
            `fileClass: ${helpers.yamlQuote(fileClassByCategory[category] ?? "compendium")}`,
            `tipo: ${helpers.yamlQuote(type)}`,
            ...(category === "luogo" ? [`funzione_luogo: ${helpers.yamlQuote(extra.funzione_luogo ?? "")}`] : []),
            "stato: bozza",
            `mondo: "[[${name}]]"`,
            `gancio: ${helpers.yamlQuote(`Elemento fondativo di ${name}.`)}`,
            `uso_al_tavolo: ${helpers.yamlQuote("Ancora del mondo da trasformare in scena, scelta o conseguenza.")}`,
            `player_safe: ${helpers.yamlQuote(seedName)}`,
            "connessioni: []",
            "fonti: []",
            "tags: [\"mondo/lore\", \"gdr/bozza\"]",
            "---",
            `# ${seedName}`,
            "",
            "> [!scena] Perche conta",
            `> ${seedName} e una delle ancore iniziali di [[${name}]].`,
            "",
            "## Cosa Manca",
            "",
            "- collega almeno due entita vive;",
            "- scrivi una versione player-safe forte;",
            "- aggiungi una conseguenza potenziale."
        ];

        await app.vault.create(filePath, lines.join("\n"));
        return `[[${seedName}]]`;
    }

    const locationLinks = [];
    const cosmologyLinks = [];
    const cultureLinks = [];

    for (const location of locations) {
        locationLinks.push(await createSeed("luoghi", location, "luogo", "sito di interesse", {
            funzione_luogo: "luogo fondativo"
        }));
    }

    for (const cosmology of cosmologies) {
        cosmologyLinks.push(await createSeed("cosmologia", cosmology, "cosmologia", "legge cosmica"));
    }

    for (const culture of cultures) {
        cultureLinks.push(await createSeed("culture", culture, "cultura", "civilta"));
    }

    return await helpers.renderFrontmatter("nuovo_mondo_homebrew", {
        id: helpers.yamlQuote(helpers.slugify(name)),
        nome: helpers.yamlQuote(name),
        categoria: 'mondo',
        fileClass: 'mondo',
        stato: 'bozza',
        canonico: 'false',
        tono: helpers.yamlQuote(tone),
        tema: helpers.yamlQuote(preset.id),
        premessa: helpers.yamlQuote(promise),
        gancio: helpers.yamlQuote(promise),
        regioni: helpers.inlineYamlList(locationLinks),
        culture_fondative: helpers.inlineYamlList(cultureLinks),
        campagne: '[]',
        cosmologie: helpers.inlineYamlWikilinkList(cosmologyLinks),
        fonti: helpers.inlineYamlWikilinkList([...locationLinks, ...cosmologyLinks, ...cultureLinks]),
        connessioni: helpers.inlineYamlWikilinkList([...locationLinks, ...cosmologyLinks, ...cultureLinks]),
        tags: helpers.inlineYamlTextList(["dnd55/homebrew", "mondo/lore", "gdr/bozza"])
    });
}

module.exports = nuovo_mondo_homebrew;
