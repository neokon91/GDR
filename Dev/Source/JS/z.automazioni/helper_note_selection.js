function createNoteSelectionHelpers({
    DONE_VALUE,
    MANUAL_VALUE,
    PATHS,
    SKIP_VALUE,
    abortCreation,
    frontmatterHasLink,
    getActiveSessionContext,
    getFrontmatter,
    isCancelled,
    normalizeText,
    promptOptional
}) {
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
                PATHS.culture,
                PATHS.timeline,
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
                PATHS.tracciati
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

    return {
        chooseCampaigns,
        chooseCompendium,
        chooseConnections,
        chooseCoreConnection,
        chooseCreatures,
        chooseEncounters,
        chooseFactions,
        chooseHandouts,
        chooseLocation,
        chooseLocations,
        chooseMarkets,
        chooseMissions,
        chooseNoteByFrontmatter,
        chooseNoteByPath,
        chooseNoteFromFiles,
        chooseNotesByPath,
        chooseNotesFromFiles,
        chooseObjects,
        choosePeople,
        choosePerson,
        chooseReligions,
        chooseRoutes,
        chooseSessions,
        chooseTracks,
        chooseWorld,
        chooseWorldResources,
        getMarkdownFilesByFrontmatter,
        getMarkdownFilesInPath,
        getMarkdownFilesInPaths
    };
}

module.exports = {
    createNoteSelectionHelpers
};
