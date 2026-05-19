# Vault GDR

Questo vault Obsidian aiuta a preparare e gestire campagne GDR: mondi, sessioni, PNG, luoghi, fazioni, missioni, incontri, oggetti e materiali da consegnare ai giocatori.

Apri [[1. DM Dashboard]] per preparare e giocare. Usa [[Worldbuilder Dashboard]] per costruire il mondo. Durante la sessione usa [[Durante il Gioco]].

## Primi 5 Minuti

1. Apri il vault in Obsidian e vai su [[1. DM Dashboard]].
2. Se Obsidian chiede conferma per i plugin community, abilitali: il vault usa plugin gia configurati per dashboard, pulsanti e tabelle.
3. Crea o apri una campagna da [[Campagne/Campagne]].
4. Crea una sessione con il pulsante `Nuova Sessione` dalla dashboard.
5. Durante la partita apri [[Durante il Gioco]] per appunti, incontri, PNG, dispense e materiali pronti.

Se dashboard, pulsanti o tabelle non funzionano, apri [[Risorse/Installazione Plugin]] e poi [[Risorse/Se Qualcosa Non Funziona]].

## Flusso Consigliato

1. Crea o apri una campagna da [[Campagne/Campagne]].
2. Scegli il mondo di riferimento dalla [[Worldbuilder Dashboard]].
3. Prepara la prossima sessione con [[Risorse/Preparazione Sessione]].
4. Crea solo le entita davvero utili al tavolo: PNG, luoghi, missioni, incontri, oggetti e dispense.
5. Collega le note usando i campi interattivi.
6. Durante il gioco usa [[Durante il Gioco]] per appunti, timer, PNG attivi, incontri pronti e dispense.
7. Dopo la sessione sposta gli appunti importanti nelle note giuste e aggiorna gli stati.

## Dove Trovare Le Cose

- `Campagne`: campagne attive, in pausa, concluse o archiviate.
- `Mondi`: ambientazioni, luoghi, personaggi, fazioni, religioni, creature, oggetti e dispense.
- `Mondi/Sessioni`: preparazione e resoconti delle sessioni.
- `Mondi/Missioni`: incarichi, trame aperte e obiettivi.
- `Mondi/Incontri`: scene di conflitto, ostacoli e combattimenti pronti.
- `Risorse`: mappe, immagini, audio, video, tabelle e dispense generiche.
- `SRD`: riferimento separato al System Reference Document 5.2.1 in italiano.
- `Inbox`: idee grezze e appunti non ancora sistemati.

## Mondo, Campagna E Risorse

- Un **mondo** contiene cio che esiste nell'ambientazione: luoghi, popoli, fazioni, religioni, creature, oggetti e verita canoniche.
- Una **campagna** raccoglie cio che accade al tavolo: party, sessioni, missioni, conseguenze e ricompense.
- **Avventure** e **one-shot** stanno nella campagna quando sono legate a un gruppo o a una storia precisa.
- Tabelle, mappe, dispense e materiali riutilizzabili in piu campagne stanno in `Risorse`.

## Uso Quotidiano

- Usa `bozza` per contenuti incompleti.
- Usa `pronto` per materiale utilizzabile al tavolo.
- Usa `archiviata` per contenuti da conservare ma non piu attivi.
- Usa `canonico: true` solo quando un contenuto e confermato nel mondo di gioco.
- Mantieni `SRD` separato dal contenuto canonico: e riferimento regolamentare, non ambientazione.

## Manutenzione Leggera

- Non lasciare link placeholder: crea la nota o trasforma il link in testo semplice.
- Archivia invece di cancellare quando una nota ha valore storico.
- Dopo una sessione, aggiorna missioni, PNG, luoghi visitati, ricompense e conseguenze.
- Per controlli, template, automazioni e sviluppo del vault, vedi [[Risorse/Sviluppo Vault]].
- Per preparare una release o una copia pulita, apri [[Risorse/Controllo Vault]] e risolvi stati anomali, campi base mancanti e materiale pronto incompleto.
- Non modificare manualmente le note in `SRD` se non sai cosa stai facendo: sono generate da `z.automazioni/import_srd.js` e possono essere rigenerate.

## SRD

`SRD` contiene il System Reference Document 5.2.1 in italiano come archivio regolamentare separato dal contenuto del mondo. Per rigenerarlo usa:

```bash
node z.automazioni/import_srd.js
```

Le note SRD generate hanno `generato_da: import_srd`. Se vuoi preservare una modifica manuale a una nota SRD, rimuovi o cambia quel campo prima di rigenerare.

## Licenza

- Il vault e i suoi contenuti sono rilasciati con licenza **CC BY-NC-SA 4.0**. Vedi [[LICENSE]].
- Gli script originali in `z.automazioni` sono rilasciati con licenza **MIT**. Vedi [[z.automazioni/LICENSE]].
- Il materiale in `SRD` mantiene la propria licenza **CC-BY-4.0** e non e coperto dalla licenza del vault. Vedi [[SRD/Licenza SRD]].
