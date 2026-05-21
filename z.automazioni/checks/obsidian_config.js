function validateObsidianConfig({
    errors,
    existsRel,
    iconConfig,
    isGeneratedTemplatePath,
    markdownFiles,
    markdownText,
    metadataMenuConfig,
    rel,
    requiredMetadataMenuPresets,
    workspace
}) {
    if (metadataMenuConfig) {
        const presetNames = new Set((metadataMenuConfig.presetFields ?? []).map(field => field?.name).filter(Boolean));

        for (const name of requiredMetadataMenuPresets) {
            if (!presetNames.has(name)) {
                errors.push(`Metadata Menu: preset field operativo mancante (${name})`);
            }
        }
    }

    const operationalViewRoots = /^(z\.modelli|Hub|Risorse|Mondi)\//;
    for (const file of markdownFiles.filter(file => operationalViewRoots.test(rel(file)))) {
        const fileRel = rel(file);
        const text = markdownText(file);
        if (text.includes('z.automazioni/session_context.js')) {
            errors.push(`${fileRel}: vista operativa punta a session_context.js; usare z.engine/session_views.js`);
        }
    }

    if (iconConfig) {
        for (const key of Object.keys(iconConfig)) {
            if (key === "settings") continue;
            if (isGeneratedTemplatePath(key)) continue;
            if (!existsRel(key) && !existsRel(`${key}.md`)) {
                errors.push(`Iconize punta a un percorso mancante: ${key}`);
            }
        }
    }

    if (workspace) {
        const serialized = JSON.stringify(workspace);
        const stalePaths = ["Bestiario/Prova.md", "\"Mondo/"];
        for (const stalePath of stalePaths) {
            if (serialized.includes(stalePath)) {
                errors.push(`Configurazione Obsidian contiene percorso obsoleto: ${stalePath}`);
            }
        }
    }
}

module.exports = {
    validateObsidianConfig
};
