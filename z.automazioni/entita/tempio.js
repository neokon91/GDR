async function tempio(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del tempio");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseNoteByFrontmatter(tp, "categoria", "mondo", "Mondo del tempio");
    const luogoPadre = await helpers.chooseNoteByPath(tp, "Mondi/Luoghi", "Regione o luogo superiore");

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
    const fazioni = await helpers.chooseNotesByPath(tp, "Mondi/Fazioni", "Fazioni collegate al tempio");

    await tp.file.move(`Mondi/Luoghi/${name}`);

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
