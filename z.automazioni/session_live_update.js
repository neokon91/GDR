async function session_live_update(tp, mode = "scena") {
    const helpers = tp.user.helpers;
    const context = helpers.getActiveSessionContext();
    const sessionFile = context.file;

    if (!sessionFile) {
        new Notice("Nessuna sessione attiva trovata.");
        return "";
    }

    const appendText = (value, text) => {
        const entries = helpers.normalizeFieldArray(value);
        return text && !entries.includes(text) ? [...entries, text] : entries;
    };

    if (mode === "scena") {
        const scena = await helpers.promptOptional(tp, "Scena corrente");

        if (!scena) return "";

        await helpers.processFrontmatter(sessionFile, fm => {
            fm.scena_corrente = scena;
        });
        new Notice("Scena corrente aggiornata.");
        return "";
    }

    if (mode === "decisione") {
        const decisione = await helpers.promptOptional(tp, "Decisione presa al tavolo");

        if (!decisione) return "";

        const conseguenza = await helpers.promptOptional(tp, "Cosa potrebbe cambiare nel mondo");
        const chiReagisce = await helpers.promptOptional(tp, "Chi potrebbe reagire");

        await helpers.processFrontmatter(sessionFile, fm => {
            fm.decisioni_prese = appendText(fm.decisioni_prese, decisione);
            fm.output_sessione = appendText(fm.output_sessione, `Decisione: ${decisione}`);
            if (conseguenza) {
                fm.conseguenze = appendText(fm.conseguenze, conseguenza);
                fm.output_sessione = appendText(fm.output_sessione, `Conseguenza potenziale: ${conseguenza}`);
                fm.propagazione_stato = fm.propagazione_stato || "aperta";
            }
            if (chiReagisce) {
                fm.propaga_a = appendText(fm.propaga_a, chiReagisce);
                fm.aggiornamenti_richiesti = appendText(fm.aggiornamenti_richiesti, `Verifica reazione: ${chiReagisce}`);
            }
        });
        new Notice("Decisione aggiunta alla sessione.");
        return "";
    }

    if (mode === "appunto") {
        const appunto = await helpers.chooseNoteByPath(tp, "Inbox", "Appunto live da collegare", "Scrivi nuovo link manuale", { world: context.world, session: context.link });

        if (!appunto) return "";

        await helpers.processFrontmatter(sessionFile, fm => {
            fm.appunti_live = helpers.appendUniqueLink(fm.appunti_live, appunto);
        });
        new Notice("Appunto live collegato alla sessione.");
        return "";
    }

    return "";
}

module.exports = session_live_update;
