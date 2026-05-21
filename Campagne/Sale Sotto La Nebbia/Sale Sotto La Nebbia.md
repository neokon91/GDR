---
id: campagna-sale-sotto-la-nebbia
nome: "Sale Sotto La Nebbia"
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

# Sale Sotto La Nebbia

Dossier campagna demo. Il Codex resta organizzato per mondo, luoghi, fazioni, missioni e timeline; questa pagina e il pacchetto giocabile che tiene insieme il materiale finale.

````tabs
tab: Dossier

> [!infoboxwiki] Sale Sotto La Nebbia
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

tab: Giocare

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

tab: Kit

> [!scena] Materiale Di Campagna
> - [[Brumafonda Demo]]
> - [[Porto Di Brumafonda]]
> - [[Consorzio Del Sale Nero]]
> - [[Culto Della Lanterna Bassa]]
> - [[Custodi Delle Saline]]
> - [[Mercato Del Sale Nero]]
> - [[Recuperare La Campana Sommersa]]
> - [[2026-05-28 - La Campana Nella Nebbia]]
> - [[La Marea Ha Preso Il Faro Vecchio]]

> [!mappa]- Player-Safe
> - [[Mappa Pubblica Di Brumafonda]]
> - [[Avviso Della Dogana Di Brumafonda]]
> - [[Vista Giocatori]]

tab: Regia

> [!regia] Flusso Operativo
> - [[Campagna da Ambientazione]]
> - [[Risorse/Preparazione Sessione]]
> - [[Durante il Gioco]]
> - [[Risorse/Post Sessione Guidato]]
> - [[Motore Mondo Vivo]]
> - [[Cosa Succede Fuori Scena]]

> [!regia]- Correzione Rapida
> - [[z.bases/Missioni.base]]
> - [[z.bases/Luoghi.base]]
> - [[z.bases/Fazioni.base]]
> - [[z.bases/Atlante Mappe.base]]
````

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Mondo | [[Brumafonda Demo]] |
| Missione | [[Recuperare La Campana Sommersa]] |
| Prima sessione | [[2026-05-28 - La Campana Nella Nebbia]] |
