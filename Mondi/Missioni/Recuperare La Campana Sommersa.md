---
id: recuperare-la-campana-sommersa
nome: "Recuperare La Campana Sommersa"
categoria: missione
fileClass: missione
tipo: incarico
stato: accettata
mondo: "[[Brumafonda Demo]]"
campagne: ["[[Sale Sotto La Nebbia]]"]
committente:
luoghi: ["[[Porto Di Brumafonda]]"]
personaggi: []
fazioni: ["[[Consorzio Del Sale Nero]]"]
tracciati: []
ricompense: []
sessioni: ["[[2026-05-28 - La Campana Nella Nebbia]]"]
progress_value: 1
progress_max: 6
pressione: 5
posta: "Chi recupera la campana decide se il faro diventa bene pubblico o proprieta del Consorzio."
scelta: "Partire subito con il Consorzio o aspettare la benedizione dei Custodi."
gancio: "La campana sommersa puo rendere di nuovo sicura la rotta."
uso_al_tavolo: "Costringe a scegliere tra denaro rapido e legittimita pubblica."
player_safe: "Recuperare una campana dal vecchio faro per riaprire una rotta sicura."
prossima_mossa: "Il Consorzio manda una squadra privata se i PG rimandano."
domande_aperte: ["La campana deve tornare al culto o al porto?"]
indizi: ["La corda della campana e stata tagliata dall'interno."]
ostacoli: ["nebbia fitta", "marea contraria", "contratto ambiguo"]
scene_pronte: ["contratto alla dogana", "veglia al molo", "immersione nel faro"]
decisioni: ["accettare clausole del Consorzio", "coinvolgere i Custodi"]
conseguenze: ["[[La Marea Ha Preso Il Faro Vecchio]]"]
entita_impattate: ["[[Porto Di Brumafonda]]", "[[Consorzio Del Sale Nero]]", "[[Culto Della Lanterna Bassa]]"]
propaga_a: ["[[Mercato Del Sale Nero]]", "[[La Marea Ha Preso Il Faro Vecchio]]"]
propagazione_stato: "aperta"
segreti: ["La campana contiene nomi incisi che non compaiono nei registri."]
connessioni: ["[[Porto Di Brumafonda]]", "[[Consorzio Del Sale Nero]]", "[[Custodi Delle Saline]]"]
scadenza_mondo: "Prima della Notte Della Lanterna Bassa"
fc-calendar: "Brumafonda"
fc-date:
fc-category: scadenza
fc-display-name: "Recuperare La Campana Sommersa"
fc-end:
---

# Recuperare La Campana Sommersa

Missione demo collegata a luogo, fazione, economia, mappa e sessione.

````tabs
tab: Missione

> [!missione] Obiettivo Giocabile
> Mondo: `INPUT[mondo][:mondo]`
>
> Stato: `INPUT[stato][:stato]`
>
> Gancio: `INPUT[text:gancio]`
>
> Scelta: `INPUT[text:scelta]`
>
> Pressione: `INPUT[pressione][:pressione]`

> [!regia]- Check Missione
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderCreationFeedback(dv);
> ```

tab: Tavolo

> [!scena] Preparazione
> Luoghi: `INPUT[luoghi][:luoghi]`
>
> Fazioni: `INPUT[fazioni][:fazioni]`
>
> Sessioni: `INPUT[inlineListSuggester(optionQuery("Mondi/Sessioni"), useLinks(partial), allowOther):sessioni]`
>
> Scene pronte: `INPUT[list:scene_pronte]`
>
> Ostacoli: `INPUT[list:ostacoli]`

> [!timer]- Clock Missione
> Progresso: `INPUT[text:progress_value]`
>
> Massimo: `INPUT[text:progress_max]`
>
> Prossima mossa: `INPUT[prossima_mossa][:prossima_mossa]`

tab: Conseguenze

> [!timer] M6
> Conseguenze: `INPUT[list:conseguenze]`
>
> Entita impattate: `INPUT[entita_impattate][:entita_impattate]`
>
> Propaga a: `INPUT[propaga_a][:propaga_a]`
>
> Stato propagazione: `INPUT[text:propagazione_stato]`

> [!conflitto]- Bersagli Collegati
> ```dataview
> TABLE categoria, stato, pressione, prossima_mossa
> FROM "Mondi"
> WHERE contains(this.entita_impattate, file.link) OR contains(this.propaga_a, file.link)
> SORT pressione DESC, file.name ASC
> ```

tab: Strumenti

> [!regia] Correzione Rapida
> - [[z.bases/Missioni.base]]
> - [[z.bases/Luoghi.base]]
> - [[z.bases/Fazioni.base]]
> - [[Motore Mondo Vivo]]
````

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Luogo | [[Porto Di Brumafonda]] |
| Fazione | [[Consorzio Del Sale Nero]] |
| Sessione | [[2026-05-28 - La Campana Nella Nebbia]] |
