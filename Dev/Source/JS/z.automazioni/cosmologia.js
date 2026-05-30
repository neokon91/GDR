async function cosmologia(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della legge cosmica, piano, divinita o pantheon");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo");
    const tipo = await helpers.chooseOptional(
        tp,
        [
            { label: "Legge cosmica", id: "legge cosmica" },
            { label: "Piano o aldila", id: "piano o aldila" },
            { label: "Divinita", id: "divinita" },
            { label: "Pantheon", id: "pantheon" }
        ],
        "Tipo cosmologico"
    );
    const regola = await helpers.promptOptional(tp, "Regola che lo rende diverso dal mondo normale");
    const pericolo = await helpers.promptOptional(tp, "Pericolo o costo per entrarci");

    await helpers.moveNote(tp, helpers.path("cosmologia"), name);

    return await helpers.renderFrontmatter("cosmologia", {
        id: id,
        nome: helpers.yamlQuote(name),
        categoria: 'cosmologia',
        tipo: helpers.yamlQuote(tipo?.id ?? "legge cosmica"),
        stato: 'bozza',
        canonico: 'false',
        mondo: mondo,
        principi_realta: '[]',
        regola: helpers.yamlQuote(regola),
        pericolo: helpers.yamlQuote(pericolo),
        effetti_su_magia: '[]',
        divinita: '[]',
        religioni: '[]',
        luoghi_collegati: '[]',
        luoghi_sacri: '[]',
        culture_collegate: '[]',
        religioni_collegate: '[]',
        fonti: '[]',
        connessioni: '[]',
        segreti: '[]',
    });
}

module.exports = cosmologia;
