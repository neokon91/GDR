# ⚔️ Guida al combattimento

Come si gioca uno scontro con i plugin **Initiative Tracker + Fantasy Statblocks +
Dice Roller**. Insieme danno l'**automazione di combattimento da tavolo** (iniziativa,
PF, condizioni, dadi cliccabili). *Non* una mappa tattica con token: per il
posizionamento si usa il *theatre-of-the-mind* o una mappa di scena (tab *Mappa*).

## 0. Preparazione (una volta sola)
1. Apri le impostazioni di **Initiative Tracker** → sezione **Parties/Players**.
2. C'è già un party **«Gruppo»** (vuoto): aggiungi i tuoi PG puntandoli alle note in
   `Mondi/Personaggi` (nome, PF, CA, livello). Da qui in poi `players: true` nei blocchi
   incontro includerà automaticamente il gruppo.
3. Le **15 condizioni 5.5e** sono già caricate come **status** del tracker (in italiano):
   applicabili/rimovibili sui combattenti, non solo consultabili.

## 1. Avviare l'incontro
- Da una nota **Incontro** (tab *Combattimento*): il blocco ` ```encounter ` è già
  pronto. Il bottone **Aggiorna encounter** lo riscrive dalle *Creature* e dagli
  *Alleati* collegati (gli alleati col flag `ally`); il campo `varianti` applica gli
  override PF/CA/iniziativa (boss potenziato, gregario indebolito).
- Oppure da uno **statblock**: i bottoni **«Avvia incontro»** / **«Aggiungi al tracker»**
  popolano il tracker dalla scheda creatura in un clic.

## 2. Il giro di combattimento (cosa è automatico)
1. **Iniziativa** — il tracker la **tira da solo** per i mostri e ordina i turni (i PG
   secondo l'impostazione che scegli). I PF iniziali si tirano dai Dadi Vita se attivo.
2. **Turni/round** — avanzi col pulsante; il contatore dei round sale da sé.
3. **Tirare un attacco** — nello statblock della creatura, **clicca il dado** del tiro
   per colpire e del danno (Dice Roller). *Decidi tu* se colpisce contro la CA del bersaglio.
4. **Applicare il danno** — clicca i **PF** del bersaglio nel tracker e inserisci il numero.
   Toggle **salvato/resistenza** = ×0,5. A **0 PF** la creatura diventa *Privo di sensi*
   in automatico.
5. **Condizioni** — applica/rimuovi gli status (le 15 condizioni) sui combattenti.

## 3. Cosa resta al DM (limiti dei plugin)
- Decidere **colpito vs CA** e l'esito dei **tiri salvezza** (i toggle dimezzano solo il
  numero che digiti — non c'è un tiro-salvezza di gruppo automatico).
- **Durate** delle condizioni e check di **concentrazione** (la condizione *Concentrazione*
  è un'etichetta, non scade da sola).
- **Posizione e mappa tattica**: non c'è griglia/token. Usa una mappa di scena come sfondo
  e gestisci le distanze a voce.

## 4. Creature homebrew giocabili
Una creatura con solo il **Grado di sfida (GS)**: nel tab *Statblock 5.5e* premi **Genera
dal GS** → riempie AC/PF/iniziativa + **multiattacco** e un attacco col bonus/danno tipici
della sua fascia. Il pannello **📐 Coerenza GS** segnala se i numeri (rifiniti a mano)
restano dentro il GS dichiarato. Poi aggiungi la creatura al tracker come le altre.
