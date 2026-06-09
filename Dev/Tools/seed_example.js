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

const nomeFile = (n) => String(n || "").trim().replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ") || "Luogo";

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

// Riempie le SEZIONI ## del corpo-modello con la prosa della demo (l'area-scrittura
// sotto lo spunto), così le note-esempio mostrano prosa vera sul sito-giocatori, che
// ora la legge dal corpo (build_site.strip_body). `fills` = { "Titolo sezione": "prosa" }.
// Le sezioni assenti restano vuote (lo strip le toglie dal sito). Un titolo che combacia
// con un callout segreto ([!rivela|segreto]) riceve la prosa DENTRO il callout (gated per tier).
function fillBody(body, fills) {
  for (const [heading, prose] of Object.entries(fills || {})) {
    if (!prose) continue;
    let lines = body.split("\n");
    const hi = lines.findIndex((l) => l.trim() === `## ${heading}`);
    if (hi >= 0) {  // sezione ## normale: prosa nell'area-scrittura sotto lo spunto
      let j = hi + 1;
      while (j < lines.length && lines[j].trim().startsWith(">")) j += 1;  // salta lo spunto
      while (j < lines.length && lines[j].trim() === "") j += 1;            // salta le righe vuote
      lines.splice(j, 0, prose, "");
    } else {  // callout segreto col titolo dato: prosa come righe '> ...' dentro il callout
      const si = lines.findIndex((l) => l.includes("[!rivela|segreto]") && l.includes(heading));
      if (si < 0) continue;
      let j = si + 1;
      while (j < lines.length && lines[j].trim().startsWith(">")) j += 1;   // fine del blockquote
      lines.splice(j, 0, ...prose.split("\n").map((p) => (p.trim() ? `> ${p}` : ">")));
    }
    body = lines.join("\n");
  }
  return body;
}

function main() {
  if (!fs.existsSync(path.join(VAULT, "Mondi"))) {
    console.error("Vault non costruito: esegui prima `npm run build`."); process.exit(1);
  }
  if (fs.existsSync(path.join(VAULT, "Mondi", "Astaria.md"))) {
    console.log("Mondo-esempio già presente (Mondi/Astaria.md) — niente da fare."); return;
  }

  // 1) Asset mappa nel vault (l'SVG ha i toponimi; il JSON gemello ha nome + origine).
  fs.mkdirSync(path.join(VAULT, "Media"), { recursive: true });
  // costa_dellombra = mappa REGIONALE (toponimi→luoghi); aster = mappa di CITTÀ di Aster
  // (drill-down: dal pin sulla regione alla pianta della città).
  for (const f of ["costa_dellombra.svg", "costa_dellombra.json", "aster.svg"]) {
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
    // conflitto e verita_nascosta NON sono più campi-frontmatter: vivono come SEZIONI del
    // corpo (sotto), riempite via fillBody. La «Verità nascosta» è un callout segreto →
    // resta nella nota (la vede il DM) ma il sito-giocatori la ESCLUDE: mostra in concreto
    // la separazione DM/giocatori che il sito promette.
    player_safe: "Una costa di nebbie, relitti e contrabbando, dove si mormora che qualcosa di antico si stia svegliando sotto le onde.",
    gancio: "I PG sbarcano ad Aster con un carico da consegnare e scoprono che il committente è scomparso — il suo ultimo messaggio nominava la Ziggurat.",
    uso_al_tavolo: "Sandbox costiero: tre poteri tirano i PG in direzioni opposte. Ogni mossa fa avanzare il clock del Risveglio.",
    pressione: 7,
    prossima_mossa: "La Veglia dei Sepolti apre la Terza Porta della Ziggurat: la marea sale nera e la nebbia entra a Chiarombra.",
    clock: 4, clock_dim: 6,
    conseguenza: "Il Risveglio: l'Ombra dilaga sulla costa e ogni porto deve scegliere un padrone — o sprofondare.",
    connessioni: [], sessioni: [], tags: ["gdr/bozza"],
  }) + fillBody(modelBody("Mondo.md"), {
    "Conflitto centrale": "Sotto la Costa dell'Ombra qualcosa di antico si ridesta, e l'Ombra cola lungo i moli corrompendo mare e uomini. Tre poteri se ne contendono il controllo: i **Corsari dell'Ombra**, che dal porto di Aster trafficano le reliquie riaffiorate dalle rovine; **La Veglia dei Sepolti**, la confraternita incappucciata che custodisce la Ziggurat; e **Chiarombra**, l'ultima città di legge che cerca di arginare la marea.",
    "Verità nascosta": "La Veglia dei Sepolti non custodisce la Ziggurat: la sta *risvegliando*. È un culto che nel Risveglio vede salvezza, e ogni reliquia che i Corsari trafugano è un tassello che manca al rito della Terza Porta — così chi vende ai Corsari, ignaro, lavora per il culto. Chiarombra lo sospetta, ma il faro dell'Artiglio Nero è già stato spento da dentro.",
  }));

  // 3) Luoghi dai toponimi (TEMPLATI) + lore curata su OGNI luogo (ogni pin è un posto vero); (una
  //    regione vera ha anche luoghi minori). Scarta il titolo-mappa. + sidecar dei segnaposto.
  // Ogni luogo: campi-scheda (clima/popolazione), `gancio` (hook del DM, tab Al tavolo →
  // fuori dal sito), `player_safe` (blurb player-facing → APRE la pagina-sito) e, per gli
  // snodi-chiave, `body` = prosa nelle sezioni ## (Atmosfera/Funzione/Segreto…) che il
  // sito legge dal corpo. Così ogni segnaposto sulla mappa ha una sua pagina vera.
  const lore = {
    Aster: { tipo: "insediamento", clima: "umido, salmastro", popolazione: "~4.000",
      gancio: "Nei vicoli della Città Bassa si compra tutto, anche un nome nuovo.",
      mappa: "[[aster.svg]]",
      player_safe: "Il porto più grande della Costa dell'Ombra: moli affollati, mercati che non chiudono mai e una Città Bassa dove conviene tenere una mano sulla borsa.",
      body: {
        Atmosfera: "Nebbia salmastra, legno marcio e lanterne che ondeggiano sui moli. Di giorno è un mercato che non chiude; di notte la Città Bassa appartiene a chi non vuole essere visto.",
        Funzione: "Il porto franco della Costa: tutto passa per Aster, e tutto ha un prezzo — comprese le reliquie che riaffiorano dalle rovine e le cose che nessun'altra città venderebbe.",
      } },
    "Ziggurat Oscura": { tipo: "dungeon", clima: "nebbia perenne",
      gancio: "Sotto le fondamenta, una porta che nessuno ricorda di aver chiuso.",
      player_safe: "Una rovina a gradoni che affiora dalla nebbia nell'entroterra di Aster. I locali la evitano e non ne pronunciano il nome dopo il tramonto.",
      body: {
        Atmosfera: "Gradoni di pietra nera inghiottiti dalla nebbia perenne. Più ci si avvicina, più il silenzio si fa spesso, finché anche il rumore del mare svanisce.",
        Segreto: "La Veglia non la custodisce: la apre. In fondo ai gradoni, oltre la Terza Porta, qualcosa risponde alle loro salmodie.",
      } },
    Chiarombra: { tipo: "insediamento", clima: "ventoso",
      gancio: "L'ultima campana che suona ancora il coprifuoco contro la nebbia.",
      player_safe: "Una città murata che tiene acceso il faro e suona il coprifuoco contro la nebbia: l'ultimo avamposto di legge sulla Costa." },
    "Artiglio Nero": { tipo: "struttura",
      gancio: "Il faro è spento da una stagione, eppure qualcosa lassù risponde ai segnali.",
      player_safe: "Un faro su uno sperone roccioso all'imboccatura della baia di Aster. La sua luce è spenta da una stagione." },
    "Porto Rivombrosa": { tipo: "insediamento", clima: "nebbioso", popolazione: "~1.200",
      gancio: "Da quando la Veglia ci ha messo radici, le barche partono cariche e tornano vuote — e nessuno chiede dove sia finito l'equipaggio.",
      player_safe: "Un piccolo scalo peschereccio avvolto nella foschia, dove di recente attraccano più navi straniere che barche da pesca." },
    "Porto Lontano": { tipo: "insediamento", clima: "battuto dai venti", popolazione: "~800",
      gancio: "L'ultimo scalo prima del mare aperto: chi vuole sparire dalla costa paga i Corsari e si imbarca qui.",
      player_safe: "L'ultimo approdo prima del mare aperto: un pugno di moli battuti dal vento, buon posto per imbarcarsi senza farsi domande." },
    Boscombroso: { tipo: "luogo", clima: "umido, fitto",
      gancio: "Gli alberi crescono storti verso la Ziggurat, e di notte il bosco sussurra in una lingua che nessuno ammette di capire.",
      player_safe: "Una pineta costiera fitta e umida, attraversata da pochi sentieri. Le guide locali preferiscono aggirarla." },
    "Grotta Dimenticata": { tipo: "dungeon", clima: "buio, umido",
      gancio: "I pescatori giurano che là dentro la marea sale anche quando fuori cala — come se qualcosa, sotto, respirasse.",
      player_safe: "Una caverna marina lungo la costa, nota ai pescatori per le maree che non seguono le regole." },
  };
  const { size, places } = im.parseSvgMap(fs.readFileSync(path.join(SRC, "costa_dellombra.svg"), "utf8"));
  const norm = (x) => String(x || "").toLowerCase().replace(/\s+/g, " ").trim();
  const luoghi = places.filter((p) => norm(p.name) !== norm(twin.name));
  const luogoBody = modelBody("Luogo.md");
  for (const p of luoghi) {
    const key = nomeFile(p.name), extra = lore[key] || {};
    write(`Mondi/Luoghi/${key}.md`, fm({
      id: key.toLowerCase().replace(/\s+/g, "-"), nome: p.name, categoria: "luogo",
      tipo: extra.tipo || "luogo", stato: "bozza", mondo: "[[Astaria]]",
      coord: `${p.x}, ${p.y}`, mappa: extra.mappa,
      clima: extra.clima, popolazione: extra.popolazione, gancio: extra.gancio,
      player_safe: extra.player_safe,
      controllata_da: key === "Aster" ? "[[Corsari dell'Ombra]]"
        : key === "Ziggurat Oscura" ? "[[La Veglia dei Sepolti]]" : undefined,
      connessioni: [], sessioni: [], tags: ["gdr/bozza"],
    }) + fillBody(luogoBody, extra.body));
  }
  write("Media/costa_dellombra.svg.markers.json",
    JSON.stringify(im.buildMarkers("Media/costa_dellombra.svg", size, luoghi, (n) => nomeFile(n)), null, 2));
  // Pin CURATO sulla mappa-città di Aster: la sede dei Corsari al porto → completa il
  // drill-down regione → città → fazione. Un solo pin a mano (i toponimi fitti della
  // pianta-città non si parsano puliti: niente auto-pin qui). Link "Corsari dell'Ombra"
  // (identità: il file-fazione ha gli spazi, risolve diretto).
  write("Media/aster.svg.markers.json", JSON.stringify(
    im.buildMarkers("Media/aster.svg", { w: 720, h: 794 },
      [{ name: "Corsari dell'Ombra", x: 319, y: 561 }], (n) => n), null, 2));

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
  }) + fillBody(fazBody, {
    Obiettivo: "Spremere ogni moneta dalla Costa dell'Ombra. Il mare e i suoi traffici sono loro: chi vuole solcarli — o sparire da qui — paga il pedaggio ai Corsari.",
    Metodi: "Squadre veloci, lame discrete e un molo dove non si fanno domande. Pagano bene chi recupera reliquie dalla Ziggurat e dimentica in fretta cosa ha visto laggiù.",
    Segreto: "Non sanno per chi lavorano davvero. Ogni reliquia che strappano alle rovine è un tassello del rito della Veglia: credono di derubare la Ziggurat, e invece la stanno aprendo.",
  }));
  write("Mondi/Fazioni/La Veglia dei Sepolti.md", fm({
    id: "la-veglia-dei-sepolti", nome: "La Veglia dei Sepolti", categoria: "fazione", tipo: "ordine",
    stato: "bozza", mondo: "[[Astaria]]", famiglia: "religiosa", sede: "[[Ziggurat Oscura]]",
    rivali: ["[[Corsari dell'Ombra]]"],
    credo: "Che l'Ombra Sepolta torni a regnare sulla costa; servirla è salvezza.",
    player_safe: "Una confraternita incappucciata che veglia le rovine sotto Aster.",
    gancio: "Cercano le reliquie che i Corsari trafugano — e accolgono come fratelli i naufraghi che «l'Ombra ha scelto».",
    pressione: 6,
    prossima_mossa: "Aprono la Terza Porta della Ziggurat.",
    clock: 4, clock_dim: 6,
    conseguenza: "Il Risveglio si compie: l'Ombra Sepolta cammina di nuovo.",
    connessioni: [], sessioni: [], tags: ["gdr/bozza"],
  }) + fillBody(fazBody, {
    Obiettivo: "Che l'Ombra Sepolta torni a camminare sulla Costa. Ogni reliquia ritrovata, ogni naufrago accolto, ogni porta dischiusa avvicina il Risveglio.",
    Metodi: "Pazienza e fede, non ferro. Lasciano che siano i Corsari, avidi, a portare loro i frammenti del rito — e accolgono come fratelli chi «l'Ombra ha scelto».",
    Segreto: "La confraternita non veglia la Ziggurat: la risveglia. La luce dell'Artiglio Nero è già stata spenta da dentro, da una delle loro mani.",
  }));

  // 5) Un PG d'esempio — la METÀ «al tavolo» che mancava al mondo-esempio. Korbin
  //    Salmastro (Ladro 1 · Umano · Criminale) è la scheda 5.5e prodotta dal wizard
  //    «Crea PG», curata e soprattutto COLLEGATA: mondo → [[Astaria]], fazione →
  //    [[Corsari dell'Ombra]]. Così la demo mostra il loop completo: worldbuilding →
  //    tavolo. Derivati RAW-2024 (CA 14 = cuoio+DES; PF 10 = d8+COS; TS DES/INT; 6
  //    competenze classe+background senza doppioni). Ritratto VUOTO (aggancio immagine).
  write("Mondi/Personaggi/Korbin Salmastro.md", KORBIN_FM + fillBody(modelBody("PG.md"), {
    Ruolo: "Contrabbandiere e galoppino dei **Corsari dell'Ombra**: utile perché non fa domande e conosce ogni vicolo della Città Bassa di Aster.",
    Aspetto: "Magro e nodoso, la pelle cotta dal sale. Una cicatrice gli taglia il sopracciglio sinistro; le mani non stanno mai ferme.",
    Vuole: "Un colpo solo, abbastanza grosso da sparire dalla Costa per sempre — e, un giorno, una nave tutta sua.",
    Teme: "Di finire come l'ultima squadra che i Corsari hanno mandato alla Ziggurat: scomparsa, senza nemmeno un nome inciso sul molo.",
    Storia: "Cresciuto nei vicoli di Aster, dove ha imparato presto che un nome nuovo si compra come tutto il resto. Oggi corre per i Corsari, e finge che il committente scomparso non lo riguardi.",
    Segreto: "Sa più di quanto dica sull'ultima spedizione alla Ziggurat: c'era anche lui, ed è l'unico che ne è tornato indietro.",
  }));

  // 6) Un INCONTRO al tavolo agganciato al mondo: «Guardiani della Terza Porta» alla
  //    Ziggurat — la Veglia che difende il rito. Chiude il loop worldbuilding →
  //    combattimento: luogo + creature SRD (risolte dal bestiario Fantasy Statblocks) +
  //    budget 2024 (pg_livello/pg_numero → difficoltà). Blocco encounter PRE-GENERATO (il
  //    seed non gira Templater, che lascerebbe il tag <% %> grezzo nel name:).
  const encBlock = "```encounter\nname: Guardiani della Terza Porta\nplayers: 4\ncreatures:\n  - 4: Cultista\n  - 1: Ombra\n```";
  write("Mondi/Incontri/Guardiani della Terza Porta.md", fm({
    id: "guardiani-terza-porta", nome: "Guardiani della Terza Porta", categoria: "incontro",
    stato: "bozza", mondo: "[[Astaria]]", luogo: "[[Ziggurat Oscura]]",
    pg_livello: 1, pg_numero: 4,
    creature: ["[[Cultista]]", "[[Cultista]]", "[[Cultista]]", "[[Cultista]]", "[[Ombra]]"],
    gancio: "Oltre la soglia, gli incappucciati della Veglia salmodiano attorno a una porta che non dovrebbe esistere — e qualcosa, dietro, risponde ai loro versi.",
    uso_al_tavolo: "Lo scontro che chiude il primo atto. I Guardiani difendono la Terza Porta, ma accolgono «chi l'Ombra ha scelto»: con la parola (o la faccia) giusta si passa senza sangue. Altrimenti, i cultisti e un'Ombra che cola dalle fessure.",
    connessioni: [], sessioni: [], tags: ["gdr/bozza"],
  }) + fillBody(modelBody("Incontro.md").replace(/```encounter[\s\S]*?```/, encBlock), {
    Obiettivo: "Oltrepassare la soglia che la Veglia difende — con la parola giusta, o con le lame.",
    Complicazione: "I Guardiani accolgono «chi l'Ombra ha scelto»: la faccia o la frase giusta apre la porta senza sangue. Ma un'Ombra cola già dalle fessure, e non distingue gli amici dai nemici.",
    "Posta in gioco": "Dietro la porta c'è il rito della Terza Porta. Se i PG arrivano troppo tardi, il clock del Risveglio avanza — e la nebbia entra a Chiarombra.",
  }));

  // 7) Nota-AHA «Inizia da qui» — la guida-lampo che ADDITA il differenziatore sull'esempio
  //    (lore → Fronti che si auto-ordinano → tavolo, in 3 sguardi su entità reali). Tua-DM
  //    (visibilita: dm), a root per la scoperta; senza `categoria` per non inquinare i cruscotti.
  //    È il momento-aha UX-1, perso nel rebuild della demo e qui restituito; ogni [[link]] punta
  //    a una nota che QUESTO seed crea (Astaria/Corsari/Aster/Veglia/Ziggurat/Korbin/incontro/Fronti).
  const ahaBody = `
# 👋 Inizia da qui — Astaria in 3 sguardi

> [!info] Di sola lettura · tua-DM
> Guida-lampo all'esempio **Astaria**: *vedi* cosa fa il vault prima del foglio bianco. Fuori dal sito giocatori (*visibilita: dm*). Quando cancelli l'esempio per il tuo mondo, **cancella anche questa nota**.

## 1 · La lore — *cosa scrivi*
Apri **[[Astaria]]**: i **[[Corsari dell'Ombra]]** trafficano reliquie dal porto di **[[Aster]]**; **[[La Veglia dei Sepolti]]** veglia (o risveglia?) la **[[Ziggurat Oscura]]**. Worldbuilding come su qualsiasi wiki.

## 2 · La superficie giocabile — *cosa si calcola da sé (il cuore)*
Ma quella lore ha due campi in più — **Pressione** e **Prossima mossa** — e così Astaria, i Corsari e la Veglia non sono voci di wiki: sono **Fronti**, minacce vive con un *clock*. Apri **[[Fronti]]**: un **cruscotto che si ordina da solo** per imminenza, col *Risveglio* (4/6, 🔴 Crisi) in cima. È il differenziatore: la tua lore **compila in un pannello di regia** che si aggiorna mentre giochi — nessun competitor lo fa.

## 3 · Il tavolo — *lo stesso vault*
Lo stesso mondo regge la sessione: **[[Korbin Salmastro]]** è un PG 5.5e collegato ad Astaria e ai Corsari; **[[Guardiani della Terza Porta]]** è un incontro alla Ziggurat, budget 2024 e creature SRD pronte da tirare. Worldbuilding → tavolo, una sola fonte di verità.

> [!tip] E adesso?
> - **Esplora** Astaria: ogni nota ha la sua **ℹ️ Guida** e i suoi **💡 Spunti**.
> - **Fai il tuo mondo**: **[[Crea il tuo mondo]]** ti accompagna dal foglio bianco in 5 tappe.
> - Per il foglio bianco, cancella la cartella **Mondi/** dell'esempio (e questa nota).
`;
  write("Inizia da qui.md", fm({ visibilita: "dm", tags: ["gdr/guida"] }) + ahaBody);

  console.log(`Mondo-esempio «Astaria» creato: ${luoghi.length} luoghi (tutti con lore) + 2 mappe (regionale coi pin + città di Aster) + 2 fazioni in conflitto (Corsari ⚔ Veglia dei Sepolti) + Fronte del Risveglio acceso (clock 4/6) + 1 PG collegato (Korbin) + 1 incontro alla Ziggurat (budget 2024) + nota-guida «Inizia da qui».`);
}

// Frontmatter del PG-esempio: la build del wizard «Crea PG», con in più i CAMPI DI
// COLLEGAMENTO (mondo, fazione) e qualche tratto narrativo per l'infobox. Tenuto come
// stringa grezza perché contiene `classi:` (array di oggetti) che fm() non serializza.
const KORBIN_FM = `---
nome: "Korbin Salmastro"
categoria: personaggio
tipo: pg
mondo: "[[Astaria]]"
fazione: "[[Corsari dell'Ombra]]"
titolo: "Contrabbandiere"
allineamento: "Caotico Neutrale"
pronomi: "lui"
eta: 34
classe: ladro
classi:
  - { id: ladro, livello: 1, sottoclasse: "" }
specie: umano
background: criminale
livello: 1
competenza: 2
taglia: Piccola o Media
velocita: 9
scurovisione: false
ca: 14
pf: 10
pf_max: 10
dado_vita: 8
dadi_vita_max: 1
armatura: cuoio
scudo: false
forza: 8
destrezza: 17
costituzione: 15
intelligenza: 12
saggezza: 13
carisma: 10
mod_forza: -1
mod_destrezza: 3
mod_costituzione: 2
mod_intelligenza: 1
mod_saggezza: 1
mod_carisma: 0
ts_forza: 0
ts_destrezza: 1
ts_costituzione: 0
ts_intelligenza: 1
ts_saggezza: 0
ts_carisma: 0
prof_acrobazia: 1
prof_addestrare_animali: 0
prof_arcano: 0
prof_atletica: 0
prof_furtivita: 1
prof_indagare: 0
prof_inganno: 1
prof_intimidire: 0
prof_intrattenere: 0
prof_intuizione: 1
prof_medicina: 0
prof_natura: 0
prof_percezione: 1
prof_persuasione: 1
prof_rapidita_di_mano: 1
prof_religione: 0
prof_sopravvivenza: 0
prof_storia: 0
tratti_specie: "intraprendente, pluriabilita e un talento Origini a scelta"
competenze_armi: "Armi semplici e armi da guerra con proprieta accurata o leggera."
competenze_armature: "Armature leggere."
competenze_strumenti: "Arnesi da scasso"
lingue:
  - "Comune"
  - "Sottocomune"
  - "Goblin"
privilegi_classe:
  - "Maestria"
  - "Attacco furtivo"
  - "Gergo ladresco"
  - "Padronanza d'armi"
inventario:
  - "armatura di cuoio"
  - "2 pugnali"
  - "spada corta"
  - "arco corto"
  - "20 frecce"
  - "faretra"
  - "arnesi da scasso"
  - "dotazione da scassinatore e 8 mo"
incantatore: false
trucchetti: []
incantesimi: []
talenti:
  - allerta
  - aggressore_selvaggio
padronanze_armi:
  - "Pugnale — Graffio"
  - "Arco corto — Vessazione"
stato: bozza
---
`;

main();
