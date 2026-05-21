---
id: culto-della-lanterna-bassa
nome: "Culto Della Lanterna Bassa"
categoria: religione
tipo: "ordine religioso"
sottotipo: culto
stato: pronto
canonico: true
stato_canonico: canonico
mondo: "[[Brumafonda Demo]]"
divinita: []
templi: ["[[Porto Di Brumafonda]]"]
luoghi_sacri: ["[[Porto Di Brumafonda]]"]
fazioni: ["[[Consorzio Del Sale Nero]]"]
pressione: 1
gancio: "Il culto benedice solo recuperi dichiarati davanti alla marea."
uso_al_tavolo: "Fornisce rituali, limiti morali e pubblico testimone."
player_safe: "La Lanterna Bassa guida chi rientra dal mare quando il faro non basta."
prossima_mossa: "Chiede una processione al molo prima del recupero."
eresie: ["vendere una campana prima del rito"]
calendario_rituale: ["Notte Della Lanterna Bassa"]
influenza_politica: "media"
relazioni: ["[[Custodi Delle Saline]]"]
rivali: ["[[Consorzio Del Sale Nero]]"]
propaga_a: ["[[Custodi Delle Saline]]"]
entita_impattate: ["[[Porto Di Brumafonda]]"]
dogmi: ["Ogni luce bassa indica un debito da onorare."]
rituali: ["accendere una lanterna sotto il livello della banchina"]
misteri: ["Alcune lanterne restano accese sott'acqua."]
indizi: ["olio salato che non brucia in superficie"]
scelte: ["Rispettare il rito o partire subito."]
rischi: ["Perdere protezione sociale nel porto."]
ricompense: ["benedizione per attraversare la nebbia"]
conseguenze: []
segreti: ["Il culto conosce il nome dell'ultimo guardiano del faro."]
connessioni: ["[[Custodi Delle Saline]]", "[[Porto Di Brumafonda]]"]
---

# Culto Della Lanterna Bassa

Religione/culto demo per coprire rituali, calendario, conseguenze e player-safe.

````tabs
tab: Culto

> [!infoboxwiki] Religione
> Mondo: `INPUT[mondo][:mondo]`
>
> Stato: `INPUT[stato][:stato]`
>
> Pressione: `INPUT[pressione][:pressione]`
>
> Player-safe: `INPUT[text:player_safe]`

> [!regia]- Check Fazione/Culto
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderM7FamilyCards(dv, dv.current(), "fazione");
> ```

tab: Rito

> [!lettura] Pratica Al Tavolo
> Gancio: `INPUT[text:gancio]`
>
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`
>
> Prossima mossa: `INPUT[prossima_mossa][:prossima_mossa]`
>
> Rituali: `INPUT[list:rituali]`
>
> Eresie: `INPUT[list:eresie]`

tab: Rete

> [!luogo] Luoghi Sacri E Tensioni
> Templi: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):templi]`
>
> Luoghi sacri: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi_sacri]`
>
> Rivali: `INPUT[inlineListSuggester(optionQuery("Mondi"), useLinks(partial), allowOther):rivali]`
>
> Entita impattate: `INPUT[entita_impattate][:entita_impattate]`
>
> Propaga a: `INPUT[propaga_a][:propaga_a]`

> [!regia]- Strumenti
> - [[z.bases/Worldbuilding.base]]
> - [[z.bases/Fazioni.base]]
> - [[Mondi/Calendario]]
````

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Luogo sacro | [[Porto Di Brumafonda]] |
| Rivale | [[Consorzio Del Sale Nero]] |
| Rito | Processione al molo prima del recupero |
