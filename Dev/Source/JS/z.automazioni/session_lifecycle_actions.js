const privatePublicPattern = /\b(dm|segreto|segreti|nascost[oaie]?|verita|verità|prossima mossa|mosse segrete|retroscena|non rivelare)\b/i;

function fieldForSession(frontmatter) {
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
    return "appunti_live";
}

function uniqueEntries(entries) {
    return entries
        .map(entry => String(entry ?? "").trim())
        .filter(Boolean)
        .reduce((acc, entry) => acc.includes(entry) ? acc : [...acc, entry], []);
}

function fileMeta(file) {
    return file ? app.metadataCache.getFileCache(file)?.frontmatter ?? {} : {};
}

function latestClosedSession(helpers) {
    return app.vault.getMarkdownFiles()
        .filter(file => file.path.startsWith(`${helpers.path("sessioni")}/`))
        .map(file => ({ file, frontmatter: fileMeta(file) }))
        .filter(({ frontmatter }) => frontmatter.categoria === "sessione"
            && (frontmatter.stato === "giocata" || frontmatter.chiusa_il))
        .sort((a, b) => {
            const byDate = String(b.frontmatter.chiusa_il ?? b.frontmatter.data ?? "")
                .localeCompare(String(a.frontmatter.chiusa_il ?? a.frontmatter.data ?? ""));
            return byDate || ((b.file.stat?.mtime ?? 0) - (a.file.stat?.mtime ?? 0));
        })[0] ?? null;
}

async function chooseSessionSourceForNext(tp, { helpers, currentFile, currentMeta }) {
    const meta = currentMeta();
    if (currentFile() && meta.categoria === "sessione") {
        return { file: currentFile(), frontmatter: meta };
    }

    const latest = latestClosedSession(helpers);
    if (latest) {
        const useLatest = await helpers.askYesNo(tp, `Usare l'ultima sessione chiusa: ${latest.file.basename}?`);
        if (useLatest) return latest;
    }

    const selected = await helpers.chooseNoteByPath(tp, helpers.path("sessioni"), "Sessione sorgente per aprire la prossima", "Annulla");
    const selectedFile = helpers.getFileFromLink(selected);
    return selectedFile ? { file: selectedFile, frontmatter: fileMeta(selectedFile) } : {};
}

async function closeLiveSession(tp, context) {
    const {
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
    } = context;
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

async function openNextLiveSession(tp, context) {
    const {
        helpers,
        today,
        currentFile,
        currentMeta,
        notice,
        appendUniqueText,
        uniqueMarkdownPath
    } = context;
    const source = await chooseSessionSourceForNext(tp, { helpers, currentFile, currentMeta });
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

module.exports = {
    closeLiveSession,
    fieldForSession,
    openNextLiveSession
};
