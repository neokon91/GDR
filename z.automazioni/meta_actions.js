async function meta_actions(tp, action = "") {
    const helpers = tp.user.helpers;
    const continuity = tp.user.continuity_state
        ?? (typeof require === "function" ? require("./continuity_state") : null);
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
    const generatedTargetFolder = frontmatter => {
        const category = String(frontmatter?.categoria ?? "");
        const type = String(frontmatter?.tipo ?? "");

        if (category === "luogo") return helpers.path("luoghi");
        if (category === "fazione") return helpers.path("fazioni");
        if (category === "religione") return helpers.path("religioni");
        if (category === "personaggio" || type === "png") return helpers.path("personaggi");
        if (category === "oggetto") return helpers.path("oggetti");
        if (category === "missione") return helpers.path("missioni");
        return "Inbox";
    };
    const hasGeneratedAnchor = frontmatter => [
        frontmatter.mondo,
        frontmatter.luogo,
        frontmatter.luogo_padre,
        frontmatter.campagne,
        frontmatter.sessioni
    ].some(value => helpers.normalizeFieldArray(value).length > 0 || String(value ?? "").trim());
    const uniqueMarkdownPath = (folder, basename) => {
        const safeName = String(basename ?? "Bozza Generata").replace(/[\\/:*?"<>|]/g, "-").trim() || "Bozza Generata";
        let target = `${folder}/${safeName}.md`;
        let index = 2;

        while (app.vault.getAbstractFileByPath(target)) {
            target = `${folder}/${safeName} ${index}.md`;
            index += 1;
        }

        return target;
    };
    const moveCurrentFileTo = async folder => {
        const file = currentFile();
        await helpers.ensureFolder(folder);
        const targetPath = uniqueMarkdownPath(folder, file.basename);
        await (app.fileManager?.renameFile
            ? app.fileManager.renameFile(file, targetPath)
            : app.vault.rename(file, targetPath));
        return targetPath;
    };
    const applyGeneratedWorkflow = async ({ canonize }) => {
        const file = currentFile();
        const meta = currentMeta();

        if (meta.plugin !== "fantasy-content-generator") {
            notice("La nota attiva non viene dal Generatore di Contenuti Fantasy.");
            return "";
        }

        if (!hasGeneratedAnchor(meta)) {
            notice("Aggiungi prima mondo, luogo, campagna o sessione alla bozza generata.");
            return "";
        }

        const targetFolder = generatedTargetFolder(meta);
        await helpers.processFrontmatter(file, fm => {
            fm.stato = fm.stato === "bozza" ? "pronto" : fm.stato;
            fm.smistato_il = today;
            fm.destinazione_smistamento = targetFolder;
            fm.origine_bozza = file.path;
            fm.fonte = fm.fonte || "fantasy-content-generator";

            if (canonize) {
                fm.canonico = true;
                fm.stato_canonico = "canonico";
                fm.canonizzato_il = today;
            } else {
                fm.canonico = false;
                fm.stato_canonico = fm.stato_canonico || "rumor";
            }
        });

        const targetPath = file.path.startsWith(`${targetFolder}/`)
            ? file.path
            : await moveCurrentFileTo(targetFolder);
        notice(canonize
            ? `Bozza canonizzata in ${targetPath}.`
            : `Bozza smistata in ${targetPath}.`);
        return "";
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
    const uniqueEntries = entries => entries
        .map(entry => String(entry ?? "").trim())
        .filter(Boolean)
        .reduce((acc, entry) => acc.includes(entry) ? acc : [...acc, entry], []);
    const compactField = value => uniqueEntries(helpers.normalizeFieldArray(value)).join("; ");
    const fileMeta = file => file ? app.metadataCache.getFileCache(file)?.frontmatter ?? {} : {};
    const latestClosedSession = () => app.vault.getMarkdownFiles()
        .filter(file => file.path.startsWith(`${helpers.path("sessioni")}/`))
        .map(file => ({ file, frontmatter: fileMeta(file) }))
        .filter(({ frontmatter }) => frontmatter.categoria === "sessione"
            && (frontmatter.stato === "giocata" || frontmatter.chiusa_il))
        .sort((a, b) => {
            const byDate = String(b.frontmatter.chiusa_il ?? b.frontmatter.data ?? "")
                .localeCompare(String(a.frontmatter.chiusa_il ?? a.frontmatter.data ?? ""));
            return byDate || ((b.file.stat?.mtime ?? 0) - (a.file.stat?.mtime ?? 0));
        })[0] ?? null;
    const chooseSessionSourceForNext = async () => {
        const meta = currentMeta();
        if (currentFile() && meta.categoria === "sessione") {
            return { file: currentFile(), frontmatter: meta };
        }

        const latest = latestClosedSession();
        if (latest) {
            const useLatest = await helpers.askYesNo(tp, `Usare l'ultima sessione chiusa: ${latest.file.basename}?`);
            if (useLatest) return latest;
        }

        const selected = await helpers.chooseNoteByPath(tp, helpers.path("sessioni"), "Sessione sorgente per aprire la prossima", "Annulla");
        const selectedFile = helpers.getFileFromLink(selected);
        return selectedFile ? { file: selectedFile, frontmatter: fileMeta(selectedFile) } : {};
    };
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

    if (action === "smista_bozza_generata") {
        return await applyGeneratedWorkflow({ canonize: false });
    }

    if (action === "canonizza_bozza_generata") {
        return await applyGeneratedWorkflow({ canonize: true });
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
        const session = currentMeta().categoria === "sessione"
            ? { file: currentFile(), frontmatter: currentMeta() }
            : helpers.getActiveSessionContext();
        const sessionFile = session.file;
        const sessionMeta = session.frontmatter ?? (sessionFile ? app.metadataCache.getFileCache(sessionFile)?.frontmatter ?? {} : {});

        if (!sessionFile) {
            notice("Nessuna sessione viva da chiudere.");
            return "";
        }

        const publicRecap = await helpers.promptOptional(tp, "Recap pubblico player-safe", sessionMeta.recap_pubblico ?? "");
        if (publicRecap && privatePublicPattern.test(publicRecap)) {
            notice("Chiusura annullata: il recap pubblico contiene termini da DM o segreti.");
            return "";
        }

        const dmRecap = await helpers.promptOptional(tp, "Recap DM e segreti", sessionMeta.recap_dm ?? "");
        const choice = await helpers.promptOptional(tp, "Svolta o scelta principale", sessionMeta.scelta ?? sessionMeta.decisioni_prese ?? "");
        const consequenceText = await helpers.promptOptional(tp, "Conseguenza concreta nel mondo", sessionMeta.conseguenza_potenziale ?? sessionMeta.impatto ?? "");
        const targets = consequenceText || choice ? await choosePropagationTargets(sessionMeta) : [];
        const nextMove = await helpers.promptOptional(tp, "Prossima mossa o reazione", sessionMeta.prossima_mossa ?? sessionMeta.prossima_apertura ?? "");
        const nextOpening = await helpers.promptOptional(tp, "Apertura prossima sessione", sessionMeta.prossima_apertura ?? "");
        const pressureDelta = targets.length ? await promptPressureDelta() : 0;
        const trackStepText = targets.length ? await helpers.promptOptional(tp, "Avanzamento tracciati bersaglio", "1") : "0";
        const trackStep = Number.parseInt(trackStepText || "0", 10);
        const sourceLink = helpers.fileLink(sessionFile);
        const eventCause = choice || "Chiusura sessione";
        const eventConsequence = consequenceText || choice;

        if (targets.length && eventConsequence) {
            const event = continuity.buildContinuityEvent({
                today,
                sourceKey: sessionFile.path,
                sourceLink,
                choice: eventCause,
                consequenceText: eventConsequence,
                targets,
                nextMove,
                pressureDelta,
                trackStep: Number.isFinite(trackStep) ? trackStep : 0,
                state: "applicata"
            });
            const eventErrors = continuity.validateContinuityEvent(event);
            if (eventErrors.length) {
                notice(`Chiusura non propagata: ${eventErrors.join(", ")}.`);
                return "";
            }

            for (const target of event.targets) {
                const targetLink = target.link || target.key;
                const targetFile = helpers.getFileFromLink(targetLink);
                await applyContinuityImpact(targetFile, {
                    sourceFile: sessionFile,
                    sourceLink,
                    targetLink,
                    consequenceText: eventConsequence,
                    nextMove,
                    pressureDelta,
                    trackStep: event.track_step,
                    mode: "conseguenza"
                });
            }

            await helpers.processFrontmatter(sessionFile, fm => {
                continuity.applyContinuityEventToSource(fm, event);
            });
        }

        await helpers.processFrontmatter(sessionFile, fm => {
            fm.stato = "giocata";
            fm.attiva = false;
            fm.chiusa_il = today;
            if (publicRecap) {
                fm.recap_pubblico = helpers.normalizeFieldArray(fm.recap_pubblico);
                if (!fm.recap_pubblico.includes(publicRecap)) fm.recap_pubblico.push(publicRecap);
                fm.recap_pubblico_preparato_il = today;
            }
            if (dmRecap) fm.recap_dm = appendUniqueText(fm.recap_dm, dmRecap);
            if (nextOpening) fm.prossima_apertura = nextOpening;
            if (nextMove && !fm.prossima_mossa) fm.prossima_mossa = nextMove;
            if (choice) fm.decisioni_prese = appendUniqueText(fm.decisioni_prese, choice);
            if (consequenceText) fm.conseguenze = appendUniqueText(fm.conseguenze, consequenceText);
            if ((choice || consequenceText) && !targets.length) {
                fm.propagazione_stato = fm.propagazione_stato || "aperta";
            }
            fm.output_sessione = appendUniqueText(
                fm.output_sessione,
                [
                    today,
                    choice ? `scelta: ${choice}` : "",
                    consequenceText ? `conseguenza: ${consequenceText}` : "",
                    nextOpening ? `prossima apertura: ${nextOpening}` : ""
                ].filter(Boolean).join(" | ")
            );
        });

        notice(targets.length ? "Sessione chiusa, recap salvato e mondo aggiornato." : "Sessione chiusa con recap; propagazione rimasta aperta.");
        return "";
    }

    if (action === "apri_prossima_sessione_viva") {
        const source = await chooseSessionSourceForNext();
        const sourceFile = source.file;
        const sourceMeta = source.frontmatter ?? {};

        if (!sourceFile) {
            notice("Nessuna sessione sorgente selezionata.");
            return "";
        }

        if (!sourceMeta.mondo) {
            notice("Prossima sessione non aperta: la sessione sorgente non ha mondo.");
            return "";
        }

        const sourceLink = helpers.fileLink(sourceFile);
        const titleDefault = `Prossima sessione da ${sourceFile.basename}`;
        const title = await helpers.promptOptional(tp, "Titolo prossima sessione", titleDefault) || titleDefault;
        const date = await helpers.promptOptional(tp, "Data prossima sessione", today) || today;
        const openingDefault = String(sourceMeta.prossima_apertura ?? sourceMeta.prossima_mossa ?? "").trim();
        const opening = await helpers.promptOptional(tp, "Apertura confermata prossima sessione", openingDefault) || openingDefault;
        const previousOutput = helpers.normalizeFieldArray(sourceMeta.output_sessione);
        const objectiveDefault = opening || previousOutput[0] || `Continuare da ${sourceFile.basename}`;
        const objective = await helpers.promptOptional(tp, "Obiettivo prossima sessione", objectiveDefault) || objectiveDefault;
        const targetLinks = uniqueEntries([
            ...helpers.normalizeFieldArray(sourceMeta.entita_impattate),
            ...helpers.normalizeFieldArray(sourceMeta.propaga_a),
            ...helpers.normalizeFieldArray(sourceMeta.applicata_a),
            ...helpers.normalizeFieldArray(sourceMeta.luoghi),
            ...helpers.normalizeFieldArray(sourceMeta.personaggi),
            ...helpers.normalizeFieldArray(sourceMeta.missioni),
            ...helpers.normalizeFieldArray(sourceMeta.tracciati),
            ...helpers.normalizeFieldArray(sourceMeta.fazioni)
        ]);
        const linked = {
            luoghi: helpers.normalizeFieldArray(sourceMeta.luoghi),
            personaggi: helpers.normalizeFieldArray(sourceMeta.personaggi),
            missioni: helpers.normalizeFieldArray(sourceMeta.missioni),
            tracciati: helpers.normalizeFieldArray(sourceMeta.tracciati),
            creature: helpers.normalizeFieldArray(sourceMeta.creature),
            incontri: helpers.normalizeFieldArray(sourceMeta.incontri),
            dispense: helpers.normalizeFieldArray(sourceMeta.dispense),
            mappe: helpers.normalizeFieldArray(sourceMeta.mappe),
            audio: helpers.normalizeFieldArray(sourceMeta.audio),
            immagini: helpers.normalizeFieldArray(sourceMeta.immagini),
            video: helpers.normalizeFieldArray(sourceMeta.video),
            fazioni: helpers.normalizeFieldArray(sourceMeta.fazioni),
            oggetti: helpers.normalizeFieldArray(sourceMeta.oggetti),
            appunti_live: []
        };
        const targetUpdates = [];
        const targetMoves = [];

        for (const link of targetLinks) {
            const targetFile = helpers.getFileFromLink(link);
            const targetMeta = fileMeta(targetFile);
            const sessionField = fieldForSession(targetMeta);
            if (linked[sessionField]) {
                linked[sessionField].push(link);
            } else {
                linked.appunti_live.push(link);
            }

            for (const update of helpers.normalizeFieldArray(targetMeta.aggiornamenti_richiesti)) {
                targetUpdates.push(`${link}: ${update}`);
            }
            if (targetMeta.prossima_mossa) {
                targetMoves.push(`${link}: ${targetMeta.prossima_mossa}`);
            }
        }

        for (const key of Object.keys(linked)) {
            linked[key] = uniqueEntries(linked[key]);
        }

        const consequences = uniqueEntries([
            ...helpers.normalizeFieldArray(sourceMeta.conseguenze),
            ...targetUpdates
        ]);
        const pressures = uniqueEntries([
            ...helpers.normalizeFieldArray(sourceMeta.pressioni),
            ...targetUpdates,
            ...targetMoves
        ]);
        const recapPublic = helpers.normalizeFieldArray(sourceMeta.recap_pubblico);
        const recapDm = helpers.normalizeFieldArray(sourceMeta.recap_dm);
        const outputCarry = uniqueEntries([
            `Preparata da ${sourceLink}`,
            ...previousOutput,
            sourceMeta.prossima_apertura ? `Apertura ereditata: ${sourceMeta.prossima_apertura}` : ""
        ]);
        const fonti = uniqueEntries([
            sourceLink,
            ...helpers.normalizeFieldArray(sourceMeta.campagne),
            ...targetLinks
        ]);
        const frontmatter = {
            id: helpers.slugify(`${date}-${title}`),
            nome: title,
            cssclasses: ["tavolo"],
            categoria: "sessione",
            fileClass: "sessione",
            tipo: sourceMeta.tipo || "sessione di campagna",
            data: date,
            data_mondo: "",
            "fc-calendar": sourceMeta["fc-calendar"] || sourceMeta.fc_calendar || "",
            "fc-date": "",
            "fc-category": "sessione",
            "fc-display-name": title,
            "fc-end": "",
            stato: "preparazione",
            attiva: true,
            mondo: sourceMeta.mondo,
            campagne: helpers.normalizeFieldArray(sourceMeta.campagne),
            ...linked,
            scena_corrente: opening,
            decisioni_prese: [],
            obiettivo: objective,
            apertura: opening,
            scelta: "",
            scene: opening ? [`Apertura: ${opening}`] : [],
            ricompense: [],
            segreti_rivelabili: [],
            domande_al_tavolo: [],
            decisioni_attese: [],
            pressioni: pressures,
            materiale_pronto: [],
            conseguenze: consequences,
            recap_pubblico: recapPublic,
            recap_dm: recapDm,
            prossima_apertura: "",
            output_sessione: outputCarry,
            fonti,
            riferimenti_srd: helpers.normalizeFieldArray(sourceMeta.riferimenti_srd),
            riferimenti_regola: helpers.normalizeFieldArray(sourceMeta.riferimenti_regola),
            sezioni_collegate: [],
            blocchi_collegati: [],
            tabelle_collegate: helpers.normalizeFieldArray(sourceMeta.tabelle_collegate),
            tags: ["gdr/bozza"]
        };
        const markdownList = values => {
            const entries = uniqueEntries(values);
            return entries.length ? entries.map(entry => `- ${entry}`).join("\n") : "- Nessun elemento ereditato.";
        };
        const body = [
            `# ${title}`,
            "",
            `> [!note] Aperta da ${sourceLink}`,
            "",
            "## Apertura",
            opening || "Da definire.",
            "",
            "## Recap pubblico",
            markdownList(recapPublic),
            "",
            "## Conseguenze da portare al tavolo",
            markdownList(consequences),
            "",
            "## Pressioni e prossime mosse",
            markdownList(pressures),
            "",
            "## Materiale collegato",
            markdownList(fonti)
        ].join("\n");
        const text = `---\n${helpers.renderYamlObject(frontmatter).join("\n")}\n---\n${body}\n`;
        const targetFolder = helpers.path("sessioni");
        await helpers.ensureFolder(targetFolder);
        const targetPath = uniqueMarkdownPath(targetFolder, `${date} - ${title}`);
        const createdFile = await app.vault.create(targetPath, text);
        const createdLink = helpers.fileLink(createdFile);

        for (const file of app.vault.getMarkdownFiles().filter(file => file.path.startsWith(`${targetFolder}/`) && file.path !== targetPath)) {
            await helpers.processFrontmatter(file, fm => {
                if (fm.categoria === "sessione") fm.attiva = false;
            });
        }

        await helpers.processFrontmatter(sourceFile, fm => {
            fm.sezioni_collegate = helpers.appendUniqueLink(fm.sezioni_collegate, createdLink);
            fm.output_sessione = appendUniqueText(fm.output_sessione, `Prossima sessione aperta: ${createdLink}`);
        });

        notice(`Prossima sessione viva aperta: ${createdFile.basename}.`);
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
            fm.recap_pubblico_preparato_il = today;
        });
        notice("Recap pubblico preparato.");
        return "";
    }

    notice(`Azione Meta Bind non riconosciuta: ${action}`);
    return "";
}

module.exports = meta_actions;
