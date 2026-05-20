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
    const genre = await helpers.promptOptional(tp, "Genere o contaminazione");
    const magic = await helpers.promptRequired(tp, "Livello magia");
    const scale = await helpers.promptRequired(tp, "Scala iniziale");
    const conflict = await helpers.promptRequired(tp, "Conflitto centrale");
    const constraints = await helpers.promptOptional(tp, "Vincoli creativi");
    const avoid = await helpers.promptOptional(tp, "Temi da evitare");
    const locations = [];
    const powers = [];
    const cultures = [];

    for (let index = 1; index <= 3; index += 1) {
        locations.push(await helpers.promptRequired(tp, `Luogo fondativo ${index}`));
    }

    for (let index = 1; index <= 3; index += 1) {
        powers.push(await helpers.promptRequired(tp, `Potere/fazione fondativa ${index}`));
    }

    for (let index = 1; index <= 2; index += 1) {
        cultures.push(await helpers.promptRequired(tp, `Cultura fondativa ${index}`));
    }

    const mystery = await helpers.promptRequired(tp, "Mistero fondativo");
    const pressure = await helpers.promptRequired(tp, "Pressione iniziale");
    const worldFolder = helpers.path("mondi");
    await helpers.moveNote(tp, worldFolder, name);

    async function createSeed(folderKey, seedName, category, type, extra = {}) {
        const folder = helpers.path(folderKey);
        await helpers.ensureFolder(folder);
        const filePath = `${folder}/${seedName}.md`;
        if (app.vault.getAbstractFileByPath(filePath)) return `[[${seedName}]]`;

        const lines = [
            "---",
            `nome: ${helpers.yamlQuote(seedName)}`,
            `categoria: ${helpers.yamlQuote(category)}`,
            `tipo: ${helpers.yamlQuote(type)}`,
            "stato: bozza",
            `mondo: "[[${name}]]"`,
            `gancio: ${helpers.yamlQuote(`Elemento fondativo di ${name}.`)}`,
            `uso_al_tavolo: ${helpers.yamlQuote("Ancora del mondo da trasformare in scena, scelta o conseguenza.")}`,
            `player_safe: ${helpers.yamlQuote(seedName)}`,
            "connessioni: []",
            "pressione: 0",
            "prossima_mossa: \"\"",
            "pubblico: false",
            ...Object.entries(extra).map(([key, value]) => `${key}: ${helpers.yamlQuote(value)}`),
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
    const powerLinks = [];
    const cultureLinks = [];

    for (const location of locations) {
        locationLinks.push(await createSeed("luoghi", location, "luogo", "luogo fondativo"));
    }

    for (const power of powers) {
        powerLinks.push(await createSeed("fazioni", power, "fazione", "fazione generica"));
    }

    for (const culture of cultures) {
        cultureLinks.push(await createSeed("culture", culture, "cultura", "cultura"));
    }

    return `---
id: ${helpers.yamlQuote(helpers.slugify(name))}
nome: ${helpers.yamlQuote(name)}
categoria: mondo
stato: bozza
tono: ${helpers.yamlQuote(tone)}
tema: ${helpers.yamlQuote(preset.id)}
genere: ${helpers.yamlQuote(genre)}
scala: ${helpers.yamlQuote(scale)}
magia: ${helpers.yamlQuote(magic)}
premessa: ${helpers.yamlQuote(promise)}
gancio: ${helpers.yamlQuote(promise)}
conflitto_centrale: ${helpers.yamlQuote(conflict)}
vincoli: ${helpers.yamlQuote(constraints)}
non_vogliamo: ${helpers.inlineYamlTextList([avoid])}
luoghi_iconici: ${helpers.inlineYamlList(locationLinks)}
fazioni_principali: ${helpers.inlineYamlList(powerLinks)}
culture_fondative: ${helpers.inlineYamlList(cultureLinks)}
misteri_pubblici: ${helpers.inlineYamlTextList([mystery])}
pressione_iniziale: ${helpers.yamlQuote(pressure)}
prossime_entita_consigliate: ["religione o mito", "risorsa contesa", "rotta", "relazione", "evento storico", "missione da conflitto"]
materiale_pubblico: []
campagne: []
relazioni_chiave: []
canonico: false
---
`;
}

module.exports = nuovo_mondo_homebrew;
