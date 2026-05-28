const createWorldbuilding = require("./worldbuilding");

async function template_router(tp, route = "") {
    const helpers = tp.user.helpers;
    const routerContract = require("./data/runtime/session_context.json").template_router ?? {};
    const promptRoutes = new Map((routerContract.prompt_routes ?? []).map(item => [item.id, item]));
    const delegatedRoutes = new Map((routerContract.delegated_routes ?? []).map(item => [item.id, item]));
    const creativeRoutes = new Set(routerContract.creative_routes ?? []);

    const includeTemplate = async templatePath => {
        const includePath = String.fromCharCode(91, 91) + templatePath + String.fromCharCode(93, 93);
        return await tp.file.include(includePath);
    };

    const routePrompt = async routeConfig => {
        const selected = await helpers.chooseRequired(
            tp,
            routeConfig.options ?? [],
            routeConfig.prompt ?? "Che cosa vuoi creare?"
        );

        if (selected.set_route) helpers.setRoute(selected.set_route);
        return await includeTemplate(selected.template);
    };

    const routeCreative = async kind => {
        const wb = await createWorldbuilding(tp);
        const routeInfo = kind === "luogo"
            ? await wb.chooseLocation()
            : await wb.chooseCreative(kind);

        return await includeTemplate(wb.getCreativeTemplate(routeInfo));
    };

    const routeDm = async () => {
        const dm = await tp.user.dm(tp);
        const contentType = await dm.chooseContent();
        const templatePath = dm.getContentTemplate(contentType);

        helpers.setRoute({ contentType });
        return await includeTemplate(templatePath);
    };

    const promptRoute = promptRoutes.get(route);
    if (promptRoute) return await routePrompt(promptRoute);

    const delegatedRoute = delegatedRoutes.get(route);
    if (delegatedRoute?.handler === "dm") return await routeDm();
    if (creativeRoutes.has(route)) {
        return await routeCreative(route);
    }

    helpers.abortCreation(`Router non configurato: ${route}`);
}

module.exports = template_router;
