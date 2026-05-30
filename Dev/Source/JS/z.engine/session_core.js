(async () => {
  async function readJsonRel(relPath) {
    if (typeof app !== "undefined" && app?.vault?.adapter?.read) {
      return JSON.parse(await app.vault.adapter.read(relPath));
    }
    if (typeof require === "function") {
      const fs = require("fs");
      return JSON.parse(fs.readFileSync(relPath, "utf8"));
    }
    throw new Error(`Impossibile leggere ${relPath}`);
  }

  function requireContractArray(contract, key) {
    const values = Array.isArray(contract?.[key])
      ? contract[key].map(value => String(value).trim()).filter(Boolean)
      : [];
    if (!values.length) {
      throw new Error(`session_core runtime contract senza ${key}`);
    }
    return values;
  }

  const SESSION_CONTEXT_CONTRACT = await readJsonRel("z.automazioni/data/runtime/session_context.json");
  const ACTIVE_STATES = requireContractArray(SESSION_CONTEXT_CONTRACT, "active_states");
  const PLAY_STATES = requireContractArray(SESSION_CONTEXT_CONTRACT, "play_states");
  const CLOSED_STATES = requireContractArray(SESSION_CONTEXT_CONTRACT, "closed_states");

  const asArray = value => Array.isArray(value) ? value : value ? [value] : [];
  const hasText = value => String(value ?? "").trim().length > 0;
  const hasLinks = value => asArray(value).length > 0;
  const isReal = page => Boolean(page);

  function activeSession(dv) {
    const explicit = dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && p.attiva === true)
      .sort(p => p.data ?? "0000-00-00", "desc")
      .first();

    if (explicit) {
      return explicit;
    }

    return dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && ACTIVE_STATES.includes(p.stato))
      .sort(p => p.data ?? "0000-00-00", "desc")
      .first();
  }

  function activeSessions(dv) {
    return dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && p.attiva === true)
      .sort(p => p.data ?? "0000-00-00", "desc");
  }

  function sessionCandidates(dv) {
    return dv.pages('"Mondi/Sessioni"')
      .where(p => isReal(p) && (p.attiva === true || PLAY_STATES.includes(p.stato)))
      .sort(p => (p.attiva === true ? "1" : "0") + "-" + (p.data ?? "0000-00-00"), "desc");
  }

  function pressure(page) {
    return Number(page?.pressione ?? page?.pericolo ?? 0) || 0;
  }

  function hasPrivateFields(page) {
    return hasLinks(page?.segreti)
      || hasText(page?.segreto)
      || hasText(page?.verita_nascosta)
      || hasText(page?.prossima_mossa)
      || hasLinks(page?.segreti_rivelabili)
      || hasLinks(page?.pressioni);
  }

  function publicCandidate(page, category) {
    if (!isReal(page) || page?.stato === "archiviata") return false;
    if (category === "missione") {
      return (page?.pubblico === true || ["accettata", "in corso", "completata"].includes(page?.stato))
        && (hasText(page?.player_safe) || hasText(page?.recap_pubblico));
    }
    if (category === "personaggio" || category === "luogo") {
      return (page?.pubblico === true || page?.stato === "in gioco") && hasText(page?.player_safe);
    }
    if (category === "dispensa") return page?.stato === "consegnato";
    if (category === "mappa") return page?.pubblico === true;
    if (category === "sessione") return page?.pubblico === true || page?.stato === "giocata";
    if (category === "tracciato") return page?.pubblico === true;
    if (page?.pubblico === true) return true;
    return false;
  }

  return {
    ACTIVE_STATES,
    CLOSED_STATES,
    PLAY_STATES,
    activeSession,
    activeSessions,
    hasPrivateFields,
    pressure,
    publicCandidate,
    sessionCandidates
  };
})()
