---
cssclasses:
  - indice
categoria: risorsa
tipo: handoff sviluppo
stato: pronto
---

# Prossima Discussione - YAML Entita Fantasy

Brief operativo storico per la fase **M11 - Pipeline Homebrew D&D 5.5 E Continuita Di Mondo**.

Stato 2026-05-21: la catena M11 e validata da fixture tecnica generata e da `npm run check:m11`. Il documento resta come contratto di prodotto; il lavoro successivo e hardening post-M11, non nuova progettazione della pipeline.

Non e una discussione libera. Si entra con tre interventi grossi, misurabili, interni a Obsidian e coerenti con l'architettura esistente.

## Tesi

Il vault deve evolvere da raccolta di note operative a sistema operativo narrativo persistente.

Una scelta al tavolo deve poter diventare:

1. evento registrato;
2. conseguenza applicabile;
3. propagazione su entita collegate;
4. modifica YAML verificabile;
5. aggiornamento visibile in dashboard e viste operative;
6. materiale concreto per la prossima sessione.

Il modello resta:

- Markdown = contenuto umano.
- YAML = stato persistente e regole dichiarative.
- Dataview = query layer.
- Meta Bind = interfaccia.
- Templater = generazione.
- `z.engine` + `z.automazioni` = runtime/logica/esecuzione.

## Intervento 1 - Contratto Entita Vive End-To-End

Scopo: chiudere il contratto YAML di **luogo + fazione + missione + tracciato** come nucleo minimo di mondo vivo.

Non basta aggiungere campi. Ogni famiglia deve avere identita, uso al tavolo, rete, continuita, pubblicazione e fallback leggibile.

File da toccare:

- `Dev/TemplateFactory/modules/entity_depth.yaml`
- `Dev/TemplateFactory/modules/fields_core.yaml`
- `Dev/TemplateFactory/modules/frontmatter_profiles.yaml`
- `Dev/TemplateFactory/modules/runtime_profiles.yaml`
- `Dev/TemplateFactory/modules/sections.yaml`
- `Dev/TemplateFactory/modules/tabs.yaml`
- `Dev/TemplateFactory/modules/metabind_inputs.yaml`
- `Dev/TemplateFactory/modules/dataview_blocks.yaml`
- `z.engine/session_views.js`
- `z.automazioni/check_vault.js`

Output atteso:

- campi canonici per pressione, posta, prossima mossa, entita impattate, propagazione, pubblicabilita e uso al tavolo;
- sezioni e tab funzionali, non decorative;
- viste DataviewJS che leggono gli stessi campi e non richiedono query duplicate;
- preview TemplateFactory aggiornate e materializzabili;
- fixture o demo generata da script usata come prova reale.

Accettazione:

- almeno una catena `luogo -> fazione -> missione -> tracciato` mostra causa, pressione, conseguenza e prossima apertura;
- `npm run check:templates` blocca superfici plugin usate ma non dichiarate;
- `npm run check:m11` e `npm run check` passano senza warning;
- nessuna nuova dashboard.

## Intervento 2 - Pipeline Homebrew D&D 5.5 Collegata Al Mondo

Scopo: smettere di trattare creature, incontri, oggetti e ricompense come archivio regolamentare isolato.

Le entita D&D 5.5 devono essere pronte al tavolo e collegate al mondo: habitat, fazione, territorio, missione, indizi, ricompense, conseguenze e sessione.

File da toccare:

- `Dev/TemplateFactory/modules/taxonomy_depth.yaml`
- `Dev/TemplateFactory/modules/dnd55_options.yaml`
- `Dev/TemplateFactory/modules/frontmatter_profiles.yaml`
- `Dev/TemplateFactory/modules/runtime_profiles.yaml`
- `z.automazioni/incontro.js`
- `z.automazioni/oggetto.js`
- `Risorse/Iniziativa e Combattimenti.md`
- `Risorse/Materiali Al Tavolo.md`
- `Risorse/Preparazione Sessione.md`
- `z.engine/session_views.js`
- `z.automazioni/check_vault.js`

Output atteso:

- creature homebrew con campi di mondo: habitat, territorio, fazione/culto, segnali, uso al tavolo, conseguenze;
- incontri con `creature`, `encounter_creatures`, luogo, missione, ricompense e pressione;
- oggetti e ricompense che possono essere loot, leva narrativa o prova di continuita;
- viste operative che mostrano materiale pronto senza cercare nel compendio SRD.

Accettazione:

- un incontro di combattimento non passa i controlli se manca materiale minimo per il tavolo;
- una creatura homebrew non resta isolata: deve avere almeno un aggancio a mondo, luogo, fazione, missione o sessione;
- `Materiali Al Tavolo`, `Preparazione Sessione` e `Iniziativa e Combattimenti` leggono gli stessi campi;
- nessuna duplicazione di schema tra YAML D&D e YAML mondo.

## Intervento 3 - Simulazione Narrativa Leggera

Scopo: rendere verificabile la catena **scelta -> evento -> conseguenza -> propagazione -> stato del mondo -> prossima sessione**.

Non serve un motore astratto nuovo. Serve rafforzare il runtime esistente: Meta Bind scrive, JS valida/esegue, Dataview mostra, YAML conserva.

File da toccare:

- `Dev/TemplateFactory/modules/workflows.yaml`
- `z.automazioni/meta_actions.js`
- `z.engine/session_views.js`
- `Mondi/Stato del Mondo.md`
- `Hub/Cosa Succede Fuori Scena.md`
- `Risorse/Post Sessione Guidato.md`
- `Hub/Durante il Gioco.md`
- `z.automazioni/check_vault.js`

Output atteso:

- regole dichiarative piu complete per trigger, condizioni, effetti e propagazioni;
- azioni Meta Bind che applicano conseguenze senza hardcode narrativo;
- stato `propagazione_stato` coerente tra sessione, missione, fazione, luogo, relazione e tracciato;
- viste che distinguono: da applicare, applicato ma non propagato, propagato ma da verificare, chiuso;
- buchi di continuita resi visibili prima della sessione successiva.

Accettazione:

- un evento senza bersagli o stato di propagazione viene segnalato dai check;
- una conseguenza applicata compare in Stato del Mondo e Cosa Succede Fuori Scena;
- la prossima sessione puo pescare aperture da conseguenze non chiuse;
- `prepara-recap-pubblico` resta separato dalla pubblicazione dell'intera sessione.

## Ordine Di Attacco

1. Chiudere Intervento 1 su `missione + tracciato`, perche sono il ponte piu diretto tra scelta e conseguenza.
2. Estendere Intervento 3 alla propagazione reale su luogo/fazione/relazione.
3. Portare Intervento 2 su creatura/incontro/ricompensa, usando lo stesso contratto di continuita.

## Decisioni Da Prendere Subito

- Scenario di prova: usare una fixture generata da script, non note demo mantenute a mano.
- Prima catena: missione -> fazione -> luogo -> tracciato/clock collegato.
- Gate obbligatori: `npm run check`, `npm run check:templates`, `npm run check:smoke` solo se cambia una superficie utente.
- Niente nuove dashboard: si migliorano `Stato del Mondo`, `Cosa Succede Fuori Scena`, `Preparazione Sessione`, `Durante il Gioco`, `Post Sessione Guidato`.

## Non Fare

- Non creare web app, backend, database o runtime esterni.
- Non spostare source of truth fuori dal vault.
- Non aggiungere campi enciclopedici senza uso al tavolo o continuita.
- Non creare mini linguaggi custom in YAML.
- Non duplicare schema tra mondo, sessione e D&D 5.5.
- Non aggiungere dashboard per mascherare campi deboli.
- Non scrivere documentazione nuova se l'informazione appartiene a roadmap, handoff, sviluppo vault o TemplateFactory.

## Definition Of Done M11

M11 e chiusa solo quando:

- esiste una catena demo completa dalla scelta giocatore alla propagazione;
- almeno una famiglia mondo e una famiglia D&D 5.5 sono collegate dallo stesso modello di continuita;
- i campi nuovi sono dichiarati in YAML prima di apparire nei template;
- le azioni Meta Bind aggiornano YAML verificabile;
- le viste DataviewJS mostrano il risultato senza query duplicate sparse;
- `npm run check` passa senza warning;
- la documentazione di sviluppo resta concentrata in [[Dev/README]], [[Dev/NEXT_PHASE_HANDOFF]], [[Dev/Sviluppo Vault]] e [[Dev/TemplateFactory/README]].
