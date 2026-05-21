---
cssclasses:
  - indice
categoria: risorsa
tipo: handoff sviluppo
stato: pronto
---

# Prossima Discussione - YAML Entita Fantasy

Obiettivo: usare YAML come centro di controllo per aumentare la profondita delle entita fantasy senza disperdere logica in JS, Markdown manuale o dashboard nuove.

La discussione deve partire da una domanda stretta: quali campi, sezioni, tab, callout, viste, bottoni e fallback servono davvero a rendere ogni entita piu profonda, giocabile, collegata e pubblicabile?

## Direzione

Priorita architetturale:

1. `fields_core.yaml` definisce il vocabolario canonico.
2. `frontmatter_profiles.yaml` ordina i campi, i default, i sample e le integrazioni fileClass/Bases.
3. `runtime_profiles.yaml` governa prompt, scelte guidate e default dei wizard.
4. `sections.yaml`, `tabs.yaml`, `callouts.yaml`, `metabind_inputs.yaml`, `metabind_buttons.yaml` e `dataview_blocks.yaml` dichiarano il corpo operativo.
5. Jinja compone solo Markdown statico.
6. JS resta sottile: raccoglie input, applica azioni atomiche, renderizza viste riusabili.

Regola: se una scelta migliora lore, tavolo o continuita, prima deve diventare contratto YAML leggibile.

## Entita Da Valutare

### Worldbuilding Core

- Mondo
- Luogo
- Cultura
- Religione/culto
- Societa
- Lingua
- Cosmologia
- Conflitto
- Evento storico
- Relazione

Domande:

- Quale livello di profondita serve per diventare materiale da manuale?
- Quale campo trasforma descrizione in scelta giocabile?
- Quale campo collega l'entita a luogo, fazione, missione, sessione o conseguenza?
- Quale parte deve essere player-safe?
- Quale parte deve restare DM-only?

### Tavolo E Campagna

- Campagna
- Missione
- Sessione
- Tracciato/clock
- Incontro
- Dispensa
- Mappa

Domande:

- Quale campo dice cosa fanno i giocatori?
- Quale campo dice cosa succede se ignorano?
- Quale campo produce prep rapida?
- Quale campo deve alimentare `Durante il Gioco`, `Post Sessione Guidato`, `Vista Giocatori` e `Motore Mondo Vivo`?

### D&D 5.5 / SRD / Fantasy

- Creatura
- PNG/PG
- Oggetto
- Oggetto magico
- Incontro di combattimento
- Ricompensa

Domande:

- Dove serve regola e dove serve fiction?
- Quali campi devono essere compatibili con Fantasy Statblocks e Initiative Tracker?
- Quali campi trasformano una creatura in presenza del mondo: habitat, culto, fazione, territorio, indizi, conseguenze?
- Quali oggetti devono essere solo loot e quali devono essere leve narrative?

## Migliorie YAML Da Discutere

### Profondita Lore

Valutare campi dichiarativi per:

- origine e causa;
- tensione interna;
- dipendenza materiale;
- versione pubblica;
- versione DM;
- simboli visibili;
- tabù o legge;
- bisogno quotidiano;
- costo sociale;
- indizi;
- segreti stratificati;
- effetto sul mondo;
- evoluzione se ignorata.

Output atteso: aggiornare `fields_core.yaml` e `frontmatter_profiles.yaml`, non aggiungere solo testo nei template.

### Giocabilita

Valutare campi per:

- gancio;
- scelta concreta;
- posta;
- rischio;
- ricompensa;
- pressione;
- prossima mossa;
- scena pronta;
- ostacolo;
- clock collegato;
- materiale player-facing.

Output atteso: sezioni YAML riusabili in `sections.yaml` e tab funzionali in `tabs.yaml`.

### Continuita

Valutare campi per:

- causa;
- conseguenze;
- entita impattate;
- propaga a;
- aggiornamenti richiesti;
- stato propagazione;
- applicata a;
- ultima propagazione;
- prossima apertura;
- memoria pubblica.

Output atteso: profili e Dataview block che alimentano `renderContinuityQueue`, `renderPropagationTargets`, `renderContinuityGaps` e `renderM7FamilyCards`.

### Pubblicabilita

Valutare campi per:

- testo da manuale;
- player-safe;
- DM-only;
- fonte;
- stato canonico;
- contraddizioni;
- retcon;
- tag di uso: tavolo, atlante, campagna, manuale, player handout.

Output atteso: controlli YAML/fileClass/Bases per distinguere materiale giocabile, pubblicabile e privato.

## Integrazioni Plugin Da Valutare

Non aggiungere plugin nuovi. Usare quelli installati dove alzano controllo o UX.

| Plugin | Valutazione YAML |
| --- | --- |
| Meta Bind | Ogni campo profondo ricorrente merita input canonico in `metabind_inputs.yaml`? |
| Dataview/DataviewJS | Ogni controllo ricorrente merita blocco in `dataview_blocks.yaml` invece di query manuale? |
| Tabs | Ogni famiglia ha tab con funzione reale: identita, tavolo, rete, continuita, pubblicazione? |
| Callouts | Ogni callout rappresenta un tipo di lavoro: scena, scelta, pressione, segreto, lettura, mappa, regia? |
| Bases | Quali famiglie devono avere vista editabile per correzione massiva? |
| Metadata Menu | Quali campi devono diventare fileClass guidati? |
| Tasks | Quali checklist sono lavoro reale del DM e non testo decorativo? |
| Excalidraw/Canvas/Maps | Quali entita meritano mappa/graph: relazioni, fronti, territori, dungeon, indizi? |
| Calendarium | Quali entita hanno date o scadenze diegetiche? |
| Fantasy Statblocks / Initiative Tracker | Quali creature e incontri devono diventare subito usabili al tavolo? |
| Dice Roller | Quali tabelle producono contenuto utilizzabile e collegabile? |

## Criteri Di Accettazione

La prossima fase e valida solo se produce:

- YAML aggiornato prima dei template;
- preview TemplateFactory coerenti;
- `npm run check:templates` che blocca nuove superfici plugin non dichiarate;
- almeno una famiglia entita migliorata end-to-end;
- nessuna nuova dashboard;
- nessun callout decorativo;
- ogni tab con una funzione reale;
- fallback Markdown leggibile;
- controlli automatici o smoke manuale per cio che non e testabile staticamente.

## Prima Famiglia Consigliata

Partire da **luogo + fazione + missione + tracciato**.

Motivo: sono il nucleo che collega worldbuilding, sessione e continuita. Se questi quattro diventano profondi e controllati da YAML, il resto del vault puo seguire lo stesso pattern.

Sequenza proposta:

1. Rafforzare campi YAML di profondita per `luogo`, `fazione`, `missione`, `tracciato`.
2. Aggiornare `runtime_profiles.yaml` con prompt migliori, non piu lunghi ma piu mirati.
3. Aggiornare `sections.yaml` e `tabs.yaml` con sezioni comuni: identita, tavolo, rete, pressione, continuita, pubblicazione.
4. Aggiornare `metabind_inputs.yaml` solo per campi ricorrenti.
5. Aggiornare `dataview_blocks.yaml` con controlli riusabili.
6. Renderizzare preview, verificare diff, poi materializzare.
7. Aggiornare demo `Sale Sotto La Nebbia` per provare i nuovi contratti.

## Non Fare

- Non aggiungere campi solo per completezza enciclopedica.
- Non creare una nuova dashboard.
- Non spostare logica nei Jinja se puo stare in YAML.
- Non aggiungere query Dataview inline duplicate.
- Non rendere ogni entita una scheda enorme: profondita significa decisioni migliori, non piu rumore.
- Non introdurre automazioni che canonizzano contenuto senza scelta del DM.
