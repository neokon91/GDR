---
cssclasses:
  - indice
---

# Inbox

Usa questa cartella per idee grezze, appunti presi al volo e materiale non ancora deciso. Quando un'idea diventa utile al tavolo, trasformala in una nota del mondo.

<!-- workflow:quick_actions:start inbox_operativa -->
> [!regia] Azioni rapide
> Smistare appunti grezzi, live e lore senza perdere agganci utili al tavolo.
>
> Plugin coinvolti: `Meta Bind`, `Dataview`, `Templater`, `Fantasy Content Generator`.
>
> **Smistamento bozze generate** - devi processare output del generatore fantasy
> `BUTTON[smistamento-bozze-generate-risorse-smistamento-bozze-generate-2]`
>
> **Smista bozza** - una nota ha gia un aggancio operativo
> `BUTTON[smista-bozza-generata]`
>
> **Canonizza bozza** - la bozza e diventata vera al tavolo
> `BUTTON[canonizza-bozza-generata]`
>
> **Nota rapida** - devi catturare un'idea senza struttura
> `BUTTON[nuova-nota-rapida-z-modelli-nota-rapida-md]`
>
> **Evento lore** - un appunto deve diventare lore da verificare
> `BUTTON[nuovo-evento-lore-z-modelli-lore-capture-md]`
>
> [!regia]- Cattura live
> Salvare materiale emerso al tavolo senza decidere subito la tassonomia definitiva.
>
> **Evento live** - succede qualcosa che potrebbe diventare canone
> `BUTTON[evento-live-z-modelli-live-evento-md]`
>
> **PNG improvvisato** - compare una persona non preparata
> `BUTTON[png-improvvisato-z-modelli-live-png-md]`
>
> **Luogo improvvisato** - il party entra in un posto non preparato
> `BUTTON[luogo-improvvisato-z-modelli-live-luogo-md]`
>
> **Nota grezza** - devi catturare velocemente senza tassonomia
> `BUTTON[nota-grezza-z-modelli-live-nota-grezza-md]`
>
> **Conseguenza live** - una scelta produce un effetto da risolvere dopo
> `BUTTON[conseguenza-z-modelli-live-conseguenza-md]`
<!-- workflow:quick_actions:end inbox_operativa -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "inbox_operativa");
```

## Da Smistare

```dataview
TABLE tipo, stato, stato_canonico, data_mondo, sessioni, collegamenti
FROM "Inbox"
WHERE file.name != "Inbox" AND stato != "smistata" AND stato != "archiviata" AND stato != "ignorata"
SORT file.ctime DESC
```

## Bozze Generate

```dataview
TABLE categoria, tipo, generatore, mondo, luogo, campagne, sessioni, creato
FROM "Inbox/Generati"
WHERE plugin = "fantasy-content-generator" AND stato = "bozza"
SORT creato ASC, file.ctime ASC
```

## Lore Capture

```dataview
TABLE tipo, stato, stato_canonico, sessioni, collegamenti, impatto
FROM "Inbox"
WHERE categoria = "lore capture" AND stato != "archiviata" AND stato != "ignorata"
SORT file.mtime DESC
```

## Smistate

```dataview
TABLE tipo, stato_canonico, collegamenti
FROM "Inbox"
WHERE (stato = "smistata" OR stato = "collegata" OR stato = "canonica")
SORT file.mtime DESC
```
