const SKIP_VALUE = "__SKIP__";
const MANUAL_VALUE = "__MANUAL__";
const DONE_VALUE = "__DONE__";

const PATHS = {
    campagne: "Campagne",
    creature: "Mondi/Creature",
    dispense: "Mondi/Dispense",
    fazioni: "Mondi/Fazioni",
    incontri: "Mondi/Incontri",
    luoghi: "Mondi/Luoghi",
    missioni: "Mondi/Missioni",
    mondi: "Mondi",
    oggetti: "Mondi/Oggetti",
    personaggi: "Mondi/Personaggi",
    religioni: "Mondi/Religioni",
    societa: "Mondi/Societa",
    relazioni: "Mondi/Relazioni",
    sessioni: "Mondi/Sessioni",
    mappe: "Risorse/Mappe",
    audio: "Risorse/Audio",
    immagini: "Risorse/Immagini",
    video: "Risorse/Video",
    culture: "Mondi/Culture",
    lingue: "Mondi/Lingue",
    storia: "Mondi/Storia",
    conflitti: "Mondi/Conflitti",
    cosmologia: "Mondi/Cosmologia",
    tracciati: "Mondi/Tracciati",
    rotte: "Mondi/Rotte",
    risorse_mondo: "Mondi/Risorse",
    mercati: "Mondi/Mercati",
    compendium: "Mondi/Compendium",
    calendario_diegetico: "Mondi/Calendario Diegetico"
};

let pendingRoute = {};
const templateFactoryCache = {};

function path(key) {
    return PATHS[key] ?? key;
}

function parseYamlScalar(value) {
    const trimmed = String(value ?? "").trim();

    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (trimmed === "[]") return [];
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

    return trimmed.replace(/^["']|["']$/g, "");
}

function parseYamlKeyValue(text) {
    const match = String(text).match(/^([^:]+):(?:\s*(.*))?$/);
    if (!match) return null;

    return {
        key: match[1].trim(),
        value: match[2] ?? ""
    };
}

function parseSimpleYaml(text) {
    const lines = String(text ?? "")
        .split(/\r?\n/)
        .map(raw => ({
            indent: raw.match(/^\s*/)[0].length,
            text: raw.trim()
        }))
        .filter(line => line.text && !line.text.startsWith("#"));

    function parseBlock(index, indent) {
        if (index >= lines.length) return [{}, index];

        if (lines[index].text.startsWith("- ")) {
            const items = [];

            while (index < lines.length && lines[index].indent === indent && lines[index].text.startsWith("- ")) {
                const rest = lines[index].text.slice(2).trim();
                const pair = parseYamlKeyValue(rest);

                if (pair) {
                    const item = {};
                    if (pair.value.trim()) {
                        item[pair.key] = parseYamlScalar(pair.value);
                        index += 1;
                    } else {
                        const [child, nextIndex] = parseBlock(index + 1, indent + 2);
                        item[pair.key] = child;
                        index = nextIndex;
                    }

                    while (index < lines.length && lines[index].indent === indent + 2 && !lines[index].text.startsWith("- ")) {
                        const childPair = parseYamlKeyValue(lines[index].text);
                        if (!childPair) break;

                        if (childPair.value.trim()) {
                            item[childPair.key] = parseYamlScalar(childPair.value);
                            index += 1;
                        } else {
                            const [child, nextIndex] = parseBlock(index + 1, indent + 4);
                            item[childPair.key] = child;
                            index = nextIndex;
                        }
                    }

                    items.push(item);
                    continue;
                }

                items.push(parseYamlScalar(rest));
                index += 1;
            }

            return [items, index];
        }

        const data = {};
        while (index < lines.length && lines[index].indent === indent && !lines[index].text.startsWith("- ")) {
            const pair = parseYamlKeyValue(lines[index].text);
            if (!pair) {
                index += 1;
                continue;
            }

            if (pair.value.trim()) {
                data[pair.key] = parseYamlScalar(pair.value);
                index += 1;
            } else {
                const [child, nextIndex] = parseBlock(index + 1, indent + 2);
                data[pair.key] = child;
                index = nextIndex;
            }
        }

        return [data, index];
    }

    return parseBlock(0, 0)[0];
}

async function readVaultText(filePath) {
    if (typeof app !== "undefined" && app?.vault?.adapter?.read) {
        return await app.vault.adapter.read(filePath);
    }

    if (typeof require === "function") {
        const fs = require("fs");
        return fs.readFileSync(filePath, "utf8");
    }

    return "";
}

async function loadTemplateFactoryModule(moduleName) {
    if (templateFactoryCache[moduleName]) {
        return templateFactoryCache[moduleName];
    }

    const source = await readVaultText(`Dev/TemplateFactory/modules/${moduleName}.yaml`);
    const parser = typeof parseYaml === "function"
        ? parseYaml
        : typeof window !== "undefined" && typeof window.parseYaml === "function"
            ? window.parseYaml
            : parseSimpleYaml;

    templateFactoryCache[moduleName] = parser(source) ?? {};
    return templateFactoryCache[moduleName];
}

async function loadRuntimeProfiles() {
    const module = await loadTemplateFactoryModule("runtime_profiles");
    return module.profiles ?? {};
}

async function runtimeProfile(name) {
    const profiles = await loadRuntimeProfiles();
    return profiles[name] ?? {};
}

async function frontmatterProfile(name) {
    const module = await loadTemplateFactoryModule("frontmatter_profiles");
    return module.profiles?.[name] ?? {};
}

async function chooseProfileOption(tp, profile, route = {}) {
    const routeKey = profile.type_route_key;
    const routeType = routeKey ? route[routeKey] : "";

    if (routeType) {
        return { id: routeType };
    }

    return await chooseOptional(tp, profile.type_options ?? [], profile.type_prompt ?? "Tipo");
}

function renderFrontmatterFromProfile(profile, values = {}) {
    const fields = profile.fields ?? [];
    const lines = fields.map(field => {
        const key = field.key;
        const valueKey = field.value;
        const rawValue = valueKey && Object.prototype.hasOwnProperty.call(values, valueKey)
            ? values[valueKey]
            : field.default ?? "";
        const value = Array.isArray(rawValue)
            ? inlineYamlList(rawValue)
            : rawValue;

        return `${key}: ${value}`;
    });

    return `---\n${lines.join("\n")}\n---\n`;
}

async function renderFrontmatter(profileName, values = {}) {
    return renderFrontmatterFromProfile(await frontmatterProfile(profileName), values);
}

function renderYamlScalar(value) {
    if (value === true) return "true";
    if (value === false) return "false";
    if (value === null || value === undefined) return '""';
    if (typeof value === "number") return String(value);
    if (Array.isArray(value)) {
        if (!value.length) return "[]";
        return `\n${value.map(item => `  - ${renderYamlScalar(item)}`).join("\n")}`;
    }
    const text = String(value);
    if (!text) return '""';
    if (/[:#\[\]{}&,*?|>!%@`"']/.test(text) || /^\s|\s$/.test(text)) {
        return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return text;
}

function renderYamlObject(data, indent = 0) {
    const lines = [];
    const prefix = " ".repeat(indent);

    for (const [key, value] of Object.entries(data ?? {})) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
            lines.push(`${prefix}${key}:`);
            lines.push(...renderYamlObject(value, indent + 2));
            continue;
        }

        const rendered = renderYamlScalar(value);
        if (typeof rendered === "string" && rendered.startsWith("\n")) {
            lines.push(`${prefix}${key}:${rendered}`);
        } else {
            lines.push(`${prefix}${key}: ${rendered}`);
        }
    }

    return lines;
}

function mergeFrontmatterNested(frontmatter, nested = {}) {
    const match = String(frontmatter ?? "").match(/^---\n([\s\S]*?)\n---\n?$/);
    if (!match) {
        throw new Error("Frontmatter non valido per merge annidato.");
    }

    const nestedLines = renderYamlObject(nested, 0);
    const body = [match[1].trimEnd(), ...nestedLines].filter(Boolean).join("\n");
    return `---\n${body}\n---\n`;
}

function setRoute(route = {}) {
    pendingRoute = { ...route };
    return pendingRoute;
}

function consumeRoute() {
    const route = { ...pendingRoute };
    pendingRoute = {};
    return route;
}

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

function getFrontmatter(file) {
    if (!file) {
        return {};
    }

    return app.metadataCache.getFileCache(file)?.frontmatter ?? {};
}

function getLinkTargetName(link) {
    if (typeof link === "object" && link !== null) {
        const objectTarget = link.path ?? link.link ?? link.display ?? "";
        return String(objectTarget).replace(/\.md$/, "").split("/").pop();
    }

    const raw = String(link ?? "").trim();
    const match = raw.match(/^\[\[([^|\]]+)(?:\|[^\]]+)?\]\]$/);
    const target = match ? match[1] : raw;
    return target.split("/").pop();
}

function frontmatterHasLink(value, link) {
    if (!value || !link) {
        return false;
    }

    const expected = normalizeText(getLinkTargetName(link));
    const values = Array.isArray(value) ? value : [value];

    return values.some(entry => normalizeText(getLinkTargetName(entry)).includes(expected));
}

function getFileFromLink(link) {
    const targetName = getLinkTargetName(link);

    if (!targetName) {
        return null;
    }

    return app.vault.getMarkdownFiles().find(file => file.basename === targetName) ?? null;
}

function getWorldFromLink(link) {
    const file = getFileFromLink(link);
    return getFrontmatter(file)?.mondo ?? "";
}

function getCalendarFromLink(link) {
    const file = getFileFromLink(link);
    const frontmatter = getFrontmatter(file);
    return String(frontmatter?.calendario ?? frontmatter?.["fc-calendar"] ?? "").trim();
}

function getPreferredCalendar({ world = "", campaigns = [], fallback = "" } = {}) {
    const campaignCalendar = normalizeFieldArray(campaigns)
        .map(getCalendarFromLink)
        .find(Boolean);

    return campaignCalendar || getCalendarFromLink(world) || String(fallback ?? "").trim();
}

async function promptCalendar(tp, context = {}, message = "Calendario Calendarium") {
    const preferred = getPreferredCalendar(context);
    return await promptOptional(tp, message, preferred);
}

function fileLink(file) {
    return file ? `[[${file.basename}]]` : "";
}

function normalizeFieldArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function linkEquals(a, b) {
    return normalizeText(getLinkTargetName(a)) === normalizeText(getLinkTargetName(b));
}

function appendUniqueLink(value, link) {
    if (!link) return normalizeFieldArray(value);
    const entries = normalizeFieldArray(value);
    return entries.some(entry => linkEquals(entry, link)) ? entries : [...entries, link];
}

// Scrive frontmatter usando l'API Obsidian quando disponibile; il fallback serve per test o ambienti ridotti.
async function processFrontmatter(file, updater) {
    if (!file) return;

    if (app.fileManager?.processFrontMatter) {
        await app.fileManager.processFrontMatter(file, updater);
        return;
    }

    const text = await app.vault.read(file);
    const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
    const fm = getFrontmatter(file);
    updater(fm);

    const yaml = Object.entries(fm)
        .map(([key, value]) => {
            if (Array.isArray(value)) {
                return value.length
                    ? `${key}:\n${value.map(entry => `  - ${entry}`).join("\n")}`
                    : `${key}: []`;
            }

            return `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`;
        })
        .join("\n");

    const body = match ? text.slice(match[0].length) : text;
    await app.vault.modify(file, `---\n${yaml}\n---\n${body}`);
}

function getFileByPathOrBasename(pathOrName) {
    const raw = String(pathOrName ?? "").replace(/\.md$/, "");
    const withExt = `${raw}.md`;
    return app.vault.getAbstractFileByPath(withExt)
        ?? app.vault.getMarkdownFiles().find(file => file.basename === raw.split("/").pop())
        ?? null;
}

function getActiveSessionFile() {
    const sessions = app.vault.getMarkdownFiles()
        .filter(file => file.path.startsWith(`${PATHS.sessioni}/`))
        .map(file => ({ file, frontmatter: getFrontmatter(file) }));

    const explicit = sessions
        .filter(entry => entry.frontmatter.attiva === true)
        .sort((a, b) => String(b.frontmatter.data ?? "").localeCompare(String(a.frontmatter.data ?? "")))[0];

    if (explicit) {
        return explicit.file;
    }

    return sessions
        .filter(entry => ["pronto", "preparazione"].includes(entry.frontmatter.stato))
        .sort((a, b) => String(b.frontmatter.data ?? "").localeCompare(String(a.frontmatter.data ?? "")))[0]?.file ?? null;
}

function getActiveSessionContext() {
    const file = getActiveSessionFile();
    const frontmatter = getFrontmatter(file);

    return {
        file,
        link: fileLink(file),
        world: frontmatter.mondo ?? "",
        campaigns: frontmatter.campagne ?? [],
        frontmatter
    };
}

function isHiddenFromSuggestions(file) {
    const frontmatter = getFrontmatter(file);
    return frontmatter.stato === "archiviata";
}

function sortFilesForSuggestions(files, context = {}) {
    const statoRank = {
        "in gioco": 0,
        pronto: 1,
        preparazione: 2,
        proposta: 3,
        accettata: 4,
        "in corso": 5,
        bozza: 6
    };

    return [...files].sort((a, b) => {
        const aMeta = getFrontmatter(a);
        const bMeta = getFrontmatter(b);
        const aSameWorld = frontmatterHasLink(aMeta.mondo, context.world);
        const bSameWorld = frontmatterHasLink(bMeta.mondo, context.world);
        const aSameSession = frontmatterHasLink(aMeta.sessioni, context.session);
        const bSameSession = frontmatterHasLink(bMeta.sessioni, context.session);

        if (aSameSession !== bSameSession) {
            return aSameSession ? -1 : 1;
        }

        if (aSameWorld !== bSameWorld) {
            return aSameWorld ? -1 : 1;
        }

        const aRank = statoRank[aMeta.stato] ?? 99;
        const bRank = statoRank[bMeta.stato] ?? 99;

        if (aRank !== bRank) {
            return aRank - bRank;
        }

        return a.basename.localeCompare(b.basename);
    });
}

function formatSuggestionLabel(file, context = {}) {
    const frontmatter = getFrontmatter(file);
    const badges = [];

    if (frontmatterHasLink(frontmatter.sessioni, context.session)) {
        badges.push("sessione attiva");
    }

    if (frontmatterHasLink(frontmatter.mondo, context.world)) {
        badges.push("stesso mondo");
    }

    if (frontmatter.stato) {
        badges.push(frontmatter.stato);
    }

    return badges.length ? `${file.basename} · ${badges.join(" · ")}` : file.basename;
}

function getMarkdownFilesByFrontmatter(field, expectedValue) {
    const normalizedExpected = normalizeText(expectedValue);

    // Usiamo la cache di Obsidian: è più stabile che leggere YAML a mano.
    return app.vault.getMarkdownFiles().filter(file => {
        const actualValue = normalizeText(getFrontmatter(file)?.[field]);
        return actualValue === normalizedExpected;
    });
}

function getMarkdownFilesInPath(path) {
    const normalizedPath = String(path ?? "").replace(/\/+$/, "");
    const indexName = normalizedPath.split("/").pop();

    // Esclude la nota indice della cartella, così i suggerimenti mostrano solo entità reali.
    return app.vault.getMarkdownFiles()
        .filter(file => file.path.startsWith(`${normalizedPath}/`))
        .filter(file => file.basename !== indexName)
        .sort((a, b) => a.basename.localeCompare(b.basename));
}

async function chooseNoteFromFiles(tp, files, message, noneLabel = "Nessuna", options = {}) {
    const visibleFiles = sortFilesForSuggestions(
        options.includeHidden ? files : files.filter(file => !isHiddenFromSuggestions(file)),
        options
    );
    const hiddenFiles = files.filter(file => isHiddenFromSuggestions(file));
    const showHiddenLabel = "Mostra anche archiviate/prove";

    if (!visibleFiles.length) {
        if (!options.includeHidden && hiddenFiles.length) {
            const selected = await tp.system.suggester(
                [noneLabel, "Inserisci manualmente", showHiddenLabel],
                [SKIP_VALUE, MANUAL_VALUE, "__SHOW_HIDDEN__"],
                false,
                message
            );

            if (isCancelled(selected)) {
                abortCreation();
            }

            if (selected === SKIP_VALUE) {
                return "";
            }

            if (selected === "__SHOW_HIDDEN__") {
                return await chooseNoteFromFiles(tp, files, message, noneLabel, { ...options, includeHidden: true });
            }

            const manual = await promptOptional(tp, `${message} manuale`);
            return manual ? `[[${manual}]]` : "";
        }

        // Se non esistono note da scegliere, il DM può comunque scrivere un link manuale.
        const manual = await promptOptional(tp, `${message} manuale`);
        return manual ? `[[${manual}]]` : "";
    }

    const labels = [
        noneLabel,
        "Inserisci manualmente",
        ...visibleFiles.map(file => formatSuggestionLabel(file, options))
    ];
    const values = [
        SKIP_VALUE,
        MANUAL_VALUE,
        ...visibleFiles.map(file => `[[${file.basename}]]`)
    ];

    if (!options.includeHidden && hiddenFiles.length) {
        labels.splice(2, 0, showHiddenLabel);
        values.splice(2, 0, "__SHOW_HIDDEN__");
    }

    const selected = await tp.system.suggester(
        labels,
        values,
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

    if (selected === "__SHOW_HIDDEN__") {
        return await chooseNoteFromFiles(tp, files, message, noneLabel, { ...options, includeHidden: true });
    }

    return selected;
}

async function chooseNoteByPath(tp, path, message, noneLabel = "Nessuna", options = {}) {
    return await chooseNoteFromFiles(tp, getMarkdownFilesInPath(path), message, noneLabel, options);
}

async function chooseNoteByFrontmatter(tp, field, expectedValue, message, noneLabel = "Nessuna", options = {}) {
    const files = getMarkdownFilesByFrontmatter(field, expectedValue);
    return await chooseNoteFromFiles(tp, files, message, noneLabel, options);
}

async function chooseNotesFromFiles(tp, files, message, options = {}) {
    const selectedLinks = [];
    let availableFiles = sortFilesForSuggestions(
        options.includeHidden ? files : files.filter(file => !isHiddenFromSuggestions(file)),
        options
    );
    const hiddenFiles = files.filter(file => isHiddenFromSuggestions(file));

    // Selezione multipla leggera: Fine chiude, X annulla, manuale copre note non ancora create.
    while (true) {
        const labels = [
            "Fine",
            "Inserisci manualmente",
            ...availableFiles.map(file => formatSuggestionLabel(file, options))
        ];
        const values = [
            DONE_VALUE,
            MANUAL_VALUE,
            ...availableFiles.map(file => file)
        ];

        if (!options.includeHidden && hiddenFiles.length) {
            labels.splice(2, 0, "Mostra anche archiviate/prove");
            values.splice(2, 0, "__SHOW_HIDDEN__");
        }

        const selected = await tp.system.suggester(
            labels,
            values,
            false,
            message
        );

        if (isCancelled(selected)) {
            abortCreation();
        }

        if (selected === DONE_VALUE) {
            if (options.requireOne && !selectedLinks.length) {
                const manual = await promptOptional(tp, `${message}: scegli almeno una connessione o scrivila manualmente`);

                if (manual) {
                    selectedLinks.push(`[[${manual}]]`);
                    return selectedLinks;
                }

                continue;
            }

            return selectedLinks;
        }

        if (selected === MANUAL_VALUE) {
            const manual = await promptOptional(tp, `${message} manuale`);

            if (manual) {
                selectedLinks.push(`[[${manual}]]`);
            }

            continue;
        }

        if (selected === "__SHOW_HIDDEN__") {
            const selectedWithHidden = await chooseNotesFromFiles(tp, files, message, { ...options, includeHidden: true });
            return [...selectedLinks, ...selectedWithHidden];
        }

        selectedLinks.push(`[[${selected.basename}]]`);
        availableFiles = availableFiles.filter(file => file.path !== selected.path);
    }
}

async function chooseNotesByPath(tp, path, message, options = {}) {
    return await chooseNotesFromFiles(tp, getMarkdownFilesInPath(path), message, options);
}

function getMarkdownFilesInPaths(paths) {
    const seen = new Set();
    const files = [];

    for (const folder of paths) {
        for (const file of getMarkdownFilesInPath(folder)) {
            if (seen.has(file.path)) continue;
            seen.add(file.path);
            files.push(file);
        }
    }

    return files.sort((a, b) => a.basename.localeCompare(b.basename));
}

async function chooseConnections(tp, message = "Connessioni vive", context = {}) {
    const activeContext = getActiveSessionContext();
    const enrichedContext = {
        session: activeContext.link,
        world: context.world ?? activeContext.world,
        ...context
    };

    return await chooseNotesFromFiles(
        tp,
        getMarkdownFilesInPaths([
            PATHS.luoghi,
            PATHS.personaggi,
            PATHS.fazioni,
            PATHS.religioni,
            PATHS.societa,
            PATHS.missioni,
            PATHS.tracciati,
            PATHS.relazioni,
            PATHS.rotte,
            PATHS.risorse_mondo,
            PATHS.mercati,
            PATHS.oggetti,
            PATHS.mappe,
            PATHS.culture,
            PATHS.storia
        ]),
        message,
        { requireOne: true, ...enrichedContext }
    );
}

async function chooseCoreConnection(tp, message = "Collega almeno un elemento operativo", context = {}) {
    const activeContext = getActiveSessionContext();
    return await chooseNotesFromFiles(
        tp,
        getMarkdownFilesInPaths([
            PATHS.luoghi,
            PATHS.personaggi,
            PATHS.fazioni,
            PATHS.missioni,
            PATHS.tracciati,
            PATHS.mappe
        ]),
        message,
        {
            requireOne: true,
            session: activeContext.link,
            world: context.world ?? activeContext.world,
            ...context
        }
    );
}

async function ensureFolder(path) {
    const parts = String(path ?? "").split("/").filter(Boolean);
    let currentPath = "";

    // Crea anche eventuali cartelle madri: così un nuovo flusso può dichiarare il percorso e basta.
    for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!app.vault.getAbstractFileByPath(currentPath)) {
            await app.vault.createFolder(currentPath);
        }
    }
}

async function moveNote(tp, folderPath, name) {
    await ensureFolder(folderPath);
    await tp.file.move(`${folderPath}/${name}`);
    return getFileByPathOrBasename(`${folderPath}/${name}`);
}

function activeContextPatch(context) {
    const patch = {};

    if (context.world) {
        patch.mondo = context.world;
    }

    if (normalizeFieldArray(context.campaigns).length) {
        patch.campagne = normalizeFieldArray(context.campaigns);
    }

    return patch;
}

async function linkCreatedNoteToActiveSession(createdFile, options = {}) {
    // Questo e il collegamento automatico centrale: ogni nota creata da un pulsante rientra nella sessione attiva.
    const context = getActiveSessionContext();
    const sessionFile = context.file;

    if (!createdFile || !sessionFile || createdFile.path === sessionFile.path) {
        return { linked: false, reason: "no-active-session" };
    }

    const createdLink = fileLink(createdFile);
    const sessionLink = fileLink(sessionFile);
    const sessionField = options.sessionField ?? "appunti_live";
    const noteSessionField = options.noteSessionField ?? "sessioni";
    const inheritWorld = options.inheritWorld !== false;
    const inheritCampaigns = options.inheritCampaigns !== false;
    const updateCreated = options.updateCreated === true;

    await processFrontmatter(sessionFile, fm => {
        // Aggiorna il campo giusto della sessione: missioni, incontri, PNG, luoghi, appunti live, ecc.
        fm[sessionField] = appendUniqueLink(fm[sessionField], createdLink);
    });

    if (updateCreated) {
        await processFrontmatter(createdFile, fm => {
            // Opzionale: utile solo se la nota appena creata non ha gia scritto sessione/mondo nel template.
            fm[noteSessionField] = appendUniqueLink(fm[noteSessionField], sessionLink);

            if (inheritWorld && context.world && !fm.mondo) {
                fm.mondo = context.world;
            }

            if (inheritCampaigns && normalizeFieldArray(context.campaigns).length && !normalizeFieldArray(fm.campagne).length) {
                fm.campagne = normalizeFieldArray(context.campaigns);
            }
        });
    }

    return { linked: true, session: sessionLink, note: createdLink, sessionField };
}

function frontmatterFieldForCategory(frontmatter = {}) {
    const category = String(frontmatter.categoria ?? "");
    const type = String(frontmatter.tipo ?? "");

    if (category === "personaggio") return "personaggi";
    if (category === "luogo") return "luoghi";
    if (category === "fazione" || category === "religione") return "fazioni";
    if (category === "societa") return "societa";
    if (category === "missione") return "missioni";
    if (category === "tracciato") return "tracciati";
    if (category === "oggetto") return "oggetti";
    if (category === "relazione") return "relazioni";
    if (category === "cultura") return "culture";
    if (category === "evento storico") return "eventi";
    if (category === "risorsa" && type === "rotta") return "rotte";
    if (category === "risorsa" && type === "mercato") return "mercati";
    if (category === "risorsa") return "risorse";
    return "connessioni";
}

async function linkCreatedNoteToConnections(createdFile, links = []) {
    if (!createdFile || !links?.length) {
        return { linked: 0 };
    }

    const createdLink = fileLink(createdFile);
    const createdMeta = getFrontmatter(createdFile);
    const typedField = frontmatterFieldForCategory(createdMeta);
    let linked = 0;

    for (const link of normalizeFieldArray(links)) {
        const targetFile = getFileFromLink(link);

        if (!targetFile || targetFile.path === createdFile.path) {
            continue;
        }

        await processFrontmatter(targetFile, fm => {
            fm.connessioni = appendUniqueLink(fm.connessioni, createdLink);
            fm[typedField] = appendUniqueLink(fm[typedField], createdLink);
        });
        linked += 1;
    }

    await processFrontmatter(createdFile, fm => {
        fm.feedback_creazione = linked > 0
            ? `Collegata a ${linked} note esistenti.`
            : "Manca connessione viva.";
    });

    return { linked };
}

async function chooseWorld(tp, message = "Mondo di riferimento") {
    return await chooseNoteByFrontmatter(tp, "categoria", "mondo", message);
}

async function chooseLocation(tp, message = "Luogo collegato", context = {}) {
    return await chooseNoteByPath(tp, PATHS.luoghi, message, "Nessuno", context);
}

async function chooseLocations(tp, message = "Luoghi collegati", context = {}) {
    return await chooseNotesByPath(tp, PATHS.luoghi, message, context);
}

async function choosePerson(tp, message = "Personaggio collegato", context = {}) {
    return await chooseNoteByPath(tp, PATHS.personaggi, message, "Nessuno", context);
}

async function choosePeople(tp, message = "Personaggi collegati", context = {}) {
    return await chooseNotesByPath(tp, PATHS.personaggi, message, context);
}

async function chooseFactions(tp, message = "Fazioni collegate", context = {}) {
    return await chooseNotesByPath(tp, PATHS.fazioni, message, context);
}

async function chooseReligions(tp, message = "Religioni collegate", context = {}) {
    return await chooseNotesByPath(tp, PATHS.religioni, message, context);
}

async function chooseObjects(tp, message = "Oggetti collegati", context = {}) {
    return await chooseNotesByPath(tp, PATHS.oggetti, message, context);
}

async function chooseCreatures(tp, message = "Creature collegate", context = {}) {
    return await chooseNotesByPath(tp, PATHS.creature, message, context);
}

async function chooseEncounters(tp, message = "Incontri collegati", context = {}) {
    return await chooseNotesByPath(tp, PATHS.incontri, message, context);
}

async function chooseMissions(tp, message = "Missioni collegate", context = {}) {
    return await chooseNotesByPath(tp, PATHS.missioni, message, context);
}

async function chooseTracks(tp, message = "Tracciati collegati", context = {}) {
    return await chooseNotesByPath(tp, PATHS.tracciati, message, context);
}

async function chooseRoutes(tp, message = "Rotte collegate", context = {}) {
    return await chooseNotesByPath(tp, PATHS.rotte, message, context);
}

async function chooseWorldResources(tp, message = "Risorse collegate", context = {}) {
    return await chooseNotesByPath(tp, PATHS.risorse_mondo, message, context);
}

async function chooseMarkets(tp, message = "Mercati o nodi commerciali collegati", context = {}) {
    return await chooseNotesByPath(tp, PATHS.mercati, message, context);
}

async function chooseCompendium(tp, message = "Elementi del compendium collegati", context = {}) {
    return await chooseNotesByPath(tp, PATHS.compendium, message, context);
}

async function chooseHandouts(tp, message = "Dispense collegate", context = {}) {
    return await chooseNotesByPath(tp, PATHS.dispense, message, context);
}

async function chooseSessions(tp, message = "Sessioni collegate", context = {}) {
    return await chooseNotesByPath(tp, PATHS.sessioni, message, context);
}

async function chooseCampaigns(tp, message = "Campagne collegate", context = {}) {
    return await chooseNotesByPath(tp, PATHS.campagne, message, context);
}

async function chooseMaps(tp, message = "Mappe collegate", context = {}) {
    return await chooseNotesByPath(tp, PATHS.mappe, message, context);
}

async function chooseAudio(tp, message = "Audio collegati", context = {}) {
    return await chooseNotesByPath(tp, PATHS.audio, message, context);
}

async function chooseImages(tp, message = "Immagini collegate", context = {}) {
    return await chooseNotesByPath(tp, PATHS.immagini, message, context);
}

async function chooseVideos(tp, message = "Video collegati", context = {}) {
    return await chooseNotesByPath(tp, PATHS.video, message, context);
}

function inlineYamlList(values) {
    const filtered = (values ?? []).filter(Boolean);
    return filtered.length ? `[${filtered.join(", ")}]` : "[]";
}

function normalizeWikilinkTarget(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";
    if (/^\[\[[^\]]+\]\]$/.test(text)) return text;
    return `[[${text.replace(/^#+/, "").trim()}]]`;
}

function splitListInput(value) {
    return String(value ?? "")
        .split(/[\n,;]+/)
        .map(entry => entry.trim())
        .filter(Boolean);
}

function inlineYamlWikilinkList(values) {
    const normalized = (values ?? [])
        .map(normalizeWikilinkTarget)
        .filter(Boolean);
    return inlineYamlList([...new Set(normalized)]);
}

async function promptWikilinkTargets(tp, message, defaultValue = "") {
    const raw = await promptOptional(tp, message, defaultValue);
    return splitListInput(raw).map(normalizeWikilinkTarget).filter(Boolean);
}

function referenceFields({
    fonti = [],
    riferimentiSrd = [],
    riferimentiRegola = [],
    sezioni = [],
    blocchi = [],
    tabelle = [],
    tags = []
} = {}) {
    return {
        fonti: inlineYamlWikilinkList(fonti),
        riferimenti_srd: inlineYamlWikilinkList(riferimentiSrd),
        riferimenti_regola: inlineYamlWikilinkList(riferimentiRegola),
        sezioni_collegate: inlineYamlWikilinkList(sezioni),
        blocchi_collegati: inlineYamlWikilinkList(blocchi),
        tabelle_collegate: inlineYamlWikilinkList(tabelle),
        tags: inlineYamlTextList(tags)
    };
}

function inlineYamlTextList(values) {
    const filtered = (values ?? [])
        .map(value => String(value ?? "").trim())
        .filter(Boolean);

    return filtered.length ? `[${filtered.map(yamlQuote).join(", ")}]` : "[]";
}

function yamlNumber(value) {
    const text = String(value ?? "").trim().replace(",", ".");
    return /^-?\d+(\.\d+)?$/.test(text) ? text : "";
}

function parseAbilityScores(value, fallback = "10 10 10 10 10 10") {
    const source = String(value ?? "").trim() || fallback;
    const scores = source
        .split(/[\s,;/|]+/)
        .map(score => score.trim())
        .filter(Boolean)
        .slice(0, 6);

    while (scores.length < 6) {
        scores.push("10");
    }

    return scores.map(score => yamlNumber(score) || "10");
}

function abilityArray(value, fallback = "10 10 10 10 10 10") {
    return `[${parseAbilityScores(value, fallback).join(", ")}]`;
}

module.exports = {
    path,
    runtimeProfile,
    frontmatterProfile,
    chooseProfileOption,
    renderFrontmatter,
    mergeFrontmatterNested,
    renderYamlObject,
    setRoute,
    consumeRoute,
    abortCreation,
    promptRequired,
    promptOptional,
    chooseRequired,
    chooseOptional,
    askYesNo,
    collectNamedDescriptions,
    inlineYamlArray,
    inlineYamlList,
    inlineYamlWikilinkList,
    inlineYamlTextList,
    promptWikilinkTargets,
    referenceFields,
    yamlNumber,
    parseAbilityScores,
    abilityArray,
    yamlQuote,
    slugify,
    normalizeText,
    getLinkTargetName,
    getFileFromLink,
    getFileByPathOrBasename,
    getWorldFromLink,
    getCalendarFromLink,
    getPreferredCalendar,
    promptCalendar,
    normalizeFieldArray,
    getActiveSessionFile,
    getActiveSessionContext,
    processFrontmatter,
    appendUniqueLink,
    linkCreatedNoteToActiveSession,
    fileLink,
    getMarkdownFilesByFrontmatter,
    getMarkdownFilesInPath,
    getMarkdownFilesInPaths,
    chooseNoteFromFiles,
    chooseNoteByPath,
    chooseNoteByFrontmatter,
    chooseNotesFromFiles,
    chooseNotesByPath,
    chooseConnections,
    chooseCoreConnection,
    ensureFolder,
    moveNote,
    linkCreatedNoteToConnections,
    chooseWorld,
    chooseLocation,
    chooseLocations,
    choosePerson,
    choosePeople,
    chooseFactions,
    chooseReligions,
    chooseObjects,
    chooseCreatures,
    chooseEncounters,
    chooseMissions,
    chooseTracks,
    chooseRoutes,
    chooseWorldResources,
    chooseMarkets,
    chooseCompendium,
    chooseHandouts,
    chooseSessions,
    chooseCampaigns,
    chooseMaps,
    chooseAudio,
    chooseImages,
    chooseVideos
};
