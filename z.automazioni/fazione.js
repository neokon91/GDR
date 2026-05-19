async function fazione(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della fazione");
    const id = helpers.slugify(name);
    const route = tp.config.extra ?? {};
    const selectedType = route.tipoFazione ? { id: route.tipoFazione } : await helpers.chooseOptional(
        tp,
        [
            { label: "Gilda", id: "gilda" },
            { label: "Confraternita", id: "confraternita" },
            { label: "Casata", id: "casata" },
            { label: "Ordine militare", id: "ordine militare" },
            { label: "Compagnia mercantile", id: "compagnia mercantile" },
            { label: "Banda criminale", id: "banda criminale" },
            { label: "Movimento ribelle", id: "movimento ribelle" },
            { label: "Governo", id: "governo" },
            { label: "Culto politico", id: "culto politico" }
        ],
        "Tipo di fazione"
    );
    const mondo = await helpers.chooseWorld(tp, "Mondo della fazione");
    const context = { world: mondo };
    const leader = await helpers.choosePeople(tp, "Leader della fazione", context);
    const luoghi = await helpers.chooseLocations(tp, "Luoghi controllati o importanti", context);
    const personaggi = await helpers.choosePeople(tp, "Membri, alleati o nemici come PNG", context);

    await helpers.moveNote(tp, helpers.PATHS.fazioni, name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: fazione
tipo: ${selectedType?.id ?? ""}
stato: bozza
canonico: false
mondo: ${mondo}
leader: ${helpers.inlineYamlList(leader)}
luoghi: ${helpers.inlineYamlList(luoghi)}
personaggi: ${helpers.inlineYamlList(personaggi)}
---
`;
}

module.exports = fazione;
