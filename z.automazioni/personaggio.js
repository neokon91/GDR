async function personaggio(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del personaggio");
    const id = helpers.slugify(name);

    const role = await helpers.promptOptional(tp, "Ruolo o professione");
    const allineamento = await helpers.promptOptional(tp, "Allineamento");
    const ac = await helpers.promptOptional(tp, "Classe Armatura", "10") || "10";
    const hp = await helpers.promptOptional(tp, "Punti Ferita", "4") || "4";
    const hitDice = await helpers.promptOptional(tp, "Dadi Vita", "1d8") || "1d8";
    const speed = await helpers.promptOptional(tp, "Velocità", "9 m.") || "9 m.";
    const cr = await helpers.promptOptional(tp, "Grado di Sfida", "0") || "0";
    const stats = await helpers.promptOptional(tp, "Caratteristiche D&D: FOR DES COS INT SAG CAR", "10 10 10 10 10 10");
    const stato = await helpers.chooseOptional(
        tp,
        [
            { label: "Bozza", id: "bozza" },
            { label: "Pronto", id: "pronto" },
            { label: "In gioco", id: "in gioco" },
            { label: "Ostile", id: "ostile" },
            { label: "Scomparso", id: "scomparso" },
            { label: "Morto", id: "morto" },
            { label: "Archiviata", id: "archiviata" }
        ],
        "Stato del personaggio"
    );
    const mondo = await helpers.chooseWorld(tp, "Mondo del personaggio");
    const context = { world: mondo };
    const luogo = await helpers.chooseLocation(tp, "Luogo del personaggio", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni del personaggio", context);
    const relazioni = await helpers.choosePeople(tp, "Relazioni del personaggio", context);

    await helpers.moveNote(tp, helpers.path("personaggi"), name);

    return `---
id: ${id}
statblock: true
name: ${helpers.yamlQuote(name)}
nome: ${helpers.yamlQuote(name)}
categoria: personaggio
tipo: png
ruolo: ${helpers.yamlQuote(role)}
alignment: ${helpers.yamlQuote(allineamento)}
allineamento: ${helpers.yamlQuote(allineamento)}
stato: ${stato?.id ?? "bozza"}
mondo: ${mondo}
fazioni: ${helpers.inlineYamlList(fazioni)}
luogo: ${luogo}
relazioni: ${helpers.inlineYamlList(relazioni)}
conseguenze: []
type: umanoide
size: media
ac: ${helpers.yamlNumber(ac) || 10}
hp: ${helpers.yamlNumber(hp) || 4}
hp_massimi: ${helpers.yamlNumber(hp) || 4}
hp_attuali: ${helpers.yamlNumber(hp) || 4}
hit_dice: ${helpers.yamlQuote(hitDice)}
speed: ${helpers.yamlQuote(speed)}
cr: ${helpers.yamlQuote(cr)}
stats: ${helpers.abilityArray(stats)}
saves: []
skillsaves: []
damage_vulnerabilities:
damage_resistances:
damage_immunities:
condition_immunities:
senses:
languages:
traits: []
actions: []
bonus_actions: []
reactions: []
legendary_actions: []
lair_actions: []
---
`;
}

module.exports = personaggio;
