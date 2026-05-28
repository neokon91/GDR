function wizardRouteContract(wizard) {
    const routes = require("./data/runtime/session_context.json").template_router?.wizard_routes ?? {};
    return routes[wizard] ?? null;
}

async function createFromTemplate(tp, routeConfig) {
    const helpers = tp.user.helpers;
    const selected = await helpers.chooseRequired(
        tp,
        routeConfig.options ?? [],
        routeConfig.prompt
    );
    const folder = helpers.path(selected.path_key);

    await tp.file.create_new(tp.file.find_tfile(selected.template), undefined, true, app.vault.getAbstractFileByPath(folder));
    return "";
}

async function wizard_layer(tp, wizard = "") {
    const notice = message => new Notice(message);
    const routeConfig = wizardRouteContract(wizard);

    if (routeConfig?.handler === "create_from_template") {
        return await createFromTemplate(tp, routeConfig);
    }

    if (routeConfig?.handler === "lore_capture") {
        return await tp.user.lore_capture(tp, routeConfig.route ?? {});
    }

    notice(`Wizard non riconosciuto: ${wizard}`);
    return "";
}

module.exports = wizard_layer;
