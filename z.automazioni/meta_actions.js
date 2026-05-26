async function meta_actions(tp, action = "") {
    const helpers = tp.user.helpers;
    const m11 = tp.user.m11_state ?? (typeof require === "function" ? require("./m11_state") : null);
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
    const appendUniqueText = (value, text) => m11.appendUnique(value, text);
    const promptPressureDelta = async () => {
        const raw = await helpers.promptOptional(tp, "Aumento pressione sui bersagli", "0");
        const delta = Number.parseInt(raw || "0", 10);
        return Number.isFinite(delta) ? delta : 0;
    };
    const applyContinuityImpact = async (targetFile, { sourceFile = currentFile(), sourceLink, targetLink, consequenceText, nextMove, pressureDelta = 0, trackStep = 0, mode = "propagazione" }) => {
        if (!targetFile || targetFile.path === sourceFile?.path) return;

        await helpers.processFrontmatter(targetFile, fm => {
            m11.applyContinuityImpact(
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
                    m11.continuityUpdateText({
                        today,
                        sourceLink,
                        text: consequenceText || `Verifica relazione ${targetLink}`,
                        nextMove
                    })
                );
            });
        }
    };
    const appendUniqueLinks = (value, links) => m11.appendUniqueMany(value, helpers.normalizeFieldArray(links));
    const continuityEntry = ({ choice, consequenceText, targets, nextMove }) => m11.continuityEntry({
        today,
        choice,
        consequenceText,
        targets,
        nextMove
    });

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
        const entry = continuityEntry({ choice, consequenceText, targets, nextMove });

        for (const target of targets) {
            const targetFile = helpers.getFileFromLink(target);
            await applyContinuityImpact(targetFile, {
                sourceFile,
                sourceLink: noteLink,
                targetLink: target,
                consequenceText: consequenceText || choice,
                nextMove,
                pressureDelta,
                trackStep: Number.isFinite(trackStep) ? trackStep : 0,
                mode: "conseguenza"
            });
        }

        await helpers.processFrontmatter(sourceFile, fm => {
            fm.decisioni_prese = appendUniqueText(fm.decisioni_prese, choice);
            fm.output_sessione = appendUniqueText(fm.output_sessione, entry);
            fm.conseguenze = appendUniqueText(fm.conseguenze, consequenceText || choice);
            fm.entita_impattate = appendUniqueLinks(fm.entita_impattate, targets);
            fm.applicata_a = appendUniqueLinks(fm.applicata_a, targets);
            fm.propagazione_stato = "applicata";
            fm.ultima_propagazione = today;
            if (nextMove && !fm.prossima_mossa) fm.prossima_mossa = nextMove;
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
