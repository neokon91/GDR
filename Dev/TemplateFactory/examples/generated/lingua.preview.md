<% await tp.user.lingua(tp) %>
# `=this.nome`









````tabs
tab: Stato

> [!infoboxwiki]- Lingua
> Mondo: `INPUT[mondo][:mondo]`
>
> Stato: `INPUT[stato][:stato]`
>
> Pubblico: `INPUT[toggle:pubblico]`
>
> Canonico: `INPUT[canonico][:canonico]`
>
> La scheda e usabile quando ha almeno un gancio, una connessione viva e una conseguenza o prossima mossa.

> [!regia] Azioni Scheda
> `BUTTON[marca-canonico]`
>
> `BUTTON[marca-rumor]`
>
> `BUTTON[collega-sessione-attiva]`
>
> `BUTTON[archivia-nota]`

tab: Tavolo

> [!scena] Identita Al Tavolo
> `INPUT[text:identita]`
>
> Gancio: `INPUT[text:gancio]`
>
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`

> [!missione] Scelta E Conseguenza
> Scelta: `INPUT[text:scelta]`
>
> Posta: `INPUT[text:posta]`
>
> Rischi: `INPUT[list:rischi]`
>
> Ricompense: `INPUT[list:ricompense]`
>
> Prossima mossa: `INPUT[prossima_mossa][:prossima_mossa]`
>
> Conseguenza potenziale: `INPUT[text:conseguenza_potenziale]`


> [!lettura]- Versione Pubblica
> `INPUT[text:player_safe]`

> [!segreto]- Livello DM
> `INPUT[text:segreto]`

tab: Connessioni

> [!regia] Collegamenti Operativi
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Entita impattate: `INPUT[entita_impattate][:entita_impattate]`
>
> Propaga a: `INPUT[propaga_a][:propaga_a]`
>
> Fonti: `INPUT[fonti][:fonti]`
>
> Riferimenti SRD: `INPUT[riferimenti_srd][:riferimenti_srd]`
>
> Riferimenti regola: `INPUT[riferimenti_regola][:riferimenti_regola]`
>
> Sezioni collegate: `INPUT[sezioni_collegate][:sezioni_collegate]`
>
> Blocchi collegati: `INPUT[blocchi_collegati][:blocchi_collegati]`
>
> Tabelle collegate: `INPUT[tabelle_collegate][:tabelle_collegate]`
>
> Tag: `INPUT[tags][:tags]`


> [!conflitto]- Note Che Puntano Qui
> ```dataview
> TABLE categoria, tipo, stato, pressione, prossima_mossa
> FROM "Mondi"
> WHERE contains(this.connessioni, file.link) OR contains(this.entita_impattate, file.link) OR contains(this.propaga_a, file.link)
> SORT categoria ASC, file.name ASC
> ```

> [!regia]- Base Editabile
> Apri la base coerente con la famiglia della nota quando devi correggere molti campi insieme.
>
> - [[z.bases/Worldbuilding.base]]
> - [[z.bases/Luoghi.base]]
> - [[z.bases/Fazioni.base]]
> - [[z.bases/Missioni.base]]
> - [[z.bases/PNG.base]]
> - [[Risorse/Mappe/Schema Relazioni GDR.excalidraw]]











tab: Controllo

> [!regia] Qualita Scheda
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderCreationFeedback(dv);
> ```


````

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Identita |  |
| Gancio |  |
| Uso al tavolo |  |
| Prossima mossa |  |
| Conseguenza potenziale |  |
| Connessioni |  |
| Entita impattate |  |
| Propaga a |  |

| Versione pubblica |  |
