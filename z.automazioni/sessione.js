async function sessione(tp) {
    const helpers = tp.user.helpers;
    const titolo = await tp.system.prompt("Titolo della sessione", "Sessione");
    const data = await tp.system.prompt("Data", tp.date.now("YYYY-MM-DD"));
    const id = helpers.slugify(`${data}-${titolo}`);

    await tp.file.move(`Mondo/Sessioni/${data} - ${titolo}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(titolo)}
cssclasses:
  - tavolo
categoria: sessione
tipo:
data: ${data}
data_mondo:
stato: preparazione
campagne: []
luoghi: []
personaggi: []
creature: []
incontri: []
dispense: []
fazioni: []
oggetti: []
scene: []
ricompense: []
---
`;
}

module.exports = sessione;
