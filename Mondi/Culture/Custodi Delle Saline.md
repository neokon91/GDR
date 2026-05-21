---
id: custodi-delle-saline
nome: "Custodi Delle Saline"
categoria: cultura
tipo: cultura
stato: pronto
canonico: true
stato_canonico: canonico
mondo: "[[Brumafonda Demo]]"
campagne: ["[[Sale Sotto La Nebbia]]"]
luoghi: ["[[Porto Di Brumafonda]]"]
lingue: []
religioni: ["[[Culto Della Lanterna Bassa]]"]
fazioni: ["[[Consorzio Del Sale Nero]]"]
usi: ["segnare i debiti su tavolette di sale"]
tabu: ["vendere sale raccolto durante una veglia funebre"]
feste: ["Notte Della Lanterna Bassa"]
valori: ["memoria dei debiti", "ospitalita misurata", "patti davanti alla marea"]
estetica: ["mantelli cerati", "corde bianche", "lampade basse"]
onore: "Restituire cio che la marea ha affidato."
mito_origine: ["La prima salina nacque dove una lanterna resto accesa sotto l'acqua."]
cose_sacre: ["sale non venduto", "nomi dei dispersi", "campane di nebbia"]
cose_proibite: ["rompere una lanterna accesa"]
famiglia_casa_ruoli: ["Le famiglie custodiscono saline e archivi insieme."]
rapporto_stranieri: ["Gli stranieri sono benvenuti se dichiarano un debito o un favore."]
gancio: "I Custodi chiedono al gruppo di recuperare la campana prima che venga comprata."
uso_al_tavolo: "Offrono informazioni, rito di protezione e pressione morale."
player_safe: "I Custodi proteggono la memoria della citta e non vogliono che il faro diventi merce."
tratto_distintivo: "Parlano di prezzi e ricordi con lo stesso vocabolario."
connessioni: ["[[Porto Di Brumafonda]]", "[[Culto Della Lanterna Bassa]]"]
propaga_a: ["[[Consorzio Del Sale Nero]]"]
entita_impattate: ["[[Porto Di Brumafonda]]"]
promesse_al_tavolo: []
scelte: ["Aiutare il rito o vendere subito il recupero."]
rischi: ["Il porto perde fiducia nei PG."]
indizi: ["Una tavoletta di sale porta il nome della campana."]
png_coinvolti: []
ricompense: []
conseguenze: []
prossima_mossa: "Convocano una veglia pubblica al molo."
leggi: []
risorse: []
tensioni: ["Dipendono dal Consorzio ma ne diffidano."]
segreti: ["Una famiglia dei Custodi ha gia venduto mappe delle saline."]
domande_aperte: []
---

# Custodi Delle Saline

Cultura demo pensata per apparire sia nel Codex DM sia nelle viste player-safe.

````tabs
tab: Identita

> [!infoboxwiki] Cultura
> Mondo: `INPUT[mondo][:mondo]`
>
> Stato: `INPUT[stato][:stato]`
>
> Tratto distintivo: `INPUT[text:tratto_distintivo]`
>
> Player-safe: `INPUT[text:player_safe]`

> [!regia]- Check Cultura
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderM7FamilyCards(dv, dv.current(), "cultura");
> ```

tab: Tavolo

> [!scena] Uso Giocabile
> Gancio: `INPUT[text:gancio]`
>
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`
>
> Prossima mossa: `INPUT[prossima_mossa][:prossima_mossa]`
>
> Scelte: `INPUT[list:scelte]`
>
> Rischi: `INPUT[list:rischi]`

> [!lettura]- Cosa Vede Il Party
> Valori: `INPUT[list:valori]`
>
> Tabu: `INPUT[list:tabu]`
>
> Feste: `INPUT[list:feste]`

tab: Connessioni

> [!conflitto] Rete Culturale
> Luoghi: `INPUT[luoghi][:luoghi]`
>
> Religioni: `INPUT[inlineListSuggester(optionQuery("Mondi/Religioni"), useLinks(partial), allowOther):religioni]`
>
> Fazioni: `INPUT[fazioni][:fazioni]`
>
> Propaga a: `INPUT[propaga_a][:propaga_a]`

> [!regia]- Basi
> - [[z.bases/Worldbuilding.base]]
> - [[z.bases/Fazioni.base]]
> - [[Risorse/Mappe/Schema Relazioni GDR.excalidraw]]
````

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Luogo | [[Porto Di Brumafonda]] |
| Culto | [[Culto Della Lanterna Bassa]] |
| Pressione | Il recupero della campana deve essere pubblico. |
