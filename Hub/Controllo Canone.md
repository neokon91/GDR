---
cssclasses:
  - dashboard
  - gdr-canon-control
categoria: risorsa
tipo: canon control
stato: pronto
mondo_attivo: ""
---

# Controllo Canone

> [!timeline] Canone operativo
> Questa vista separa cosa e vero, cosa e voce, cosa si contraddice e cosa deve produrre conseguenze prima di confondere il tavolo.

## Filtro

> [!scena] Mondo
> `INPUT[mondo][:mondo_attivo]`

<!-- workflow:quick_actions:start controllo_canone -->
> [!regia] Azioni rapide
> Separare canone, rumor, retcon e contraddizioni prima che confondano il tavolo.
>
> **Timeline** - una verita deve entrare nella storia del mondo
> `BUTTON[timeline-mondi-timeline-timeline]`
>
> **Revisione lore** - devi ripulire appunti, rumor o contraddizioni
> `BUTTON[revisione-lore-revisione-lore]`
>
> [!regia]- Stabilizza canone
> Portare informazioni in viste dove possono essere verificate.
>
> **Lore hub** - vuoi vedere segnali e materiale canonico collegato
> `BUTTON[lore-hub-lore-hub]`
>
> **Evento lore** - una scoperta deve restare tracciabile ma non ancora assoluta
> `BUTTON[nuovo-evento-lore-z-modelli-lore-capture-md]`
>
> **Controllo worldbuilding** - la contraddizione dipende da schede incomplete
> `BUTTON[controllo-worldbuilding-controllo-worldbuilding]`
>
> **Motore mondo vivo** - una verita produce reazioni tra sessioni
> `BUTTON[motore-mondo-vivo-motore-mondo-vivo]`
<!-- workflow:quick_actions:end controllo_canone -->

## Priorita

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCanonControlNow(dv, dv.current().mondo_attivo);
```

## Stato Canone

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
gdr.renderCanonControlReadiness(dv, dv.current().mondo_attivo);
```

## Code Canoniche

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderCanonControlQueues(dv, dv.current().mondo_attivo);
```

## Superfici

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderCanonControlSurfaceLinks(dv);
```

## Azioni

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "controllo_canone", { mode: "simple" });
```
