/// Insieme di funzioni "router" di selezione entità da creare
const taxonomy = require("./world_taxonomy");

async function worldbuilding(tp) {
  const helpers = tp.user.helpers;

  if (!taxonomy?.getTaxonomy) {
    helpers.abortCreation("Tassonomia worldbuilding non caricata: controlla gli script Templater.");
  }

  /// Selezione per Luogo
  async function chooseLocation() {
    return chooseCreative("luogo");
  }

  function getLocationTemplate(category, subtype) {
    return taxonomy.getLocationTemplate(category, subtype);
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
    return taxonomy.getCreativeTemplate(route);
  }

  return {
    chooseLocation,
    getLocationTemplate,
    chooseCreative,
    getCreativeTemplate
  };
}

module.exports = worldbuilding;
