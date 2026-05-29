function createObsidianAcceptanceValidators({
    cycleSmoke,
    pluginRuntimeProbes,
    runCycleSmoke,
    runPluginRuntimeProbes,
    runWorkflowSmoke,
    workflowSmoke
}) {
    function validateReport(report) {
        const errors = [];
        const { summary, results, workflow, workflowPages = [], cycle, cyclePages = [], pluginRuntimeProbes: runtimeProbeReport, events } = report;
        if (!summary) {
            errors.push("plugin summary non disponibile");
            return errors;
        }
        if (summary.enabledPluginCount !== summary.expectedPluginCount || summary.loadedPluginCount !== summary.expectedPluginCount || summary.missingLoaded.length) {
            errors.push(`plugin release non caricati: ${JSON.stringify(summary)}`);
        }
        for (const [name, ok] of Object.entries(summary.keyCommands)) {
            if (!ok) errors.push(`comando/plugin chiave assente nel live pass: ${name}`);
        }
        for (const result of results) {
            errors.push(...validatePageResult(result, "first-run"));
        }
        if (runWorkflowSmoke) errors.push(...validateWorkflowResult(workflow, "workflow"));
        for (const result of workflowPages) {
            errors.push(...validatePageResult(result, "post-workflow"));
        }
        if (runCycleSmoke) errors.push(...validateCycleResult(cycle, "cycle"));
        for (const result of cyclePages) {
            errors.push(...validatePageResult(result, "post-cycle"));
        }
        if (runPluginRuntimeProbes) errors.push(...validatePluginRuntimeProbes(runtimeProbeReport));
        if (events.length) errors.push(`eventi console globali nel live pass: ${JSON.stringify(events)}`);
        return errors;
    }

    function validatePluginRuntimeProbes(report) {
        if (!report) return ["plugin runtime probes non eseguiti"];
        if (report.probeCount !== pluginRuntimeProbes.length) {
            return [`plugin runtime probes incompleti (${report.probeCount}/${pluginRuntimeProbes.length})`];
        }
        return (report.errors ?? []).map(error => `plugin runtime: ${error}`);
    }

    function validatePageResult(result, label) {
        const errors = [];
        if (!result.exists) errors.push(`pagina ${label} mancante nel live pass: ${result.page}`);
        if (result.activeFile !== result.page) errors.push(`pagina ${label} non aperta nel live pass: ${result.page} -> ${result.activeFile}`);
        if (result.previewModeError) errors.push(`pagina ${label} non forzata in lettura preview ${result.page}: ${result.previewModeError}`);
        if (result.restrictedMode) errors.push(`restricted mode visibile nel live pass ${label}: ${result.page}`);
        if (result.dataviewError) errors.push(`errore Dataview visibile nel live pass ${label}: ${result.page}`);
        if (result.templaterLeak) errors.push(`codice Templater visibile nel live pass ${label}: ${result.page}`);
        if (!result.ux?.visibleTextLength) errors.push(`pagina ${label} senza testo visibile nel live pass: ${result.page}`);
        if (result.ux?.forbiddenTextHits?.length) {
            errors.push(`pagina ${label} espone testo tecnico vietato ${result.page}: ${result.ux.forbiddenTextHits.join(", ")}`);
        }
        if (result.ux?.forbiddenRegexHits?.length) {
            errors.push(`pagina ${label} espone pattern tecnico vietato ${result.page}: ${result.ux.forbiddenRegexHits.join(", ")}`);
        }
        if (result.ux?.forbiddenSelectorHits?.length) {
            errors.push(`pagina ${label} espone elementi UI vietati ${result.page}: ${JSON.stringify(result.ux.forbiddenSelectorHits)}`);
        }
        if (result.ux?.missingAllText?.length) {
            errors.push(`pagina ${label} senza testo UX obbligatorio ${result.page}: ${result.ux.missingAllText.join(", ")}`);
        }
        if (result.ux?.missingAnyText?.length) {
            errors.push(`pagina ${label} senza nessuna CTA attesa ${result.page}: ${result.ux.missingAnyText.join(" | ")}`);
        }
        if (result.ux?.missingClickableAll?.length) {
            errors.push(`pagina ${label} senza pulsanti cliccabili obbligatori ${result.page}: ${result.ux.missingClickableAll.join(", ")}; trovati: ${(result.ux.clickableLabels ?? []).join(" | ")}`);
        }
        if (result.ux?.missingClickableAny?.length) {
            errors.push(`pagina ${label} senza nessun pulsante cliccabile atteso ${result.page}: ${result.ux.missingClickableAny.join(" | ")}; trovati: ${(result.ux.clickableLabels ?? []).join(" | ")}`);
        }
        if (result.problemNotices.length) errors.push(`notice problematica nel live pass ${label} ${result.page}: ${result.problemNotices.join(" | ")}`);
        if (result.newEvents.length) errors.push(`eventi console nel live pass ${label} ${result.page}: ${JSON.stringify(result.newEvents)}`);
        return errors;
    }

    function validateWorkflowState(state, label) {
        const errors = [];
        if (!state) return [`workflow ${label} non eseguito`];
        if (state.missingFiles?.length) errors.push(`workflow ${label}: file attesi mancanti (${state.missingFiles.join(", ")})`);
        if (!state.worldExists) errors.push(`workflow ${label}: mondo non creato`);
        if (state.missingWorldText?.length) errors.push(`workflow ${label}: contenuto mondo incompleto (${state.missingWorldText.join(", ")})`);
        if (state.metadataCategoria !== "mondo") errors.push(`workflow ${label}: metadata categoria non indicizzata come mondo (${state.metadataCategoria})`);
        if (!state.dataviewIndexed) errors.push(`workflow ${label}: Dataview non vede il mondo creato`);
        return errors;
    }

    function validateWorkflowResult(workflow, label) {
        const errors = [];
        if (!workflow) return [`workflow ${label} non eseguito`];
        if (!workflow.bodyHasButtonLabel) errors.push(`workflow ${label}: pulsante Nuovo Mondo non visibile nella pagina setup`);
        if (!workflow.buttonFound) errors.push(`workflow ${label}: template button Meta Bind mancante (${workflowSmoke.button_id})`);
        if (workflow.buttonActionType !== "templaterCreateNote") errors.push(`workflow ${label}: azione Meta Bind inattesa (${workflow.buttonActionType})`);
        if (workflow.buttonTemplateFile !== workflowSmoke.template_file) errors.push(`workflow ${label}: template Meta Bind inatteso (${workflow.buttonTemplateFile})`);
        if (!workflow.templateExists) errors.push(`workflow ${label}: template materializzato mancante (${workflowSmoke.template_file})`);
        if (!workflow.helperExists) errors.push(`workflow ${label}: helper runtime mancante (${workflowSmoke.helper_script})`);
        if (!workflow.userScriptExists) errors.push(`workflow ${label}: user script Templater mancante (${workflowSmoke.user_script})`);
        if (workflow.currentPath !== workflowSmoke.expected_world_path) errors.push(`workflow ${label}: mondo creato nel path inatteso (${workflow.currentPath})`);
        if (!workflow.promptCount || workflow.promptCount < Object.keys(workflowSmoke.prompt_answers ?? {}).length) {
            errors.push(`workflow ${label}: prompt compilati insufficienti (${workflow.promptCount})`);
        }
        errors.push(...validateWorkflowState(workflow.state, label));
        if (workflow.newEvents?.length) errors.push(`workflow ${label}: eventi console durante creazione (${JSON.stringify(workflow.newEvents)})`);
        return errors;
    }

    function validateCycleState(state, label) {
        const errors = [];
        if (!state) return [`ciclo ${label} non eseguito`];
        if (!state.sessionExists) errors.push(`ciclo ${label}: sessione non creata`);
        if (state.sessionPath !== cycleSmoke.expected_session_path) {
            errors.push(`ciclo ${label}: sessione nel path inatteso (${state.sessionPath})`);
        }
        if (state.missingSessionText?.length) {
            errors.push(`ciclo ${label}: contenuto sessione incompleto (${state.missingSessionText.join(", ")})`);
        }
        if (state.metadataCategoria !== "sessione") {
            errors.push(`ciclo ${label}: metadata categoria non indicizzata come sessione (${state.metadataCategoria})`);
        }
        if (state.missingFrontmatter?.length) {
            errors.push(`ciclo ${label}: frontmatter inatteso (${JSON.stringify(state.missingFrontmatter)})`);
        }
        if (state.missingListValues?.length) {
            errors.push(`ciclo ${label}: liste frontmatter incomplete (${JSON.stringify(state.missingListValues)})`);
        }
        if (!state.dataviewIndexed) errors.push(`ciclo ${label}: Dataview non vede la sessione creata`);
        return errors;
    }

    function validateCycleResult(cycle, label) {
        const errors = [];
        if (!cycle) return [`ciclo ${label} non eseguito`];
        if (!cycle.sessionButtonFound) errors.push(`ciclo ${label}: pulsante Nuova Sessione mancante (${cycleSmoke.session_button_id})`);
        if (cycle.sessionButtonActionType !== "templaterCreateNote") errors.push(`ciclo ${label}: azione Nuova Sessione inattesa (${cycle.sessionButtonActionType})`);
        if (cycle.sessionButtonTemplateFile !== cycleSmoke.session_template_file) errors.push(`ciclo ${label}: template Nuova Sessione inatteso (${cycle.sessionButtonTemplateFile})`);
        if (!cycle.postSessionButtonFound) errors.push(`ciclo ${label}: pulsante post-sessione mancante (${cycleSmoke.post_session_button_id})`);
        if (cycle.postSessionButtonActionType !== "runTemplaterFile") errors.push(`ciclo ${label}: azione post-sessione inattesa (${cycle.postSessionButtonActionType})`);
        if (cycle.postSessionButtonTemplateFile !== cycleSmoke.post_session_template_file) errors.push(`ciclo ${label}: template post-sessione inatteso (${cycle.postSessionButtonTemplateFile})`);
        if (!cycle.sessionTemplateExists) errors.push(`ciclo ${label}: template sessione materializzato mancante (${cycleSmoke.session_template_file})`);
        if (!cycle.postSessionTemplateExists) errors.push(`ciclo ${label}: template post-sessione materializzato mancante (${cycleSmoke.post_session_template_file})`);
        if (!cycle.sessionScriptExists) errors.push(`ciclo ${label}: script sessione mancante (${cycleSmoke.session_user_script})`);
        if (!cycle.postSessionScriptExists) errors.push(`ciclo ${label}: script post-sessione mancante (${cycleSmoke.post_session_user_script})`);
        if (cycle.currentPath !== cycleSmoke.expected_session_path) errors.push(`ciclo ${label}: sessione creata nel path inatteso (${cycle.currentPath})`);
        if (!cycle.promptCount || cycle.promptCount < Object.keys(cycleSmoke.prompt_answers ?? {}).length) {
            errors.push(`ciclo ${label}: prompt compilati insufficienti (${cycle.promptCount})`);
        }
        errors.push(...validateCycleState(cycle.state, label));
        if (cycle.newEvents?.length) errors.push(`ciclo ${label}: eventi console durante sessione/post-sessione (${JSON.stringify(cycle.newEvents)})`);
        return errors;
    }

    function validatePersistenceReport(report) {
        const errors = [];
        if (!report?.summary) return ["persistence live pass non disponibile"];
        if (report.summary.missingLoaded?.length) errors.push(`persistence: plugin mancanti (${report.summary.missingLoaded.join(", ")})`);
        errors.push(...validateWorkflowState(report.state, "persistence"));
        if (runCycleSmoke) errors.push(...validateCycleState(report.cycleState, "persistence"));
        for (const result of report.results ?? []) {
            errors.push(...validatePageResult(result, "persistence"));
        }
        if (report.events?.length) errors.push(`persistence: eventi console globali (${JSON.stringify(report.events)})`);
        return errors;
    }

    return {
        validatePersistenceReport,
        validateReport
    };
}

module.exports = {
    createObsidianAcceptanceValidators
};
