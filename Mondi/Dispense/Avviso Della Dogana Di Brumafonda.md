---
id: avviso-della-dogana-di-brumafonda
nome: "Avviso Della Dogana Di Brumafonda"
categoria: dispensa
tipo: documento
stato: pronto
pubblico: true
mondo: "[[Brumafonda Demo]]"
campagne: ["[[Sale Sotto La Nebbia]]"]
luogo: "[[Porto Di Brumafonda]]"
personaggi: []
sessioni: ["[[2026-05-28 - La Campana Nella Nebbia]]"]
player_safe: "Avviso pubblico: la rotta del faro vecchio resta chiusa finche la campana sommersa non viene recuperata o dichiarata perduta."
---

# Avviso Della Dogana Di Brumafonda

````tabs
tab: Dispensa

> [!lettura] Testo Consegnabile
> Pubblico: `INPUT[toggle:pubblico]`
>
> Player-safe: `INPUT[text:player_safe]`
>
> Mondo: `INPUT[mondo][:mondo]`
>
> Luogo: `INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luogo]`

> [!regia]- Check Dispensa
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderM7FamilyCards(dv, dv.current(), "dispensa");
> ```

tab: Testo

> [!lettura] Avviso Pubblico
> Per ordine della dogana, nessuna barca lascia il molo basso dopo il tramonto senza lanterna registrata e testimone del porto.
>
> La rotta del faro vecchio resta chiusa finche la campana sommersa non viene recuperata o dichiarata perduta davanti alla Lanterna Bassa.

tab: Uso

> [!scena] Quando Mostrarla
> Sessioni: `INPUT[inlineListSuggester(optionQuery("Mondi/Sessioni"), useLinks(partial), allowOther):sessioni]`
>
> Collegala quando il party chiede cosa sa il porto sulla rotta chiusa.

> [!conflitto]- Altre Dispense
> ```dataview
> TABLE stato, pubblico, player_safe, sessioni
> FROM "Mondi/Dispense"
> WHERE file.name != this.file.name
> SORT file.name ASC
> ```
````

Per ordine della dogana, nessuna barca lascia il molo basso dopo il tramonto senza lanterna registrata e testimone del porto.

La rotta del faro vecchio resta chiusa finche la campana sommersa non viene recuperata o dichiarata perduta davanti alla Lanterna Bassa.

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Pubblico | true |
| Sessione | [[2026-05-28 - La Campana Nella Nebbia]] |
