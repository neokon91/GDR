const fs = require("fs");

const REQUIRED_PLUGIN_MATRIX_FIELDS = ["id", "name", "class", "function", "guide", "operational", "smoke"];

function validatePluginControls({
    communityPlugins,
    errors,
    existsRel,
    hasValue,
    isGeneratedTemplatePath,
    pluginMatrix,
    repoPath,
    requiredPlugins,
    targetPath,
    tasksConfig
}) {
    for (const plugin of requiredPlugins) {
        if (!communityPlugins.includes(plugin)) {
            errors.push(`Plugin obbligatorio non abilitato: ${plugin}`);
        }

        if (!fs.existsSync(repoPath(".obsidian/plugins", plugin, "manifest.json"))) {
            errors.push(`Plugin obbligatorio non incluso: ${plugin}`);
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

    const hexCartographerMain = repoPath(".obsidian/plugins/hex-cartographer/main.js");
    if (communityPlugins.includes("hex-cartographer") && fs.existsSync(hexCartographerMain)) {
        const hexSource = fs.readFileSync(hexCartographerMain, "utf8");
        if (!hexSource.includes("const activeFilePath = leaf.view.file.path")) {
            errors.push("Hex Cartographer: manca patch difensiva activeFilePath su active-leaf-change");
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
                const targetWithExtension = /\.(md|base|js|json|excalidraw)$/i.test(target) ? target : targetPath(target);
                if (!existsRel(targetWithExtension) && !isGeneratedTemplatePath(targetWithExtension)) {
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
}

module.exports = {
    validatePluginControls
};
