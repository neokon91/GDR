const helpers = require("./helpers");

async function create_entity(tp, templateId = "") {
  const template = helpers.core.templates.find(item => item.id === templateId);
  if (!template) {
    throw new Error(`Template non dichiarato: ${templateId}`);
  }

  const category = template.category;
  const categorySpec = helpers.core.categories[category] ?? {};
  const type = await helpers.choose(
    tp,
    categorySpec.subtypes ?? [template.default_type],
    `Tipo ${template.title}`,
    template.default_type
  );
  const name = await helpers.prompt(tp, `Nome ${template.title}`);
  const world = category === "mondo" ? "" : await helpers.prompt(tp, "Mondo di riferimento", "");
  const folderKey = categorySpec.folder ?? category;
  const folder = helpers.core.folders[folderKey] ?? helpers.core.folders[category] ?? "Inbox";

  await helpers.moveCurrentNote(tp, folder, name);

  const session = helpers.activeSession();
  const sessionLink = helpers.fileLink(session);
  const frontmatter = {
    id: helpers.slugify(name),
    nome: name,
    categoria: category,
    tipo: type,
    stato: "bozza",
    mondo: world,
    connessioni: [],
    sessioni: sessionLink ? [sessionLink] : [],
    pressione: 0,
    prossima_mossa: "",
    player_safe: "",
    tags: ["gdr/bozza"]
  };

  if (category === "sessione") {
    frontmatter.attiva = false;
    frontmatter.data = tp.date.now("YYYY-MM-DD");
  }

  return helpers.frontmatter(frontmatter);
}

module.exports = create_entity;
