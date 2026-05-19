async function incontro(tp, routeOptions = {}) {
    const helpers = tp.user.helpers;
    const encounterName = value => {
        const raw = String(value ?? "").trim();
        const match = raw.match(/^\[\[([^|\]]+)(?:\|[^\]]+)?\]\]$/);
        const target = match ? match[1] : raw;
        return target.replace(/\.md$/, "").split("/").pop();
    };
    const name = await helpers.promptRequired(tp, "Nome dell'incontro");
    const id = helpers.slugify(name);
    const route = Object.keys(routeOptions).length ? routeOptions : helpers.consumeRoute();
    const forcedType = route.tipoIncontro ?? (["trappola", "pericolo ambientale"].includes(route.contentType) ? route.contentType : "");
    const selectedType = forcedType ? { id: forcedType } : await helpers.chooseOptional(
        tp,
        [
            { label: "Combattimento", id: "combattimento" },
            { label: "Negoziazione", id: "negoziazione" },
            { label: "Esplorazione", id: "esplorazione" },
            { label: "Ostacolo", id: "ostacolo" },
            { label: "Inseguimento", id: "inseguimento" },
            { label: "Trappola", id: "trappola" },
            { label: "Pericolo ambientale", id: "pericolo ambientale" },
            { label: "Scena sociale", id: "scena sociale" }
        ],
        "Tipo di incontro"
    );
    const luogo = await helpers.chooseLocation(tp, "Luogo dell'incontro");
    const context = { world: helpers.getWorldFromLink(luogo) };
    const pericolo = await helpers.promptOptional(tp, "Pericolo da 0 a 10");
    const creature = await helpers.chooseCreatures(tp, "Creature coinvolte", context);
    const personaggi = await helpers.choosePeople(tp, "Personaggi coinvolti", context);
    const ricompense = await helpers.chooseObjects(tp, "Ricompense", context);
    const encounterCreatures = creature.map(link => helpers.yamlQuote(encounterName(link)));

    await helpers.moveNote(tp, helpers.path("incontri"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: incontro
tipo: ${selectedType?.id ?? ""}
stato: bozza
mondo: ${context.world}
luogo: ${luogo}
creature: ${helpers.inlineYamlList(creature)}
personaggi: ${helpers.inlineYamlList(personaggi)}
pericolo: ${pericolo}
ricompense: ${helpers.inlineYamlList(ricompense)}
round: 1
condizioni: []
encounter_creatures: ${helpers.inlineYamlList(encounterCreatures)}
---
`;
}

module.exports = incontro;
