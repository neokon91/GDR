---
id: consorzio-del-sale-nero
nome: "Consorzio Del Sale Nero"
categoria: fazione
fileClass: fazione
tipo: gilda
stato: pronto
canonico: true
stato_canonico: canonico
mondo: "[[Brumafonda Demo]]"
leader: []
luoghi: ["[[Porto Di Brumafonda]]"]
personaggi: []
missioni: ["[[Recuperare La Campana Sommersa]]"]
obiettivo: "Riaprire le saline sommerse e controllare la nuova rotta."
gancio: "Assume il gruppo per recuperare la campana prima della veglia."
uso_al_tavolo: "Mette denaro, permessi e pressione sociale sul tavolo."
player_safe: "Il Consorzio paga bene chi rende di nuovo sicuro il porto."
obiettivo_nascosto: "Usare la campana come prova legale per reclamare il faro vecchio."
agenda: "Profitto e monopolio del sale nero."
influenza: "alta"
pressione: 4
prossima_mossa: "Compra testimoni e blocca i moli dei rivali."
scadenza_mondo: "Prima della Notte Della Lanterna Bassa"
progress_value: 2
progress_max: 6
innesco: "Se la missione fallisce o viene ritardata."
escalation: ["chiusura del molo", "ricatto ai barcaioli"]
posta: "Controllo della rotta e prezzo del sale."
mosse_visibili: ["offre contratti pubblici"]
mosse_segrete: ["falsifica registri portuali"]
scelte: ["Accettare oro o imporre condizioni pubbliche."]
rischi: ["Il Consorzio diventa padrone della ricostruzione."]
indizi: ["Contratti gia firmati prima del recupero."]
ricompense: ["permesso di accesso alle saline"]
risorse: ["navi basse", "magazzini", "credito"]
debolezze: ["dipende dai Custodi per la legittimita rituale"]
alleati: []
rivali: ["[[Custodi Delle Saline]]"]
trattati: []
relazioni: []
eventi: ["[[La Marea Ha Preso Il Faro Vecchio]]"]
propaga_a: ["[[Mercato Del Sale Nero]]"]
conseguenze: []
segreti: ["Il contratto include una clausola sul possesso dei resti del faro."]
domande_aperte: ["Chi nel Consorzio teme davvero la campana?"]
connessioni: ["[[Porto Di Brumafonda]]", "[[Mercato Del Sale Nero]]"]
---

# Consorzio Del Sale Nero

Potere economico demo: utile per testare fazioni, missioni, economia e conseguenze.

````tabs
tab: Potere

> [!infoboxwiki] Fazione
> Mondo: `INPUT[mondo][:mondo]`
>
> Stato: `INPUT[stato][:stato]`
>
> Obiettivo: `INPUT[text:obiettivo]`
>
> Pressione: `INPUT[pressione][:pressione]`
>
> Prossima mossa: `INPUT[prossima_mossa][:prossima_mossa]`

> [!regia]- Check Fazione
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderM7FamilyCards(dv, dv.current(), "fazione");
> ```

tab: Tavolo

> [!missione] Contratto E Ricatto
> Gancio: `INPUT[text:gancio]`
>
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`
>
> Scelte: `INPUT[list:scelte]`
>
> Rischi: `INPUT[list:rischi]`
>
> Ricompense: `INPUT[list:ricompense]`

> [!segreto]- Livello DM
> Obiettivo nascosto: `INPUT[text:obiettivo_nascosto]`
>
> Mosse segrete: `INPUT[list:mosse_segrete]`

tab: Rete

> [!conflitto] Propagazione
> Luoghi: `INPUT[luoghi][:luoghi]`
>
> Missioni: `INPUT[missioni][:missioni]`
>
> Rivali: `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):rivali]`
>
> Propaga a: `INPUT[propaga_a][:propaga_a]`

> [!regia]- Strumenti
> - [[z.bases/Fazioni.base]]
> - [[z.bases/Economia.base]]
> - [[Motore Mondo Vivo]]
````

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Luogo | [[Porto Di Brumafonda]] |
| Missione | [[Recuperare La Campana Sommersa]] |
| Rivale | [[Custodi Delle Saline]] |
