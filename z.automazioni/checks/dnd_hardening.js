function validateDndHardening({ fileRel, frontmatter, warnings, hasAny, hasValue }) {
    const fm = frontmatter;

    if (fileRel.startsWith("Mondi/Incontri/") && fm.categoria === "incontro" && fm.stato !== "archiviata") {
        if (!hasAny(fm, ["luogo", "luoghi"])) {
            warnings.push(`${fileRel}: incontro senza luogo`);
        }
        if (!hasAny(fm, ["missioni", "fazioni", "sessioni"])) {
            warnings.push(`${fileRel}: incontro isolato da missione, fazione o sessione`);
        }
        if (!hasAny(fm, ["gancio", "uso_al_tavolo"])) {
            warnings.push(`${fileRel}: incontro senza gancio o uso_al_tavolo`);
        }
        if (String(fm.tipo ?? "") === "combattimento" && !hasValue(fm.encounter_creatures)) {
            warnings.push(`${fileRel}: combattimento senza encounter_creatures`);
        }
        if (String(fm.tipo ?? "") === "combattimento" && !hasValue(fm.creature)) {
            warnings.push(`${fileRel}: combattimento senza creature collegate`);
        }
    }

    if (fileRel.startsWith("Mondi/Creature/") && fm.categoria === "creatura" && fm.stato !== "archiviata") {
        if (!hasAny(fm, ["luoghi", "habitat"])) {
            warnings.push(`${fileRel}: creatura senza habitat o luoghi`);
        }
        if (!hasAny(fm, ["missioni", "fazioni", "luoghi", "luogo"])) {
            warnings.push(`${fileRel}: creatura senza missione/fazione/luogo`);
        }
        if (!hasAny(fm, ["gancio", "uso_al_tavolo"])) {
            warnings.push(`${fileRel}: creatura senza gancio o uso_al_tavolo`);
        }
    }

    if (fileRel.startsWith("Mondi/Oggetti/") && fm.categoria === "oggetto" && fm.stato !== "archiviata") {
        if (!hasAny(fm, ["luogo", "proprietario"])) {
            warnings.push(`${fileRel}: oggetto senza luogo o proprietario`);
        }
        if (!hasAny(fm, ["missioni", "sessioni", "connessioni"])) {
            warnings.push(`${fileRel}: oggetto isolato da missione, sessione o connessioni`);
        }
        if (!hasAny(fm, ["gancio", "uso_al_tavolo", "prossima_mossa", "conseguenza_potenziale"])) {
            warnings.push(`${fileRel}: oggetto senza uso narrativo`);
        }
    }
}

module.exports = {
    validateDndHardening
};
