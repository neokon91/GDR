#!/usr/bin/env node
// seed_example.js — genera il MONDO-ESEMPIO «Astaria» nel vault costruito (dist/GDR-vault),
// riusando le funzioni d'import GIA' testate (parseSvgMap/buildMarkers) e i CORPI dei modelli
// (z.modelli/*.md) → entità di PRIMA classe, mai disallineate dai template. Non un dump di nomi:
// un mondo VIVO (premessa, conflitto, Fronte ACCESO con clock, grafo di conflitto Corsari⚔culto)
// per provare il pitch «scrivi lore → la superficie si accende» e dare buoni screenshot.
// Sorgente versionata: Dev/Source/Esempio/. Idempotente: salta se Astaria esiste già.
// Ritratti/banner lasciati VUOTI di proposito (agganci per immagini). Uso: `npm run seed-example`.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const VAULT = path.join(ROOT, "dist", "GDR-vault");
const SRC = path.join(ROOT, "Dev", "Source", "Esempio");
const im = require(path.join(ROOT, "Dev", "Source", "JS", "importa_mappa.js"));

const nomeFile = (n) => String(n || "").trim().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_") || "Luogo";

// Corpo di un modello (z.modelli/<Nome>.md), saltando la riga 1 (tag Templater <% ... %>).
function modelBody(name) {
  const p = path.join(VAULT, "z.modelli", name);
  return fs.existsSync(p) ? "\n" + fs.readFileSync(p, "utf8").replace(/^[^\n]*\n/, "") : "\n";
}
// Frontmatter YAML da un oggetto (stringhe quotate, numeri/array nudi; null/"" → omessi).
function fm(obj) {
  const q = (v) => typeof v === "number" ? String(v) : JSON.stringify(String(v));
  const lines = ["---"];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) lines.push(`${k}: [${v.map(q).join(", ")}]`);
    else if (v === "") lines.push(`${k}: ""`);
    else lines.push(`${k}: ${q(v)}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}
const write = (rel, text) => {
  const p = path.join(VAULT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
};

function main() {
  if (!fs.existsSync(path.join(VAULT, "Mondi"))) {
    console.error("Vault non costruito: esegui prima `npm run build`."); process.exit(1);
  }
  if (fs.existsSync(path.join(VAULT, "Mondi", "Astaria.md"))) {
    console.log("Mondo-esempio già presente (Mondi/Astaria.md) — niente da fare."); return;
  }

  // 1) Asset mappa nel vault (l'SVG ha i toponimi; il JSON gemello ha nome + origine).
  fs.mkdirSync(path.join(VAULT, "Media"), { recursive: true });
  for (const f of ["costa_dellombra.svg", "costa_dellombra.json"]) {
    fs.copyFileSync(path.join(SRC, f), path.join(VAULT, "Media", f));
  }
  const twin = JSON.parse(fs.readFileSync(path.join(SRC, "costa_dellombra.json"), "utf8"));

  // 2) Mondo Astaria — premessa + conflitto + Fronte ACCESO (clock del Risveglio 4/6, Crisi).
  write("Mondi/Astaria.md", fm({
    id: "astaria", nome: "Astaria", categoria: "mondo", tipo: "mondo", stato: "bozza",
    mappa: "[[costa_dellombra.svg]]", mappa_origine: String(twin.origin || ""),
    genere: "dark fantasy",
    temi: ["oscurità che si ridesta", "frontiera senza legge", "eredità maledetta", "il prezzo della salvezza"],
    diffusione_magia: 3, tono: 4, ordine_politico: 4, civilta_natura: 4, eta_storica: 4,
    conflitto: "Sepolta sotto la Costa dell'Ombra, la Ziggurat Oscura si ridesta e l'Ombra cola lungo i moli, corrompendo mare e uomini. Tre poteri si contendono il risveglio: i Corsari dell'Ombra (ne salvano e vendono le reliquie), la Veglia dei Sepolti (il culto che vuole completarlo) e Chiarombra (l'ultima città di legge, che cerca di fermarlo).",
    player_safe: "Una costa di nebbie, relitti e contrabbando, dove si mormora che qualcosa di antico si stia svegliando sotto le onde.",
    gancio: "I PG sbarcano ad Aster con un carico da consegnare e scoprono che il committente è scomparso — il suo ultimo messaggio nominava la Ziggurat.",
    uso_al_tavolo: "Sandbox costiero: tre poteri tirano i PG in direzioni opposte. Ogni mossa fa avanzare il clock del Risveglio.",
    pressione: 7,
    prossima_mossa: "La Veglia dei Sepolti apre la Terza Porta della Ziggurat: la marea sale nera e la nebbia entra a Chiarombra.",
    clock: 4, clock_dim: 6,
    conseguenza: "Il Risveglio: l'Ombra dilaga sulla costa e ogni porto deve scegliere un padrone — o sprofondare.",
    connessioni: [], sessioni: [], tags: ["gdr/bozza"],
  }) + modelBody("Mondo.md"));

  // 3) Luoghi dai toponimi (TEMPLATI) + lore curata sui chiave; gli altri restano spilli (una
  //    regione vera ha anche luoghi minori). Scarta il titolo-mappa. + sidecar dei segnaposto.
  const lore = {
    Aster: { tipo: "insediamento", clima: "umido, salmastro", popolazione: "~4.000",
      gancio: "Nei vicoli della Città Bassa si compra tutto, anche un nome nuovo." },
    Ziggurat_Oscura: { tipo: "dungeon", clima: "nebbia perenne",
      gancio: "Sotto le fondamenta, una porta che nessuno ricorda di aver chiuso." },
    Chiarombra: { tipo: "insediamento", clima: "ventoso",
      gancio: "L'ultima campana che suona ancora il coprifuoco contro la nebbia." },
    Artiglio_Nero: { tipo: "struttura",
      gancio: "Il faro è spento da una stagione, eppure qualcosa lassù risponde ai segnali." },
  };
  const { size, places } = im.parseSvgMap(fs.readFileSync(path.join(SRC, "costa_dellombra.svg"), "utf8"));
  const norm = (x) => String(x || "").toLowerCase().replace(/\s+/g, " ").trim();
  const luoghi = places.filter((p) => norm(p.name) !== norm(twin.name));
  const luogoBody = modelBody("Luogo.md");
  for (const p of luoghi) {
    const key = nomeFile(p.name), extra = lore[key] || {};
    write(`Mondi/Luoghi/${key}.md`, fm({
      id: key.toLowerCase().replace(/_/g, "-"), nome: p.name, categoria: "luogo",
      tipo: extra.tipo || "luogo", stato: "bozza", mondo: "[[Astaria]]",
      coord: `${p.x}, ${p.y}`,
      clima: extra.clima, popolazione: extra.popolazione, gancio: extra.gancio,
      controllata_da: key === "Aster" ? "[[Corsari dell'Ombra]]"
        : key === "Ziggurat_Oscura" ? "[[La Veglia dei Sepolti]]" : undefined,
      connessioni: [], sessioni: [], tags: ["gdr/bozza"],
    }) + luogoBody);
  }
  write("Media/costa_dellombra.svg.markers.json",
    JSON.stringify(im.buildMarkers("Media/costa_dellombra.svg", size, luoghi, (n) => nomeFile(n)), null, 2));

  // 4) Due fazioni in CONFLITTO (il grafo che racconta una storia): i Corsari (banda mercantile,
  //    sede Aster) ⚔ la Veglia dei Sepolti (ordine religioso, sede la Ziggurat). Rivali a vicenda;
  //    entrambe sono Fronti con la loro Prossima mossa.
  const fazBody = modelBody("Fazione.md");
  write("Mondi/Fazioni/Corsari dell'Ombra.md", fm({
    id: "corsari-dell-ombra", nome: "Corsari dell'Ombra", categoria: "fazione", tipo: "banda",
    stato: "bozza", mondo: "[[Astaria]]", famiglia: "mercantile", sede: "[[Aster]]",
    rivali: ["[[La Veglia dei Sepolti]]"],
    territorio: "Le coste e i moli di Aster, lungo la Costa dell'Ombra",
    racket: "Contrabbando, pedaggi sui mercantili e riscatti",
    player_safe: "La banda di contrabbandieri che controlla davvero il porto di Aster.",
    gancio: "Pagano bene chi recupera reliquie dalla Ziggurat e non fa domande — ma l'ultima squadra che hanno mandato non è più tornata.",
    pressione: 5,
    prossima_mossa: "Comprano la fedeltà del guardiano dell'Artiglio Nero per chiudere la costa ai rivali.",
    clock: 2, clock_dim: 4,
    conseguenza: "Monopolio: i Corsari controllano ogni rotta della costa — e il prezzo delle reliquie.",
    connessioni: [], sessioni: [], tags: ["gdr/bozza"],
  }) + fazBody);
  write("Mondi/Fazioni/La Veglia dei Sepolti.md", fm({
    id: "la-veglia-dei-sepolti", nome: "La Veglia dei Sepolti", categoria: "fazione", tipo: "ordine",
    stato: "bozza", mondo: "[[Astaria]]", famiglia: "religiosa", sede: "[[Ziggurat_Oscura]]",
    rivali: ["[[Corsari dell'Ombra]]"],
    credo: "Che l'Ombra Sepolta torni a regnare sulla costa; servirla è salvezza.",
    player_safe: "Una confraternita incappucciata che veglia le rovine sotto Aster.",
    gancio: "Cercano le reliquie che i Corsari trafugano — e accolgono come fratelli i naufraghi che «l'Ombra ha scelto».",
    pressione: 6,
    prossima_mossa: "Aprono la Terza Porta della Ziggurat.",
    clock: 4, clock_dim: 6,
    conseguenza: "Il Risveglio si compie: l'Ombra Sepolta cammina di nuovo.",
    connessioni: [], sessioni: [], tags: ["gdr/bozza"],
  }) + fazBody);

  console.log(`Mondo-esempio «Astaria» creato: ${luoghi.length} luoghi (4 con lore) + mappa + 2 fazioni in conflitto (Corsari ⚔ Veglia dei Sepolti) + Fronte del Risveglio acceso (clock 4/6).`);
}
main();
