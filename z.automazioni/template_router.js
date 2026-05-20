async function template_router(tp, route = "") {
    const helpers = tp.user.helpers;

    const includeTemplate = async templatePath => {
        const includePath = String.fromCharCode(91, 91) + templatePath + String.fromCharCode(93, 93);
        return await tp.file.include(includePath);
    };

    const routeCreative = async kind => {
        const wb = await tp.user.worldbuilding(tp);

        if (kind === "luogo") {
            await wb.chooseLocation();
        } else {
            await wb.chooseCreative(kind);
        }

        return await includeTemplate(wb.getCreativeTemplate());
    };

    const routeFaction = async () => {
        const selected = await helpers.chooseRequired(
            tp,
            [
                { label: "Fazione generica", id: "fazione", template: "z.modelli/fazione/Fazione", tipo: "" },
                { label: "Gilda", id: "gilda", template: "z.modelli/fazione/Gilda", tipo: "gilda" },
                { label: "Confraternita", id: "confraternita", template: "z.modelli/fazione/Confraternita", tipo: "confraternita" },
                { label: "Culto politico", id: "culto politico", template: "z.modelli/fazione/Fazione", tipo: "culto politico" }
            ],
            "Che tipo di fazione vuoi creare?"
        );

        helpers.setRoute({ tipoFazione: selected.tipo });
        return await includeTemplate(selected.template);
    };

    const routeDm = async () => {
        const dm = await tp.user.dm(tp);
        const contentType = await dm.chooseContent();
        const templatePath = dm.getContentTemplate(contentType);

        helpers.setRoute({ contentType });
        return await includeTemplate(templatePath);
    };

    if (route === "fazione") return await routeFaction();
    if (route === "dm") return await routeDm();

    const creativeRoutes = new Set([
        "cultura",
        "ecologia",
        "economia",
        "luogo",
        "magia",
        "religione",
        "societa",
        "storia"
    ]);

    if (creativeRoutes.has(route)) {
        return await routeCreative(route);
    }

    helpers.abortCreation(`Router non configurato: ${route}`);
}

module.exports = template_router;
