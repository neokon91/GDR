<% await tp.user.crea_png(tp) %>
# `=this.nome`

> [!infobox|personaggio] 🎭 PNG
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Ruolo narrativo** | `VIEW[{famiglia} ?? "—"]` |
> | **Titolo** | `VIEW[{titolo} ?? "—"]` |
> | **Rango** | `VIEW[{rango} ?? "—"]` |
> | **Allineamento** | `VIEW[{allineamento} ?? "—"]` |
> | **Pronomi** | `VIEW[{pronomi} ?? "—"]` |
> | **Età** | `VIEW[{eta} ?? "—"]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(pg), option(png)):tipo]`
> **Ruolo narrativo**: `INPUT[inlineSelect(option(alleato), option(antagonista), option(mentore), option(patrono), option(rivale), option(mercante), option(contatto), option(gregario)):famiglia]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!note]- Cosa significa ogni ruolo narrativo
> **alleato** — Sta dalla parte del gruppo: aiuta, copre, combatte al loro fianco.
> **antagonista** — Si oppone attivamente al gruppo o ne ostacola gli obiettivi; non per forza un nemico.
> **mentore** — Guida, istruisce o protegge il gruppo; offre saggezza, addestramento o risorse.
> **patrono** — Commissiona, finanzia o dà missioni; ha potere e un'agenda propria.
> **rivale** — Compete col gruppo (onore, risorse, gloria) senza volerne la rovina.
> **mercante** — Fornisce beni, servizi o informazioni in cambio di qualcosa.
> **contatto** — Nodo di informazioni o accesso: introduce, fa da ponte, apre porte.
> **gregario** — Comparsa ricorrente o seguace: dà colore e continuità alla scena.

> [!info]- ℹ️ Guida — PNG
> **Cos'è** · Una persona del mondo — PG giocabile o PNG da interpretare (lo stesso tipo serve entrambi).
> **Campi chiave** · **Tipo** (pg/png); per i PNG il **Ruolo narrativo** (alleato, mentore, rivale…) e l'**Affiliazione** (fazione); **Allineamento** per la bussola morale.
> **Spunti** · Cosa vuole, e cosa lo ferma? Un segreto, una paura, una contraddizione. Come può intrecciarsi con i personaggi giocanti?

````tabs
--- 📋 Scheda

> [!info] In gioco
> CA `INPUT[number:ca]` · PF `INPUT[number:pf]`/`INPUT[number:pf_max]` · Velocità `INPUT[number:velocita]` m
>
> Competenza +`INPUT[number:competenza]` · Iniziativa `VIEW[floor(({destrezza} - 10) / 2)]`

> [!abstract] Caratteristiche
> **FOR** `INPUT[number:forza]` · mod `VIEW[floor(({forza} - 10) / 2)][math:mod_forza]`
> **DES** `INPUT[number:destrezza]` · mod `VIEW[floor(({destrezza} - 10) / 2)][math:mod_destrezza]`
> **COS** `INPUT[number:costituzione]` · mod `VIEW[floor(({costituzione} - 10) / 2)][math:mod_costituzione]`
> **INT** `INPUT[number:intelligenza]` · mod `VIEW[floor(({intelligenza} - 10) / 2)][math:mod_intelligenza]`
> **SAG** `INPUT[number:saggezza]` · mod `VIEW[floor(({saggezza} - 10) / 2)][math:mod_saggezza]`
> **CAR** `INPUT[number:carisma]` · mod `VIEW[floor(({carisma} - 10) / 2)][math:mod_carisma]`

--- 📖 Lore

> [!abstract] Scheda
> Titolo: `INPUT[text:titolo]`
> Rango: `INPUT[rango][:rango]`
> Allineamento: `INPUT[allineamento][:allineamento]`
> Pronomi: `INPUT[text:pronomi]`
> Età: `INPUT[text:eta]`

> [!tip]- Genera nome/spunto
> `BUTTON[genera-locale]` (italiano, a tema) — scegli **cosa generare**: nomi (persona/luogo/fazione), PNG, taverne, bevande, ganci, dicerie, tesori (SRD), insediamenti, oggetti, meteo, stanze di dungeon… — dallo *stile* della cultura/specie collegata. Inserisce al cursore.
> [!note]- Chi è
> In una riga: ruolo, impressione che lascia, cosa porta in scena.

> [!quote]- Versione player-safe
> `INPUT[text:player_safe]`

> [!note] Ruolo
> `INPUT[textArea:ruolo]`

> [!note] Aspetto
> `INPUT[textArea:aspetto]`

> [!note] Vuole
> `INPUT[textArea:desiderio]`

> [!note] Teme
> `INPUT[textArea:paura]`

> [!note] Storia
> `INPUT[textArea:storia]`

> [!note] Voce
> `INPUT[textArea:voce]`

> [!note] Oggetto
> `INPUT[textArea:oggetto]`

> [!quote] Frase tipica
> `INPUT[textArea:frase]`

> [!segreto]- Segreto
> `INPUT[textArea:segreto]`


> [!abstract] Tema natale
> Segno: `INPUT[segno][:segno]` · Arcano: `INPUT[arcano][:arcano]`
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTemaNatale");
```
--- 🎲 Al tavolo

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
--- 📊 Carattere

> [!abstract] Carattere
> **Moralità** `INPUT[slider(minValue(1), maxValue(5), addLabels):moralita]` → `VIEW[{moralita} == 5 ? "5 · Spietato" : ({moralita} == 4 ? "4 · Interessato" : ({moralita} == 3 ? "3 · Pragmatico" : ({moralita} == 2 ? "2 · Generoso" : ({moralita} == 1 ? "1 · Altruista" : ("—")))))]`
> **Lealtà** `INPUT[slider(minValue(1), maxValue(5), addLabels):lealta]` → `VIEW[{lealta} == 5 ? "5 · Ribelle" : ({lealta} == 4 ? "4 · Insofferente" : ({lealta} == 3 ? "3 · Indipendente" : ({lealta} == 2 ? "2 · Affidabile" : ({lealta} == 1 ? "1 · Leale" : ("—")))))]`
> **Temperamento** `INPUT[slider(minValue(1), maxValue(5), addLabels):temperamento]` → `VIEW[{temperamento} == 5 ? "5 · Volatile" : ({temperamento} == 4 ? "4 · Impulsivo" : ({temperamento} == 3 ? "3 · Equilibrato" : ({temperamento} == 2 ? "2 · Calmo" : ({temperamento} == 1 ? "1 · Glaciale" : ("—")))))]`
> **Socievolezza** `INPUT[slider(minValue(1), maxValue(5), addLabels):socievolezza]` → `VIEW[{socievolezza} == 5 ? "5 · Magnetico" : ({socievolezza} == 4 ? "4 · Espansivo" : ({socievolezza} == 3 ? "3 · Cordiale" : ({socievolezza} == 2 ? "2 · Riservato" : ({socievolezza} == 1 ? "1 · Solitario" : ("—")))))]`
> **Approccio** `INPUT[slider(minValue(1), maxValue(5), addLabels):approccio]` → `VIEW[{approccio} == 5 ? "5 · Istintivo" : ({approccio} == 4 ? "4 · Pratico" : ({approccio} == 3 ? "3 · Versatile" : ({approccio} == 2 ? "2 · Riflessivo" : ({approccio} == 1 ? "1 · Metodico" : ("—")))))]`

> [!note]- Moralità — Quanto antepone gli altri a sé stesso.
> **1 · Altruista** — Si sacrifica per gli altri; il bene comune prima di tutto.
> **2 · Generoso** — Aiuta volentieri, ma bada anche a sé.
> **3 · Pragmatico** — Bilancia interesse proprio e altrui secondo il caso.
> **4 · Interessato** — Mette sé al primo posto; aiuta se ne ricava qualcosa.
> **5 · Spietato** — Usa gli altri senza scrupoli; solo il proprio tornaconto conta.

> [!note]- Lealtà — Rapporto con regole, autorità e patti.
> **1 · Leale** — Rispetta leggi e parola data; l'ordine è un valore.
> **2 · Affidabile** — Mantiene gli impegni, ma sa essere flessibile.
> **3 · Indipendente** — Segue il proprio codice; obbedisce se ha senso.
> **4 · Insofferente** — Mal sopporta regole e autorità; le aggira.
> **5 · Ribelle** — Rifiuta ogni vincolo; la libertà sopra tutto.

> [!note]- Temperamento — Come reagisce sotto pressione.
> **1 · Glaciale** — Imperturbabile; nulla scalfisce la sua calma.
> **2 · Calmo** — Misurato; perde il controllo solo all'estremo.
> **3 · Equilibrato** — Reagisce in proporzione; emotivo ma controllato.
> **4 · Impulsivo** — Agisce d'istinto; l'emozione guida le scelte.
> **5 · Volatile** — Esplosivo e imprevedibile; un attimo e cambia tutto.

> [!note]- Socievolezza — Come si pone con le altre persone.
> **1 · Solitario** — Evita gli altri; sta bene da solo.
> **2 · Riservato** — Pochi legami scelti; diffida degli estranei.
> **3 · Cordiale** — Si adatta alla compagnia; né schivo né invadente.
> **4 · Espansivo** — Cerca gli altri; a suo agio in mezzo alla gente.
> **5 · Magnetico** — Calamita l'attenzione; trascina e influenza chi incontra.

> [!note]- Approccio — Come affronta i problemi.
> **1 · Metodico** — Pianifica tutto; niente lasciato al caso.
> **2 · Riflessivo** — Pondera prima di agire; valuta le opzioni.
> **3 · Versatile** — Pensa e agisce a seconda di ciò che serve.
> **4 · Pratico** — Impara facendo; preferisce l'azione all'analisi.
> **5 · Istintivo** — Si fida del proprio fiuto; decide nell'istante.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "personaggio", component);
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderCoerenza");
```

--- 🔗 Collegamenti

> [!example] Relazioni
> **Affiliazione**: `INPUT[suggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazione]`
> **Parenti / stirpe**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):parenti]`
> **Base**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
> **Alleati**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):alleati]`
> **Rivali**: `INPUT[inlineListSuggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):rivali]`

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
