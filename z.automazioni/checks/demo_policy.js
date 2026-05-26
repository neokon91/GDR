const FORBIDDEN_MANUAL_DEMO_FILES = [
    "Mondi/[Demo] Regno di Prova.md",
    "Mondi/Brumafonda Demo.md",
    "Campagne/Sale Sotto La Nebbia/Sale Sotto La Nebbia.md",
    "Mondi/Culture/Custodi Delle Saline.md",
    "Mondi/Fazioni/Consorzio Del Sale Nero.md",
    "Mondi/Religioni/Culto Della Lanterna Bassa.md",
    "Mondi/Luoghi/Porto Di Brumafonda.md",
    "Mondi/Mercati/Mercato Del Sale Nero.md",
    "Risorse/Mappe/Mappa Pubblica Di Brumafonda.md",
    "Mondi/Dispense/Avviso Della Dogana Di Brumafonda.md",
    "Mondi/Missioni/Recuperare La Campana Sommersa.md",
    "Mondi/Sessioni/2026-05-28 - La Campana Nella Nebbia.md",
    "Mondi/Timeline/La Marea Ha Preso Il Faro Vecchio.md"
];

function validateDemoPolicy({ errors, markdownMeta, readRel }) {
    for (const fileRel of FORBIDDEN_MANUAL_DEMO_FILES) {
        if (markdownMeta.has(fileRel)) {
            errors.push(`Demo sorgente vietata: ${fileRel}. La demo va generata da script solo a fine ciclo.`);
        }
    }

    const playerViewText = readRel("Hub/Vista Giocatori.md");
    if (!playerViewText.includes("renderPlayerPortalStatus") || !playerViewText.includes("renderPublicSafety")) {
        errors.push("Demo finale: Vista Giocatori non espone stato portale e controllo sicurezza");
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
    validateDemoPolicy
};
