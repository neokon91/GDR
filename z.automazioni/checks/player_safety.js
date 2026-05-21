function validatePlayerSafety({
    fileRel,
    frontmatter,
    text,
    publicPrivateFields,
    warnings,
    errors,
    hasAny,
    hasValue,
    hasPrivatePublicText,
    normalizedText
}) {
    const fm = frontmatter;

    if (fileRel.startsWith("Mondi/Sessioni/") && fm.categoria === "sessione" && hasValue(fm.recap_pubblico)) {
        if (hasPrivatePublicText(fm.recap_pubblico)) {
            warnings.push(`${fileRel}: recap_pubblico contiene termini da DM o segreti`);
        }

        const publicRecap = normalizedText(fm.recap_pubblico);
        const dmRecap = normalizedText(fm.recap_dm);
        if (publicRecap && dmRecap && publicRecap === dmRecap) {
            warnings.push(`${fileRel}: recap_pubblico identico a recap_dm`);
        }
    }

    if (fm.pubblico !== true || fileRel.startsWith("Dev/")) return;

    if (hasAny(fm, publicPrivateFields)) {
        errors.push(`${fileRel}: nota pubblica con campi DM evidenti (${publicPrivateFields.filter(field => hasValue(fm[field])).join(", ")})`);
    }
    if (hasPrivatePublicText(fm.player_safe) || hasPrivatePublicText(fm.recap_pubblico) || hasPrivatePublicText(fm.cosa_mostrare)) {
        errors.push(`${fileRel}: testo pubblico/player-safe contiene termini da DM o segreti`);
    }
    if (/\[!segreto\]/i.test(text)) {
        warnings.push(`${fileRel}: nota pubblica con callout segreto`);
    }
}

module.exports = {
    validatePlayerSafety
};
