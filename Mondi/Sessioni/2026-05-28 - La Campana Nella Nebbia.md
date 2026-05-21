---
id: 2026-05-28-la-campana-nella-nebbia
nome: "La Campana Nella Nebbia"
cssclasses:
  - tavolo
categoria: sessione
fileClass: sessione
tipo: "sessione di campagna"
data: 2026-05-28
data_mondo: "Vigilia della Lanterna Bassa"
fc-calendar: "Brumafonda"
fc-date:
fc-category: sessione
fc-display-name: "La Campana Nella Nebbia"
fc-end:
stato: giocata
attiva: false
pubblico: true
mondo: "[[Brumafonda Demo]]"
campagne: ["[[Sale Sotto La Nebbia]]"]
luoghi: ["[[Porto Di Brumafonda]]"]
personaggi: []
missioni: ["[[Recuperare La Campana Sommersa]]"]
tracciati: []
creature: []
incontri: []
dispense: ["[[Avviso Della Dogana Di Brumafonda]]"]
mappe: ["[[Mappa Pubblica Di Brumafonda]]"]
audio: []
immagini: []
video: []
fazioni: ["[[Consorzio Del Sale Nero]]"]
oggetti: []
appunti_live: []
scena_corrente: "La dogana chiude mentre la campana suona sotto la nebbia."
decisioni_prese: ["Il gruppo ascolta i Custodi prima di firmare il contratto."]
obiettivo: "Mettere il gruppo davanti alla scelta tra profitto e legittimita."
apertura: "Una campana suona sotto il molo e tutti i mercanti tacciono."
scelta: "Firmare con il Consorzio o pretendere testimoni pubblici."
scene: ["contratto alla dogana", "veglia al molo", "preparazione della barca"]
ricompense: []
segreti_rivelabili: []
domande_al_tavolo: ["Chi vi fidate a lasciare sulla banchina?"]
decisioni_attese: ["scegliere il patrono del recupero"]
pressioni: ["Consorzio", "Custodi", "marea"]
materiale_pronto: ["[[Mappa Pubblica Di Brumafonda]]", "[[Avviso Della Dogana Di Brumafonda]]"]
conseguenze: ["[[La Marea Ha Preso Il Faro Vecchio]]"]
entita_impattate: ["[[Porto Di Brumafonda]]", "[[Recuperare La Campana Sommersa]]", "[[Consorzio Del Sale Nero]]"]
propaga_a: ["[[Mercato Del Sale Nero]]", "[[Culto Della Lanterna Bassa]]"]
propagazione_stato: "aperta"
recap_pubblico: ["Il gruppo ha visto il porto fermarsi quando la campana sommersa ha suonato sotto la nebbia."]
recap_dm: ["Il Consorzio ha accelerato il contratto dopo il suono della campana."]
prossima_apertura: "La barca lascia il molo basso mentre le lanterne scendono a pelo d'acqua."
output_sessione: ["missione agganciata", "mappa pubblica pronta", "conseguenza storica creata"]
---

# La Campana Nella Nebbia

Sessione demo gia giocata per alimentare Vista Giocatori, recap e conseguenze.

````tabs
tab: Prepara

> [!scena] Scaletta
> Obiettivo: `INPUT[text:obiettivo]`
>
> Apertura: `INPUT[text:apertura]`
>
> Scelta: `INPUT[text:scelta]`
>
> Pressioni: `INPUT[inlineList:pressioni]`
>
> Materiale pronto: `INPUT[inlineList:materiale_pronto]`

> [!regia]- Check Sessione
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderPlayableOutline(dv, dv.current());
> ```

tab: Ancore

> [!luogo] Mondo E Tavolo
> Mondo: `INPUT[mondo][:mondo]`
>
> Campagne: `INPUT[campagne][:campagne]`
>
> Luoghi: `INPUT[luoghi][:luoghi]`
>
> Fazioni: `INPUT[fazioni][:fazioni]`
>
> Missioni: `INPUT[missioni][:missioni]`

> [!regia]- Rete Sessione
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderSessionAnchorCards(dv, dv.current());
> ```

tab: Tavolo

> [!regia] Live
> Attiva: `INPUT[toggle:attiva]`
>
> Stato: `INPUT[stato][:stato]`
>
> Scena corrente: `INPUT[text:scena_corrente]`
>
> Decisioni prese: `INPUT[list:decisioni_prese]`
>
> Tiro rapido: `dice: 1d20`

> [!mappa]- Materiali
> Mappe: `INPUT[inlineListSuggester(optionQuery("Risorse/Mappe"), useLinks(partial), allowOther):mappe]`
>
> Dispense: `INPUT[inlineListSuggester(optionQuery("Mondi/Dispense"), useLinks(partial), allowOther):dispense]`

> [!regia]- Stato Live
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderSessionLiveCards(dv, dv.current());
> ```

tab: Dopo

> [!timer] Continuita
> Conseguenze: `INPUT[list:conseguenze]`
>
> Entita impattate: `INPUT[entita_impattate][:entita_impattate]`
>
> Propaga a: `INPUT[propaga_a][:propaga_a]`
>
> Stato propagazione: `INPUT[text:propagazione_stato]`
>
> Prossima apertura: `INPUT[text:prossima_apertura]`

> [!lettura]- Recap Pubblico
> `INPUT[list:recap_pubblico]`

> [!segreto]- Recap DM
> `INPUT[list:recap_dm]`

> [!regia]- Chiusura
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderSessionPostCards(dv, dv.current());
> ```
````

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Obiettivo | Mettere il gruppo davanti alla scelta tra profitto e legittimita. |
| Mappa | [[Mappa Pubblica Di Brumafonda]] |
| Conseguenza | [[La Marea Ha Preso Il Faro Vecchio]] |
