const GDRView = (() => {
    const asArray = value => Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
    const isReal = page => page && page.stato !== "archiviata";
    const pressure = page => Number(page.pressione ?? page.progress_value ?? 0) || 0;
    const linkKey = link => String(link?.path ?? link ?? "").replace(/\.md$/, "").split("/").pop();

    function renderStatGrid(dv, stats) {
        const grid = dv.el("div", "", { cls: "gdr-stat-grid" });
        stats.forEach(stat => {
            const card = grid.createDiv({ cls: "gdr-stat-card" });
            card.createEl("strong", { text: String(stat.value ?? 0) });
            card.createEl("span", { text: stat.label });
            if (stat.note) card.createEl("small", { text: stat.note });
        });
    }

    function renderPressureList(dv, source = '"Mondi/Missioni" OR "Mondi/Tracciati" OR "Mondi/Fazioni"') {
        const rows = dv.pages(source)
            .where(page => isReal(page) && pressure(page) > 0)
            .sort(page => pressure(page), "desc")
            .map(page => [page.file.link, page.categoria ?? page.tipo ?? "", page.stato ?? "", pressure(page), page.prossima_mossa ?? ""])
            .array();

        if (!rows.length) {
            dv.paragraph("Nessuna pressione attiva.");
            return;
        }

        dv.table(["Nota", "Tipo", "Stato", "Pressione", "Prossima mossa"], rows);
    }

    function renderLinkedOperationalTable(dv, links, title = "Connessioni operative") {
        const wanted = new Set(asArray(links).map(linkKey));
        const rows = dv.pages('"Mondi" OR "Risorse"')
            .where(page => isReal(page) && wanted.has(page.file.name))
            .sort(page => page.categoria ?? "")
            .map(page => [page.file.link, page.categoria ?? "", page.stato ?? "", page.pressione ?? "", page.prossima_mossa ?? ""])
            .array();

        dv.header(3, title);
        if (!rows.length) {
            dv.paragraph("Nessuna connessione operativa collegata.");
            return;
        }

        dv.table(["Nota", "Categoria", "Stato", "Pressione", "Prossima mossa"], rows);
    }

    function renderSessionOutput(dv, session = dv.current()) {
        const rows = [
            ...asArray(session.decisioni_prese).map(value => ["Decisione", value]),
            ...asArray(session.conseguenze).map(value => ["Conseguenza", value]),
            ...asArray(session.output_sessione).map(value => ["Output", value]),
            ...asArray(session.recap_pubblico).map(value => ["Pubblico", value])
        ];

        if (!rows.length) {
            dv.paragraph("Nessun output di sessione registrato.");
            return;
        }

        dv.table(["Tipo", "Voce"], rows);
    }

    return {
        asArray,
        isReal,
        pressure,
        linkKey,
        renderStatGrid,
        renderPressureList,
        renderLinkedOperationalTable,
        renderSessionOutput
    };
})();

if (typeof module !== "undefined") {
    module.exports = GDRView;
}

GDRView;
