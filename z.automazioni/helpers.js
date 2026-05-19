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

    if (isCancelled(value)) {
        abortCreation();
    }

    const trimmed = String(value ?? "").trim();

    if (!trimmed) {
        abortCreation("Creazione annullata: manca un nome.");
    }

    return trimmed;
}

async function promptOptional(tp, message, defaultValue = "") {
    const value = await tp.system.prompt(`${message} (opzionale)`, defaultValue);

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

function getMarkdownFilesInPath(path) {
    const normalizedPath = String(path ?? "").replace(/\/+$/, "");
    const indexName = normalizedPath.split("/").pop();

    return app.vault.getMarkdownFiles()
        .filter(file => file.path.startsWith(`${normalizedPath}/`))
        .filter(file => file.basename !== indexName)
        .sort((a, b) => a.basename.localeCompare(b.basename));
}

async function chooseNoteFromFiles(tp, files, message, noneLabel = "Nessuna") {
    if (!files.length) {
        const manual = await promptOptional(tp, `${message} manuale`);
        return manual ? `[[${manual}]]` : "";
    }

    const selected = await tp.system.suggester(
        [noneLabel, "Inserisci manualmente", ...files.map(file => file.basename)],
        [SKIP_VALUE, MANUAL_VALUE, ...files.map(file => `[[${file.basename}]]`)],
        false,
        message
    );

    if (isCancelled(selected)) {
        abortCreation();
    }

    if (selected === SKIP_VALUE) {
        return "";
    }

    if (selected === MANUAL_VALUE) {
        const manual = await promptOptional(tp, `${message} manuale`);
        return manual ? `[[${manual}]]` : "";
    }

    return selected;
}

async function chooseNoteByPath(tp, path, message, noneLabel = "Nessuna") {
    return await chooseNoteFromFiles(tp, getMarkdownFilesInPath(path), message, noneLabel);
}

async function chooseNoteByFrontmatter(tp, field, expectedValue, message, noneLabel = "Nessuna") {
    const files = getMarkdownFilesByFrontmatter(field, expectedValue);
    return await chooseNoteFromFiles(tp, files, message, noneLabel);
}

async function chooseNotesFromFiles(tp, files, message) {
    const selectedLinks = [];
    let availableFiles = [...files];

    while (true) {
        const selected = await tp.system.suggester(
            ["Fine", "Inserisci manualmente", ...availableFiles.map(file => file.basename)],
            [DONE_VALUE, MANUAL_VALUE, ...availableFiles.map(file => file)],
            false,
            message
        );

        if (isCancelled(selected)) {
            abortCreation();
        }

        if (selected === DONE_VALUE) {
            return selectedLinks;
        }

        if (selected === MANUAL_VALUE) {
            const manual = await promptOptional(tp, `${message} manuale`);

            if (manual) {
                selectedLinks.push(`[[${manual}]]`);
            }

            continue;
        }

        selectedLinks.push(`[[${selected.basename}]]`);
        availableFiles = availableFiles.filter(file => file.path !== selected.path);
    }
}

async function chooseNotesByPath(tp, path, message) {
    return await chooseNotesFromFiles(tp, getMarkdownFilesInPath(path), message);
}

function inlineYamlList(values) {
    const filtered = (values ?? []).filter(Boolean);
    return filtered.length ? `[${filtered.join(", ")}]` : "[]";
}

module.exports = {
    abortCreation,
    promptRequired,
    promptOptional,
    chooseRequired,
    chooseOptional,
    askYesNo,
    collectNamedDescriptions,
    inlineYamlArray,
    inlineYamlList,
    yamlQuote,
    slugify,
    normalizeText,
    getMarkdownFilesByFrontmatter,
    getMarkdownFilesInPath,
    chooseNoteFromFiles,
    chooseNoteByPath,
    chooseNoteByFrontmatter,
    chooseNotesFromFiles,
    chooseNotesByPath
};
