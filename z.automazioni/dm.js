function dmContentContract() {
    const content = require("./data/runtime/session_context.json").template_router?.dm_content ?? {};
    if (!Array.isArray(content.options) || !content.options.length) {
        throw new Error("Contratto DM runtime mancante in z.automazioni/data/runtime/session_context.json");
    }
    return content;
}

async function dm(tp) {
    const helpers = tp.user.helpers;
    const content = dmContentContract();
    const options = content.options ?? [];
    const templates = new Map(options.map(option => [option.id, option.template]));

    async function chooseContent() {
        const selected = await helpers.chooseRequired(
            tp,
            options,
            content.prompt
        );

        return selected.id;
    }

    function getContentTemplate(contentType) {
        return templates.get(contentType) ?? content.fallback_template;
    }

    return {
        chooseContent,
        getContentTemplate
    };
}

module.exports = dm;
