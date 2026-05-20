---
cssclasses:
  - indice
categoria: risorsa
tipo: plugin
stato: pronto
---

# Installazione Plugin

Questa pagina serve al primo avvio del vault.

Il vault usa plugin gia configurati per far funzionare dashboard, pulsanti, tabelle, schede mostro, bacheche e campi interattivi. Se Obsidian chiede se fidarsi dei plugin community, conferma solo se hai scaricato il vault da una fonte affidabile.

Prima di usare dashboard, pulsanti e template, verifica che almeno i plugin obbligatori siano abilitati.

Per sapere quali plugin sono installati, che versione hanno e come sfruttarli nel flusso GDR, apri [[Risorse/Recap Plugin Installati]].

## Obbligatori

| Plugin | Serve per | Se manca |
| --- | --- | --- |
| Dataview | Tabelle, dashboard, controlli e riepiloghi automatici | Le viste restano vuote o mostrano codice |
| Templater | Creazione guidata di sessioni, missioni, PNG, luoghi e contenuti | I pulsanti di creazione non producono note corrette |
| Meta Bind | Pulsanti, campi interattivi e selettori dentro le note | Dashboard e template diventano meno usabili |
| JS Engine | Supporto ad alcune viste dinamiche | Alcuni blocchi avanzati possono non funzionare |
| Metadata Menu | Gestione coerente dei campi delle note | I campi restano modificabili ma meno guidati |
| Folder Notes | Indici collegati alle cartelle | Alcune cartelle sono meno comode da aprire |
| Homepage | Apertura automatica della dashboard | Devi aprire manualmente [[1. DM Dashboard]] |

## Consigliati Per Giocare

| Plugin | Serve per | Se manca |
| --- | --- | --- |
| Kanban | Bacheche di preparazione e post-sessione | Le bacheche sono meno efficaci |
| Callout Manager | Callout GDR riconoscibili | I blocchi restano leggibili ma meno chiari |
| Fantasy Statblocks | Schede creature e mostri | Le creature non vengono renderizzate come statblock |
| Dice Roller | Tiri rapidi e tabelle casuali | I comandi `dice:` restano testo |
| Initiative Tracker | Ordine di iniziativa e combattimenti | Gli incontri vanno gestiti manualmente |
| Calendarium | Date del mondo e scadenze narrative | Le date restano solo testo |

## Consigliati Per Worldbuilding

| Plugin | Serve per | Se manca |
| --- | --- | --- |
| Excalidraw | Mappe, relazioni e schemi visuali | Le mappe Excalidraw non sono modificabili |
| Media Extended | Audio e video da usare al tavolo | I media restano semplici link o file |
| Generatore di Contenuti Fantasy | Spunti rapidi in italiano | Devi creare gli spunti a mano |
| Iconize | Icone su cartelle e note | Cambia solo l'orientamento visuale |
| Tabs | Sezioni a schede nei template lunghi | Il contenuto resta leggibile in sequenza |
| Style Settings | Regolazioni visuali di Minimal e dello snippet GDR | Il preset funziona, ma non puoi modificarlo da interfaccia |

## Opzionali

- Advanced Tables: comodo per modificare tabelle Markdown.
- Emoji Toolbar: solo supporto visuale.
- Hex Cartographer e TTRPG Tools: Maps: utili solo se usi mappe dedicate.
- Iron Vault: usalo solo per campagne Ironsworn o Starforged.
- BRAT: solo per manutenzione o plugin non pubblicati.

## Dopo L'Installazione

1. Apri [[1. DM Dashboard]].
2. Apri [[Risorse/Controllo Vault]].
3. Se vedi errori, apri [[Risorse/Se Qualcosa Non Funziona]].
4. Se tutto appare correttamente, crea una sessione di prova o usa le note `Prova -`.

## Per Chi Mantiene Il Vault

I plugin inclusi in `.obsidian/plugins` fanno parte del funzionamento custom del vault: non sono accessori da rimuovere in una copia di release.

Per una release o una copia da distribuire, esegui anche questo controllo tecnico:

```bash
node z.automazioni/check_vault.js
```
