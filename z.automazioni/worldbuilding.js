/// Insieme di funzioni "router" di selezione entità da creare

async function worldbuilding(tp) {
  const helpers = tp.user.helpers;

  /// Selezione per Luogo
  async function chooseLocation() {
    const category = await helpers.chooseRequired(
      tp,
      [
        { label: "Insediamento", id: "insediamento" },
        { label: "Luogo di interesse", id: "luogo di interesse" },
        { label: "Regione naturale", id: "regione naturale" },
        { label: "Geografia grande", id: "geografia" },
        { label: "Territorio politico", id: "politica" }
      ],
      "Che tipo di luogo vuoi creare?"
    );

    let subtype = "";

    if (category.id === "insediamento") {
      subtype = await helpers.chooseRequired(
        tp,
        [
          { label: "Amleto", id: "amleto" },
          { label: "Villaggio", id: "villaggio" },
          { label: "Città", id: "città" },
          { label: "Capitale", id: "capitale" },
          { label: "Porto", id: "porto" },
          { label: "Fortezza", id: "fortezza" }
        ],
        "Che tipo di insediamento?"
      );
    }

    if (category.id === "luogo di interesse") {
      subtype = await helpers.chooseRequired(
        tp,
        [
          { label: "Tempio", id: "tempio" },
          { label: "Dungeon", id: "dungeon" },
          { label: "Rovina", id: "rovina" },
          { label: "Torre", id: "torre" },
          { label: "Santuario", id: "santuario" },
          { label: "Accampamento", id: "accampamento" }
        ],
        "Che luogo di interesse?"
      );
    }

    if (category.id === "regione naturale") {
      subtype = await helpers.chooseRequired(
        tp,
        [
          { label: "Foresta", id: "foresta" },
          { label: "Montagna", id: "montagna" },
          { label: "Palude", id: "palude" },
          { label: "Deserto", id: "deserto" },
          { label: "Lago", id: "lago" },
          { label: "Caverna", id: "caverna" }
        ],
        "Che regione naturale?"
      );
    }

    if (category.id === "geografia") {
      subtype = await helpers.chooseRequired(
        tp,
        [
          { label: "Continente", id: "continente" },
          { label: "Regione", id: "regione" },
          { label: "Isola", id: "isola" }
        ],
        "Che elemento geografico?"
      );
    }

    if (category.id === "politica") {
      subtype = await helpers.chooseRequired(
        tp,
        [
          { label: "Regno", id: "regno" },
          { label: "Impero", id: "impero" },
          { label: "Repubblica", id: "repubblica" },
          { label: "Oligarchia", id: "oligarchia" },
          { label: "Ducato", id: "ducato" },
          { label: "Contea", id: "contea" },
          { label: "Baronia", id: "baronia" }
        ],
        "Che territorio politico?"
      );
    }

    return { category: category.id, subtype: subtype.id };
  }

  function getLocationTemplate(category, subtype) {
    if (category === "insediamento") return "z.modelli/luogo/Insediamento";
    if (subtype === "tempio") return "z.modelli/luogo/Tempio";
    if (subtype === "dungeon") return "z.modelli/luogo/Dungeon";
    if (subtype === "rovina") return "z.modelli/luogo/Rovina";
    if (category === "regione naturale") return "z.modelli/luogo/Regione Naturale";
    if (subtype === "continente") return "z.modelli/geografia/Continente";
    if (subtype === "isola") return "z.modelli/geografia/Isola";
    if (category === "geografia") return "z.modelli/geografia/Regione";
    if (subtype === "regno") return "z.modelli/politica/Regno";
    if (subtype === "impero") return "z.modelli/politica/Impero";
    if (subtype === "repubblica") return "z.modelli/politica/Repubblica";
    if (subtype === "oligarchia") return "z.modelli/politica/Oligarchia";
    if (subtype === "ducato") return "z.modelli/politica/Ducato";
    if (subtype === "contea") return "z.modelli/politica/Contea";
    if (subtype === "baronia") return "z.modelli/politica/Baronia";

    return "z.modelli/luogo/Interesse";
  }

  return {
    chooseLocation,
    getLocationTemplate
  };
}

module.exports = worldbuilding;
