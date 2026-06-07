#!/usr/bin/env node
// seed_example.js — genera il MONDO-ESEMPIO «Astaria» nel vault costruito (dist/GDR-vault),
// riusando le funzioni d'import GIA' testate (parseSvgMap/buildMarkers/luogoFrontmatter) e i
// CORPI dei modelli (z.modelli/*.md) → entità di PRIMA classe, mai disallineate dai template.
// Sorgente versionata: le mappe-esempio in Dev/Source/Esempio/. Idempotente: salta se Astaria
// esiste già (non sovrascrive il lavoro dell'utente). Uso: `npm run seed-example`.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const VAULT = path.join(ROOT, "dist", "GDR-vault");
const SRC = path.join(ROOT, "Dev", "Source", "Esempio");
const im = require(path.join(ROOT, "Dev", "Source", "JS", "importa_mappa.js"));

const q = (v) => JSON.stringify(String(v == null ? "" : v));
const nomeFile = (n) => String(n || "").trim().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_") || "Luogo";

// Corpo di un modello (z.modelli/<Nome>.md), saltando la riga 1 (tag Templater <% ... %>).
function modelBody(name) {
  const p = path.join(VAULT, "z.modelli", name);
  return fs.existsSync(p) ? "\n" + fs.readFileSync(p, "utf8").replace(/^[^\n]*\n/, "") : "\n";
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
  const origine = String(twin.origin || twin.url || "");

  // 2) Mondo Astaria — assi a tema (dark fantasy di frontiera costiera) + mappa.
  write("Mondi/Astaria.md",
    "---\nid: astaria\nnome: Astaria\ncategoria: mondo\ntipo: mondo\nstato: bozza\n"
    + `mappa: "[[costa_dellombra.svg]]"\n` + (origine ? `mappa_origine: ${q(origine)}\n` : "")
    + `genere: ${q("Dark fantasy di frontiera")}\n`
    + "diffusione_magia: 3\ntono: 4\nordine_politico: 4\ncivilta_natura: 4\neta_storica: 4\n"
    + "connessioni: []\nsessioni: []\ntags: [gdr/bozza]\n---\n"
    + modelBody("Mondo.md"));

  // 3) Luoghi dai toponimi (TEMPLATI) + sidecar dei segnaposto. Scarta il titolo-mappa.
  const { size, places } = im.parseSvgMap(fs.readFileSync(path.join(SRC, "costa_dellombra.svg"), "utf8"));
  const norm = (x) => String(x || "").toLowerCase().replace(/\s+/g, " ").trim();
  const luoghi = places.filter((p) => norm(p.name) !== norm(twin.name));
  const luogoBody = modelBody("Luogo.md");
  for (const p of luoghi) {
    write(`Mondi/Luoghi/${nomeFile(p.name)}.md`, im.luogoFrontmatter(p.name, "Astaria", p.x, p.y) + luogoBody);
  }
  write("Media/costa_dellombra.svg.markers.json",
    JSON.stringify(im.buildMarkers("Media/costa_dellombra.svg", size, luoghi, (n) => nomeFile(n)), null, 2));

  // 4) Una fazione che vuole qualcosa: i Corsari dell'Ombra, con SEDE = Aster (se esiste tra
  //    i toponimi) + l'inverso tipizzato su Aster (controllata_da) → il grafo nasce chiuso.
  const hasAster = luoghi.some((p) => nomeFile(p.name) === "Aster");
  write("Mondi/Fazioni/Corsari dell'Ombra.md",
    `---\nid: corsari-dell-ombra\nnome: ${q("Corsari dell'Ombra")}\ncategoria: fazione\ntipo: banda\nstato: bozza\n`
    + "mondo: \"[[Astaria]]\"\nfamiglia: mercantile\n"
    + (hasAster ? "sede: \"[[Aster]]\"\n" : "")
    + `territorio: ${q("Le coste e i moli di Aster, lungo la Costa dell'Ombra")}\n`
    + `racket: ${q("Contrabbando, pedaggi sui mercantili e riscatti")}\n`
    + "connessioni: []\nsessioni: []\ntags: [gdr/bozza]\n---\n"
    + modelBody("Fazione.md"));
  if (hasAster) {
    const ap = path.join(VAULT, "Mondi", "Luoghi", "Aster.md");
    let a = fs.readFileSync(ap, "utf8");
    if (!/^controllata_da:/m.test(a)) {
      a = a.replace(/^stato: bozza\n/m, "stato: bozza\ncontrollata_da: \"[[Corsari dell'Ombra]]\"\n");
      fs.writeFileSync(ap, a);
    }
  }

  console.log(`Mondo-esempio «Astaria» creato: ${luoghi.length} luoghi templati + mappa Costa dell'Ombra + fazione «Corsari dell'Ombra»${hasAster ? " (sede Aster, inverso scritto)" : ""}.`);
}
main();
