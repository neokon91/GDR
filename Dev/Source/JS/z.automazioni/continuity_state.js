const {
    applyContinuityEventToSource,
    applyContinuityEventToTarget,
    appendUnique,
    appendUniqueMany,
    buildContinuityEvent,
    continuityEventEntry,
    continuityEventUpdateText,
    normalizeContinuityTargets,
    normalizeFieldArray,
    validateContinuityEvent
} = require("./continuity_event_model");

function continuityUpdateText({ today, sourceLink, text, nextMove }) {
    const event = buildContinuityEvent({
        today,
        sourceLink,
        consequenceText: text,
        nextMove
    });
    return continuityEventUpdateText(event);
}

function continuityEntry({ today, choice, consequenceText, targets, nextMove }) {
    const event = buildContinuityEvent({
        today,
        choice,
        consequenceText,
        targets,
        nextMove
    });
    return continuityEventEntry(event);
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

    const event = buildContinuityEvent({
        today,
        sourceKey,
        sourceLink,
        consequenceText,
        targets: [{ key: targetKey, link: targetLink }],
        nextMove,
        pressureDelta,
        trackStep,
        mode
    });

    return applyContinuityEventToTarget(target, event, event.targets[0]);
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
    if (!source) throw new Error(`Sorgente continuita non trovata: ${sourceKey}`);
    if (!choice) throw new Error("Scelta di continuita mancante.");

    const event = buildContinuityEvent({
        today,
        sourceKey,
        sourceLink,
        choice,
        consequenceText,
        targets,
        nextMove,
        pressureDelta,
        trackStep,
        mode: "conseguenza",
        state: "applicata"
    });
    const errors = validateContinuityEvent(event);
    if (errors.length) throw new Error(`Evento continuita non valido: ${errors.join("; ")}`);

    for (const target of event.targets) {
        if (target.key === sourceKey) continue;
        applyContinuityEventToTarget(recordFrontmatter(records, target.key), event, target);
    }

    applyContinuityEventToSource(source, event);

    return { entry: continuityEventEntry(event), event };
}

module.exports = {
    applyContinuityEventToSource,
    applyContinuityEventToTarget,
    applyContinuityImpact,
    appendUnique,
    appendUniqueMany,
    buildContinuityEvent,
    continuityEntry,
    continuityEventEntry,
    continuityEventUpdateText,
    continuityUpdateText,
    normalizeContinuityTargets,
    normalizeFieldArray,
    registerWorldChoice,
    validateContinuityEvent
};
