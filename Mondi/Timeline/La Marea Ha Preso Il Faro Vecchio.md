---
id: la-marea-ha-preso-il-faro-vecchio
nome: "La Marea Ha Preso Il Faro Vecchio"
categoria: evento storico
tipo: evento
stato: canonico
stato_canonico: canonico
canonico: true
fonte: prep
fonte_note: "demo finale"
grado_certezza: alto
contraddice: []
retcon_di: []
retcon_motivo:
mondo: "[[Brumafonda Demo]]"
data_mondo: "Tre notti prima della Lanterna Bassa"
data_reale: 2026-05-28
fc-calendar: "Brumafonda"
fc-date:
fc-category: conseguenza
fc-display-name: "La Marea Ha Preso Il Faro Vecchio"
luoghi: ["[[Porto Di Brumafonda]]"]
personaggi: []
fazioni: ["[[Consorzio Del Sale Nero]]"]
missioni: ["[[Recuperare La Campana Sommersa]]"]
tracciati: []
sessioni: ["[[2026-05-28 - La Campana Nella Nebbia]]"]
causa: "Il faro vecchio e crollato durante una marea anomala."
gancio: "La campana rimasta sotto il faro puo decidere la nuova autorita sul porto."
uso_al_tavolo: "Trasforma una scena iniziale in pressione su missione, mercato e fazioni."
player_safe: "Il faro vecchio e crollato; recuperare la campana puo riaprire la rotta."
connessioni: ["[[Porto Di Brumafonda]]", "[[Recuperare La Campana Sommersa]]"]
cause: ["marea anomala", "faro non mantenuto"]
effetti: ["rotta chiusa", "prezzo del sale aumentato"]
entita_impattate: ["[[Porto Di Brumafonda]]", "[[Mercato Del Sale Nero]]"]
propaga_a: ["[[Recuperare La Campana Sommersa]]", "[[Consorzio Del Sale Nero]]"]
stato_mondo: ["rotta interrotta", "molo sotto pressione"]
fatti_accertati: ["Il faro non illumina piu la rotta bassa."]
memoria_pubblica: ["Tutti ricordano il suono della campana nella nebbia."]
versioni_alternative: ["Alcuni dicono che non sia stato il mare a prendere il faro."]
cambiamenti_quotidiani: ["I barcaioli chiedono il doppio per uscire dopo il tramonto."]
eredita_materiali: ["resti del faro", "campana sommersa"]
conseguenze: ["Prezzo del sale aumentato", "Missione di recupero aperta"]
prossima_mossa: "Il Consorzio usa l'emergenza per reclamare il faro nuovo."
giocabile: true
scelte: ["recuperare per il porto o per un patrono"]
rischi: ["monopolio sul faro nuovo"]
indizi: ["corde tagliate", "registri mancanti"]
png_coinvolti: []
ricompense: []
---

# La Marea Ha Preso Il Faro Vecchio

Conseguenza demo: azione del mondo -> missione -> propagazione a luogo, mercato e fazione.

````tabs
tab: Evento

> [!timer] Causa Effetto
> Mondo: `INPUT[mondo][:mondo]`
>
> Stato: `INPUT[stato][:stato]`
>
> Causa: `INPUT[text:causa]`
>
> Effetti: `INPUT[list:effetti]`
>
> Prossima mossa: `INPUT[prossima_mossa][:prossima_mossa]`

> [!regia]- Check Continuita
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderM7FamilyCards(dv, dv.current(), "continuita");
> ```

tab: Propagazione

> [!conflitto] Bersagli
> Luoghi: `INPUT[luoghi][:luoghi]`
>
> Fazioni: `INPUT[fazioni][:fazioni]`
>
> Missioni: `INPUT[missioni][:missioni]`
>
> Sessioni: `INPUT[inlineListSuggester(optionQuery("Mondi/Sessioni"), useLinks(partial), allowOther):sessioni]`
>
> Entita impattate: `INPUT[entita_impattate][:entita_impattate]`
>
> Propaga a: `INPUT[propaga_a][:propaga_a]`

> [!regia]- Coda M6
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderWorldImpact(dv, dv.current());
> ```

tab: Pubblico

> [!lettura] Memoria
> Player-safe: `INPUT[text:player_safe]`
>
> Memoria pubblica: `INPUT[list:memoria_pubblica]`
>
> Versioni alternative: `INPUT[list:versioni_alternative]`

> [!segreto]- DM
> Indizi: `INPUT[list:indizi]`
>
> Rischi: `INPUT[list:rischi]`

tab: Strumenti

> [!regia] Correzione Rapida
> - [[Motore Mondo Vivo]]
> - [[Cosa Succede Fuori Scena]]
> - [[z.bases/Worldbuilding.base]]
> - [[z.bases/Missioni.base]]
````

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Causa | Il faro vecchio e crollato durante una marea anomala. |
| Effetto | rotta chiusa, prezzo del sale aumentato |
| Bersagli | [[Porto Di Brumafonda]], [[Mercato Del Sale Nero]] |
