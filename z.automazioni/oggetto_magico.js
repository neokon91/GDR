async function oggettoMagico(tp) {
    const helpers = tp.user.helpers;
    const name = await tp.system.prompt("Nome dell'oggetto magico");
    const id = helpers.slugify(name);
    const rarita = await tp.system.suggester(
        ["Comune", "Non comune", "Raro", "Molto raro", "Leggendario", "Artefatto"],
        ["comune", "non comune", "raro", "molto raro", "leggendario", "artefatto"],
        false,
        "Rarità"
    );

    await tp.file.move(`Mondo/Oggetti/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: oggetto
tipo: oggetto magico
rarita: ${rarita}
sintonia: false
cariche:
maledizione: false
stato: bozza
canonico: false
proprietario:
luogo:
---
`;
}

module.exports = oggettoMagico;
