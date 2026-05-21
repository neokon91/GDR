---
id: campagna-sale-sotto-la-nebbia
nome: "Campagna - Sale Sotto La Nebbia"
categoria: campagna
tipo: campagna
stato: preparazione
profilo: "sandbox"
tono: "mistero operativo"
promessa: "Ogni spedizione al porto cambia equilibri, prezzi e alleanze."
calendario: "Brumafonda"
mondo: "[[Brumafonda Demo]]"
regione: "[[Porto Di Brumafonda]]"
luoghi: ["[[Porto Di Brumafonda]]"]
culture: ["[[Custodi Delle Saline]]"]
fazioni: ["[[Consorzio Del Sale Nero]]"]
conflitti: []
missioni: ["[[Recuperare La Campana Sommersa]]"]
sessioni: ["[[2026-05-28 - La Campana Nella Nebbia]]"]
ricompense: []
domande_campagna: ["Chi diventa padrone del faro nuovo?"]
---

# Campagna - Sale Sotto La Nebbia

Demo di campagna breve: il gruppo entra in una citta portuale dove commercio, culto e memoria pubblica si contendono la stessa campana.

````tabs
tab: Stato

> [!infoboxwiki] Campagna
> Mondo: `INPUT[mondo][:mondo]`
>
> Profilo: `INPUT[text:profilo]`
>
> Tono: `INPUT[text:tono]`
>
> Stato: `INPUT[stato][:stato]`

> [!regia]- Check Campagna
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderM7FamilyCards(dv, dv.current(), "campagna");
> ```

tab: Gioco

> [!missione] Da Mondo A Sessioni
> Regione: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):regione]`
>
> Missioni: `INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial), allowOther):missioni]`
>
> Sessioni: `INPUT[inlineListSuggester(optionQuery("Mondi/Sessioni"), useLinks(partial), allowOther):sessioni]`
>
> Domande campagna: `INPUT[list:domande_campagna]`

> [!conflitto]- Pressioni Collegate
> ```dataview
> TABLE categoria, stato, pressione, prossima_mossa
> FROM "Mondi"
> WHERE contains(campagne, this.file.link) OR contains(campagna, this.file.link) OR contains(mondo, this.mondo)
> SORT pressione DESC, file.name ASC
> ```

tab: Strumenti

> [!regia] Correzione Rapida
> - [[Campagna da Ambientazione]]
> - [[Risorse/Preparazione Sessione]]
> - [[z.bases/Missioni.base]]
> - [[z.bases/Luoghi.base]]
> - [[z.bases/Fazioni.base]]
````

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Mondo | [[Brumafonda Demo]] |
| Missione | [[Recuperare La Campana Sommersa]] |
| Prima sessione | [[2026-05-28 - La Campana Nella Nebbia]] |
