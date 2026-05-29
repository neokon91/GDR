const REQUIRED_PLUGIN_MATRIX_FIELDS = ["id", "name", "class", "function", "guide", "operational", "smoke"];

function validatePluginControls({
    communityPlugins,
    errors,
    existsRel,
    generatedFiles = new Set(),
    hasValue,
    isGeneratedTemplatePath,
    isVirtualUserPath,
    pluginBindings,
    pluginMatrix,
    requiredPlugins,
    targetPath,
    tasksConfig
}) {
    for (const plugin of requiredPlugins) {
        if (!communityPlugins.includes(plugin)) {
            errors.push(`Plugin obbligatorio non abilitato: ${plugin}`);
        }
    }

    if (communityPlugins.includes("obsidian-tasks-plugin")) {
        if (tasksConfig.globalFilter !== "#task") {
            errors.push("Tasks: globalFilter deve restare #task per evitare task accidentali");
        }
        if (tasksConfig.loggingOptions?.minLevels?.["tasks.Cache"] !== "error") {
            errors.push("Tasks: tasks.Cache deve loggare solo errori per evitare warning sui callout custom");
        }
    }

    const pluginMatrixById = new Map();
    if (!Array.isArray(pluginMatrix)) {
        errors.push("Dev/plugin_matrix.json: root deve essere un array");
    } else {
        for (const entry of pluginMatrix) {
            for (const field of REQUIRED_PLUGIN_MATRIX_FIELDS) {
                if (!hasValue(entry?.[field])) {
                    errors.push(`Dev/plugin_matrix.json: entry plugin senza campo ${field}`);
                }
            }

            if (!entry?.id) continue;
            if (pluginMatrixById.has(entry.id)) {
                errors.push(`Dev/plugin_matrix.json: plugin duplicato ${entry.id}`);
            }
            pluginMatrixById.set(entry.id, entry);

            for (const field of ["guide", "operational", "smoke"]) {
                const target = String(entry[field] ?? "");
                if (!target) continue;
                const targetWithExtension = /\.(md|base|js|json|yaml|yml|excalidraw)$/i.test(target) ? target : targetPath(target);
                if (!existsRel(targetWithExtension)
                    && !generatedFiles.has(targetWithExtension)
                    && !isGeneratedTemplatePath(targetWithExtension)
                    && !isVirtualUserPath(targetWithExtension)) {
                    errors.push(`Dev/plugin_matrix.json: ${entry.id} ${field} mancante ${targetWithExtension}`);
                }
            }
        }
    }

    for (const plugin of communityPlugins) {
        if (!pluginMatrixById.has(plugin)) {
            errors.push(`Plugin matrix: plugin abilitato non mappato ${plugin}`);
        }
    }

    const bindings = pluginBindings?.bindings ?? {};
    const boundPluginIds = new Set(
        Object.values(bindings)
            .map(binding => binding?.plugin_id)
            .filter(Boolean)
    );
    for (const plugin of communityPlugins) {
        if (!boundPluginIds.has(plugin)) {
            errors.push(`Plugin bindings: plugin abilitato senza binding tecnico (${plugin})`);
        }
    }

    for (const [bindingName, binding] of Object.entries(bindings)) {
        const pluginId = binding?.plugin_id;
        if (pluginId && !communityPlugins.includes(pluginId)) {
            errors.push(`Plugin bindings: ${bindingName} punta a plugin non abilitato (${pluginId})`);
        }
    }
}

module.exports = {
    validatePluginControls
};
