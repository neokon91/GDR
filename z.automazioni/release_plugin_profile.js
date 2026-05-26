const { readJson, repoPath } = require("./node_utils");

function asList(value) {
    return Array.isArray(value) ? value.map(item => String(item)) : [];
}

function pluginTier(entry) {
    return String(entry?.class ?? "").split(/\s+/, 1)[0].toLowerCase();
}

function releasePluginProfile(root, releaseBoundary) {
    const matrix = readJson(repoPath(root, "Dev/plugin_matrix.json"), []);
    const profile = releaseBoundary.release_plugin_profile;
    if (!Array.isArray(matrix) || matrix.length === 0) {
        throw new Error("Dev/plugin_matrix.json non dichiara plugin per il profilo release");
    }
    if (!profile || typeof profile !== "object" || Object.keys(profile).length === 0) {
        throw new Error("release_boundary.release_plugin_profile non dichiarato");
    }

    const matrixIds = new Set(matrix.map(entry => entry.id));
    const enabledClasses = new Set(asList(profile.enabled_classes));
    const enabledOptionalPlugins = new Set(asList(profile.enabled_optional_plugins));
    const excludedClasses = new Set(asList(profile.excluded_classes));
    const excludedPlugins = new Set([
        ...asList(profile.excluded_plugins),
        ...asList(profile.excluded_optional_plugins)
    ]);
    const declaredIds = [...enabledOptionalPlugins, ...excludedPlugins];
    const unknownIds = declaredIds.filter(id => !matrixIds.has(id));
    if (enabledClasses.size === 0 && enabledOptionalPlugins.size === 0) {
        throw new Error("release_plugin_profile non abilita classi o plugin");
    }
    if (unknownIds.length) {
        throw new Error(`release_plugin_profile contiene plugin non presenti nella matrice: ${unknownIds.join(", ")}`);
    }

    const enabledPlugins = matrix
        .filter(entry => {
            const tier = pluginTier(entry);
            if (excludedClasses.has(tier) || excludedPlugins.has(entry.id)) return false;
            return enabledClasses.has(tier) || enabledOptionalPlugins.has(entry.id);
        })
        .map(entry => entry.id);
    if (enabledPlugins.length === 0) {
        throw new Error("release_plugin_profile produce una lista plugin vuota");
    }

    return {
        enabledPlugins,
        enabledPluginSet: new Set(enabledPlugins),
        excludedPlugins,
        matrix
    };
}

module.exports = {
    releasePluginProfile
};
