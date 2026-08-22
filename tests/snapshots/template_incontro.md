<% await tp.user.crea_incontro(tp) %>
# `=this.nome`

> [!infobox|incontro] 🎲 Incontro
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Livello del gruppo** | `INPUT[number:pg_livello]` |
> | **Numero di PG** | `INPUT[number:pg_numero]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Tipo**: `INPUT[inlineSelect(option(incontro), option(agguato), option(inseguimento)):tipo]`
> **Famiglia**: `INPUT[inlineSelect(option(combattimento), option(sociale), option(esplorazione), option(enigma), option(ambientale)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni famiglia
> **combattimento** — Scontro: l'obiettivo è prevalere sul nemico.
> **sociale** — Interazione: persuadere, negoziare, ingannare, intimidire.
> **esplorazione** — Scoperta: attraversare, cercare, orientarsi nell'ignoto.
> **enigma** — Rompicapo: risolvere un puzzle, un indovinello, un meccanismo.
> **ambientale** — Sopravvivenza: l'ambiente stesso è la minaccia.

> [!info]- ℹ️ Guida — Incontro
> **Cos'è** · Una scena pronta da giocare — scontro, agguato o inseguimento — col budget di difficoltà 2024 calcolato in automatico.
> **Campi chiave** · **Creature** + **Livello del gruppo** + **Numero di PG** alimentano il calcolo difficoltà; la **Famiglia** (combattimento/sociale…) varia il ritmo.
> **Spunti** · Qual è l'obiettivo della scena e la posta se va male? Cosa nell'ambiente complica lo scontro? Cosa vogliono davvero gli avversari — si può evitare il sangue?

````tabs
--- 🎬 Scena

```gdr
renderTipoProfilo
```
> [!tavolo] Uso al tavolo
> `INPUT[textArea(placeholder(es. i PG possono corrompere la guardia per entrare di notte)):uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[textArea(placeholder(es. una taglia sul suo capo che nessuno osa riscuotere)):gancio]`

> [!info]- 👁 Condivisione coi giocatori
> Rivelazione attuale: `VIEW[{rivelazione} ?? "—"]` — *si imposta in **⚙️ Opzioni*** (per non avere due controlli sullo stesso campo).
> Quando questa nota entra nel **sito dei giocatori** (lo generi con un clic da **[[Occhi del giocatore]]**), decide cosa i PG vedono.
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.

> [!tip]- Tiri
> Normale `dice: 1d20` · Vantaggio `dice: 2d20kh1` · Svantaggio `dice: 2d20kl1`


--- ⚔ Combattimento

```gdr
renderEncounter
```

> [!tip] ⚔️ Gioca nella Board (consigliato)
> Dal comando **«GDR: Schiera l'incontro nella Board»** (con questa nota aperta) la Board di
> combattimento si apre **pre-popolata**: le *Creature* collegate diventano nemici, gli
> *Alleati* e i tuoi **PG** entrano dalla tua parte, gli override `varianti` (hp/ca) si
> applicano. Poi tiri l'iniziativa e giochi lì (motore nativo: PF, condizioni, statblock).
>
> **Boss/gregari**: una proprietà `varianti` nel frontmatter, una riga per creatura — es.
> `[[Salamandra]]: hp 60, ca 12, init 20` (alias `pf`→hp) — applica gli override quando
> schieri; indicare l'HP rende l'incontro **ripetibile** (niente tiro casuale dei PF).

```gdr
renderCondizioni
```
```gdr
renderMaestrie
```
--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Luogo**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
> **Creature**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):creature]`
> **Alleati (PNG/evocazioni)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):alleati]`
> **Scena**: `INPUT[suggester(optionQuery("Mondi/Scene"), useLinks(partial), allowOther):scena]`
> **Insidie**: `INPUT[inlineListSuggester(optionQuery("Mondi/Insidie"), useLinks(partial), allowOther):insidie]`
> **Bottino**: `INPUT[inlineListSuggester(optionQuery("Mondi/Oggetti"), useLinks(partial), allowOther):bottino]`

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
