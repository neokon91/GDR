async function mondo(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del mondo");
    const id = helpers.slugify(name);
    const tono = await helpers.promptOptional(tp, "Tono");
    const tema = await helpers.promptOptional(tp, "Tema");
    const tecnologia = await helpers.promptOptional(tp, "Tecnologia");
    const magia = await helpers.promptOptional(tp, "Magia");
    const premessa = await helpers.promptOptional(tp, "Promessa del mondo");
    const conflittoCentrale = await helpers.promptOptional(tp, "Conflitto centrale");

    await helpers.moveNote(tp, helpers.path("mondi"), name);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: mondo
fileClass: mondo
stato: bozza
tono: ${helpers.yamlQuote(tono)}
tema: ${helpers.yamlQuote(tema)}
temi: []
promesse_narrative: []
limiti: []
ispirazioni: []
non_vogliamo: []
tecnologia: ${helpers.yamlQuote(tecnologia)}
magia: ${helpers.yamlQuote(magia)}
premessa: ${helpers.yamlQuote(premessa)}
gancio: ${helpers.yamlQuote(premessa)}
conflitto_centrale: ${helpers.yamlQuote(conflittoCentrale)}
luoghi_iconici: []
fazioni_principali: []
misteri_pubblici: []
materiale_pubblico: []
domande_guida: []
continenti: []
fazioni: []
religioni: []
campagne: []
verita: []
rumor_attivi: []
stato_mondo: []
continuita: []
relazioni_chiave: []
domande_aperte: []
tensioni: []
fronti: []
segreti: []
checklist_lore: []
canonico: false
---
`;
}

module.exports = mondo;
