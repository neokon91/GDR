<% await tp.user.crea_oggetto_magico(tp) %>
# `=this.nome`

> [!infobox|oggetto] 🎒 Oggetto Magico
> `INPUT[ritratto][:ritratto]`
>
> | | |
> |:--|:--|
> | **Tipo** | `VIEW[{tipo} ?? "—"]` |
> | **Mondo** | `VIEW[{mondo}][link]` |
> | **Rarità** | `INPUT[rarita][:rarita]` |
> | **Sintonia** | `INPUT[text(placeholder(es. sì oppure solo da un incantatore)):sintonia]` |
> | **Cariche** | `INPUT[text:cariche]` |
> | **Ricarica** | `INPUT[text:ricarica]` |
> | **Stato** | `INPUT[stato][:stato]` |

> [!opzioni]- ⚙️ Opzioni
> **Stato**: `INPUT[stato][:stato]`
> **Tipo**: `INPUT[inlineSelect(option(arma), option(armatura), option(scudo), option(oggetto meraviglioso), option(strumento), option(oggetto magico), option(veleno), option(tesoro), option(veicolo o cavalcatura)):tipo]`
> **Canonico**: `INPUT[toggle:canonico]`
> **Visibilità** *(dm = solo DM, fuori dal sito giocatori)*: `INPUT[inlineSelect(option(normale), option(dm)):visibilita]`
> **Rivelazione**: `INPUT[rivelazione][:rivelazione]`

> [!info]- ℹ️ Guida — Oggetto Magico
> **Cos'è** · Un oggetto del mondo — da equipaggiamento mondano ad artefatto senziente; armi/armature homebrew diventano giocabili.
> **Campi chiave** · **Tipo** (arma/armatura/oggetto magico…); per gli oggetti magici **Rarità** e **Sintonia**; per armi/armature i campi meccanici (**Danni**, **CA**, **Padronanza**) che li rendono usabili.
> **Spunti** · A cosa serve davvero, e chi lo vuole? Ha un costo nascosto o una volontà propria? Da dove viene — e perché è finito qui?

````tabs
--- 📋 Scheda


--- 📖 Lore

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTipoProfilo");
```
> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

%%prosa%%
## Aspetto
> [!question]- 💡 Aspetto e fattura

## Effetto
> [!question]- 💡 Cosa fa: regole/effetto al tavolo

## Provenienza
> [!question]- 💡 Costo, come si ottiene

%%/prosa%%

--- 📊 Carattere

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).radar(engine, app, "oggetto", component);
```

> [!abstract] Carattere
> **Natura Materiale** `INPUT[slider(minValue(1), maxValue(5), addLabels):natura_materiale]` → `VIEW[{natura_materiale} == 5 ? "5 · Perfetta" : ({natura_materiale} == 4 ? "4 · Avanzata" : ({natura_materiale} == 3 ? "3 · Fine" : ({natura_materiale} == 2 ? "2 · Forgiata" : ({natura_materiale} == 1 ? "1 · Grezza" : ("—")))))]`
> **Origine** `INPUT[slider(minValue(1), maxValue(5), addLabels):origine]` → `VIEW[{origine} == 5 ? "5 · Divina" : ({origine} == 4 ? "4 · Spirituale" : ({origine} == 3 ? "3 · Alchemica" : ({origine} == 2 ? "2 · Umana" : ({origine} == 1 ? "1 · Naturale" : ("—")))))]`
> **Funzione** `INPUT[slider(minValue(1), maxValue(5), addLabels):funzione]` → `VIEW[{funzione} == 5 ? "5 · Sacro" : ({funzione} == 4 ? "4 · Simbolico" : ({funzione} == 3 ? "3 · Versatile" : ({funzione} == 2 ? "2 · Arcana" : ({funzione} == 1 ? "1 · Utilitaria" : ("—")))))]`
> **Potere Attivo** `INPUT[slider(minValue(1), maxValue(5), addLabels):potere_attivo]` → `VIEW[{potere_attivo} == 5 ? "5 · Senziente" : ({potere_attivo} == 4 ? "4 · Semi-autonomo" : ({potere_attivo} == 3 ? "3 · Reattivo" : ({potere_attivo} == 2 ? "2 · Attivabile" : ({potere_attivo} == 1 ? "1 · Dormiente" : ("—")))))]`
> **Legame Spirituale** `INPUT[slider(minValue(1), maxValue(5), addLabels):legame]` → `VIEW[{legame} == 5 ? "5 · Vincolante" : ({legame} == 4 ? "4 · Legato" : ({legame} == 3 ? "3 · Ereditario" : ({legame} == 2 ? "2 · Empatico" : ({legame} == 1 ? "1 · Libero" : ("—")))))]`
> **Influenza sulla Realtà** `INPUT[slider(minValue(1), maxValue(5), addLabels):influenza_realta]` → `VIEW[{influenza_realta} == 5 ? "5 · Alterante" : ({influenza_realta} == 4 ? "4 · Distorsivo forte" : ({influenza_realta} == 3 ? "3 · Distorsivo lieve" : ({influenza_realta} == 2 ? "2 · Vibrazione magica" : ({influenza_realta} == 1 ? "1 · Passivo" : ("—")))))]`
> **Allineamento Intrinseco** `INPUT[slider(minValue(1), maxValue(5), addLabels):allineamento]` → `VIEW[{allineamento} == 5 ? "5 · Legale" : ({allineamento} == 4 ? "4 · Tendente all’ordine" : ({allineamento} == 3 ? "3 · Neutrale" : ({allineamento} == 2 ? "2 · Tendente al caos" : ({allineamento} == 1 ? "1 · Caotico" : ("—")))))]`

> [!note]- Natura Materiale — Livello di lavorazione e qualità della materia dell'oggetto.
> **1 · Grezza** — Rudimentale, naturale o primitivo: un osso, una pietra, un ramo sacro.
> **2 · Forgiata** — Tecniche tradizionali, lavorato a mano. Spade, bastoni rituali, talismani.
> **3 · Fine** — Alta qualità: ornamenti, bilanciamenti, iscrizioni, fattura eccelsa.
> **4 · Avanzata** — Tecnica sopraffina, tecnomagica o alchemica; meccanismi invisibili.
> **5 · Perfetta** — Forma perfetta: geometria sacra, materia impossibile, forgia divina.

> [!note]- Origine — Da dove nasce l'artefatto, dal mondo fisico ai piani superiori.
> **1 · Naturale** — Nato dalla natura, trasformato solo marginalmente. Cristalli, pietre vive.
> **2 · Umana** — Forgiato da mani mortali; frutto di cultura, artigianato, tecnologia.
> **3 · Alchemica** — Creato con scienza mistica, infusione magica, manipolazione arcana.
> **4 · Spirituale** — Nato da entità sovrannaturali, spiriti, sogni; ha un'anima o memoria.
> **5 · Divina** — Creato da una divinità o principio cosmico; potere intrinseco, irripetibile.

> [!note]- Funzione — Uso per cui l'oggetto è stato creato, dal pratico al sacro.
> **1 · Utilitaria** — Uso quotidiano o funzionale; può diventare sacro solo in seconda istanza.
> **2 · Arcana** — Usato in rituali o incantesimi; scopo pratico in contesti soprannaturali.
> **3 · Versatile** — Sia strumento che reliquia; può essere usato e venerato.
> **4 · Simbolico** — Venerato come simbolo; esposto, onorato, valore rappresentativo.
> **5 · Sacro** — Non si usa, si custodisce: emanazione divina o reliquia cosmica.

> [!note]- Potere Attivo — Grado di potere e autonomia d'azione dell'oggetto.
> **1 · Dormiente** — Nessun potere attivo; serve solo come focus o supporto.
> **2 · Attivabile** — Poteri solo tramite atti specifici: comandi, rituali, volontà dell'utente.
> **3 · Reattivo** — Reagisce all'ambiente o allo stato d'animo; può attivarsi da solo.
> **4 · Semi-autonomo** — Volontà debole; sceglie se attivarsi, comunica con sogni e impulsi.
> **5 · Senziente** — Ha coscienza propria; parla, sceglie, rifiuta comandi, ha uno scopo.

> [!note]- Legame Spirituale — Relazione vincolante tra l'artefatto e il suo portatore.
> **1 · Libero** — Usabile da chiunque; nessun legame richiesto o generato.
> **2 · Empatico** — Legame simbolico; migliora con la compatibilità, ma non vincola.
> **3 · Ereditario** — Si lega a stirpi o eletti; può rifiutarsi di funzionare con altri.
> **4 · Legato** — Vincolato all'anima del portatore; rompere il legame causa danni.
> **5 · Vincolante** — Legame definitivo o consumante; il portatore è posseduto o trasfigurato.

> [!note]- Influenza sulla Realtà — Descrive il grado in cui l’oggetto modifica l’ambiente, le leggi fisiche o i piani di esistenza con la sua sola presenza.
> **1 · Passivo** — Non influenza il mondo circostante se non quando attivamente usato.
> **2 · Vibrazione magica** — Emana un’aura percettibile solo da sensitivi o creature spirituali.
> **3 · Distorsivo lieve** — Influenza lievemente la realtà circostante. Presenze evanescenti, suoni, sogni, variazioni atmosferiche.
> **4 · Distorsivo forte** — La sua presenza altera il destino, l’equilibrio magico o gli eventi. Può causare prodigi o catastrofi involontarie.
> **5 · Alterante** — L’oggetto modifica stabilmente la realtà. Piegamento dello spazio, apertura di fratture dimensionali, manipolazione delle probabilità o delle leggi cosmiche.

> [!note]- Allineamento Intrinseco — Natura etica o cosmica interna dell’oggetto. Esprime se è legato a forze di ordine o disordine, indipendentemente dall’uso.
> **1 · Caotico** — L’oggetto porta instabilità, trasgressione o cambiamento radicale. Non può essere controllato completamente.
> **2 · Tendente al caos** — Favorisce l’autonomia, la rottura delle regole o l’individualismo.
> **3 · Neutrale** — L’oggetto non ha un orientamento etico o cosmico definito. Risponde al volere del portatore.
> **4 · Tendente all’ordine** — Esprime armonia, regole, strutture. Funziona meglio in contesti rituali e gerarchici.
> **5 · Legale** — Impone equilibrio, disciplina, coerenza spirituale o cosmica. Rifiuta l’uso improprio o deviante.

--- 🔗 Collegamenti

> [!tip] Collega
> Modo rapido e **guidato**: `BUTTON[collega-nota]` — scegli relazione e nota da una lista (scrive anche l'inverso). In alternativa compila i campi qui sotto: l'icona **☰** apre la **lista** delle note, la **✏️** è solo la modifica a mano.

> [!example] Relazioni
> **Proprietario**: `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):proprietario]`
> **Dove si trova**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):dove]`
> **Creatore**: `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):creatore]`
> **Materia / risorsa**: `INPUT[inlineListSuggester(optionQuery("Mondi/Risorse"), useLinks(partial), allowOther):materia]`
> **Tradizione magica**: `INPUT[suggester(optionQuery("Mondi/Magia"), useLinks(partial), allowOther):sistema_magico]`
> **Divinità / patrono**: `INPUT[suggester(optionQuery("Mondi/Divinita"), useLinks(partial), allowOther):divinita]`
> **Trovato in (incontri)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Incontri"), useLinks(partial), allowOther):incontri]`
> **Ricompensa di (missioni)**: `INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial), allowOther):missioni]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

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
