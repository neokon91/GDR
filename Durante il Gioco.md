---
cssclasses:
  - tavolo
---

# Durante Il Gioco

## Sessione Attiva

```dataview
TABLE data, data_mondo, stato, luoghi, personaggi, creature
FROM "Mondo/Sessioni"
WHERE stato = "pronto" OR stato = "preparazione"
SORT data DESC
LIMIT 1
```

## Comandi Rapidi

```meta-bind-button
label: Preparazione Sessione
style: primary
actions:
  - type: open
    link: "[[Risorse/Preparazione Sessione]]"
```

```meta-bind-button
label: Nota Rapida
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Nota Rapida.md"
    folderPath: "Inbox"
    open: true
```

```meta-bind-button
label: Controllo Vault
style: primary
actions:
  - type: open
    link: "[[Risorse/Controllo Vault]]"
```

## Scena Corrente

> [!lettura] Riassunto da leggere
> 

> [!scena] Situazione al tavolo
> 

> [!timer] Orologi e pressioni
> - [ ] 
> - [ ] 
> - [ ] 
> - [ ] 

## Appunti Rapidi

> [!indizio] Dettagli emersi
> 

> [!segreto]- Da ricordare
> 

## Improvvisazione Rapida

> [!png] Nome o volto al volo
> - Nome:
> - Voce:
> - Vuole:
> - Sa:

> [!luogo] Dettaglio sensoriale
> - Suono:
> - Odore:
> - Traccia:
> - Cosa stona:

> [!pericolo] Complicazione
> - [ ] Una minaccia avanza
> - [ ] Qualcuno arriva
> - [ ] Qualcosa costa piu del previsto

## Persone In Scena

### PNG In Gioco

```dataview
TABLE ruolo, luogo, atteggiamento
FROM "Mondo/Personaggi"
WHERE tipo = "png" AND stato = "in gioco"
SORT nome ASC
```

### PG

```dataview
TABLE giocatore, classe, livello, hp_attuali, hp_massimi
FROM "Mondo/Personaggi"
WHERE tipo = "pg"
SORT nome ASC
```

## Materiale Pronto

### Incontri

```dataview
TABLE luogo, pericolo, creature
FROM "Mondo/Incontri"
WHERE stato = "pronto" OR stato = "in gioco"
SORT pericolo DESC
```

### Oggetti Da Assegnare

```dataview
TABLE tipo, rarita, luogo
FROM "Mondo/Oggetti"
WHERE !proprietario AND stato != "archiviata"
SORT rarita ASC
```

### Dispense Di Scena

```dataview
TABLE tipo, luogo, personaggi
FROM "Mondo/Dispense"
WHERE stato = "pronto"
SORT nome ASC
```

### Musica e Risorse

```dataview
LIST
FROM "Risorse/Audio" OR "Risorse/Dispense"
SORT file.name ASC
```

### Regole e Riferimenti

- [[Risorse/Callout GDR]]
- [[Risorse/Plugin Attivi]]

## Post-Sessione

```meta-bind-button
label: Bacheca Post Sessione
style: primary
actions:
  - type: open
    link: "[[z.bacheche/Post Sessione]]"
```

> [!missione] Conseguenze
> - [ ] Aggiornare missioni
> - [ ] Aggiornare PNG e relazioni
> - [ ] Aggiornare luoghi visitati
> - [ ] Spostare appunti nelle note giuste

> [!tesoro] Ricompense e promesse
> 
