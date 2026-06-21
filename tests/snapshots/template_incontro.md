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
> **Stato**: `INPUT[stato][:stato]`
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

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```
> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!info]- 👁 Condivisione coi giocatori
> Quando questa nota entra nel **sito dei giocatori** (`npm run site -- --reveal <livello>`): `INPUT[rivelazione][:rivelazione]`
>
> *pubblico* = noto da subito · *incontrato* = quando i PG lo scoprono · *segreto* = colpo di scena. Per non condividerla **mai**, imposta `visibilita: dm`.

> [!tip]- Tiri
> Normale `dice: 1d20` · Vantaggio `dice: 2d20kh1` · Svantaggio `dice: 2d20kl1`


--- ⚔ Combattimento

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEncounter");
```

Avvia il combattimento dal blocco (Initiative Tracker). Aggiungi le creature per
nome dal bestiario (SRD / Fantasy Statblocks) con `- <numero>: <Nome>`; un alleato
(PNG/evocazione) si schiera col gruppo con `- <Nome>, ally`. `players: true` include
il **gruppo**.

> [!tip] Schiera il gruppo (una volta sola)
> Niente config manuale del Party: `BUTTON[prepara-gruppo]` auto-popola il **Party di
> Initiative Tracker** dai tuoi **PG** del vault (note *personaggio · pg*: nome, PF, CA,
> iniziativa). Dopo, `players: true` qui sotto risolve e **Avvia incontro** include il
> gruppo. Ripremi quando aggiungi un PG o sali di livello.

> [!tip] Sincronizza da creature e alleati collegati
> Riscrive il blocco qui sotto dalle *Creature* e dagli *Alleati* in *Collegamenti*
> (gli alleati col flag `ally`; niente copia-incolla): `BUTTON[aggiorna-encounter]`
> **Boss/gregari**: aggiungi una proprietà `varianti` al frontmatter, una riga per
> creatura — es. `[[Salamandra]]: hp 60, ca 12, init 20` (alias `pf`→hp). *Aggiorna*
> applica gli override; indicare l'HP rende l'incontro **ripetibile** (niente tiro PF).

```encounter
name: <% tp.config.target_file.basename %>
players: true
creatures:
  - 1: Nome Creatura
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderCondizioni");
```
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMaestrie");
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

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMemoria");
```
--- 👁 Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```
````
