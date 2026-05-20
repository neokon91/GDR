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

        const recapPubblico = await helpers.promptOptional(tp, "Recap pubblico");
        const recapDm = await helpers.promptOptional(tp, "Recap DM");
        const conseguenza = await helpers.promptOptional(tp, "Conseguenza principale da applicare");
        const prossimaApertura = await helpers.promptOptional(tp, "Prossima apertura");
        const output = await helpers.promptOptional(tp, "Output utile per la prossima sessione");

        await helpers.processFrontmatter(session.file, fm => {
            fm.stato = "giocata";
            fm.attiva = false;
            fm.recap_pubblico = helpers.normalizeFieldArray(fm.recap_pubblico);
            fm.recap_dm = helpers.normalizeFieldArray(fm.recap_dm);
            fm.conseguenze = helpers.normalizeFieldArray(fm.conseguenze);
            fm.output_sessione = helpers.normalizeFieldArray(fm.output_sessione);

            if (recapPubblico) fm.recap_pubblico.push(recapPubblico);
            if (recapDm) fm.recap_dm.push(recapDm);
            if (conseguenza) fm.conseguenze.push(conseguenza);
            if (prossimaApertura) fm.prossima_apertura = prossimaApertura;
            if (output) fm.output_sessione.push(output);
        });

        new Notice("Sessione chiusa. Output pronto per la prossima preparazione.");
        return "";
    }

    if (wizard === "nuova_sessione_da_output_precedente") {
        const lastSession = helpers.getActiveSessionFile();
        const lastMeta = app.metadataCache.getFileCache(lastSession)?.frontmatter ?? {};
        const output = helpers.normalizeFieldArray(lastMeta.output_sessione).join("; ");

        helpers.setRoute({
            obiettivo: output
        });

        return await tp.user.sessione(tp);
    }

    new Notice(`Wizard non riconosciuto: ${wizard}`);
    return "";
}

module.exports = wizard_layer;
