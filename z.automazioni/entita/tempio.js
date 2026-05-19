async function tempio(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del tempio");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo del tempio");
    const context = { world: mondo };
    const luogoPadre = await helpers.chooseLocation(tp, "Regione o luogo superiore", context);

    const deity = await helpers.chooseNoteByFrontmatter(
        tp,
        "sottotipo",
        "divinità",
        "Scegli una divinità principale",
        "Nessuna"
    );

    const cult = await helpers.chooseNoteByFrontmatter(
        tp,
        "sottotipo",
        "culto",
        "Scegli un culto associato",
        "Nessuno"
    );
    const fazioni = await helpers.chooseFactions(tp, "Fazioni collegate al tempio", context);

    await helpers.moveNote(tp, helpers.path("luoghi"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: luogo
tipo: tempio
sottotipo: luogo di interesse
stato: bozza
canonico: false
mondo: ${mondo}
luogo_padre: ${luogoPadre}
divinita_principale: ${deity}
culto_associato: ${cult}
reliquie: []
fazioni: ${helpers.inlineYamlList(fazioni)}
religioni: []
risorse: []
problemi: []
---
`;
}

module.exports = tempio;
