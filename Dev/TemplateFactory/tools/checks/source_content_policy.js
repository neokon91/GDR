function validateSourceContentPolicy({ errors, readRel }) {
    const playerViewText = readRel("Hub/Vista Giocatori.md");
    if (!playerViewText.includes("renderPlayerPortalStatus") || !playerViewText.includes("renderPublicSafety")) {
        errors.push("Vista Giocatori non espone stato portale e controllo sicurezza");
    }

    const metaActionsText = readRel("z.automazioni/meta_actions.js");
    const recapActionMatch = metaActionsText.match(/if \(action === "prepara_recap_pubblico"\) \{[\s\S]*?notice\("Recap pubblico preparato\."\);/);
    if (!recapActionMatch) {
        errors.push("meta_actions.js: azione prepara_recap_pubblico mancante o non verificabile");
    } else if (/fm\.pubblico\s*=\s*true/.test(recapActionMatch[0])) {
        errors.push("meta_actions.js: prepara_recap_pubblico non deve marcare pubblica la nota sessione");
    }

    return {
        metaActionsText
    };
}

module.exports = {
    validateSourceContentPolicy
};
