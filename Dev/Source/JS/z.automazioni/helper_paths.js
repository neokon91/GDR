function loadPathRegistry() {
    let contract;
    try {
        contract = require("./data/runtime/session_context.json");
    } catch (error) {
        throw new Error(`Path registry runtime mancante. Esegui npm run sync:sources. (${error.message})`);
    }

    const registry = contract?.path_registry;
    if (!registry || typeof registry !== "object" || Array.isArray(registry) || !Object.keys(registry).length) {
        throw new Error("Path registry runtime vuota in z.automazioni/data/runtime/session_context.json");
    }

    return Object.freeze(Object.fromEntries(
        Object.entries(registry).map(([key, value]) => [
            key,
            String(value ?? "").replace(/\/+$/, "")
        ])
    ));
}

const PATHS = loadPathRegistry();

function path(key) {
    return PATHS[key] ?? key;
}

module.exports = {
    PATHS,
    path
};
