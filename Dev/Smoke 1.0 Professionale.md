---
cssclasses:
  - indice
categoria: risorsa
tipo: controllo
stato: pronto
---

# Smoke 1.0 Professionale

Checklist visuale prima di dichiarare pronta qualunque release 1.0.

## Regola

Ogni voce va verificata in Obsidian, non solo con `npm run check`. L'obiettivo e confermare che un DM non tecnico possa usare il vault senza conoscere plugin, YAML, Dataview o cartelle interne.

## Primo Avvio

- [ ] [[Inizia Qui]] si apre come prima pagina.
- [ ] Il primo schermo mostra chiaramente crea mondo, prepara, gioca, aggiorna e giocatori.
- [ ] I pulsanti principali aprono o creano contenuti senza errori.
- [ ] Nessun testo chiede di modificare YAML a mano.

## Crea Mondo

- [ ] [[z.modelli/wizard/Nuovo Mondo Homebrew]] crea un mondo con identita, tono, scala, conflitto e spina dorsale.
- [ ] Il mondo creato rimanda a luoghi, poteri, culture, mistero e pressione.
- [ ] [[Worldbuilder Dashboard]] mostra cosa manca e quale passo fare dopo.
- [ ] Le mappe visuali e le viste Bases collegate sono raggiungibili.

## Espandi Mondo

- [ ] I router creativi creano note senza far scegliere nomi file tecnici.
- [ ] Le note create hanno uso al tavolo, player-safe, connessioni e prossima mossa quando serve.
- [ ] [[z.bases/Worldbuilding.base]], [[z.bases/Fazioni.base]], [[z.bases/Economia.base]] permettono correzione rapida.
- [ ] Metadata Menu mostra campi coerenti per i tipi principali.

## Mappe

- [ ] [[Risorse/Mappe/Mappe]] mostra mappe pubbliche, DM, politiche, commerciali, religiose e conflitti.
- [ ] [[z.bases/Atlante Mappe.base]] mostra marker con `coordinates`, `icon` e `color` dove presenti.
- [ ] Le mappe Excalidraw rimandano a note canoniche.
- [ ] Le mappe zoomabili o esagonali hanno fallback Markdown leggibile.

## Prepara Sessione

- [ ] [[Risorse/Preparazione Sessione]] richiede mondo e almeno tre ancore.
- [ ] La sessione pronta ha obiettivo, prima scena, scelta, pressione e materiale.
- [ ] Incontri, tabelle, media, ricompense e mappe sono raggiungibili dalla preparazione.
- [ ] [[Risorse/Task DM]] mostra solo task operative.

## Gioca Live

- [ ] [[Durante il Gioco]] mostra la sessione attiva e non un archivio generico.
- [ ] Appunti live, conseguenze, PNG e luoghi improvvisati si creano da pulsanti.
- [ ] Initiative Tracker e Fantasy Statblocks sono usabili negli incontri di combattimento.
- [ ] Dice Roller produce risultati leggibili da tabelle stabili.
- [ ] Media Extended mostra solo media pronti quando esistono.

## Post-Sessione

- [ ] [[Risorse/Post Sessione Guidato]] chiude appunti, canone, rumor, conseguenze e prossima sessione.
- [ ] [[z.bacheche/Post Sessione]] guida il lavoro operativo senza duplicare lore.
- [ ] Conseguenze aggiornano missioni, PNG, luoghi, fazioni, clock o timeline.
- [ ] Il calendario resta selezionabile e non forza un unico mondo.

## Vista Giocatori

- [ ] [[Vista Giocatori]] non mostra segreti, prossime mosse DM o retroscena.
- [ ] Recap, mappe, dispense e personaggi pubblici sono leggibili.
- [ ] Il controllo anti-segreti non segnala esposizioni.
- [ ] Il portale resta utile anche senza pubblicazione esterna.

## Manutenzione

- [ ] `npm run check` passa.
- [ ] `git diff --check` passa.
- [ ] [[Risorse/Controllo Vault]] e [[Risorse/Quality Report]] non mostrano blocchi critici.
- [ ] [[z.bacheche/Manutenzione Vault]] contiene solo task tecniche o operative, non fiction.
- [ ] `npm run release:clean` genera una ZIP senza file di sviluppo.

## Demo Finale

- [ ] La demo e creata solo dopo il completamento dei flussi precedenti.
- [ ] Ogni nota demo usa template ufficiali.
- [ ] Ogni elemento demo passa controlli, mappe, player-safe e smoke visuale.
