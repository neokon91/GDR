async function tempio(tp) {
    const helpers = tp.user.helpers;
    const name = await tp.system.prompt("Nome del tempio?");
    const id = helpers.slugify(name);
    await tp.file.move(`Mondo/Luoghi/${name}`);

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

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: luogo
tipo: tempio
sottotipo: luogo di interesse
stato: bozza
canonico: false
luogo_padre:
divinita_principale: ${deity}
culto_associato: ${cult}
reliquie: []
fazioni: []
religioni: []
risorse: []
problemi: []
---
`;
}

module.exports = tempio;
