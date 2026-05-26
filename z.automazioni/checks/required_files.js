function validateRequiredFiles({
    errors,
    existsRel,
    generatedFiles = new Set(),
    generatedVaultRoots = new Set(),
    requiredBaseFiles,
    requiredFiles,
    requiredLayerFiles
}) {
    const existsOrGenerated = file => {
        if (existsRel(file)) return true;
        const top = String(file).replace(/\\/g, "/").split("/", 1)[0];
        return generatedVaultRoots.has(top) && generatedFiles.has(String(file).replace(/\\/g, "/"));
    };

    for (const file of requiredFiles) {
        if (!existsOrGenerated(file)) {
            errors.push(`File release/onboarding obbligatorio mancante: ${file}`);
        }
    }

    for (const file of requiredBaseFiles) {
        if (!existsOrGenerated(file)) {
            errors.push(`Base operativa mancante: ${file}`);
        }
    }

    for (const file of requiredLayerFiles) {
        if (!existsOrGenerated(file)) {
            errors.push(`Plugin layer interno: file obbligatorio mancante ${file}`);
        }
    }
}

module.exports = {
    validateRequiredFiles
};
