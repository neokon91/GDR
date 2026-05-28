const VALID_STATES = new Set(["aperta", "applicata", "propagata", "da verificare", "canonizzata", "archiviata"]);
const VALID_VISIBILITY = new Set(["dm", "player_safe", "pubblica"]);

function normalizeFieldArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value === null || value === undefined) return [];
    const text = String(value).trim();
    return text ? [text] : [];
}

function appendUnique(value, entry) {
    const entries = normalizeFieldArray(value);
    if (!entry || entries.includes(entry)) return entries;
    return [...entries, entry];
}

function appendUniqueMany(value, entries) {
    return normalizeFieldArray(entries).reduce((acc, entry) => appendUnique(acc, entry), value);
}

function pathFromLink(value) {
    const raw = String(value ?? "").trim();
    const wiki = raw.match(/^\[\[([^\]]+)\]\]$/);
    const target = (wiki ? wiki[1] : raw).split("|")[0].split("#")[0].trim();
    if (!target) return "";
    return /\.[A-Za-z0-9]+$/.test(target) ? target : `${target}.md`;
}

function linkFromPath(value) {
    const path = String(value ?? "").replace(/\\/g, "/").trim();
    if (!path) return "";
    return `[[${path.replace(/\.md$/, "")}]]`;
}

function normalizeContinuityTarget(target) {
    if (target && typeof target === "object" && !Array.isArray(target)) {
        const link = String(target.link ?? target.wikilink ?? "").trim()
            || (target.key ? linkFromPath(target.key) : "");
        const key = String(target.key ?? target.path ?? "").trim()
            || pathFromLink(link);
        return { key, link };
    }

    const link = String(target ?? "").trim();
    return { key: pathFromLink(link), link };
}

function normalizeContinuityTargets(targets) {
    return normalizeFieldArray(targets)
        .map(normalizeContinuityTarget)
        .filter(target => target.key || target.link);
}

function numericDelta(value, fallback = 0) {
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number) ? number : fallback;
}

function slug(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

function buildContinuityEvent(options = {}) {
    const date = String(options.today ?? options.date ?? "").trim();
    const sourceKey = String(options.sourceKey ?? options.source?.key ?? "").trim();
    const sourceLink = String(options.sourceLink ?? options.source?.link ?? "").trim()
        || (sourceKey ? linkFromPath(sourceKey) : "");
    const cause = String(options.choice ?? options.cause ?? "").trim();
    const consequence = String(options.consequenceText ?? options.consequence ?? "").trim();
    const nextMove = String(options.nextMove ?? options.next_move ?? "").trim();
    const state = VALID_STATES.has(options.state) ? options.state : "aperta";
    const visibility = VALID_VISIBILITY.has(options.visibility) ? options.visibility : "dm";
    const targets = normalizeContinuityTargets(options.targets ?? []);
    const id = [
        date,
        slug(sourceKey.split("/").pop()?.replace(/\.md$/, "")),
        slug(cause || consequence || nextMove || "continuita")
    ].filter(Boolean).join("-");

    return {
        id,
        date,
        source: {
            key: sourceKey,
            link: sourceLink
        },
        cause,
        consequence,
        targets,
        state,
        visibility,
        next_move: nextMove,
        pressure_delta: numericDelta(options.pressureDelta ?? options.pressure_delta, 0),
        track_step: numericDelta(options.trackStep ?? options.track_step, 0),
        mode: options.mode === "propagazione" ? "propagazione" : "conseguenza"
    };
}

function continuityEventImpact(event) {
    return event.consequence || event.cause;
}

function continuityEventEntry(event) {
    return [
        event.date,
        event.cause ? `scelta: ${event.cause}` : "",
        event.consequence ? `conseguenza: ${event.consequence}` : "",
        event.targets.length ? `bersagli: ${event.targets.map(target => target.link || target.key).join(", ")}` : "",
        event.next_move ? `prossima mossa: ${event.next_move}` : ""
    ].filter(Boolean).join(" | ");
}

function continuityEventUpdateText(event) {
    const impact = continuityEventImpact(event);
    return [
        event.date,
        event.source.link,
        impact ? `impatto: ${impact}` : "",
        event.next_move ? `prossima mossa: ${event.next_move}` : ""
    ].filter(Boolean).join(" | ");
}

function validateContinuityEvent(event) {
    const errors = [];
    if (!event?.date) errors.push("date mancante");
    if (!event?.source?.key && !event?.source?.link) errors.push("source mancante");
    if (!event?.cause && !event?.consequence) errors.push("cause/consequence mancante");
    if (!event?.targets?.length) errors.push("targets mancanti");
    if (!VALID_STATES.has(event?.state)) errors.push(`state non valido (${event?.state})`);
    if (!VALID_VISIBILITY.has(event?.visibility)) errors.push(`visibility non valida (${event?.visibility})`);
    return errors;
}

function applyContinuityEventToTarget(target, event, targetRef = {}) {
    if (!target) return false;

    const sourceLink = event.source.link;
    const impact = continuityEventImpact(event);
    target.propagato_da = appendUnique(target.propagato_da, sourceLink);
    target.propagazione_stato = "da verificare";
    target.ultima_propagazione = event.date;
    target.aggiornamenti_richiesti = appendUnique(
        target.aggiornamenti_richiesti,
        continuityEventUpdateText(event)
    );

    if (event.mode === "conseguenza") {
        target.conseguenze = appendUnique(target.conseguenze, sourceLink);
    } else {
        target.connessioni = appendUnique(target.connessioni, sourceLink);
    }

    if (impact) {
        target.impatto = appendUnique(target.impatto, impact);
        if (String(target.categoria ?? "") === "tracciato" && !target.innesco) {
            target.innesco = impact;
        }
    }

    if (event.next_move && !target.prossima_mossa) {
        target.prossima_mossa = event.next_move;
    }

    if (event.pressure_delta !== 0) {
        const currentPressure = Number.parseInt(target.pressione ?? 0, 10) || 0;
        target.pressione = Math.max(0, currentPressure + event.pressure_delta);
    }

    if (event.track_step !== 0 && String(target.categoria ?? "") === "tracciato") {
        const currentProgress = Number.parseInt(target.progress_value ?? 0, 10) || 0;
        const maxProgress = Number.parseInt(target.progress_max ?? 0, 10) || 0;
        target.progress_value = Math.max(0, currentProgress + event.track_step);
        target.avanzato_il = event.date;
        if (maxProgress > 0 && target.progress_value >= maxProgress && target.stato !== "archiviata") {
            target.stato = "completato";
        }
    }

    if (targetRef.link && String(target.categoria ?? "") === "relazione") {
        target.relazioni = appendUnique(target.relazioni, targetRef.link);
    }

    return true;
}

function applyContinuityEventToSource(source, event) {
    if (!source) return false;

    const targetLinks = event.targets.map(target => target.link || target.key).filter(Boolean);
    const impact = continuityEventImpact(event);
    source.decisioni_prese = appendUnique(source.decisioni_prese, event.cause);
    source.output_sessione = appendUnique(source.output_sessione, continuityEventEntry(event));
    source.conseguenze = appendUnique(source.conseguenze, impact);
    source.entita_impattate = appendUniqueMany(source.entita_impattate, targetLinks);
    source.applicata_a = appendUniqueMany(source.applicata_a, targetLinks);
    source.propagazione_stato = "applicata";
    source.ultima_propagazione = event.date;
    if (event.next_move && !source.prossima_mossa) source.prossima_mossa = event.next_move;
    return true;
}

module.exports = {
    applyContinuityEventToSource,
    applyContinuityEventToTarget,
    appendUnique,
    appendUniqueMany,
    buildContinuityEvent,
    continuityEventEntry,
    continuityEventImpact,
    continuityEventUpdateText,
    linkFromPath,
    normalizeContinuityTarget,
    normalizeContinuityTargets,
    normalizeFieldArray,
    pathFromLink,
    validateContinuityEvent
};
