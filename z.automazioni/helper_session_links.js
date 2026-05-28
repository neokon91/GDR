function createSessionLinkHelpers({
    PATHS,
    appendUniqueLink,
    fileLink,
    getFileByPathOrBasename,
    getFileFromLink,
    getFrontmatter,
    normalizeFieldArray,
    processFrontmatter
}) {
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

    return {
        ensureFolder,
        getActiveSessionContext,
        getActiveSessionFile,
        linkCreatedNoteToActiveSession,
        linkCreatedNoteToConnections,
        moveNote
    };
}

module.exports = {
    createSessionLinkHelpers
};
