async function askYesNo(tp, message) {
    const yesNoOptions = [
        { label: "Sì", id: true },
        { label: "No", id: false }
    ];

    const selected = await tp.system.suggester(
        yesNoOptions.map(e => e.label),
        yesNoOptions,
        false,
        message
    );

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
        const entryName = await tp.system.prompt(`Nome ${sectionLabel}`);
        const entryDesc = await tp.system.prompt(`Descrizione ${sectionLabel}`);

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

function inlineYamlArray(entries) {
    if (!entries.length) {
        return "[]";
    }

    return `[${entries.map(entry =>
        `{name: ${yamlQuote(entry.name)}, desc: ${yamlQuote(entry.desc)}}`
    ).join(", ")}]`;
}

function yamlQuote(value) {
    return JSON.stringify(String(value ?? ""));
}

function slugify(value) {
    return String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

function normalizeText(value) {
    return String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function getMarkdownFilesByFrontmatter(field, expectedValue) {
    const normalizedExpected = normalizeText(expectedValue);

    return app.vault.getMarkdownFiles().filter(file => {
        const cache = app.metadataCache.getFileCache(file);
        const actualValue = normalizeText(cache?.frontmatter?.[field]);
        return actualValue === normalizedExpected;
    });
}

async function chooseNoteFromFiles(tp, files, message, noneLabel = "Nessuna") {
    const MANUAL_VALUE = "__MANUAL__";
    const NONE_VALUE = "__NONE__";

    if (!files.length) {
        const manual = await tp.system.prompt(`${message} (manuale, opzionale)`);
        return manual ? `[[${manual}]]` : "";
    }

    const selected = await tp.system.suggester(
        [noneLabel, "Inserisci manualmente", ...files.map(file => file.basename)],
        [NONE_VALUE, MANUAL_VALUE, ...files.map(file => `[[${file.basename}]]`)],
        false,
        message
    );

    if (!selected || selected === NONE_VALUE) {
        return "";
    }

    if (selected === MANUAL_VALUE) {
        const manual = await tp.system.prompt(`${message} (manuale)`);
        return manual ? `[[${manual}]]` : "";
    }

    return selected;
}

async function chooseNoteByFrontmatter(tp, field, expectedValue, message, noneLabel = "Nessuna") {
    const files = getMarkdownFilesByFrontmatter(field, expectedValue);
    return await chooseNoteFromFiles(tp, files, message, noneLabel);
}

module.exports = {
    askYesNo,
    collectNamedDescriptions,
    inlineYamlArray,
    yamlQuote,
    slugify,
    normalizeText,
    getMarkdownFilesByFrontmatter,
    chooseNoteFromFiles,
    chooseNoteByFrontmatter
};
