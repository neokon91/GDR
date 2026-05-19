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

    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della creatura");
    const id = helpers.slugify(name);

    const selectedType = await helpers.chooseOptional(
        tp,
        creatureTypes,
        "Tipo della creatura"
    );

    const selectedDimensions = await helpers.chooseOptional(
        tp,
        dimensions,
        "Dimensione della creatura"
    );

    const selectedAlignment = await helpers.chooseOptional(
        tp,
        alignments,
        "Allineamento della creatura"
    );
    const mondo = await helpers.chooseNoteByFrontmatter(tp, "categoria", "mondo", "Mondo della creatura");
    const luoghi = await helpers.chooseNotesByPath(tp, "Mondi/Luoghi", "Luoghi o habitat collegati");

    // === STATISTICHE ===
    const ac = await helpers.promptOptional(tp, "Classe Armatura", "15") || "15";
    const hp = await helpers.promptOptional(tp, "Punti Ferita", "12") || "12";
    const speed = await helpers.promptOptional(tp, "Velocità", "9 m.") || "9 m.";
    const cr = await helpers.promptOptional(tp, "Grado di Sfida", "1/4") || "1/4";

    // === CARATTERISTICHE ===
    const str = await helpers.promptOptional(tp, "Forza", "10") || "10";
    const dex = await helpers.promptOptional(tp, "Destrezza", "10") || "10";
    const con = await helpers.promptOptional(tp, "Costituzione", "10") || "10";
    const int = await helpers.promptOptional(tp, "Intelligenza", "10") || "10";
    const wis = await helpers.promptOptional(tp, "Saggezza", "10") || "10";
    const cha = await helpers.promptOptional(tp, "Carisma", "10") || "10";

    const traits = await helpers.collectNamedDescriptions(tp, "tratti");
    const actions = await helpers.collectNamedDescriptions(tp, "azioni");
    const bonusActions = await helpers.collectNamedDescriptions(tp, "azioni bonus");
    const reactions = await helpers.collectNamedDescriptions(tp, "reazioni");


    // Rinomina file
    await tp.file.move(`Mondi/Creature/${name}`);

    return `---
id: ${id}
statblock: true
name: ${helpers.yamlQuote(name)}
nome: ${helpers.yamlQuote(name)}
categoria: creatura
type: ${selectedType?.id ?? ""}
tipo: ${selectedType?.id ?? ""}
stato: bozza
mondo: ${mondo}
size: ${selectedDimensions?.id ?? ""}
alignment: ${selectedAlignment?.id ?? ""}
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
luoghi: ${helpers.inlineYamlList(luoghi)}
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
