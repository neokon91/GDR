const { PATHS, path } = require("./helper_paths");
const promptHelpers = require("./helper_prompts");
const yamlHelpers = require("./helper_yaml");
const { createNoteHelpers } = require("./helper_notes");

let pendingRoute = {};

const noteHelpers = createNoteHelpers({
    DONE_VALUE: promptHelpers.DONE_VALUE,
    MANUAL_VALUE: promptHelpers.MANUAL_VALUE,
    PATHS,
    SKIP_VALUE: promptHelpers.SKIP_VALUE,
    abortCreation: promptHelpers.abortCreation,
    isCancelled: promptHelpers.isCancelled,
    normalizeText: yamlHelpers.normalizeText,
    promptOptional: promptHelpers.promptOptional
});

async function chooseProfileOption(tp, profile, route = {}) {
    const routeKey = profile.type_route_key;
    const routeType = routeKey ? route[routeKey] : "";

    if (routeType) {
        return { id: routeType };
    }

    return await promptHelpers.chooseOptional(tp, profile.type_options ?? [], profile.type_prompt ?? "Tipo");
}

function setRoute(route = {}) {
    pendingRoute = { ...route };
    return pendingRoute;
}

function consumeRoute() {
    const route = { ...pendingRoute };
    pendingRoute = {};
    return route;
}

async function promptWikilinkTargets(tp, message, defaultValue = "") {
    const raw = await promptHelpers.promptOptional(tp, message, defaultValue);
    return yamlHelpers.splitListInput(raw).map(yamlHelpers.normalizeWikilinkTarget).filter(Boolean);
}

module.exports = {
    path,
    runtimeProfile: yamlHelpers.runtimeProfile,
    frontmatterProfile: yamlHelpers.frontmatterProfile,
    chooseProfileOption,
    renderFrontmatter: yamlHelpers.renderFrontmatter,
    mergeFrontmatterNested: yamlHelpers.mergeFrontmatterNested,
    renderYamlObject: yamlHelpers.renderYamlObject,
    setRoute,
    consumeRoute,
    abortCreation: promptHelpers.abortCreation,
    promptRequired: promptHelpers.promptRequired,
    promptOptional: promptHelpers.promptOptional,
    chooseRequired: promptHelpers.chooseRequired,
    chooseOptional: promptHelpers.chooseOptional,
    askYesNo: promptHelpers.askYesNo,
    collectNamedDescriptions: promptHelpers.collectNamedDescriptions,
    inlineYamlArray: yamlHelpers.inlineYamlArray,
    inlineYamlList: yamlHelpers.inlineYamlList,
    inlineYamlWikilinkList: yamlHelpers.inlineYamlWikilinkList,
    inlineYamlTextList: yamlHelpers.inlineYamlTextList,
    promptWikilinkTargets,
    referenceFields: yamlHelpers.referenceFields,
    yamlNumber: yamlHelpers.yamlNumber,
    parseAbilityScores: yamlHelpers.parseAbilityScores,
    abilityArray: yamlHelpers.abilityArray,
    yamlQuote: yamlHelpers.yamlQuote,
    slugify: yamlHelpers.slugify,
    normalizeText: yamlHelpers.normalizeText,
    getLinkTargetName: noteHelpers.getLinkTargetName,
    getFileFromLink: noteHelpers.getFileFromLink,
    getFileByPathOrBasename: noteHelpers.getFileByPathOrBasename,
    getWorldFromLink: noteHelpers.getWorldFromLink,
    normalizeFieldArray: noteHelpers.normalizeFieldArray,
    getActiveSessionFile: noteHelpers.getActiveSessionFile,
    getActiveSessionContext: noteHelpers.getActiveSessionContext,
    processFrontmatter: noteHelpers.processFrontmatter,
    appendUniqueLink: noteHelpers.appendUniqueLink,
    linkCreatedNoteToActiveSession: noteHelpers.linkCreatedNoteToActiveSession,
    fileLink: noteHelpers.fileLink,
    getMarkdownFilesByFrontmatter: noteHelpers.getMarkdownFilesByFrontmatter,
    getMarkdownFilesInPath: noteHelpers.getMarkdownFilesInPath,
    getMarkdownFilesInPaths: noteHelpers.getMarkdownFilesInPaths,
    chooseNoteFromFiles: noteHelpers.chooseNoteFromFiles,
    chooseNoteByPath: noteHelpers.chooseNoteByPath,
    chooseNoteByFrontmatter: noteHelpers.chooseNoteByFrontmatter,
    chooseNotesFromFiles: noteHelpers.chooseNotesFromFiles,
    chooseNotesByPath: noteHelpers.chooseNotesByPath,
    chooseConnections: noteHelpers.chooseConnections,
    chooseCoreConnection: noteHelpers.chooseCoreConnection,
    ensureFolder: noteHelpers.ensureFolder,
    moveNote: noteHelpers.moveNote,
    linkCreatedNoteToConnections: noteHelpers.linkCreatedNoteToConnections,
    chooseWorld: noteHelpers.chooseWorld,
    chooseLocation: noteHelpers.chooseLocation,
    chooseLocations: noteHelpers.chooseLocations,
    choosePerson: noteHelpers.choosePerson,
    choosePeople: noteHelpers.choosePeople,
    chooseFactions: noteHelpers.chooseFactions,
    chooseReligions: noteHelpers.chooseReligions,
    chooseObjects: noteHelpers.chooseObjects,
    chooseCreatures: noteHelpers.chooseCreatures,
    chooseEncounters: noteHelpers.chooseEncounters,
    chooseMissions: noteHelpers.chooseMissions,
    chooseTracks: noteHelpers.chooseTracks,
    chooseRoutes: noteHelpers.chooseRoutes,
    chooseWorldResources: noteHelpers.chooseWorldResources,
    chooseMarkets: noteHelpers.chooseMarkets,
    chooseCompendium: noteHelpers.chooseCompendium,
    chooseHandouts: noteHelpers.chooseHandouts,
    chooseSessions: noteHelpers.chooseSessions,
    chooseCampaigns: noteHelpers.chooseCampaigns
};
