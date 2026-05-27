---
cssclasses:
  - dashboard
  - gdr-atlante-dashboard
categoria: risorsa
tipo: dashboard
stato: pronto
mondo_attivo: ""
---

# Atlante Del Mondo

> [!timeline] Atlante operativo
> Usa questa pagina per decidere quale mappa aprire, quali luoghi e rotte sono pronti, quali territori hanno buchi cartografici e cosa puo essere mostrato ai giocatori.

<!-- workflow:quick_actions:start atlante_mondo -->
> [!regia] Azioni rapide
> Costruire e controllare geografia, culture, storia e buchi spaziali del mondo.
>
> **Nuova cultura** - un popolo, costume o tabu cambia luoghi e scelte
> `BUTTON[nuova-cultura-z-modelli-worldbuilding-cultura-md]`
>
> **Nuova lingua** - lingua o scrittura diventano indizio, accesso o identita
> `BUTTON[nuova-lingua-z-modelli-worldbuilding-lingua-md]`
>
> **Nuova era** - la storia ha bisogno di una fase riconoscibile
> `BUTTON[nuova-era-z-modelli-worldbuilding-era-storica-md]`
>
> **Nuovo conflitto** - una tensione geografica o culturale deve produrre gioco
> `BUTTON[nuovo-conflitto-z-modelli-worldbuilding-conflitto-md]`
>
> **Cosmologia** - il mondo ha regole metafisiche che cambiano il tavolo
> `BUTTON[cosmologia-z-modelli-worldbuilding-cosmologia-md]`
>
> [!regia]- Orientamento mondo
> Passare dall'atlante a controllo, profondita e gioco.
>
> **Worldbuilder** - non sai ancora quale pezzo creare o collegare
> `BUTTON[worldbuilder-worldbuilder-dashboard-2]`
>
> **Controllo worldbuilding** - vuoi vedere cosa resta superficiale o scollegato
> `BUTTON[controllo-worldbuilding-controllo-worldbuilding]`
>
> **Worldbuilding profondo** - una scheda ricorrente merita origine, costo e memoria
> `BUTTON[worldbuilding-profondo-risorse-worldbuilding-profondo]`
>
> **Geopolitica** - luoghi e confini devono diventare poteri in attrito
> `BUTTON[geopolitica-geopolitical-dashboard]`
>
> **Economia e rotte** - viaggi, risorse o passaggi devono pesare sul mondo
> `BUTTON[economia-e-rotte-economia-e-rotte]`
>
> **Lore hub** - vuoi navigare segnali, storia e materiale canonico
> `BUTTON[lore-hub-lore-hub]`
<!-- workflow:quick_actions:end atlante_mondo -->

## Filtro

> [!scena] Mondo
> `INPUT[mondo][:mondo_attivo]`

## Adesso

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderAtlasNow(dv, dv.current().mondo_attivo);
```

## Prontezza

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderAtlasReadiness(dv, dv.current().mondo_attivo);
```

## Code Cartografiche

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderAtlasQueues(dv, dv.current().mondo_attivo);
```

## Mappe E Strumenti

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderAtlasSurfaceLinks(dv);
```

## Azioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "atlante_mondo", { mode: "simple" });
```
