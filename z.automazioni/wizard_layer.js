async function wizard_layer(tp, wizard = "") {
    const helpers = tp.user.helpers;

    if (wizard === "nuova_entita_viva") {
        const selected = await helpers.chooseRequired(
            tp,
            [
                { label: "Nuovo mondo homebrew", template: "z.modelli/wizard/Nuovo Mondo Homebrew.md", folder: helpers.path("mondi") },
                { label: "PNG vivo", template: "z.modelli/personaggio/PNG.md", folder: helpers.path("personaggi") },
                { label: "Luogo vivo", template: "z.modelli/Luogo Router.md", folder: helpers.path("luoghi") },
                { label: "Fazione viva", template: "z.modelli/Fazione Router.md", folder: helpers.path("fazioni") },
                { label: "Societa", template: "z.modelli/Societa Router.md", folder: helpers.path("societa") },
                { label: "Cultura", template: "z.modelli/Cultura Router.md", folder: helpers.path("culture") },
                { label: "Religione o mito", template: "z.modelli/Religione Router.md", folder: helpers.path("religioni") },
                { label: "Economia o risorsa", template: "z.modelli/Economia Router.md", folder: helpers.path("risorse_mondo") },
                { label: "Magia o cosmologia", template: "z.modelli/Magia Router.md", folder: helpers.path("cosmologia") },
                { label: "Storia", template: "z.modelli/Storia Router.md", folder: helpers.path("storia") },
                { label: "Ecologia o creatura", template: "z.modelli/Ecologia Router.md", folder: helpers.path("creature") },
                { label: "Missione viva", template: "z.modelli/dm/Missione.md", folder: helpers.path("missioni") },
                { label: "Clock o tracciato", template: "z.modelli/dm/Tracciato.md", folder: helpers.path("tracciati") }
            ],
            "Che entita viva vuoi creare?"
        );

        await tp.file.create_new(tp.file.find_tfile(selected.template), undefined, true, app.vault.getAbstractFileByPath(selected.folder));
        return "";
    }

    if (wizard === "appunto_live") {
        return await tp.user.lore_capture(tp, {
            defaultName: "Appunto live",
            useActiveSession: true
        });
    }

    if (wizard === "conseguenza") {
        return await tp.user.lore_capture(tp, {
            tipo: "conseguenza",
            defaultName: "Conseguenza emersa",
            useActiveSession: true
        });
    }

    if (wizard === "fine_sessione") {
        const session = helpers.getActiveSessionContext();
        if (!session.file) {
            new Notice("Nessuna sessione attiva da chiudere.");
            return "";
        }

        const meta = session.frontmatter ?? {};
        const compactField = value => helpers.normalizeFieldArray(value).filter(Boolean).join("; ");
        const appendUniqueText = (entries, text) => {
            const normalized = helpers.normalizeFieldArray(entries);
            return text && !normalized.includes(text) ? [...normalized, text] : normalized;
        };

        // Il post-sessione deve riusare cio che e gia stato scritto live, non farlo reinserire da zero.
        const sceltaGiocatori = await helpers.promptOptional(tp, "Scelta dei giocatori", compactField(meta.decisioni_prese ?? meta.scelta));
        const cambiamentoMondo = await helpers.promptOptional(tp, "Cosa cambia nel mondo", compactField(meta.conseguenze ?? meta.impatto));
        const chiReagisce = await helpers.promptOptional(tp, "Chi reagisce prima della prossima sessione", compactField(meta.propaga_a ?? meta.entita_impattate));
        const recapPubblico = await helpers.promptOptional(tp, "Recap pubblico", compactField(meta.recap_pubblico));
        const recapDm = await helpers.promptOptional(tp, "Recap DM", compactField(meta.recap_dm));
        const prossimaApertura = await helpers.promptOptional(tp, "Prossima apertura", meta.prossima_apertura ?? meta.prossima_mossa ?? "");
        const output = await helpers.promptOptional(tp, "Output utile per la prossima sessione", compactField(meta.output_sessione));

        await helpers.processFrontmatter(session.file, fm => {
            fm.stato = "giocata";
            fm.attiva = false;
            fm.recap_pubblico = helpers.normalizeFieldArray(fm.recap_pubblico);
            fm.recap_dm = helpers.normalizeFieldArray(fm.recap_dm);
            fm.conseguenze = helpers.normalizeFieldArray(fm.conseguenze);
            fm.output_sessione = helpers.normalizeFieldArray(fm.output_sessione);
            fm.decisioni_prese = helpers.normalizeFieldArray(fm.decisioni_prese);
            fm.propaga_a = helpers.normalizeFieldArray(fm.propaga_a);

            if (sceltaGiocatori) fm.decisioni_prese = appendUniqueText(fm.decisioni_prese, sceltaGiocatori);
            if (cambiamentoMondo) fm.conseguenze = appendUniqueText(fm.conseguenze, cambiamentoMondo);
            if (chiReagisce) {
                fm.propaga_a = appendUniqueText(fm.propaga_a, chiReagisce);
                fm.aggiornamenti_richiesti = helpers.normalizeFieldArray(fm.aggiornamenti_richiesti);
                fm.aggiornamenti_richiesti = appendUniqueText(
                    fm.aggiornamenti_richiesti,
                    `Post-sessione: ${chiReagisce} reagisce a ${cambiamentoMondo || sceltaGiocatori || "quanto accaduto"}`
                );
                fm.propagazione_stato = "aperta";
            }
            if (recapPubblico) fm.recap_pubblico = appendUniqueText(fm.recap_pubblico, recapPubblico);
            if (recapDm) fm.recap_dm = appendUniqueText(fm.recap_dm, recapDm);
            if (prossimaApertura) fm.prossima_apertura = prossimaApertura;
            if (output) fm.output_sessione = appendUniqueText(fm.output_sessione, output);
            if (sceltaGiocatori || cambiamentoMondo) {
                fm.output_sessione = appendUniqueText(
                    fm.output_sessione,
                    `Continuita: ${[sceltaGiocatori, cambiamentoMondo, chiReagisce].filter(Boolean).join(" -> ")}`
                );
            }
        });

        new Notice("Sessione chiusa. Output pronto per la prossima preparazione.");
        return "";
    }

    if (wizard === "nuova_sessione_da_output_precedente") {
        const sessioniPath = helpers.path("sessioni");
        // Se non c'e una sessione attiva, riparte dall'ultima sessione giocata con output utile.
        const latestPlayedSession = app.vault.getMarkdownFiles()
            .filter(file => file.path.startsWith(`${sessioniPath}/`))
            .map(file => ({ file, meta: app.metadataCache.getFileCache(file)?.frontmatter ?? {} }))
            .filter(({ meta }) => {
                const output = helpers.normalizeFieldArray(meta.output_sessione);
                return meta.categoria === "sessione" && meta.stato === "giocata" && (output.length || meta.prossima_apertura);
            })
            .sort((a, b) => (b.file.stat?.mtime ?? 0) - (a.file.stat?.mtime ?? 0))[0]?.file ?? null;
        const selectedSession = helpers.getActiveSessionFile() ?? latestPlayedSession;
        let lastSession = selectedSession;

        if (!lastSession) {
            const selected = await helpers.chooseNoteByPath(tp, sessioniPath, "Sessione sorgente per la prossima preparazione", "Annulla");
            lastSession = helpers.getFileFromLink(selected);
        }

        if (!lastSession) {
            new Notice("Nessuna sessione sorgente selezionata.");
            return "";
        }

        const lastMeta = app.metadataCache.getFileCache(lastSession)?.frontmatter ?? {};
        const outputItems = helpers.normalizeFieldArray(lastMeta.output_sessione);
        const output = [
            ...outputItems,
            lastMeta.prossima_apertura ? `Prossima apertura: ${lastMeta.prossima_apertura}` : ""
        ].filter(Boolean).join("; ");

        helpers.setRoute({
            obiettivo: output || `Continuare da ${lastSession.basename}`,
            apertura: lastMeta.prossima_apertura ?? "",
            mondo: lastMeta.mondo ?? "",
            campagne: helpers.normalizeFieldArray(lastMeta.campagne),
            luoghi: helpers.normalizeFieldArray(lastMeta.luoghi),
            missioni: helpers.normalizeFieldArray(lastMeta.missioni),
            tracciati: helpers.normalizeFieldArray(lastMeta.tracciati),
            fazioni: helpers.normalizeFieldArray(lastMeta.fazioni)
        });

        new Notice(`Nuova preparazione da: ${lastSession.basename}.`);
        return await tp.user.sessione(tp);
    }

    new Notice(`Wizard non riconosciuto: ${wizard}`);
    return "";
}

module.exports = wizard_layer;
