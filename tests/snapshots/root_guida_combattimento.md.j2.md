# ⚔️ Guida al combattimento

Come si gioca uno scontro con la **Board di combattimento** nativa del plugin GDR: il motore
event-sourced di *regole* fa iniziativa, turni, PF, tiri (colpire / salvezza / danno) e le
**condizioni con i loro effetti**. Nessun plugin di terze parti. *Non* è una mappa tattica con
token: per il posizionamento si usa il *theatre-of-the-mind* o una mappa di scena (tab *Mappa*).

## 0. Preparazione (una volta sola)
Crea i tuoi **PG** (comando **«GDR: Crea PG»**). La Board li riconosce come il tuo
schieramento: entrano dalla tua parte con CA, PF, bonus d'iniziativa e tiri salvezza già
calcolati dalla scheda.

## 1. Schierare l'incontro
- Da una nota **Incontro** (tab *Combattimento*), con la nota aperta lancia
  **«GDR: Schiera l'incontro nella Board»**: le *Creature* collegate diventano nemici, gli
  *Alleati* e i tuoi **PG** entrano dalla tua parte, e gli override `varianti` (PF/CA) si
  applicano. La Board si apre **pre-popolata**, pronta per l'iniziativa.
- Oppure apri la Board dal **Cruscotto DM** (bottone **«⚔️ Board di combattimento»**) e
  aggiungi i combattenti a mano: **➕ Nemico** / **➕ Alleato** li pescano dal bestiario SRD.

## 2. Il giro di combattimento (cosa fa il motore)
1. **🎲 Iniziativa** — un clic tira l'iniziativa di tutti e ordina i turni; la battaglia parte.
2. **⏭️ Passa turno** — avanza al prossimo; il contatore dei round sale da sé.
3. **Azioni di turno** — per il combattente attivo compaiono le sue azioni eseguibili
   (attacchi, incantesimi, multiattacco): scegli il **bersaglio** e il motore **risolve il tiro
   per colpire contro la CA**, il **danno** e gli eventuali **tiri salvezza** (i PG li tirano da
   soli). Niente da calcolare a mano.
4. **PF** — i pulsanti **−** / **+** sul combattente infliggono danno o curano; a **0 PF**
   scatta *Privo di sensi* in automatico.
5. **Condizioni vere** — **＋stato** applica una condizione: i suoi effetti (vantaggio/
   svantaggio ai tiri, salvezza automaticamente fallita…) entrano **da soli** nei tiri
   successivi — non sono solo etichette.

## 3. Cosa resta al DM
- **Posizione e distanze**: non c'è griglia né token — *theatre-of-the-mind* o una mappa di
  scena come sfondo, distanze a voce.
- **Durate narrative** e le scelte di trama (quando finisce un effetto «a scelta del GM»).

## 4. Creature homebrew giocabili
Una creatura con solo il **Grado di sfida (GS)**: nel tab *Statblock* premi **Genera dal GS**
→ riempie CA/PF + **multiattacco** e un attacco col bonus/danno tipici della sua fascia, già
nella forma nativa. Il pannello **📐 Coerenza GS** segnala se i numeri (rifiniti a mano)
restano dentro il GS dichiarato. Lo statblock nativo è subito schierabile nella Board.

## 5. Richiamo rapido dei termini
Condizioni, maestrie delle armi e ordini di bastione — tutti in un posto solo:
**[[Glossario|📖 Glossario dei termini di gioco]]**.
