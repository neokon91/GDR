async function creatura(tp){
    const creatureTypes = [
    { label: "Aberrazione", id: "aberrazione" },
    { label: "Bestia", id: "bestia" },
    { label: "Celestiale", id: "celestiale" },
    { label: "Costrutto", id: "costrutto" },
    { label: "Drago", id: "drago" },
    { label: "Elementale", id: "elementale" },
    { label: "Folletto", id: "folletto" },
    { label: "Gigante", id: "gigante" },
    { label: "Immondo", id: "immondo" },
    { label: "Melma", id: "melma" },
    { label: "Mostruosità", id: "mostruosità" },
    { label: "Non Morto", id: "non morto" },
    { label: "Umanoide", id: "umanoide" },
    { label: "Vegetale", id: "vegetale" }
    ];

    const dimensions = [
    { label: "Minuscola", id: "minuscola" },
    { label: "Piccola", id: "piccola" },
    { label: "Media", id: "media" },
    { label: "Grande", id: "grande" },
    { label: "Enorme", id: "enorme" },
    { label: "Mastodontica", id: "mastodontica" }
    ];

    const alignments = [
    { label: "Legale Buono", id: "legale buono" },
    { label: "Neutrale Buono", id: "neutrale buono" },
    { label: "Caotico Buono", id: "caotico buono" },
    { label: "Legale Neutrale", id: "legale neutrale" },
    { label: "Neutrale", id: "neutrale" },
    { label: "Caotico Neutrale", id: "caotico neutrale" },
    { label: "Legale Malvagio", id: "legale malvagio" },
    { label: "Neutrale Malvagio", id: "neutrale malvagio" },
    { label: "Caotico Malvagio", id: "caotico malvagio" }
    ];

    const name = await tp.system.prompt("Nome della creatura");
    const helpers = tp.user.helpers;
    const id = helpers.slugify(name);

    const selectedType = await tp.system.suggester(
    creatureTypes.map(e => e.label),
    creatureTypes,
    false,
    "Scegli un tipo per la creatura"
    );

    const selectedDimensions = await tp.system.suggester(
    dimensions.map(e => e.label),
    dimensions,
    false,
    "Scegli le dimensioni della creatura"
    );

    const selectedAlignment = await tp.system.suggester(
    alignments.map(e => e.label),
    alignments,
    false,
    "Scegli un allineamento per la creatura"
    );

    // === STATISTICHE ===
    const ac = await tp.system.prompt("Classe Armatura", "15");
    const hp = await tp.system.prompt("Punti Ferita", "12");
    const speed = await tp.system.prompt("Velocità", "9 m.");
    const cr = await tp.system.prompt("Grado di Sfida", "1/4");

    // === CARATTERISTICHE ===
    const str = await tp.system.prompt("Forza", "10");
    const dex = await tp.system.prompt("Destrezza", "10");
    const con = await tp.system.prompt("Costituzione", "10");
    const int = await tp.system.prompt("Intelligenza", "10");
    const wis = await tp.system.prompt("Saggezza", "10");
    const cha = await tp.system.prompt("Carisma", "10");

    const traits = await helpers.collectNamedDescriptions(tp, "tratti");
    const actions = await helpers.collectNamedDescriptions(tp, "azioni");
    const bonusActions = await helpers.collectNamedDescriptions(tp, "azioni bonus");
    const reactions = await helpers.collectNamedDescriptions(tp, "reazioni");


    // Rinomina file
    await tp.file.move(`Mondo/Creature/${name}`);

    return `---
id: ${id}
statblock: true
name: ${helpers.yamlQuote(name)}
nome: ${helpers.yamlQuote(name)}
categoria: creatura
type: ${selectedType.id}
tipo: ${selectedType.id}
stato: bozza
size: ${selectedDimensions.id}
alignment: ${selectedAlignment.id}
ac: ${ac}
hp: ${hp}
speed: ${speed}
cr: ${cr}
stats: [${str}, ${dex}, ${con}, ${int}, ${wis}, ${cha}]
saves: []
skillsaves: []
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses:
languages:
gear:
habitat:
luoghi: []
traits: ${tp.user.helpers.inlineYamlArray(traits)}
actions: ${tp.user.helpers.inlineYamlArray(actions)}
bonus_actions: ${tp.user.helpers.inlineYamlArray(bonusActions)}
reactions: ${tp.user.helpers.inlineYamlArray(reactions)}
legendary_actions: []
lair_actions: []
---
`
}

module.exports = creatura;
