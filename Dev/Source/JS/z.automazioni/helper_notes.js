const { createNoteCore } = require("./helper_note_core");
const { createNoteSelectionHelpers } = require("./helper_note_selection");
const { createSessionLinkHelpers } = require("./helper_session_links");

function createNoteHelpers(deps) {
    const core = createNoteCore(deps);
    const sessionLinks = createSessionLinkHelpers({
        ...deps,
        ...core
    });
    const selections = createNoteSelectionHelpers({
        ...deps,
        ...core,
        getActiveSessionContext: sessionLinks.getActiveSessionContext
    });

    return {
        ...core,
        ...selections,
        ...sessionLinks
    };
}

module.exports = {
    createNoteHelpers
};
