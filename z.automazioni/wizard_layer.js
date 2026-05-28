async function wizard_layer(tp, wizard = "") {
    const helpers = tp.user.helpers;
    const notice = message => new Notice(message);

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

    notice(`Wizard non riconosciuto: ${wizard}`);
    return "";
}

module.exports = wizard_layer;
