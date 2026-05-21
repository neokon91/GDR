---
cssclasses:
  - indice
categoria: risorsa
tipo: supporto
stato: pronto
---

# Se Qualcosa Non Funziona

Usa questa pagina quando dashboard, pulsanti, tabelle o schede creatura non si comportano come previsto.

````tabs
tab: Diagnosi

> [!regia] Prima Verifica
> ```dataviewjs
> const enabled = id => app.plugins.enabledPlugins.has(id);
> const checks = [
>   ["Dataview", enabled("dataview"), "Tabelle e DataviewJS"],
>   ["Templater", enabled("templater-obsidian"), "Wizard e creazione note"],
>   ["Meta Bind", enabled("obsidian-meta-bind-plugin"), "Input e pulsanti"],
>   ["Tasks", enabled("obsidian-tasks-plugin"), "Checklist operative"],
>   ["CSS", true, "Attiva lo snippet gdr-vault se la grafica è piatta o poco leggibile"]
> ];
> dv.table(["Strumento", "Stato", "Serve per"], checks.map(([a,b,c]) => [a, b ? "Pronto" : "Da controllare", c]));
> ```

tab: Ripara

> [!todo] Percorso Rapido
> - [ ] Riavvia Obsidian. #task
> - [ ] Apri [[Risorse/Setup Guidato]]. #task
> - [ ] Apri [[Risorse/Primo Avvio Strumenti]]. #task
> - [ ] Riprova da [[Risorse/Prima Sessione In 15 Minuti]]. #task

tab: Sintomi

> [!lettura] Problemi Comuni
> Le tabelle richiedono Dataview; i pulsanti richiedono Meta Bind e Templater; i tiri `dice:` richiedono Dice Roller; le schede creatura richiedono Fantasy Statblocks.

tab: Qualità

> [!regia] Controlli
> - [[Risorse/Controllo Vault]]
> - [[Risorse/Quality Report|Quality Report - controllo qualità]]
> - `npm run check` nel repository sorgente
> - `npm run release:clean` prima di creare lo ZIP utente
````

## Fallback Markdown - Versione Leggibile Senza Plugin

| Sintomo | Prima azione |
| --- | --- |
| Tabelle vuote | Controlla Dataview |
| Pulsanti rotti | Controlla Meta Bind e Templater |
| Grafica piatta | Attiva snippet `gdr-vault` |

## Prima Verifica

1. Controlla gli strumenti necessari in [[Risorse/Primo Avvio Strumenti]].
2. Riavvia Obsidian dopo averli abilitati o aggiornati.
3. Apri [[1. DM Dashboard]] e poi [[Risorse/Controllo Vault]].
4. Se una vista mostra codice invece del risultato, uno strumento interno probabilmente manca o non e attivo.

## Problemi Comuni

| Sintomo | Probabile causa | Cosa fare |
| --- | --- | --- |
| Le tabelle non compaiono | Dataview disattivato | Abilita Dataview e riapri la nota |
| Vedi blocchi tipo `dataviewjs` invece di tabelle | Dataview non sta eseguendo il codice | Abilita Dataview e consenti JavaScript queries nelle impostazioni di Dataview |
| I pulsanti non funzionano | Meta Bind o Templater disattivati | Abilita entrambi e riprova |
| Il pulsante crea una nota ma non compila i campi | Templater non e attivo o non ha accesso agli script | Abilita Templater, controlla la cartella script e riprova da [[1. DM Dashboard]] |
| Le note create sono vuote o sbagliate | Creazione guidata non attiva | Controlla gli strumenti necessari in [[Risorse/Primo Avvio Strumenti]] |
| `Durante il Gioco` non mostra la sessione giusta | Nessuna sessione attiva o troppe sessioni attive | Apri la sessione corretta e lascia `attiva` acceso solo lì |
| `Cosa Succede Fuori Scena` è vuota | Mancano pressione, prossima mossa o conseguenze sulle note | Compila `pressione`, `innesco`, `prossima_mossa` o `conseguenze` su missioni, PNG, fazioni e clock |
| I mostri non appaiono come schede | Schede creatura non attive | Controlla gli strumenti necessari e riapri la nota creatura |
| I tiri `dice:` restano testo | Tiri rapidi non attivi | Controlla gli strumenti necessari |
| Le date non compaiono nel calendario | Calendario non attivo o data mancante | Controlla gli strumenti necessari e compila la data del mondo |
| Le bacheche non si aprono | Bacheche non attive | Controlla gli strumenti necessari |
| La grafica sembra piatta o poco leggibile | Snippet CSS non attivo | Attiva `gdr-vault` in Impostazioni > Aspetto > Snippet CSS |
| Obsidian chiede di fidarsi dei plugin | Protezione di sicurezza normale | Conferma solo se hai scaricato lo ZIP da una fonte affidabile |

## Percorso Di Ripristino Rapido

1. Riavvia Obsidian.
2. Apri [[Risorse/Setup Guidato]].
3. Se un controllo non e pronto, apri [[Risorse/Primo Avvio Strumenti]].
4. Apri [[Risorse/Prima Sessione In 15 Minuti]] e riprova il flusso base.
5. Se il problema riguarda una sessione, controlla che una sola sessione abbia `attiva: true`.
6. Se il problema riguarda il mondo vivo, aggiungi almeno una `prossima_mossa` o una `pressione` a una missione, fazione, PNG o tracciato.

## Controlli Di Qualità

Prima di usare una copia come release, apri [[Risorse/Controllo Vault]] e verifica:

- nessuno stato fuori standard;
- nessuna nota senza `categoria` o `stato`;
- nessun materiale `pronto` incompleto;
- nessuna data narrativa da calendarizzare, se usi Calendarium;
- nessun link placeholder lasciato in note operative.

## Se Il Vault Resta Rotto

- Apri [[Risorse/Primo Avvio Strumenti]] e verifica che gli strumenti richiesti risultino abilitati.
- Se hai modificato manualmente file in `SRD`, controlla [[SRD/Licenza SRD]] e rigenera solo quando sai che le modifiche non verranno perse.
