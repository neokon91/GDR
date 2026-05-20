async function meta_actions(tp, action = "") {
    const helpers = tp.user.helpers;
    const activeFile = app.workspace.getActiveFile?.() ?? tp.config?.target_file ?? null;
    const today = tp.date.now("YYYY-MM-DD");

    const currentFile = () => activeFile;
    const currentLink = () => helpers.fileLink(currentFile());
    const currentMeta = () => helpers.getFileByPathOrBasename(currentFile()?.path)?.path
        ? app.metadataCache.getFileCache(currentFile())?.frontmatter ?? {}
        : {};

    const notice = message => new Notice(message);
    const privatePublicPattern = /\b(dm|segreto|segreti|nascost[oaie]?|verita|verità|prossima mossa|mosse segrete|retroscena|non rivelare)\b/i;
    const fieldForSession = frontmatter => {
        const category = String(frontmatter?.categoria ?? "");
        const type = String(frontmatter?.tipo ?? "");

        if (category === "personaggio") return "personaggi";
        if (category === "luogo") return "luoghi";
        if (category === "fazione" || category === "religione") return "fazioni";
        if (category === "missione") return "missioni";
        if (category === "tracciato") return "tracciati";
        if (category === "incontro") return "incontri";
        if (category === "oggetto") return "oggetti";
        if (category === "dispensa") return "dispense";
        if (category === "risorsa" && type === "mappa") return "mappe";
        return "appunti_live";
    };

    const chooseTrack = async () => {
        const file = currentFile();
        const meta = currentMeta();

        if (file && meta.categoria === "tracciato") {
            return file;
        }

        const link = await helpers.chooseNoteByPath(tp, helpers.path("tracciati"), "Clock o tracciato da avanzare", "Annulla");
        return helpers.getFileFromLink(link);
    };

    const choosePropagationTargets = async meta => {
        const existing = [
            ...helpers.normalizeFieldArray(meta.entita_impattate),
            ...helpers.normalizeFieldArray(meta.propaga_a)
        ].filter(Boolean);

        if (existing.length) {
            const useExisting = await helpers.askYesNo(tp, "Usare entita_impattate e propaga_a gia presenti?");
            if (useExisting) return existing;
        }

        return await helpers.chooseConnections(tp, "Entita a cui propagare", { world: meta.mondo });
    };

    if (!currentFile()) {
        notice("Nessuna nota attiva.");
        return "";
    }

    if (action === "marca_canonico") {
        await helpers.processFrontmatter(currentFile(), fm => {
            fm.canonico = true;
            fm.stato_canonico = "canonico";
            if (fm.categoria === "lore capture") fm.stato = "canonica";
            fm.canonizzato_il = today;
        });
        notice("Nota marcata canonica.");
        return "";
    }

    if (action === "marca_rumor") {
        await helpers.processFrontmatter(currentFile(), fm => {
            fm.canonico = false;
            fm.stato_canonico = "rumor";
            if (!fm.stato || fm.stato === "canonica") fm.stato = "da smistare";
        });
        notice("Nota marcata come rumor.");
        return "";
    }

    if (action === "archivia") {
        await helpers.processFrontmatter(currentFile(), fm => {
            fm.stato = "archiviata";
            fm.archiviata_il = today;
        });
        notice("Nota archiviata.");
        return "";
    }

    if (action === "collega_sessione_attiva") {
        const session = helpers.getActiveSessionContext();
        if (!session.file) {
            notice("Nessuna sessione attiva trovata.");
            return "";
        }

        const sessionField = fieldForSession(currentMeta());
        await helpers.linkCreatedNoteToActiveSession(currentFile(), {
            sessionField,
            updateCreated: true
        });
        notice(`Collegata alla sessione attiva (${sessionField}).`);
        return "";
    }

    if (action === "avanza_clock") {
        const trackFile = await chooseTrack();
        if (!trackFile) return "";

        const amountText = await helpers.promptOptional(tp, "Segmenti da avanzare", "1");
        const amount = Number.parseInt(amountText || "1", 10);
        const step = Number.isFinite(amount) ? amount : 1;

        await helpers.processFrontmatter(trackFile, fm => {
            const current = Number.parseInt(fm.progress_value ?? 0, 10) || 0;
            const max = Number.parseInt(fm.progress_max ?? 0, 10) || 0;
            fm.progress_value = Math.max(0, current + step);
            fm.avanzato_il = today;
            if (max > 0 && fm.progress_value >= max && fm.stato !== "archiviata") {
                fm.stato = "completato";
            }
        });
        notice("Clock avanzato.");
        return "";
    }

    if (action === "applica_conseguenza") {
        const meta = currentMeta();
        const targets = await choosePropagationTargets(meta);
        const consequenceText = await helpers.promptOptional(tp, "Conseguenza applicata", meta.nome ?? currentFile().basename);
        const noteLink = currentLink();

        for (const target of targets) {
            const targetFile = helpers.getFileFromLink(target);
            if (!targetFile || targetFile.path === currentFile().path) continue;

            await helpers.processFrontmatter(targetFile, fm => {
                fm.conseguenze = helpers.appendUniqueLink(fm.conseguenze, noteLink);
                if (consequenceText) {
                    fm.impatto = helpers.normalizeFieldArray(fm.impatto);
                    if (!fm.impatto.includes(consequenceText)) fm.impatto.push(consequenceText);
                }
            });
        }

        await helpers.processFrontmatter(currentFile(), fm => {
            fm.stato = fm.stato === "da smistare" ? "collegata" : fm.stato;
            fm.applicata_il = today;
            fm.applicata_a = targets;
        });
        notice("Conseguenza applicata alle entita scelte.");
        return "";
    }

    if (action === "propaga_entita") {
        const meta = currentMeta();
        const targets = await choosePropagationTargets(meta);
        const noteLink = currentLink();

        for (const target of targets) {
            const targetFile = helpers.getFileFromLink(target);
            if (!targetFile || targetFile.path === currentFile().path) continue;

            await helpers.processFrontmatter(targetFile, fm => {
                fm.connessioni = helpers.appendUniqueLink(fm.connessioni, noteLink);
                fm.propagato_da = helpers.appendUniqueLink(fm.propagato_da, noteLink);
            });
        }

        await helpers.processFrontmatter(currentFile(), fm => {
            fm.propagato_il = today;
            fm.propaga_a = targets;
        });
        notice("Propagazione registrata.");
        return "";
    }

    if (action === "prepara_recap_pubblico") {
        const session = currentMeta().categoria === "sessione"
            ? { file: currentFile() }
            : helpers.getActiveSessionContext();

        if (!session.file) {
            notice("Nessuna sessione da riepilogare.");
            return "";
        }

        const recap = await helpers.promptOptional(tp, "Recap pubblico per i giocatori");
        if (!recap) return "";

        if (privatePublicPattern.test(recap)) {
            notice("Recap pubblico non salvato: contiene termini da DM o segreti.");
            return "";
        }

        await helpers.processFrontmatter(session.file, fm => {
            fm.recap_pubblico = helpers.normalizeFieldArray(fm.recap_pubblico);
            if (!fm.recap_pubblico.includes(recap)) fm.recap_pubblico.push(recap);
            fm.pubblico = true;
        });
        notice("Recap pubblico preparato.");
        return "";
    }

    notice(`Azione Meta Bind non riconosciuta: ${action}`);
    return "";
}

module.exports = meta_actions;
