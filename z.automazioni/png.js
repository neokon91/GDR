async function png(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome del PNG");
    const id = helpers.slugify(name);
    const role = await helpers.promptOptional(tp, "Ruolo o professione");
    const atteggiamento = await helpers.promptOptional(tp, "Atteggiamento iniziale");
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
        "Stato del PNG"
    );
    const mondo = await helpers.chooseWorld(tp, "Mondo del PNG");
    const context = { world: mondo };
    const luogo = await helpers.chooseLocation(tp, "Luogo del PNG", context);
    const fazioni = await helpers.chooseFactions(tp, "Fazioni del PNG", context);
    const relazioni = await helpers.choosePeople(tp, "Relazioni del PNG", context);
    const missioni = await helpers.chooseMissions(tp, "Missioni collegate al PNG", context);
    const vuole = await helpers.promptOptional(tp, "Cosa vuole");
    const sa = await helpers.promptOptional(tp, "Cosa sa di utile");
    const segreto = await helpers.promptOptional(tp, "Segreto o contraddizione");
    const leva = await helpers.promptOptional(tp, "Leva per coinvolgerlo al tavolo");
    const domandaAperta = await helpers.promptOptional(tp, "Domanda aperta sul PNG");

    await helpers.moveNote(tp, helpers.path("personaggi"), name);

    return `---
id: ${id}
statblock: true
name: ${helpers.yamlQuote(name)}
nome: ${helpers.yamlQuote(name)}
categoria: personaggio
fileClass: png
tipo: png
ruolo: ${helpers.yamlQuote(role)}
stato: ${stato?.id ?? "bozza"}
mondo: ${mondo}
luogo: ${luogo}
fazioni: ${helpers.inlineYamlList(fazioni)}
relazioni: ${helpers.inlineYamlList(relazioni)}
missioni: ${helpers.inlineYamlList(missioni)}
vuole: ${helpers.yamlQuote(vuole)}
sa: ${helpers.yamlQuote(sa)}
leva: ${helpers.yamlQuote(leva)}
segreto: ${helpers.yamlQuote(segreto)}
domande_aperte: ${helpers.inlineYamlTextList([domandaAperta])}
atteggiamento: ${helpers.yamlQuote(atteggiamento)}
conseguenze: []
type: umanoide
size: media
alignment:
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

module.exports = png;
