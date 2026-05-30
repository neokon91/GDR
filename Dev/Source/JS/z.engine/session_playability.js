// Kernel condiviso per i gate di giocabilita usati dalle viste operative.
ctx => {
  const { hasText } = ctx;

  const PLAYABILITY_GATES = ["tavolo", "movimento", "conseguenza", "collegamento"];
  const PLAYABILITY_GATE_LABELS = {
    tavolo: "tavolo",
    movimento: "movimento",
    conseguenza: "conseguenza",
    collegamento: "collegamento"
  };

  const FIELD_GROUPS = {
    tavolo: ["uso_al_tavolo", "promessa_al_tavolo", "scene", "scena", "gancio", "posta", "obiettivo", "obiettivo_giocabile", "indizi", "missioni"],
    movimento: ["prossima_mossa", "mosse", "innesco", "avanza_se", "tracciati", "clock"],
    conseguenza: ["conseguenza", "conseguenze", "conseguenze_se_bloccata", "effetti", "impatto", "propaga_a", "entita_impattate", "cambiamenti_quotidiani", "cosa_cambia"]
  };

  const PROFILE_ACTIONS = {
    worldbuilder: {
      tavolo: "Manuale: compila uso_al_tavolo, scena o posta. Pulsante: Nuova missione o Nuovo incontro.",
      movimento: "Manuale: compila prossima_mossa o pressione. Pulsante: Motore mondo vivo o Nuovo clock.",
      conseguenza: "Manuale: compila conseguenze, propaga_a o entita_impattate. Workflow: Post Sessione Guidato o Controllo vault.",
      collegamento: "Manuale: collega mondo, luogo, fazione, missione o conseguenza. Superficie: Codex editabile o Nuova relazione."
    },
    vault: {
      tavolo: "Manuale: compila uso_al_tavolo, scena o posta. Workflow: Worldbuilder, Preparazione sessione o Materiali al tavolo.",
      movimento: "Manuale: compila prossima_mossa o pressione. Workflow: Motore mondo vivo o Task DM.",
      conseguenza: "Manuale: compila conseguenze, propaga_a o entita_impattate. Workflow: Post Sessione Guidato.",
      collegamento: "Manuale: collega mondo, luogo, fazione, missione o conseguenza. Workflow: Worldbuilder o Codex tabellare."
    }
  };

  const PROFILE_CONFIGS = {
    worldbuilder: {
      actions: "worldbuilder",
      exclude: new Set(["mondo", "dashboard", "sessione", "risorsa"]),
      live: new Set([
        "luogo", "fazione", "religione", "culto", "personaggio", "png", "missione", "conflitto",
        "relazione", "rotta", "mercato", "tracciato", "clock", "incontro", "creatura", "risorsa",
        "cultura", "lingua", "evento storico", "cosmologia", "segreto", "mistero"
      ]),
      moving: new Set([
        "fazione", "religione", "culto", "personaggio", "png", "missione", "conflitto",
        "relazione", "rotta", "mercato", "tracciato", "clock"
      ]),
      consequence: new Set([
        "luogo", "fazione", "religione", "culto", "personaggio", "png", "missione", "conflitto",
        "relazione", "rotta", "mercato", "tracciato", "clock", "incontro", "evento storico", "cosmologia"
      ]),
      folderPrefix: "Mondi/"
    },
    worldbuildingControl: {
      actions: "worldbuilder",
      exclude: new Set(["mondo", "dashboard", "sessione", "risorsa", "compendium", "dispensa", "mappa"]),
      live: new Set([
        "luogo", "fazione", "religione", "culto", "personaggio", "png", "missione", "conflitto",
        "relazione", "rotta", "mercato", "tracciato", "clock", "incontro", "creatura",
        "cultura", "lingua", "evento storico", "cosmologia", "segreto", "mistero"
      ]),
      moving: new Set([
        "fazione", "religione", "culto", "personaggio", "png", "missione", "conflitto",
        "relazione", "rotta", "mercato", "tracciato", "clock"
      ]),
      consequence: new Set([
        "luogo", "fazione", "religione", "culto", "personaggio", "png", "missione", "conflitto",
        "relazione", "rotta", "mercato", "tracciato", "clock", "incontro", "evento storico", "cosmologia"
      ]),
      folderPrefix: "Mondi/"
    },
    vault: {
      actions: "vault",
      moving: new Set(["fazione", "culto", "religione", "png", "personaggio", "missione", "conflitto", "relazione", "rotta", "tracciato", "clock"]),
      consequence: new Set(["luogo", "fazione", "culto", "religione", "png", "personaggio", "missione", "conflitto", "relazione", "rotta", "tracciato", "clock", "incontro"])
    }
  };

  function normalizePlayabilityKind(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function defaultHasValue(value) {
    if (Array.isArray(value)) return value.filter(Boolean).length > 0;
    if (typeof value === "boolean") return value === true;
    if (typeof value === "number") return Number.isFinite(value) && value !== 0;
    return hasText(value);
  }

  function positiveNumber(page, fields) {
    return fields.some(field => Number(page?.[field] ?? 0) > 0);
  }

  function playabilityProfile(profile) {
    return PROFILE_CONFIGS[profile] ?? PROFILE_CONFIGS.worldbuilder;
  }

  function playabilityAction(gate, profile = "worldbuilder") {
    const actionProfile = playabilityProfile(profile).actions ?? profile;
    return PROFILE_ACTIONS[actionProfile]?.[gate] ?? PROFILE_ACTIONS.worldbuilder[gate] ?? "";
  }

  function playabilityIsCandidate(category, profile = "worldbuilder", options = {}) {
    const config = playabilityProfile(profile);
    const kind = normalizePlayabilityKind(category);
    if (config.exclude?.has(kind)) return false;
    if (config.live?.has(kind)) return true;
    return Boolean(config.folderPrefix && String(options.folder ?? "").startsWith(config.folderPrefix));
  }

  function playabilityRequiredGates(category, profile = "worldbuilder") {
    const config = playabilityProfile(profile);
    const kind = normalizePlayabilityKind(category);
    const gates = ["tavolo", "collegamento"];
    if (config.moving?.has(kind)) gates.splice(1, 0, "movimento");
    if (config.consequence?.has(kind)) gates.splice(gates.length - 1, 0, "conseguenza");
    return gates;
  }

  function playabilityGateCoverage(page, options = {}) {
    const hasValue = options.hasValue ?? defaultHasValue;
    return {
      tavolo: FIELD_GROUPS.tavolo.some(field => hasValue(page?.[field])),
      movimento: FIELD_GROUPS.movimento.some(field => hasValue(page?.[field])) || positiveNumber(page, ["pressione", "pericolo"]),
      conseguenza: FIELD_GROUPS.conseguenza.some(field => hasValue(page?.[field])),
      collegamento: Number(options.links ?? 0) >= 2
    };
  }

  function playabilityIssue(options = {}) {
    const {
      page,
      category,
      profile = "worldbuilder",
      links = 0,
      hasValue,
      folder,
      candidate,
      priorityBase = 6
    } = options;

    const kind = normalizePlayabilityKind(category);
    if (candidate !== true && !playabilityIsCandidate(kind, profile, { folder })) return null;

    const coverage = playabilityGateCoverage(page, { links, hasValue });
    const missingGates = playabilityRequiredGates(kind, profile).filter(gate => !coverage[gate]);
    if (!missingGates.length) return null;

    const missingLabel = missingGates.map(gate => PLAYABILITY_GATE_LABELS[gate] ?? gate).join(", ");
    const workflow = [...new Set(missingGates.map(gate => playabilityAction(gate, profile)))].join(" | ");
    return {
      page,
      problem: `mancano: ${missingLabel}`,
      missingLabel,
      missingGates,
      action: playabilityAction(missingGates[0], profile),
      workflow,
      priority: priorityBase + missingGates.length
    };
  }

  function playabilityGateCounts(rows) {
    return PLAYABILITY_GATES.reduce((counts, gate) => {
      counts[gate] = rows.filter(row => row.missingGates?.includes(gate)).length;
      return counts;
    }, {});
  }

  return {
    PLAYABILITY_GATES,
    PLAYABILITY_GATE_LABELS,
    normalizePlayabilityKind,
    playabilityAction,
    playabilityGateCounts,
    playabilityGateCoverage,
    playabilityIsCandidate,
    playabilityIssue,
    playabilityRequiredGates
  };
}
