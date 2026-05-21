function normalizeFieldArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value === null || value === undefined) return [];
    const text = String(value).trim();
    return text ? [text] : [];
}

function appendUnique(value, entry) {
    const entries = normalizeFieldArray(value);
    if (!entry || entries.includes(entry)) return entries;
    return [...entries, entry];
}

function appendUniqueMany(value, entries) {
    return normalizeFieldArray(entries).reduce((acc, entry) => appendUnique(acc, entry), value);
}

function continuityUpdateText({ today, sourceLink, text, nextMove }) {
    return [
        today,
        sourceLink,
        text ? `impatto: ${text}` : "",
        nextMove ? `prossima mossa: ${nextMove}` : ""
    ].filter(Boolean).join(" | ");
}

function continuityEntry({ today, choice, consequenceText, targets, nextMove }) {
    return [
        today,
        choice ? `scelta: ${choice}` : "",
        consequenceText ? `conseguenza: ${consequenceText}` : "",
        normalizeFieldArray(targets).length ? `bersagli: ${normalizeFieldArray(targets).join(", ")}` : "",
        nextMove ? `prossima mossa: ${nextMove}` : ""
    ].filter(Boolean).join(" | ");
}

function recordFrontmatter(records, key) {
    const record = records instanceof Map ? records.get(key) : records[key];
    return record?.frontmatter ?? record ?? null;
}

function applyContinuityImpact(records, targetKey, options) {
    const {
        sourceKey = "",
        sourceLink,
        targetLink = "",
        consequenceText = "",
        nextMove = "",
        pressureDelta = 0,
        trackStep = 0,
        today,
        mode = "propagazione"
    } = options;
    const target = recordFrontmatter(records, targetKey);

    if (!target || targetKey === sourceKey) return false;

    target.propagato_da = appendUnique(target.propagato_da, sourceLink);
    target.propagazione_stato = "da verificare";
    target.ultima_propagazione = today;
    target.aggiornamenti_richiesti = appendUnique(
        target.aggiornamenti_richiesti,
        continuityUpdateText({ today, sourceLink, text: consequenceText, nextMove })
    );

    if (mode === "conseguenza") {
        target.conseguenze = appendUnique(target.conseguenze, sourceLink);
    } else {
        target.connessioni = appendUnique(target.connessioni, sourceLink);
    }

    if (consequenceText) {
        target.impatto = appendUnique(target.impatto, consequenceText);
        if (String(target.categoria ?? "") === "tracciato" && !target.innesco) {
            target.innesco = consequenceText;
        }
    }

    if (nextMove && !target.prossima_mossa) {
        target.prossima_mossa = nextMove;
    }

    if (pressureDelta !== 0) {
        const currentPressure = Number.parseInt(target.pressione ?? 0, 10) || 0;
        target.pressione = Math.max(0, currentPressure + pressureDelta);
    }

    if (trackStep !== 0 && String(target.categoria ?? "") === "tracciato") {
        const currentProgress = Number.parseInt(target.progress_value ?? 0, 10) || 0;
        const maxProgress = Number.parseInt(target.progress_max ?? 0, 10) || 0;
        target.progress_value = Math.max(0, currentProgress + trackStep);
        target.avanzato_il = today;
        if (maxProgress > 0 && target.progress_value >= maxProgress && target.stato !== "archiviata") {
            target.stato = "completato";
        }
    }

    if (targetLink && String(target.categoria ?? "") === "relazione") {
        target.relazioni = appendUnique(target.relazioni, targetLink);
    }

    return true;
}

function registerWorldChoice(records, sourceKey, options) {
    const {
        today,
        choice,
        consequenceText = "",
        targets = [],
        nextMove = "",
        pressureDelta = 0,
        trackStep = 0,
        sourceLink
    } = options;
    const source = recordFrontmatter(records, sourceKey);
    if (!source) throw new Error(`Sorgente M11 non trovata: ${sourceKey}`);
    if (!choice) throw new Error("Scelta M11 mancante.");
    if (!normalizeFieldArray(targets).length) throw new Error("Bersagli M11 mancanti.");

    const entry = continuityEntry({ today, choice, consequenceText, targets, nextMove });

    for (const target of targets) {
        applyContinuityImpact(records, target.key, {
            sourceKey,
            sourceLink,
            targetLink: target.link,
            consequenceText: consequenceText || choice,
            nextMove,
            pressureDelta,
            trackStep,
            today,
            mode: "conseguenza"
        });
    }

    source.decisioni_prese = appendUnique(source.decisioni_prese, choice);
    source.output_sessione = appendUnique(source.output_sessione, entry);
    source.conseguenze = appendUnique(source.conseguenze, consequenceText || choice);
    source.entita_impattate = appendUniqueMany(source.entita_impattate, targets.map(target => target.link));
    source.applicata_a = appendUniqueMany(source.applicata_a, targets.map(target => target.link));
    source.propagazione_stato = "applicata";
    source.ultima_propagazione = today;
    if (nextMove && !source.prossima_mossa) source.prossima_mossa = nextMove;

    return { entry };
}

module.exports = {
    applyContinuityImpact,
    appendUnique,
    appendUniqueMany,
    continuityEntry,
    continuityUpdateText,
    normalizeFieldArray,
    registerWorldChoice
};
