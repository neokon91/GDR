/// Insieme di funzioni "router" di selezione entità da creare

async function worldbuilding(tp) {

  /// Selezione per Luogo
  async function chooseLocation() {
    const category = await tp.system.suggester(
      ["Insediamento", "Luogo di interesse", "Regione naturale"],
      ["insediamento", "luogo di interesse", "regione naturale"]
    );

    let subtype = "";

    if (category === "insediamento") {
      subtype = await tp.system.suggester(
        ["Amleto", "Villaggio", "Città", "Capitale", "Porto", "Fortezza"],
        ["amleto", "villaggio", "città", "capitale", "porto", "fortezza"]
      );
    }

    if (category === "luogo di interesse") {
      subtype = await tp.system.suggester(
        ["Tempio", "Dungeon", "Rovina", "Torre", "Santuario", "Accampamento"],
        ["tempio", "dungeon", "rovina", "torre", "santuario", "accampamento"]
      );
    }

    if (category === "regione naturale") {
      subtype = await tp.system.suggester(
        ["Foresta", "Montagna", "Palude", "Deserto", "Lago", "Caverna"],
        ["foresta", "montagna", "palude", "deserto", "lago", "caverna"]
      );
    }

    return { category, subtype };
  }

  function getLocationTemplate(category, subtype) {
    if (category === "insediamento") return "z.modelli/luogo/Insediamento";
    if (subtype === "tempio") return "z.modelli/luogo/Tempio";
    if (subtype === "dungeon") return "z.modelli/luogo/Dungeon";
    if (subtype === "rovina") return "z.modelli/luogo/Rovina";
    if (category === "regione naturale") return "z.modelli/luogo/Regione Naturale";

    return "z.modelli/luogo/Interesse";
  }

  return {
    chooseLocation,
    getLocationTemplate
  };
}

module.exports = worldbuilding;
