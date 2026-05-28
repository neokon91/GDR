const WORLD_TAXONOMY = require("./data/runtime/session_context.json").world_taxonomy ?? {};
const TAXONOMY = WORLD_TAXONOMY.kinds ?? {};
const TEMPLATE_ROUTES = WORLD_TAXONOMY.template_routes ?? {};

function getTaxonomy(kind) {
    return TAXONOMY[kind] ?? null;
}

function getAllKinds() {
    return Object.keys(TAXONOMY);
}

function conditionMatches(route, conditions = {}, mode = "match") {
    return Object.entries(conditions).every(([key, expected]) => {
        const value = String(route?.[key] ?? "");
        const target = String(expected ?? "");
        return mode === "contains" ? value.includes(target) : value === target;
    });
}

function ruleMatches(route, rule = {}) {
    if (rule.match && !conditionMatches(route, rule.match, "match")) return false;
    if (rule.contains && !conditionMatches(route, rule.contains, "contains")) return false;
    return Boolean(rule.match || rule.contains);
}

function getCreativeTemplate(route = {}) {
    const routeSpec = TEMPLATE_ROUTES.by_kind?.[route.kind] ?? {};
    const rule = (routeSpec.rules ?? []).find(candidate => ruleMatches(route, candidate));
    return rule?.template
        ?? routeSpec.default_template
        ?? TEMPLATE_ROUTES.default_template;
}

function getLocationTemplate(category, subtype) {
    return getCreativeTemplate({ kind: "luogo", category, subtype });
}

module.exports = {
    TAXONOMY,
    TEMPLATE_ROUTES,
    getAllKinds,
    getCreativeTemplate,
    getLocationTemplate,
    getTaxonomy
};
