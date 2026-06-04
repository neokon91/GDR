<% await tp.user.crea_pg(tp) %>
# `=this.nome`

> [!infobox|personaggio] 🎭 PG
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][text(renderMarkdown)]` |
> | **Ruolo narrativo** | `VIEW[{famiglia} ?? "—"]` |
> | **Titolo o rango** | `VIEW[{titolo} ?? "—"]` |
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

````tabs
--- 📋 Scheda

> [!info] In gioco
> CA `INPUT[number:ca]` · PF `INPUT[number:pf]`/`INPUT[number:pf_max]` · PF temp `INPUT[number:pf_temp]` · Velocità `INPUT[number:velocita]` m
>
> Competenza +`INPUT[number:competenza]` · Iniziativa `VIEW[floor(({destrezza} - 10) / 2)]` → tira `dice: 1d20 + mod_destrezza`
>
> 🎲 **Ispirazione eroica** `INPUT[toggle:ispirazione]` — quando ce l'hai, ritira un tiro per colpire, una prova o un TS (2024).
>
> **A 0 PF** — TS morte (CD 10) `dice: 1d20` · successi `INPUT[inlineSelect(option(0, "—"), option(1, "1"), option(2, "2"), option(3, "3 ✓")):ts_morte_successi]` · fallimenti `INPUT[inlineSelect(option(0, "—"), option(1, "1"), option(2, "2"), option(3, "3 ☠")):ts_morte_fallimenti]`
>
> **Esaurimento** (Indebolimento 2024) `INPUT[inlineSelect(option(0, "0 —"), option(1, "1"), option(2, "2"), option(3, "3"), option(4, "4"), option(5, "5"), option(6, "6 ☠")):esaurimento]` → −`VIEW[2 * ({esaurimento} ?? 0)]` a OGNI prova d20 · velocità −`VIEW[1.5 * ({esaurimento} ?? 0)]` m
>
> **Dadi Vita** d`VIEW[{dado_vita} ?? "?"]` · spesi `INPUT[number:dadi_vita_spesi]` / `VIEW[{dadi_vita_max} ?? "—"]` → rimasti `VIEW[({dadi_vita_max} ?? 0) - ({dadi_vita_spesi} ?? 0)]`
>
> **🌀 Concentrazione** su `INPUT[text:concentrazione_su]` — quando subisci danni: TS Costituzione (CD 10 o metà danni); finisce a 0 PF o se incapacitato
>
> Riposo: `BUTTON[riposo-breve]` (spendi 1 Dado Vita → +tiro+mod COS ai PF) · `BUTTON[riposo-lungo]` (PF al massimo, slot e TS morte azzerati, metà Dadi Vita recuperati, −1 Esaurimento)

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderRisorsePG");
```

> [!note]- Slot incantesimo (caster)
> | Liv | Max | Spesi | Rimasti |
> |:-:|:-:|:-:|:-:|
> | 1° | `VIEW[{slot_1} ?? "—"]` | `INPUT[number:slot_uso_1]` | `VIEW[({slot_1} ?? 0) > 0 ? (({slot_1}) - ({slot_uso_1} ?? 0)) : "—"]` |
> | 2° | `VIEW[{slot_2} ?? "—"]` | `INPUT[number:slot_uso_2]` | `VIEW[({slot_2} ?? 0) > 0 ? (({slot_2}) - ({slot_uso_2} ?? 0)) : "—"]` |
> | 3° | `VIEW[{slot_3} ?? "—"]` | `INPUT[number:slot_uso_3]` | `VIEW[({slot_3} ?? 0) > 0 ? (({slot_3}) - ({slot_uso_3} ?? 0)) : "—"]` |
> | 4° | `VIEW[{slot_4} ?? "—"]` | `INPUT[number:slot_uso_4]` | `VIEW[({slot_4} ?? 0) > 0 ? (({slot_4}) - ({slot_uso_4} ?? 0)) : "—"]` |
> | 5° | `VIEW[{slot_5} ?? "—"]` | `INPUT[number:slot_uso_5]` | `VIEW[({slot_5} ?? 0) > 0 ? (({slot_5}) - ({slot_uso_5} ?? 0)) : "—"]` |
> | 6° | `VIEW[{slot_6} ?? "—"]` | `INPUT[number:slot_uso_6]` | `VIEW[({slot_6} ?? 0) > 0 ? (({slot_6}) - ({slot_uso_6} ?? 0)) : "—"]` |
> | 7° | `VIEW[{slot_7} ?? "—"]` | `INPUT[number:slot_uso_7]` | `VIEW[({slot_7} ?? 0) > 0 ? (({slot_7}) - ({slot_uso_7} ?? 0)) : "—"]` |
> | 8° | `VIEW[{slot_8} ?? "—"]` | `INPUT[number:slot_uso_8]` | `VIEW[({slot_8} ?? 0) > 0 ? (({slot_8}) - ({slot_uso_8} ?? 0)) : "—"]` |
> | 9° | `VIEW[{slot_9} ?? "—"]` | `INPUT[number:slot_uso_9]` | `VIEW[({slot_9} ?? 0) > 0 ? (({slot_9}) - ({slot_uso_9} ?? 0)) : "—"]` |

**Caratteristiche**

| Car | Valore | Mod | Prova 🎲 | TS 🎲 | Comp |
|:--|:-:|:-:|:-:|:-:|:-:|
| **FOR** | `INPUT[number:forza]` | `VIEW[floor(({forza} - 10) / 2)][math:mod_forza]` | `dice: 1d20 + mod_forza` | `dice: 1d20 + mod_forza + ts_forza * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_forza]` |
| **DES** | `INPUT[number:destrezza]` | `VIEW[floor(({destrezza} - 10) / 2)][math:mod_destrezza]` | `dice: 1d20 + mod_destrezza` | `dice: 1d20 + mod_destrezza + ts_destrezza * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_destrezza]` |
| **COS** | `INPUT[number:costituzione]` | `VIEW[floor(({costituzione} - 10) / 2)][math:mod_costituzione]` | `dice: 1d20 + mod_costituzione` | `dice: 1d20 + mod_costituzione + ts_costituzione * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_costituzione]` |
| **INT** | `INPUT[number:intelligenza]` | `VIEW[floor(({intelligenza} - 10) / 2)][math:mod_intelligenza]` | `dice: 1d20 + mod_intelligenza` | `dice: 1d20 + mod_intelligenza + ts_intelligenza * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_intelligenza]` |
| **SAG** | `INPUT[number:saggezza]` | `VIEW[floor(({saggezza} - 10) / 2)][math:mod_saggezza]` | `dice: 1d20 + mod_saggezza` | `dice: 1d20 + mod_saggezza + ts_saggezza * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_saggezza]` |
| **CAR** | `INPUT[number:carisma]` | `VIEW[floor(({carisma} - 10) / 2)][math:mod_carisma]` | `dice: 1d20 + mod_carisma` | `dice: 1d20 + mod_carisma + ts_carisma * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_carisma]` |

**Abilità**

| Abilità | Bonus | Tiro 🎲 | Comp |
|:--|:-:|:-:|:-:|
| Acrobazia (DES) | `VIEW[floor(({destrezza} - 10) / 2) + ({prof_acrobazia} * {competenza})]` | `dice: 1d20 + mod_destrezza + prof_acrobazia * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_acrobazia]` |
| Addestrare Animali (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_addestrare_animali} * {competenza})]` | `dice: 1d20 + mod_saggezza + prof_addestrare_animali * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_addestrare_animali]` |
| Arcano (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_arcano} * {competenza})]` | `dice: 1d20 + mod_intelligenza + prof_arcano * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_arcano]` |
| Atletica (FOR) | `VIEW[floor(({forza} - 10) / 2) + ({prof_atletica} * {competenza})]` | `dice: 1d20 + mod_forza + prof_atletica * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_atletica]` |
| Furtività (DES) | `VIEW[floor(({destrezza} - 10) / 2) + ({prof_furtivita} * {competenza})]` | `dice: 1d20 + mod_destrezza + prof_furtivita * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_furtivita]` |
| Indagare (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_indagare} * {competenza})]` | `dice: 1d20 + mod_intelligenza + prof_indagare * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_indagare]` |
| Inganno (CAR) | `VIEW[floor(({carisma} - 10) / 2) + ({prof_inganno} * {competenza})]` | `dice: 1d20 + mod_carisma + prof_inganno * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_inganno]` |
| Intimidire (CAR) | `VIEW[floor(({carisma} - 10) / 2) + ({prof_intimidire} * {competenza})]` | `dice: 1d20 + mod_carisma + prof_intimidire * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_intimidire]` |
| Intrattenere (CAR) | `VIEW[floor(({carisma} - 10) / 2) + ({prof_intrattenere} * {competenza})]` | `dice: 1d20 + mod_carisma + prof_intrattenere * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_intrattenere]` |
| Intuizione (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_intuizione} * {competenza})]` | `dice: 1d20 + mod_saggezza + prof_intuizione * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_intuizione]` |
| Medicina (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_medicina} * {competenza})]` | `dice: 1d20 + mod_saggezza + prof_medicina * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_medicina]` |
| Natura (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_natura} * {competenza})]` | `dice: 1d20 + mod_intelligenza + prof_natura * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_natura]` |
| Percezione (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_percezione} * {competenza})]` | `dice: 1d20 + mod_saggezza + prof_percezione * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_percezione]` |
| Persuasione (CAR) | `VIEW[floor(({carisma} - 10) / 2) + ({prof_persuasione} * {competenza})]` | `dice: 1d20 + mod_carisma + prof_persuasione * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_persuasione]` |
| Rapidità di Mano (DES) | `VIEW[floor(({destrezza} - 10) / 2) + ({prof_rapidita_di_mano} * {competenza})]` | `dice: 1d20 + mod_destrezza + prof_rapidita_di_mano * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_rapidita_di_mano]` |
| Religione (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_religione} * {competenza})]` | `dice: 1d20 + mod_intelligenza + prof_religione * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_religione]` |
| Sopravvivenza (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_sopravvivenza} * {competenza})]` | `dice: 1d20 + mod_saggezza + prof_sopravvivenza * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_sopravvivenza]` |
| Storia (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_storia} * {competenza})]` | `dice: 1d20 + mod_intelligenza + prof_storia * competenza` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_storia]` |

> [!tip]- Tiri
> Normale `dice: 1d20` · Vantaggio `dice: 2d20kh1` · Svantaggio `dice: 2d20kl1`
> [!abstract] Sistema
> **Classe**: `VIEW[{classe} ?? "—"]` · **Specie**: `VIEW[{specie} ?? "—"]` · **Background**: `VIEW[{background} ?? "—"]`
>
> **Taglia**: `VIEW[{taglia} ?? "—"]` · **Velocità**: `VIEW[{velocita} ?? "—"]` m · **Scurovisione**: `VIEW[{scurovisione} ?? "—"]`
>
> **Armatura**: `VIEW[{armatura} ?? "—"]` · **Scudo**: `VIEW[{scudo} ?? "—"]`
>
> **TS competenti**: `VIEW[{ts_competenti} ?? "—"]` · **Competenze (abilità)**: `VIEW[{competenze_abilita} ?? "—"]`
>
> **Armi**: `VIEW[{competenze_armi} ?? "—"]` · **Armature**: `VIEW[{competenze_armature} ?? "—"]` · **Strumenti**: `VIEW[{competenze_strumenti} ?? "—"]`
>
> **Lingue**: `VIEW[{lingue} ?? "—"]`
>
> **Privilegi di classe**: `VIEW[{privilegi_classe} ?? "—"]` · **Talenti**: `VIEW[{talenti} ?? "—"]`
>
> **Tratti di specie**: `VIEW[{tratti_specie} ?? "—"]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderSpecieTratti");
```
> [!note]- Inventario
> `VIEW[{inventario} ?? "—"]`

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderIncantesimi");
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderProgressione");
```

> [!tip] Avanza di livello
> Applica PF/competenza/slot e guida le scelte (ASI/talento/sottoclasse/incantesimi): `BUTTON[sali-di-livello]`
--- 📖 Lore

> [!abstract] Scheda
> Titolo o rango: `INPUT[text:titolo]`
> Allineamento: `INPUT[allineamento][:allineamento]`
> Pronomi: `INPUT[text:pronomi]`
> Età: `INPUT[text:eta]`

> [!note]- Descrizione
> Chi è, com'è, cosa porta in scena.

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

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderAttacchi");
```

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderCondizioni");
```
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderMaestrie");
```
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
