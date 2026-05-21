---
id: mercato-del-sale-nero
nome: "Mercato Del Sale Nero"
categoria: risorsa
fileClass: mercato
tipo: mercato
stato: pronto
mondo: "[[Brumafonda Demo]]"
luogo: "[[Porto Di Brumafonda]]"
luoghi: ["[[Porto Di Brumafonda]]"]
regioni: []
fazioni_controllanti: ["[[Consorzio Del Sale Nero]]"]
fazioni: ["[[Consorzio Del Sale Nero]]"]
risorse: []
rotte: []
pedaggi: ["quota sulla banchina bassa"]
rischi: ["prezzo manipolato dopo il crollo del faro"]
dipendenze: ["lanterne", "barche basse", "benedizione del culto"]
pressione: 3
gancio: "Il prezzo del sale decide chi puo finanziare il recupero."
uso_al_tavolo: "Permette scelte su debiti, favori e risorse prima della missione."
player_safe: "Mercato portuale dove il sale nero vale piu dell'argento quando cala la nebbia."
prossima_mossa: "Il Consorzio aumenta i pedaggi ai barcaioli indipendenti."
connessioni: ["[[Consorzio Del Sale Nero]]", "[[Porto Di Brumafonda]]"]
missioni: ["[[Recuperare La Campana Sommersa]]"]
conflitti: []
sessioni: ["[[2026-05-28 - La Campana Nella Nebbia]]"]
mappe: ["[[Mappa Pubblica Di Brumafonda]]"]
coordinate:
mappa: "[[Mappa Pubblica Di Brumafonda]]"
layer_mappa: commerciale
tipo_mappa: commerciale
propaga_a: ["[[Consorzio Del Sale Nero]]"]
entita_impattate: ["[[Porto Di Brumafonda]]"]
conseguenze: []
domande_aperte: ["Chi puo comprare senza indebitarsi?"]
---

# Mercato Del Sale Nero

Nodo economia demo collegato a luogo, fazione, missione e mappa.

````tabs
tab: Mercato

> [!infoboxwiki] Nodo Economico
> Mondo: `INPUT[mondo][:mondo]`
>
> Luogo: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`
>
> Pressione: `INPUT[pressione][:pressione]`
>
> Player-safe: `INPUT[text:player_safe]`

> [!regia]- Check Mercato
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderM7FamilyCards(dv, dv.current(), "risorsa");
> ```

tab: Tavolo

> [!missione] Scelte Economiche
> Gancio: `INPUT[text:gancio]`
>
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`
>
> Prossima mossa: `INPUT[prossima_mossa][:prossima_mossa]`
>
> Rischi: `INPUT[list:rischi]`
>
> Pedaggi: `INPUT[list:pedaggi]`

tab: Connessioni

> [!conflitto] Controllo E Propagazione
> Fazioni controllanti: `INPUT[inlineListSuggester(optionQuery("Mondi/Fazioni"), useLinks(partial), allowOther):fazioni_controllanti]`
>
> Missioni: `INPUT[missioni][:missioni]`
>
> Entita impattate: `INPUT[entita_impattate][:entita_impattate]`
>
> Propaga a: `INPUT[propaga_a][:propaga_a]`

> [!mappa]- Marker
> Mappa: `INPUT[inlineListSuggester(optionQuery("Risorse/Mappe"), useLinks(partial), allowOther):mappa]`
>
> Layer mappa: `INPUT[text:layer_mappa]`
>
> - [[z.bases/Economia.base]]
> - [[z.bases/Atlante Mappe.base]]
````

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Luogo | [[Porto Di Brumafonda]] |
| Controllo | [[Consorzio Del Sale Nero]] |
| Missione | [[Recuperare La Campana Sommersa]] |
