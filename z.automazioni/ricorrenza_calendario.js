async function ricorrenza_calendario(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della festa, scadenza o ricorrenza");
    const id = helpers.slugify(name);
    const mondo = await helpers.chooseWorld(tp, "Mondo della ricorrenza");
    const context = { world: mondo };
    const culture = await helpers.chooseNotesByPath(tp, helpers.path("culture"), "Culture collegate", context);
    const religioni = await helpers.chooseReligions(tp, "Religioni collegate", context);
    const luoghi = await helpers.chooseLocations(tp, "Luoghi collegati", context);
    const dataMondo = await helpers.promptOptional(tp, "Data leggibile nel mondo");
    const calendario = await helpers.promptCalendar(tp, { world: mondo });
    const conseguenza = await helpers.promptOptional(tp, "Conseguenza se la data passa");

    await helpers.moveNote(tp, helpers.path("calendario_diegetico"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: risorsa
fileClass: ricorrenza
tipo: ricorrenza
stato: bozza
mondo: ${mondo}
data_mondo: ${helpers.yamlQuote(dataMondo)}
mese:
stagione:
festa: true
tabu_stagionali: []
scadenze_rituali: []
eventi_ricorrenti: []
culture: ${helpers.inlineYamlList(culture)}
religioni: ${helpers.inlineYamlList(religioni)}
luoghi: ${helpers.inlineYamlList(luoghi)}
fazioni: []
conseguenze_data_passata: ${helpers.inlineYamlTextList([conseguenza])}
conseguenze: ${helpers.inlineYamlTextList([conseguenza])}
pressioni_da_avanzare: []
pressione: 0
prossima_mossa:
fc-calendar: ${helpers.yamlQuote(calendario)}
fc-date:
fc-category: festa
fc-display-name: ${helpers.yamlQuote(name)}
propaga_a: []
entita_impattate: []
---

`;
}

module.exports = ricorrenza_calendario;
