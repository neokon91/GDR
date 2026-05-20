async function template_router(tp, route = "") {
    const helpers = tp.user.helpers;

    const includeTemplate = async templatePath => {
        const includePath = String.fromCharCode(91, 91) + templatePath + String.fromCharCode(93, 93);
        return await tp.file.include(includePath);
    };

    const routeCreative = async kind => {
        const wb = await tp.user.worldbuilding(tp);
        let routeInfo;

        if (kind === "luogo") {
            routeInfo = await wb.chooseLocation();
        } else {
            routeInfo = await wb.chooseCreative(kind);
        }

        return await includeTemplate(wb.getCreativeTemplate(routeInfo));
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

    const routePersonaggio = async () => {
        const selected = await helpers.chooseRequired(
            tp,
            [
                { label: "PNG", template: "z.modelli/personaggio/PNG" },
                { label: "PG", template: "z.modelli/personaggio/PG" },
                { label: "Divinità o entità", template: "z.modelli/personaggio/Divinità" }
            ],
            "Che tipo di personaggio vuoi creare?"
        );

        return await includeTemplate(selected.template);
    };

    if (route === "fazione") return await routeFaction();
    if (route === "dm") return await routeDm();
    if (route === "personaggio") return await routePersonaggio();

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
