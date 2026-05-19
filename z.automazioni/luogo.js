async function luogo(tp){
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del luogo");
    const id = helpers.slugify(name);
    const route = tp.config.extra ?? {};
    const selectedType = route.subtype ? { id: route.subtype } : await helpers.chooseOptional(
        tp,
        [
            { label: "Città", id: "città" },
            { label: "Villaggio", id: "villaggio" },
            { label: "Capitale", id: "capitale" },
            { label: "Porto", id: "porto" },
            { label: "Fortezza", id: "fortezza" },
            { label: "Rovina", id: "rovina" },
            { label: "Dungeon", id: "dungeon" },
            { label: "Regione", id: "regione" },
            { label: "Regno", id: "regno" },
            { label: "Tempio", id: "tempio" },
            { label: "Foresta", id: "foresta" },
            { label: "Montagna", id: "montagna" }
        ],
        "Tipo di luogo"
    );
    const selectedBiome = await helpers.chooseOptional(
        tp,
        [
            { label: "Foresta", id: "foresta" },
            { label: "Deserto", id: "deserto" },
            { label: "Montagna", id: "montagna" },
            { label: "Costa", id: "costa" },
            { label: "Palude", id: "palude" },
            { label: "Tundra", id: "tundra" },
            { label: "Sottosuolo", id: "sottosuolo" }
        ],
        "Bioma"
    );
    const mondo = await helpers.chooseNoteByFrontmatter(tp, "categoria", "mondo", "Mondo del luogo");
    const luogoPadre = await helpers.chooseNoteByPath(tp, "Mondi/Luoghi", "Luogo o regione superiore");
    const governante = await helpers.chooseNoteByPath(tp, "Mondi/Personaggi", "Governante o referente");
    const pericolo = await helpers.promptOptional(tp, "Pericolo da 0 a 10");
    await tp.file.move(`Mondi/Luoghi/${name}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(name)}
categoria: luogo
tipo: ${selectedType?.id ?? ""}
tipologia: ${selectedType?.id ?? ""}
bioma: ${selectedBiome?.id ?? ""}
stato: bozza
canonico: false
mondo: ${mondo}
luogo_padre: ${luogoPadre}
governante: ${governante}
popolazione:
stabilita:
pericolo: ${pericolo}
hp_massimi:
hp_attuali:
fazioni: []
religioni: []
risorse: []
problemi: []
---
`
}

module.exports = luogo;
