---
cssclasses:
  - dashboard
  - gdr-worldbuilder-dashboard
categoria: risorsa
tipo: dashboard
stato: pronto
mondo_attivo: ""
campagne_attive: []
---

# Worldbuilder Dashboard

> [!luogo] Scriptorium del Mondo
> Costruisci ambientazioni giocabili: luoghi, PNG, fazioni, storia e pressioni devono restare collegati a cio che puo arrivare al tavolo.

## Mondo

> [!scena] Filtro
> Mondo:
> `INPUT[mondo][:mondo_attivo]`
>
> Campagne:
> `INPUT[campagne][:campagne_attive]`

<!-- workflow:quick_actions:start espandi_mondo -->
> [!regia] Azioni rapide
> Aggiungere entita vive collegate e giocabili.
>
> **Nuovo mondo guidato** - il vault non ha ancora un mondo operativo
> `BUTTON[nuovo-mondo-homebrew]`
>
> **Nuova entita viva** - non sai ancora se serve luogo, fazione, PNG o pressione
> `BUTTON[wizard-nuova-entita-viva]`
>
> **Campagna da ambientazione** - il mondo deve diventare struttura giocabile
> `BUTTON[campagna-da-ambientazione-campagna-da-ambientazione]`
>
> **Stato mondo** - vuoi vedere cosa e gia vivo o incompleto
> `BUTTON[stato-mondo-mondi-stato-del-mondo]`
>
> **Motore mondo vivo** - devi decidere chi si muove fuori scena
> `BUTTON[motore-mondo-vivo-motore-mondo-vivo]`
>
> **Controllo vault** - il materiale sembra scollegato o non pronto
> `BUTTON[controllo-vault-risorse-controllo-vault]`
>
> [!regia]- Superfici mondo
> Aprire viste di controllo senza cercarle nella sidebar.
>
> **DM Dashboard** - devi tornare al cockpit principale
> `BUTTON[dm-dashboard-1-dm-dashboard]`
>
> **Indice mondo** - vuoi navigare le categorie del mondo
> `BUTTON[indice-mondo-mondi-mondo]`
>
> **Atlante del mondo** - devi controllare luoghi e mappe
> `BUTTON[atlante-del-mondo-atlante-del-mondo]`
>
> **Bibbia del mondo** - vuoi consolidare canone e tono
> `BUTTON[bibbia-del-mondo-bibbia-del-mondo-2]`
>
> **Geopolitica** - vuoi leggere poteri, confini e conflitti
> `BUTTON[geopolitica-geopolitical-dashboard-2]`
>
> **Economia e rotte** - vuoi controllare scambi, risorse e dipendenze
> `BUTTON[economia-e-rotte-economia-e-rotte-2]`
>
> **Lore hub** - devi lavorare su canone e appunti lore
> `BUTTON[lore-hub-lore-hub-2]`
>
> **Timeline** - devi storicizzare un evento
> `BUTTON[timeline-mondi-timeline-timeline]`
>
> **Revisione lore** - devi ripulire o canonizzare materiale
> `BUTTON[revisione-lore-revisione-lore]`
>
> **Controllo canone** - temi duplicati, contraddizioni o segreti esposti
> `BUTTON[controllo-canone-controllo-canone]`
>
> [!regia]- Fondamenta giocabili
> Creare solo pezzi di mondo con un uso potenziale al tavolo.
>
> **Nuovo luogo** - serve un posto dove possano agire i personaggi
> `BUTTON[nuovo-luogo-z-modelli-luogo-router-md]`
>
> **Nuova cultura** - un popolo o costume cambia scelte e scene
> `BUTTON[nuova-cultura-z-modelli-worldbuilding-cultura-md]`
>
> **Nuova lingua** - lingua o scrittura diventano indizio, accesso o ostacolo
> `BUTTON[nuova-lingua-z-modelli-worldbuilding-lingua-md]`
>
> **Evento storico** - un fatto deve entrare nella timeline canonica
> `BUTTON[evento-storico-z-modelli-evento-storico-md]`
>
> **Nuova era** - la cronologia ha bisogno di una fase riconoscibile
> `BUTTON[nuova-era-z-modelli-worldbuilding-era-storica-md]`
>
> [!regia]- Poteri e pressioni
> Dare al mondo attori capaci di reagire.
>
> **Nuova fazione** - serve un potere organizzato
> `BUTTON[nuova-fazione-z-modelli-fazione-router-md]`
>
> **Nuovo culto** - religione o culto devono agire come fazione
> `BUTTON[nuovo-culto-z-modelli-fazione-culto-md]`
>
> **Nuovo personaggio** - serve un volto ricorrente o una leva sociale
> `BUTTON[nuovo-personaggio-z-modelli-personaggio-router-md]`
>
> **Nuova relazione** - due entita devono influenzarsi a vicenda
> `BUTTON[nuova-relazione-z-modelli-worldbuilding-relazione-md]`
>
> **Nuovo conflitto** - la tensione deve produrre missioni o clock
> `BUTTON[nuovo-conflitto-z-modelli-worldbuilding-conflitto-md]`
>
> **Nuovo clock** - una pressione deve avanzare in modo visibile
> `BUTTON[nuovo-clock-z-modelli-dm-tracciato-md]`
>
> [!regia]- Mistero, mito e risorse
> Collegare meraviglia, segreti ed economia a conseguenze pratiche.
>
> **Cosmologia** - piani, dei o regole cosmiche incidono sul gioco
> `BUTTON[cosmologia-z-modelli-worldbuilding-cosmologia-md]`
>
> **Segreto o mistero** - serve materiale da rivelare gradualmente
> `BUTTON[segreto-o-mistero-z-modelli-worldbuilding-segreto-o-mistero-md]`
>
> **Nuova creatura** - una presenza deve avere habitat, uso e conseguenze
> `BUTTON[nuova-creatura-z-modelli-creatura-md]`
>
> **Nuovo oggetto** - serve una leva concreta o ricompensa
> `BUTTON[nuovo-oggetto-z-modelli-oggetto-md]`
>
> **Oggetto magico** - una ricompensa deve essere giocabile al tavolo
> `BUTTON[nuovo-oggetto-magico-z-modelli-oggetto-magico-md]`
>
> **Nuova rotta** - commercio o viaggio devono creare opportunita
> `BUTTON[nuova-rotta-z-modelli-worldbuilding-rotta-md]`
>
> **Nuova risorsa** - una merce o dipendenza muove fazioni
> `BUTTON[nuova-risorsa-z-modelli-worldbuilding-risorsa-md]`
>
> **Nuovo mercato** - serve un nodo economico o sociale
> `BUTTON[nuovo-mercato-z-modelli-worldbuilding-mercato-o-nodo-commerciale-md]`
>
> [!regia]- Tavolo e mappe
> Trasformare worldbuilding in materiale immediatamente usabile.
>
> **Nuova missione** - una tensione diventa obiettivo giocabile
> `BUTTON[nuova-missione-z-modelli-dm-missione-md]`
>
> **Nuovo incontro** - serve una scena pronta
> `BUTTON[nuovo-incontro-z-modelli-dm-incontro-md-default]`
>
> **Dispense** - vuoi controllare materiale consegnabile
> `BUTTON[dispense-mondi-dispense-dispense]`
>
> **Mappe** - devi vedere o creare supporti spaziali
> `BUTTON[mappe-risorse-mappe-mappe]`
>
> **Nuova mappa zoom** - un luogo deve essere navigabile
> `BUTTON[nuova-mappa-zoom-z-modelli-mappe-mappa-zoom-md]`
>
> **Nuova mappa fronti** - vuoi visualizzare poteri, relazioni o pressioni
> `BUTTON[nuova-mappa-fronti-z-modelli-mappe-mappa-excalidraw-fronti-excalidraw-md]`
<!-- workflow:quick_actions:end espandi_mondo -->

## Adesso

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const current = dv.current();
gdr.renderWorldbuilderNow(dv, current.mondo_attivo, current.campagne_attive);
```

## Prontezza

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const current = dv.current();
gdr.renderWorldbuilderReadiness(dv, current.mondo_attivo, current.campagne_attive);
```

## Code Operative

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
const current = dv.current();
await gdr.renderWorldbuilderQueues(dv, current.mondo_attivo, current.campagne_attive);
```

## Mappe E Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorldbuilderSurfaceLinks(dv);
```

## Azioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "espandi_mondo", { mode: "simple" });
```
