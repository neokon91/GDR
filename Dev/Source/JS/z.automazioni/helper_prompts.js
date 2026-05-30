const SKIP_VALUE = "__SKIP__";
const MANUAL_VALUE = "__MANUAL__";
const DONE_VALUE = "__DONE__";

function abortCreation(message = "Creazione annullata dall'utente.") {
    throw new Error(message);
}

function isCancelled(value) {
    return value === null || value === undefined;
}

async function promptRequired(tp, message, defaultValue = "") {
    const value = await tp.system.prompt(message, defaultValue);

    // La X della finestra annulla l'intera creazione, invece di produrre una nota incompleta.
    if (isCancelled(value)) {
        abortCreation();
    }

    const trimmed = String(value ?? "").trim();

    // Solo il nome resta davvero obbligatorio: senza nome non sappiamo dove creare la nota.
    if (!trimmed) {
        abortCreation("Creazione annullata: manca un nome.");
    }

    return trimmed;
}

async function promptOptional(tp, message, defaultValue = "") {
    const value = await tp.system.prompt(`${message} (opzionale)`, defaultValue);

    // Anche sui campi opzionali la X significa "ferma tutto"; lasciare vuoto significa "salta".
    if (isCancelled(value)) {
        abortCreation();
    }

    return String(value ?? "").trim();
}

async function chooseRequired(tp, options, message) {
    const selected = await tp.system.suggester(
        options.map(e => e.label),
        options,
        false,
        message
    );

    if (isCancelled(selected)) {
        abortCreation();
    }

    return selected;
}

async function chooseOptional(tp, options, message, skipLabel = "Salta") {
    const selected = await tp.system.suggester(
        [skipLabel, ...options.map(e => e.label)],
        [SKIP_VALUE, ...options],
        false,
        message
    );

    if (isCancelled(selected)) {
        abortCreation();
    }

    if (selected === SKIP_VALUE) {
        return null;
    }

    return selected;
}

async function askYesNo(tp, message) {
    const yesNoOptions = [
        { label: "Sì", id: true },
        { label: "No", id: false }
    ];

    const selected = await chooseRequired(tp, yesNoOptions, message);

    return selected?.id === true;
}

async function collectNamedDescriptions(tp, sectionLabel) {
    const shouldInsert = await askYesNo(
        tp,
        `Vuoi inserire ${sectionLabel}?`
    );

    if (!shouldInsert) {
        return [];
    }

    const entries = [];
    let keepAdding = true;

    while (keepAdding) {
        const entryName = await promptOptional(tp, `Nome ${sectionLabel}`);
        const entryDesc = entryName
            ? await promptOptional(tp, `Descrizione ${sectionLabel}`)
            : "";

        if (entryName && entryDesc) {
            entries.push({
                name: entryName,
                desc: entryDesc
            });
        }

        keepAdding = await askYesNo(
            tp,
            `Vuoi aggiungere un'altra voce a ${sectionLabel}?`
        );
    }

    return entries;
}

module.exports = {
    DONE_VALUE,
    MANUAL_VALUE,
    SKIP_VALUE,
    abortCreation,
    askYesNo,
    chooseOptional,
    chooseRequired,
    collectNamedDescriptions,
    isCancelled,
    promptOptional,
    promptRequired
};
