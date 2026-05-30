async function meta_actions(tp, action = "") {
    const helpers = tp.user.helpers;
    const optionalRequire = modulePath => {
        if (typeof require !== "function") return null;
        try {
            return require(modulePath);
        } catch {
            return null;
        }
    };
    const continuity = tp.user.continuity_state ?? optionalRequire("./continuity_state");
    const sessionLifecycle = tp.user.session_lifecycle_actions ?? optionalRequire("./session_lifecycle_actions");
    const activeFile = app.workspace.getActiveFile?.() ?? tp.config?.target_file ?? null;
    const today = tp.date.now("YYYY-MM-DD");

    const currentFile = () => activeFile;
    const currentLink = () => helpers.fileLink(currentFile());
    const currentMeta = () => helpers.getFileByPathOrBasename(currentFile()?.path)?.path
        ? app.metadataCache.getFileCache(currentFile())?.frontmatter ?? {}
        : {};

    const notice = message => new Notice(message);
    const privatePublicPattern = /\b(dm|segreto|segreti|nascost[oaie]?|verita|verità|prossima mossa|mosse segrete|retroscena|non rivelare)\b/i;

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
    const chooseSessionToActivate = async () => {
        const file = currentFile();
        const meta = currentMeta();

        if (file && meta.categoria === "sessione") {
            return file;
        }

        const link = await helpers.chooseNoteByPath(tp, helpers.path("sessioni"), "Sessione da rendere attiva", "Annulla");
        return helpers.getFileFromLink(link);
    };
    const appendUniqueText = (value, text) => continuity.appendUnique(value, text);
    const promptPressureDelta = async () => {
        const raw = await helpers.promptOptional(tp, "Aumento pressione sui bersagli", "0");
        const delta = Number.parseInt(raw || "0", 10);
        return Number.isFinite(delta) ? delta : 0;
    };
    const applyContinuityImpact = async (targetFile, { sourceFile = currentFile(), sourceLink, targetLink, consequenceText, nextMove, pressureDelta = 0, trackStep = 0, mode = "propagazione" }) => {
        if (!targetFile || targetFile.path === sourceFile?.path) return;

        await helpers.processFrontmatter(targetFile, fm => {
            continuity.applyContinuityImpact(
                new Map([[targetFile.path, { frontmatter: fm }]]),
                targetFile.path,
                {
                    sourceKey: sourceFile?.path ?? "",
                    sourceLink,
                    targetLink,
                    consequenceText,
                    nextMove,
                    pressureDelta,
                    trackStep,
                    today,
                    mode
                }
            );
        });

        const targetMeta = app.metadataCache.getFileCache(targetFile)?.frontmatter ?? {};
        const targetIsRelation = String(targetMeta.categoria ?? "") === "relazione" || helpers.normalizeFieldArray(targetMeta.soggetti).length > 0;

        if (!targetIsRelation) return;

        for (const subject of helpers.normalizeFieldArray(targetMeta.soggetti)) {
            const subjectFile = helpers.getFileFromLink(subject);
            if (!subjectFile || subjectFile.path === targetFile.path || subjectFile.path === sourceFile?.path) continue;

            await helpers.processFrontmatter(subjectFile, fm => {
                fm.relazioni = helpers.appendUniqueLink(fm.relazioni, targetLink);
                fm.propagato_da = helpers.appendUniqueLink(fm.propagato_da, sourceLink);
                fm.propagazione_stato = fm.propagazione_stato || "da verificare";
                fm.aggiornamenti_richiesti = appendUniqueText(
                    fm.aggiornamenti_richiesti,
                    continuity.continuityUpdateText({
                        today,
                        sourceLink,
                        text: consequenceText || `Verifica relazione ${targetLink}`,
                        nextMove
                    })
                );
            });
        }
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

        if (!sessionLifecycle) {
            notice("Modulo sessioni vive non disponibile.");
            return "";
        }

        const sessionField = sessionLifecycle.fieldForSession(currentMeta());
        await helpers.linkCreatedNoteToActiveSession(currentFile(), {
            sessionField,
            updateCreated: true
        });
        notice(`Collegata alla sessione attiva (${sessionField}).`);
        return "";
    }

    if (action === "rendi_sessione_attiva") {
        const targetSession = await chooseSessionToActivate();
        if (!targetSession) return "";

        const sessionFiles = app.vault.getMarkdownFiles()
            .filter(file => file.path.startsWith(`${helpers.path("sessioni")}/`));

        for (const file of sessionFiles) {
            const isTarget = file.path === targetSession.path;
            await helpers.processFrontmatter(file, fm => {
                if (fm.categoria !== "sessione") return;
                fm.attiva = isTarget;
                if (isTarget && (!fm.stato || fm.stato === "preparazione")) {
                    fm.stato = "pronto";
                }
            });
        }

        notice(`Sessione attiva: ${targetSession.basename}.`);
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
        const nextMove = await helpers.promptOptional(tp, "Prossima mossa suggerita ai bersagli", meta.prossima_mossa ?? "");
        const pressureDelta = await promptPressureDelta();
        const noteLink = currentLink();

        for (const target of targets) {
            const targetFile = helpers.getFileFromLink(target);
            await applyContinuityImpact(targetFile, {
                sourceLink: noteLink,
                targetLink: target,
                consequenceText,
                nextMove,
                pressureDelta,
                mode: "conseguenza"
            });
        }

        await helpers.processFrontmatter(currentFile(), fm => {
            fm.stato = fm.stato === "da smistare" ? "collegata" : fm.stato;
            fm.applicata_il = today;
            fm.applicata_a = targets;
            fm.propagazione_stato = "applicata";
            fm.ultima_propagazione = today;
            if (consequenceText) fm.effetti = appendUniqueText(fm.effetti, consequenceText);
            if (nextMove && !fm.prossima_mossa) fm.prossima_mossa = nextMove;
        });
        notice("Conseguenza applicata alle entita scelte.");
        return "";
    }

    if (action === "registra_scelta_mondo") {
        const session = currentMeta().categoria === "sessione"
            ? { file: currentFile(), frontmatter: currentMeta() }
            : helpers.getActiveSessionContext();
        const sourceFile = session.file ?? currentFile();
        const sourceMeta = session.file ? (session.frontmatter ?? app.metadataCache.getFileCache(session.file)?.frontmatter ?? {}) : currentMeta();

        if (!sourceFile) {
            notice("Nessuna sessione o nota sorgente da aggiornare.");
            return "";
        }

        const choice = await helpers.promptOptional(tp, "Scelta dei giocatori", sourceMeta.scelta ?? "");
        if (!choice) return "";

        const consequenceText = await helpers.promptOptional(tp, "Conseguenza concreta nel mondo", sourceMeta.conseguenza_potenziale ?? sourceMeta.impatto ?? "");
        const targets = await choosePropagationTargets(sourceMeta);
        if (!targets.length) {
            notice("Scelta non registrata: servono entita impattate o propaga_a.");
            return "";
        }

        const nextMove = await helpers.promptOptional(tp, "Prossima mossa suggerita ai bersagli", sourceMeta.prossima_mossa ?? sourceMeta.prossima_apertura ?? "");
        const pressureDelta = await promptPressureDelta();
        const trackStepText = await helpers.promptOptional(tp, "Avanzamento tracciati bersaglio", "1");
        const trackStep = Number.parseInt(trackStepText || "0", 10);
        const noteLink = helpers.fileLink(sourceFile);
        const event = continuity.buildContinuityEvent({
            today,
            sourceKey: sourceFile.path,
            sourceLink: noteLink,
            choice,
            consequenceText,
            targets,
            nextMove,
            pressureDelta,
            trackStep: Number.isFinite(trackStep) ? trackStep : 0,
            state: "applicata"
        });
        const eventErrors = continuity.validateContinuityEvent(event);
        if (eventErrors.length) {
            notice(`Scelta non registrata: ${eventErrors.join(", ")}.`);
            return "";
        }

        for (const target of event.targets) {
            const targetLink = target.link || target.key;
            const targetFile = helpers.getFileFromLink(targetLink);
            await applyContinuityImpact(targetFile, {
                sourceFile,
                sourceLink: noteLink,
                targetLink,
                consequenceText: consequenceText || choice,
                nextMove,
                pressureDelta,
                trackStep: event.track_step,
                mode: "conseguenza"
            });
        }

        await helpers.processFrontmatter(sourceFile, fm => {
            continuity.applyContinuityEventToSource(fm, event);
        });

        notice("Scelta registrata e propagata nel mondo.");
        return "";
    }

    if (action === "propaga_entita") {
        const meta = currentMeta();
        const targets = await choosePropagationTargets(meta);
        const consequenceText = await helpers.promptOptional(tp, "Cosa deve cambiare sui bersagli", meta.impatto ?? meta.conseguenza_potenziale ?? meta.nome ?? currentFile().basename);
        const nextMove = await helpers.promptOptional(tp, "Prossima mossa suggerita ai bersagli", meta.prossima_mossa ?? "");
        const noteLink = currentLink();

        for (const target of targets) {
            const targetFile = helpers.getFileFromLink(target);
            await applyContinuityImpact(targetFile, {
                sourceLink: noteLink,
                targetLink: target,
                consequenceText,
                nextMove,
                mode: "propagazione"
            });
        }

        await helpers.processFrontmatter(currentFile(), fm => {
            fm.propagato_il = today;
            fm.propaga_a = targets;
            fm.propagazione_stato = "propagata";
            fm.ultima_propagazione = today;
            if (consequenceText) fm.aggiornamenti_richiesti = appendUniqueText(fm.aggiornamenti_richiesti, consequenceText);
            if (nextMove && !fm.prossima_mossa) fm.prossima_mossa = nextMove;
        });
        notice("Propagazione registrata.");
        return "";
    }

    if (action === "chiudi_sessione_viva") {
        if (!sessionLifecycle) {
            notice("Modulo sessioni vive non disponibile.");
            return "";
        }
        return await sessionLifecycle.closeLiveSession(tp, {
            helpers,
            continuity,
            today,
            currentFile,
            currentMeta,
            notice,
            choosePropagationTargets,
            promptPressureDelta,
            applyContinuityImpact,
            appendUniqueText
        });
    }

    if (action === "apri_prossima_sessione_viva") {
        if (!sessionLifecycle) {
            notice("Modulo sessioni vive non disponibile.");
            return "";
        }
        return await sessionLifecycle.openNextLiveSession(tp, {
            helpers,
            today,
            currentFile,
            currentMeta,
            notice,
            appendUniqueText,
            uniqueMarkdownPath
        });
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
            fm.recap_pubblico_preparato_il = today;
        });
        notice("Recap pubblico preparato.");
        return "";
    }

    notice(`Azione Meta Bind non riconosciuta: ${action}`);
    return "";
}

module.exports = meta_actions;
