async function compendium_mondo(tp) {
    const helpers = tp.user.helpers;
    const type = await helpers.chooseRequired(
        tp,
        [
            { label: "Materiale", id: "materiale" },
            { label: "Pianta", id: "pianta" },
            { label: "Malattia", id: "malattia" },
            { label: "Moneta", id: "moneta" },
            { label: "Tecnologia", id: "tecnologia" },
            { label: "Cibo", id: "cibo" },
            { label: "Superstizione", id: "superstizione" },
            { label: "Professione", id: "professione" },
            { label: "Creatura regionale", id: "creatura regionale" }
        ],
        "Tipo di elemento del compendium"
    );
    const name = await helpers.promptRequired(tp, `Nome ${type.id}`);
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo di riferimento");
    const context = { world: mondo };
    const regioni = await helpers.chooseLocations(tp, "Regioni o luoghi collegati", context);
    const culture = await helpers.chooseNotesByPath(tp, helpers.path("culture"), "Culture collegate", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni collegate", context);
    const risorse = await helpers.chooseWorldResources(tp, "Risorse collegate", context);
    const uso = await helpers.promptOptional(tp, "Uso narrativo");
    const segreto = await helpers.promptOptional(tp, "Segreto, tabù o ambiguità");

    await helpers.moveNote(tp, helpers.path("compendium"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: risorsa
fileClass: compendium
tipo: ${type.id}
stato: bozza
mondo: ${mondo}
culture: ${helpers.inlineYamlList(culture)}
regioni: ${helpers.inlineYamlList(regioni)}
luoghi: ${helpers.inlineYamlList(regioni)}
risorse: ${helpers.inlineYamlList(risorse)}
fazioni: ${helpers.inlineYamlList(fazioni)}
missioni: []
eventi_storici: []
eventi: []
uso_narrativo: ${helpers.yamlQuote(uso)}
usi: ${helpers.inlineYamlTextList([uso])}
rischi: []
conseguenze: []
segreti: ${helpers.inlineYamlTextList([segreto])}
pressione: 0
prossima_mossa:
mappe: []
coordinate:
mappa:
layer_mappa: culturale
tipo_mappa: culturale
propaga_a: []
entita_impattate: []
domande_aperte: []
---

`;
}

module.exports = compendium_mondo;
