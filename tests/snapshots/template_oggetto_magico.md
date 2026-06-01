<% await tp.user.crea_oggetto_magico(tp) %>
# `=this.nome`

> [!info] 🎒 Oggetto Magico
> **Tipo**: `VIEW[{tipo} ?? "—"]` · **Mondo**: `VIEW[{mondo}][text(renderMarkdown)]`
> **Rarità** `VIEW[{rarita} ?? "—"]` · **Sintonia** `VIEW[{sintonia} ?? "—"]`
>
> **Stato**: `INPUT[stato][:stato]`

````tabs
--- Scheda

> [!abstract] Scheda
> Rarità: `INPUT[rarita][:rarita]`
> Sintonia: `INPUT[text:sintonia]`

--- Lore

> [!note]- Descrizione
> Cosa è, com'è, perché conta al tavolo.

> [!note] Aspetto
> `INPUT[textArea:descrizione_oggetto]`

> [!note] Effetto
> `INPUT[textArea:effetto]`

> [!note] Provenienza
> `INPUT[textArea:provenienza]`


--- Carattere

> [!abstract] Carattere
> **Natura Materiale** `INPUT[slider(minValue(1), maxValue(5), addLabels):natura_materiale]` → `VIEW[{natura_materiale} == 5 ? "5 · Perfetta" : ({natura_materiale} == 4 ? "4 · Avanzata" : ({natura_materiale} == 3 ? "3 · Fine" : ({natura_materiale} == 2 ? "2 · Forgiata" : ({natura_materiale} == 1 ? "1 · Grezza" : ("—")))))]`
> **Origine** `INPUT[slider(minValue(1), maxValue(5), addLabels):origine]` → `VIEW[{origine} == 5 ? "5 · Divina" : ({origine} == 4 ? "4 · Spirituale" : ({origine} == 3 ? "3 · Alchemica" : ({origine} == 2 ? "2 · Umana" : ({origine} == 1 ? "1 · Naturale" : ("—")))))]`
> **Funzione** `INPUT[slider(minValue(1), maxValue(5), addLabels):funzione]` → `VIEW[{funzione} == 5 ? "5 · Sacro" : ({funzione} == 4 ? "4 · Simbolico" : ({funzione} == 3 ? "3 · Versatile" : ({funzione} == 2 ? "2 · Arcana" : ({funzione} == 1 ? "1 · Utilitaria" : ("—")))))]`
> **Potere Attivo** `INPUT[slider(minValue(1), maxValue(5), addLabels):potere_attivo]` → `VIEW[{potere_attivo} == 5 ? "5 · Senziente" : ({potere_attivo} == 4 ? "4 · Semi-autonomo" : ({potere_attivo} == 3 ? "3 · Reattivo" : ({potere_attivo} == 2 ? "2 · Attivabile" : ({potere_attivo} == 1 ? "1 · Dormiente" : ("—")))))]`
> **Legame Spirituale** `INPUT[slider(minValue(1), maxValue(5), addLabels):legame]` → `VIEW[{legame} == 5 ? "5 · Vincolante" : ({legame} == 4 ? "4 · Legato" : ({legame} == 3 ? "3 · Ereditario" : ({legame} == 2 ? "2 · Empatico" : ({legame} == 1 ? "1 · Libero" : ("—")))))]`

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
> **Proprietario**: `INPUT[suggester(optionQuery("Mondi/Personaggi"), useLinks(partial), allowOther):proprietario]`
> **Dove si trova**: `INPUT[suggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):dove]`

> [!example] Collegamenti
> Mondo: `INPUT[mondo][:mondo]`
>
> Connessioni: `INPUT[connessioni][:connessioni]`

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
