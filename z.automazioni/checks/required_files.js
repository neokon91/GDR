function validateRequiredFiles({
    errors,
    existsRel,
    requiredBaseFiles,
    requiredFiles,
    requiredLayerFiles
}) {
    for (const file of requiredFiles) {
        if (!existsRel(file)) {
            errors.push(`File release/onboarding obbligatorio mancante: ${file}`);
        }
    }

    for (const file of requiredBaseFiles) {
        if (!existsRel(file)) {
            errors.push(`Base operativa mancante: ${file}`);
        }
    }

    for (const file of requiredLayerFiles) {
        if (!existsRel(file)) {
            errors.push(`Plugin layer interno: file obbligatorio mancante ${file}`);
        }
    }
}

module.exports = {
    validateRequiredFiles
};
