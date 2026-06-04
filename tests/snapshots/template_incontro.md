<% await tp.user.crea_incontro(tp) %>
# `=this.nome`

> [!infobox|incontro] 🎲 Incontro
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Famiglia** | `VIEW[{famiglia} ?? "—"]` |
> | **Livello del gruppo** | `VIEW[{pg_livello} ?? "—"]` |
> | **Numero di PG** | `VIEW[{pg_numero} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!info] Famiglia: `INPUT[inlineSelect(option(combattimento), option(sociale), option(esplorazione), option(enigma), option(inseguimento), option(ambientale)):famiglia]`

> [!note]- Cosa significa ogni famiglia
> **combattimento** — Scontro: l'obiettivo è prevalere sul nemico.
> **sociale** — Interazione: persuadere, negoziare, ingannare, intimidire.
> **esplorazione** — Scoperta: attraversare, cercare, orientarsi nell'ignoto.
> **enigma** — Rompicapo: risolvere un puzzle, un indovinello, un meccanismo.
> **inseguimento** — Movimento: rincorrere o fuggire, con poste e ostacoli.
> **ambientale** — Sopravvivenza: l'ambiente stesso è la minaccia.

````tabs
--- 🎬 Scena

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text:prossima_mossa]`

**⏳ Fronte** — clock `INPUT[number:clock]` / `INPUT[clock_dim][:clock_dim]` segmenti
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderClock");
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderPressioni");
```

> [!warning]- Conseguenza (quando il clock è pieno)
> `INPUT[testo_area][:conseguenza]`
>
> Bersaglio: `INPUT[legame][:conseguenza_su]`

> [!tip] Avanza / scatena
> Una spinta dal grafo o una mossa? `BUTTON[avanza-fronte]` (clock +1).
> Clock pieno? `BUTTON[scatena-conseguenza]` — crea l'evento-conseguenza collegato e azzera il clock.
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
il **gruppo**: i PG vanno configurati una volta come *Party* nelle impostazioni di
Initiative Tracker (puntandoli alle note in `Mondi/Personaggi`).

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

> [!example] Relazioni
> **Luogo**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
> **Creature**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):creature]`
> **Alleati (PNG/evocazioni)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Creature"), useLinks(partial), allowOther):alleati]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Sessioni: `INPUT[sessioni][:sessioni]`

> [!tip] Collega
> Aggiungi una relazione (anche dopo la creazione): `BUTTON[collega-nota]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderConnessioni");
```
--- 👁 Vista

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderEntityPanel");
```
````
