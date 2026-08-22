<% await tp.user.crea_creatura(tp) %>
# `=this.nome`

> [!infobox|creatura] 🐾 Creatura
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Taglia** | `INPUT[taglia][:taglia]` |
> | **Grado di sfida** | `INPUT[gs][:gs]` |
> | **Ruolo ecologico** | `INPUT[ruolo_ecologico][:ruolo_ecologico]` |
> | **Dieta** | `INPUT[dieta][:dieta]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Tipo**: `INPUT[inlineSelect(option(aberrazione), option(bestia), option(celestiale), option(costrutto), option(drago), option(elementale), option(fata), option(gigante), option(immondo), option(melma), option(mostruosita), option(non-morto), option(umanoide), option(vegetale)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Creatura
> **Cos'è** · Una creatura giocabile: il lore (ecologia, mito, tattiche) sopra e lo statblock 5.5e nel blocco dati per iniziativa e attacchi.
> **Campi chiave** · **Tipo** + **GS** (pesa la difficoltà degli incontri) + lo **statblock** che la rende combattibile; **Habitat**/**Specie** la agganciano al mondo.
> **Spunti** · Cosa la rende pericolosa al di là dei numeri? Come caccia o si difende? Che leggenda raccontano di lei i popoli vicini?

````tabs
--- 🐉 Statblock

```gdr statblock
nome: <% tp.config.target_file.basename %>
taglia: media
tipo: umanoide
allineamento: neutrale
ca: {valore: 10}
caratteristiche:
  forza: {valore: 10}
  destrezza: {valore: 10}
  costituzione: {valore: 10}
  intelligenza: {valore: 10}
  saggezza: {valore: 10}
  carisma: {valore: 10}
dadi_vita: 2
velocita: {camminata: 9}
gs: "1"
percezione_passiva: 10
lingue: [Comune]
tratti: []
azioni: []
```

> [!tip]- 🎲 Genera dal Grado di sfida
> Imposta il **GS** (tab *Lore*) e premi: lo statblock qui sopra si riempie coi valori base dei mostri SRD di pari GS (CA/PF + multiattacco e un attacco col bonus e il danno tipici). Poi rifinisci a mano (tratti, resistenze, leggendarie).
> `BUTTON[genera-statblock]`

```gdr
renderVerificaGS
```

--- 🎲 Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[textArea(placeholder(es. i PG possono corrompere la guardia per entrare di notte)):uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[textArea(placeholder(es. una taglia sul suo capo che nessuno osa riscuotere)):gancio]`

> [!info]- 👁 Condivisione coi giocatori
> Rivelazione attuale: `VIEW[{rivelazione} ?? "—"]` — *si imposta in **⚙️ Opzioni*** (per non avere due controlli sullo stesso campo).
> Quando questa nota entra nel **sito dei giocatori** (lo generi con un clic da **[[Occhi del giocatore]]**), decide cosa i PG vedono.
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.
--- 📖 Lore

```gdr
renderTipoProfilo
```

> [!note]- Aspetto e indole
> Com'è fatta, come si muove, che impressione dà. I numeri sono nel tab Statblock.

> [!quote]- Versione player-safe
> `INPUT[text(placeholder(cosa possono sapere i giocatori)):player_safe]`

%%prosa%%
## Ecologia
> [!question]- 💡 Ecologia: habitat, ruolo nell'ecosistema, dieta

## Aspetto
> [!question]- 💡 Aspetto: taglia, corporatura, tratti distintivi, segni di pericolo

## Comportamento
> [!question]- 💡 Comportamento: indole, abitudini, come caccia o si difende

## Tattiche
> [!question]- 💡 Tattiche in combattimento (apertura, asso nella manica, fuga)

## Mito e reputazione
> [!question]- 💡 Mito e reputazione (leggende, come la vedono le civilta')

> [!rivela|segreto]- Segreto
> 💡 *Segreto o debolezza nascosta*
>

%%/prosa%%

--- 📊 Carattere

```gdr
radar creatura
```

> [!abstract] Carattere
> **Indole** `INPUT[slider(minValue(1), maxValue(5), addLabels):indole]` → `VIEW[{indole} == 5 ? "5 · Feroce" : ({indole} == 4 ? "4 · Aggressiva" : ({indole} == 3 ? "3 · Territoriale" : ({indole} == 2 ? "2 · Schiva" : ({indole} == 1 ? "1 · Docile" : ("—")))))]`
> **Socialità** `INPUT[slider(minValue(1), maxValue(5), addLabels):socialita]` → `VIEW[{socialita} == 5 ? "5 · Ipercollettiva" : ({socialita} == 4 ? "4 · Comunitaria" : ({socialita} == 3 ? "3 · Aggregativa" : ({socialita} == 2 ? "2 · Individualista" : ({socialita} == 1 ? "1 · Solitaria" : ("—")))))]`
> **Mobilità** `INPUT[slider(minValue(1), maxValue(5), addLabels):mobilita]` → `VIEW[{mobilita} == 5 ? "5 · Errante" : ({mobilita} == 4 ? "4 · Migratoria" : ({mobilita} == 3 ? "3 · Adattiva" : ({mobilita} == 2 ? "2 · Territoriale" : ({mobilita} == 1 ? "1 · Radicata" : ("—")))))]`
> **Natura** `INPUT[slider(minValue(1), maxValue(5), addLabels):natura]` → `VIEW[{natura} == 5 ? "5 · Aberrante" : ({natura} == 4 ? "4 · Magica" : ({natura} == 3 ? "3 · Toccata" : ({natura} == 2 ? "2 · Insolita" : ({natura} == 1 ? "1 · Mondana" : ("—")))))]`
> **Intelletto** `INPUT[slider(minValue(1), maxValue(5), addLabels):intelletto]` → `VIEW[{intelletto} == 5 ? "5 · Geniale" : ({intelletto} == 4 ? "4 · Sapiente" : ({intelletto} == 3 ? "3 · Senziente" : ({intelletto} == 2 ? "2 · Astuto" : ({intelletto} == 1 ? "1 · Istintivo" : ("—")))))]`

> [!note]- Indole — Disposizione della creatura verso chi incontra.
> **1 · Docile** — Mansueta, non aggressiva; fugge o ignora più che attaccare.
> **2 · Schiva** — Diffidente; evita il contatto, reagisce solo se messa alle strette.
> **3 · Territoriale** — Tollerante finché non si invade il suo spazio; allora difende.
> **4 · Aggressiva** — Incline all'attacco; caccia o assale per istinto o fame.
> **5 · Feroce** — Ostile e spietata; uccide oltre il bisogno, vive per la violenza.

> [!note]- Socialità — Grado di coesione e struttura sociale della creatura.
> **1 · Solitaria** — Vive e caccia da sola; legami rari o solo riproduttivi.
> **2 · Individualista** — Convive in prossimità ma autonoma; interazioni utilitaristiche.
> **3 · Aggregativa** — Gruppi flessibili (branchi, clan) per necessità territoriale o biologica.
> **4 · Comunitaria** — Comunità organizzate con ruoli distinti e relazioni stabili.
> **5 · Ipercollettiva** — L'individuo non esiste: colonia, alveare, coscienza distribuita.

> [!note]- Mobilità — Rapporto della creatura col territorio e il movimento.
> **1 · Radicata** — Legata a un solo bioma; non può o non vuole spostarsi.
> **2 · Territoriale** — Confini definiti; viaggia ma torna sempre al proprio habitat.
> **3 · Adattiva** — Si adatta a vari ambienti; nucleo d'origine ma non vincolata.
> **4 · Migratoria** — Migra seguendo rotte, cicli stagionali o necessità.
> **5 · Errante** — Sempre in movimento; nessuna terra propria, vagabonda per natura.

> [!note]- Natura — Quanto la creatura è ordinaria o intrisa di magia.
> **1 · Mondana** — Bestia naturale; nessun tratto soprannaturale.
> **2 · Insolita** — Tratti fuori dal comune (taglia, resistenza), ma ancora naturale.
> **3 · Toccata** — Magia latente o residua: un'abilità, un'aura, un'origine arcana.
> **4 · Magica** — Apertamente soprannaturale; poteri, incantesimi, forma mutevole.
> **5 · Aberrante** — Essere di pura magia o altri piani; piega le leggi della realtà.

> [!note]- Intelletto — Livello di coscienza e capacità cognitiva.
> **1 · Istintivo** — Agisce per puro istinto; nessun pensiero astratto.
> **2 · Astuto** — Furbizia animale; trappole, finte, apprendimento limitato.
> **3 · Senziente** — Linguaggio e ragionamento; cultura semplice possibile.
> **4 · Sapiente** — Pensiero simbolico ed etico; strategie, inganni elaborati.
> **5 · Geniale** — Mente superiore o aliena; piani secolari, concetti iperoggettivi.

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Habitat**: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):habitat]`
> **Specie**: `INPUT[suggester(optionQuery("Mondi/Specie"), useLinks(partial), allowOther):specie]`
> **Ecosistemi**: `INPUT[inlineListSuggester(optionQuery("Mondi/Ecosistemi"), useLinks(partial), allowOther):ecosistemi]`
> **Habitat (biomi)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Biomi"), useLinks(partial), allowOther):biomi]`
> **Origine divina/primordiale**: `INPUT[inlineListSuggester(optionQuery("Mondi/Primordiali"), useLinks(partial), allowOther):origine_primordiale]`
> **Culture che la venerano/temono**: `INPUT[inlineListSuggester(optionQuery("Mondi/Culture"), useLinks(partial), allowOther):culture]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

```gdr
renderConnessioni
```
```gdr
renderMemoria
```
--- 👁 Vista

```gdr
renderEntityPanel
```
````
