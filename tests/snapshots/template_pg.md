<% await tp.user.crea_pg(tp) %>
# `=this.nome`

> [!info] PG
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Scheda

> [!info] In gioco
> CA `INPUT[number:ca]` · PF `INPUT[number:pf]`/`INPUT[number:pf_max]` · Velocità `INPUT[number:velocita]` m
>
> Competenza +`INPUT[number:competenza]` · Iniziativa `VIEW[floor(({destrezza} - 10) / 2)]`

**Caratteristiche**

| Car | Valore | Mod | TS | Comp |
|:--|:-:|:-:|:-:|:-:|
| **FOR** | `INPUT[number:forza]` | `VIEW[floor(({forza} - 10) / 2)][math:mod_forza]` | `VIEW[floor(({forza} - 10) / 2) + ({ts_forza} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_forza]` |
| **DES** | `INPUT[number:destrezza]` | `VIEW[floor(({destrezza} - 10) / 2)][math:mod_destrezza]` | `VIEW[floor(({destrezza} - 10) / 2) + ({ts_destrezza} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_destrezza]` |
| **COS** | `INPUT[number:costituzione]` | `VIEW[floor(({costituzione} - 10) / 2)][math:mod_costituzione]` | `VIEW[floor(({costituzione} - 10) / 2) + ({ts_costituzione} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_costituzione]` |
| **INT** | `INPUT[number:intelligenza]` | `VIEW[floor(({intelligenza} - 10) / 2)][math:mod_intelligenza]` | `VIEW[floor(({intelligenza} - 10) / 2) + ({ts_intelligenza} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_intelligenza]` |
| **SAG** | `INPUT[number:saggezza]` | `VIEW[floor(({saggezza} - 10) / 2)][math:mod_saggezza]` | `VIEW[floor(({saggezza} - 10) / 2) + ({ts_saggezza} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_saggezza]` |
| **CAR** | `INPUT[number:carisma]` | `VIEW[floor(({carisma} - 10) / 2)][math:mod_carisma]` | `VIEW[floor(({carisma} - 10) / 2) + ({ts_carisma} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓")):ts_carisma]` |

**Abilità**

| Abilità | Bonus | Comp |
|:--|:-:|:-:|
| Acrobazia (DES) | `VIEW[floor(({destrezza} - 10) / 2) + ({prof_acrobazia} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_acrobazia]` |
| Addestrare Animali (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_addestrare_animali} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_addestrare_animali]` |
| Arcano (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_arcano} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_arcano]` |
| Atletica (FOR) | `VIEW[floor(({forza} - 10) / 2) + ({prof_atletica} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_atletica]` |
| Furtività (DES) | `VIEW[floor(({destrezza} - 10) / 2) + ({prof_furtivita} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_furtivita]` |
| Indagare (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_indagare} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_indagare]` |
| Inganno (CAR) | `VIEW[floor(({carisma} - 10) / 2) + ({prof_inganno} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_inganno]` |
| Intimidire (CAR) | `VIEW[floor(({carisma} - 10) / 2) + ({prof_intimidire} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_intimidire]` |
| Intrattenere (CAR) | `VIEW[floor(({carisma} - 10) / 2) + ({prof_intrattenere} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_intrattenere]` |
| Intuizione (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_intuizione} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_intuizione]` |
| Medicina (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_medicina} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_medicina]` |
| Natura (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_natura} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_natura]` |
| Percezione (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_percezione} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_percezione]` |
| Persuasione (CAR) | `VIEW[floor(({carisma} - 10) / 2) + ({prof_persuasione} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_persuasione]` |
| Rapidità di Mano (DES) | `VIEW[floor(({destrezza} - 10) / 2) + ({prof_rapidita_di_mano} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_rapidita_di_mano]` |
| Religione (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_religione} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_religione]` |
| Sopravvivenza (SAG) | `VIEW[floor(({saggezza} - 10) / 2) + ({prof_sopravvivenza} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_sopravvivenza]` |
| Storia (INT) | `VIEW[floor(({intelligenza} - 10) / 2) + ({prof_storia} * {competenza})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "✓✓")):prof_storia]` |

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

> [!note]- Inventario
> `VIEW[{inventario} ?? "—"]`

> [!note]- Incantesimi (1º livello)
> Incantatore: `VIEW[{incantatore} ?? "—"]` · slot di 1º: `VIEW[{slot_1} ?? "—"]`
>
> **Trucchetti**: `VIEW[{trucchetti} ?? "—"]`
>
> **Preparati (1º)**: `VIEW[{incantesimi} ?? "—"]`
--- Lore

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


--- Al tavolo

> [!tavolo] Uso al tavolo
> `INPUT[testo_area][:uso_al_tavolo]`

> [!gancio]- Gancio
> `INPUT[testo_area][:gancio]`

> [!warning] Pressione — `VIEW[{pressione} >= 7 ? "🔴 Crisi" : ({pressione} >= 4 ? "🟠 Tensione" : "🟢 Calma")]`
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[text:prossima_mossa]`


--- Carattere

> [!abstract] Carattere
> **Moralità** `INPUT[slider(minValue(1), maxValue(5), addLabels):moralita]`
> **Lealtà** `INPUT[slider(minValue(1), maxValue(5), addLabels):lealta]`
> **Temperamento** `INPUT[slider(minValue(1), maxValue(5), addLabels):temperamento]`
> **Socievolezza** `INPUT[slider(minValue(1), maxValue(5), addLabels):socievolezza]`
> **Approccio** `INPUT[slider(minValue(1), maxValue(5), addLabels):approccio]`

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
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
await views.renderAxesRadar(container, app, page);
```

--- Collegamenti

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
--- Vista

```js-engine
const src = await app.vault.adapter.read("z.automazioni/views.js");
const mod = { exports: {} };
new Function("module", "exports", src)(mod, mod.exports);
const views = mod.exports;
const dv = app.plugins.plugins.dataview && app.plugins.plugins.dataview.api;
const file = app.workspace.getActiveFile();
const page = dv && file ? dv.page(file.path) : null;
return engine.markdown.create(views.renderEntityPanel(dv, page));
```
````
