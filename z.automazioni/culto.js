async function culto(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della religione, divinità o culto");
    const id = helpers.slugify(name);
    const selectedSubtype = await helpers.chooseOptional(
        tp,
        [
            { label: "Religione", id: "religione" },
            { label: "Culto", id: "culto" },
            { label: "Divinità", id: "divinità" },
            { label: "Entità", id: "entità" }
        ],
        "Sottotipo"
    );
    const tipo = await helpers.promptOptional(tp, "Tipo o dominio");
    const mondo = await helpers.chooseNoteByFrontmatter(tp, "categoria", "mondo", "Mondo della religione");
    const templi = await helpers.chooseNotesByPath(tp, "Mondi/Luoghi", "Templi collegati");
    const fazioni = await helpers.chooseNotesByPath(tp, "Mondi/Fazioni", "Fazioni collegate");

    await tp.file.move(`Mondi/Religioni/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: religione
tipo: ${helpers.yamlQuote(tipo)}
sottotipo: ${selectedSubtype?.id ?? ""}
stato: bozza
canonico: false
mondo: ${mondo}
divinita: []
templi: ${helpers.inlineYamlList(templi)}
fazioni: ${helpers.inlineYamlList(fazioni)}
---
`;
}

module.exports = culto;
