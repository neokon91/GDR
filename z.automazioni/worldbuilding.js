/// Insieme di funzioni "router" di selezione entità da creare

async function worldbuilding(tp) {
  const helpers = tp.user.helpers;
  const taxonomy = tp.user.world_taxonomy;

  if (!taxonomy?.getTaxonomy) {
    helpers.abortCreation("Tassonomia worldbuilding non caricata: controlla gli script Templater.");
  }

  /// Selezione per Luogo
  async function chooseLocation() {
    return chooseCreative("luogo");
  }

  function getLocationTemplate(category, subtype) {
    if (subtype === "insediamento") return "z.modelli/luogo/Insediamento";
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

  async function chooseCreative(kind) {
    const group = taxonomy.getTaxonomy(kind);

    if (!group) {
      helpers.abortCreation(`Router non configurato: ${kind}`);
    }

    const family = await helpers.chooseRequired(
      tp,
      group.families.map(entry => ({
        label: entry.label,
        id: entry.id,
        folder: entry.folder,
        category: entry.category
      })),
      `Che famiglia di ${group.label.toLowerCase()} vuoi creare?`
    );
    const familyConfig = group.families.find(entry => entry.id === family.id);
    const subtype = await helpers.chooseRequired(
      tp,
      familyConfig.items.map(([id, label]) => ({ id, label })),
      "Che cosa stai immaginando?"
    );

    helpers.setRoute({
      kind,
      family: family.id,
      folder: familyConfig.folder ?? group.defaultFolder,
      category: familyConfig.category,
      subtype: subtype.id
    });

    return {
      category: family.id,
      subtype: subtype.id,
      folder: familyConfig.folder ?? group.defaultFolder,
      frontmatterCategory: familyConfig.category
    };
  }

  function getCreativeTemplate(route = {}) {
    if (route.kind === "luogo") return getLocationTemplate(route.category, route.subtype);
    if (route.kind === "cultura") return "z.modelli/worldbuilding/Cultura";
    if (route.kind === "religione") return "z.modelli/fazione/Culto";
    if (route.kind === "magia") return "z.modelli/worldbuilding/Cosmologia";
    if (route.kind === "storia") return route.subtype === "eta mitica"
      ? "z.modelli/worldbuilding/Era Storica"
      : "z.modelli/Evento Storico";
    if (route.kind === "ecologia") return "z.modelli/Creatura";
    if (route.kind === "economia") {
      if (String(route.subtype ?? "").includes("rotta")) return "z.modelli/worldbuilding/Rotta";
      if (String(route.subtype ?? "").includes("mercato")) return "z.modelli/worldbuilding/Mercato o Nodo Commerciale";
      return "z.modelli/worldbuilding/Risorsa";
    }

    return "z.modelli/worldbuilding/Entita Worldbuilding";
  }

  return {
    chooseLocation,
    getLocationTemplate,
    chooseCreative,
    getCreativeTemplate
  };
}

module.exports = worldbuilding;
