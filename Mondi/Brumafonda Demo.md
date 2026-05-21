---
id: brumafonda-demo
nome: "Brumafonda Demo"
categoria: mondo
fileClass: mondo
stato: pronto
tono: "mistero costiero"
tema: "citta di sale, debiti e fari spenti"
temi: ["memoria", "scambio", "marea"]
promesse_narrative: ["ogni scelta lascia una traccia nella citta"]
limiti: []
ispirazioni: ["laguna nebbiosa", "porto mercantile", "culto dei fari"]
non_vogliamo: []
tecnologia: "rinascimentale bassa"
magia: "rara, rituale, legata alla marea"
calendario: "Brumafonda"
premessa: "Una citta portuale vive sopra saline sommerse e deve decidere cosa sacrificare quando la marea riporta vecchi debiti."
gancio: "Il vecchio faro e crollato e la campana sommersa suona solo quando qualcuno mente al porto."
conflitto_centrale: "Il Consorzio vuole riaprire le saline proibite, mentre i Custodi temono che la citta perda la memoria dei morti."
luoghi_iconici: ["[[Porto Di Brumafonda]]"]
fazioni_principali: ["[[Consorzio Del Sale Nero]]"]
misteri_pubblici: ["La campana del faro suona sotto la nebbia anche quando il mare e calmo."]
materiale_pubblico: ["[[Mappa Pubblica Di Brumafonda]]"]
domande_guida: ["Chi controlla davvero il prezzo del sale nero?", "Cosa resta sotto il faro vecchio?"]
continenti: []
fazioni: ["[[Consorzio Del Sale Nero]]"]
religioni: ["[[Culto Della Lanterna Bassa]]"]
campagne: ["[[Sale Sotto La Nebbia]]"]
verita: []
rumor_attivi: ["I barcaioli sentono una campana sotto la banchina al cambio di marea."]
stato_mondo: ["Il faro vecchio e perso; il porto cerca una nuova rotta sicura."]
continuita: ["La prossima sessione parte dal molo delle saline."]
relazioni_chiave: []
domande_aperte: ["La campana protegge la citta o la tiene in ostaggio?"]
tensioni: ["mercanti contro custodi", "fede popolare contro profitto"]
fronti: ["[[Recuperare La Campana Sommersa]]"]
segreti: []
checklist_lore: []
canonico: true
---

# Brumafonda Demo

Mondo demo per verificare il flusso 1.0: creazione mondo, espansione, economia, mappe, campagna, sessione, conseguenza e vista giocatori.

````tabs
tab: Codex

> [!infoboxwiki] Identita Del Mondo
> Premessa: `INPUT[text:premessa]`
>
> Tono: `INPUT[text:tono]`
>
> Tema: `INPUT[text:tema]`
>
> Calendario: `INPUT[text:calendario]`
>
> Canonico: `INPUT[canonico][:canonico]`

> [!scena]- Stato Al Tavolo

> - La citta conosce la perdita del faro vecchio.
> - Il Consorzio cerca volontari per recuperare la campana sommersa.
> - I Custodi chiedono che nessun reperto venga venduto prima del rito della Lanterna Bassa.

tab: Spine

> [!luogo] Ancore Del Mondo
> Luoghi iconici: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi_iconici]`
>
> Fazioni principali: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni_principali]`
>
> Religioni: `INPUT[inlineListSuggester(optionQuery("Mondi/Religioni"), useLinks(partial), allowOther):religioni]`
>
> Campagne: `INPUT[inlineListSuggester(optionQuery("Campagne"), useLinks(partial), allowOther):campagne]`

> [!regia]- Stato M7
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderM7FamilyCards(dv, dv.current(), "mondo");
> ```

tab: Continuita

> [!timer] Stato Del Mondo
> Stato mondo: `INPUT[list:stato_mondo]`
>
> Fronti: `INPUT[inlineListSuggester(optionQuery("Mondi/Missioni"), useLinks(partial), allowOther):fronti]`
>
> Tensioni: `INPUT[list:tensioni]`
>
> Domande aperte: `INPUT[list:domande_aperte]`

> [!conflitto]- Catena Viva
> ```dataview
> TABLE categoria, tipo, stato, pressione, prossima_mossa
> FROM "Mondi"
> WHERE contains(mondo, this.file.link) OR contains(connessioni, this.file.link) OR contains(campagne, this.file.link)
> SORT categoria ASC, pressione DESC, file.name ASC
> ```

tab: Strumenti

> [!regia] Superfici Operative
> - [[Worldbuilder Dashboard]]
> - [[Atlante del Mondo]]
> - [[Bibbia del Mondo]]
> - [[Motore Mondo Vivo]]
> - [[z.bases/Worldbuilding.base]]
> - [[Risorse/Mappe/Schema Relazioni GDR.excalidraw]]
````

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Premessa | Una citta di sale, debiti e fari spenti. |
| Luogo iniziale | [[Porto Di Brumafonda]] |
| Potere iniziale | [[Consorzio Del Sale Nero]] |
| Missione iniziale | [[Recuperare La Campana Sommersa]] |
