---
cssclasses:
  - indice
---

# Preparazione Sessione

Usa questa pagina quando devi preparare la prossima sessione senza perderti nei dettagli.

```meta-bind-button
label: Nuova Sessione
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/dm/Sessione.md"
    folderPath: "Mondi/Sessioni"
    open: true
```

```meta-bind-button
label: Durante Il Gioco
style: primary
actions:
  - type: open
    link: "[[Durante il Gioco]]"
```

## Sessione Da Preparare

```dataview
TABLE data, data_mondo, stato, campagne, luoghi, personaggi
FROM "Mondi/Sessioni"
WHERE (stato = "preparazione" OR stato = "pronto") AND !startswith(file.name, "Prova -")
SORT data ASC
LIMIT 1
```

## Checklist Del DM

> [!scena] Apertura
> - [ ] Riassunto da leggere
> - [ ] Prima scena chiara
> - [ ] Una scelta immediata per i giocatori

> [!png] Presenze
> - [ ] PNG importanti pronti
> - [ ] Motivazione dei PNG chiara
> - [ ] Reazione se i PG fanno qualcosa di inatteso

> [!indizio] Informazioni
> - [ ] Almeno 3 indizi
> - [ ] Un segreto scopribile
> - [ ] Una conseguenza se ignorano il problema
> - [ ] Una domanda aperta da risolvere al tavolo

> [!incontro] Tavolo
> - [ ] Incontro o ostacolo pronto
> - [ ] Ricompensa o informazione utile
> - [ ] Piano B se i PG cambiano direzione
> - [ ] Pressione attiva chiara se i PG esitano

## Materiale Pronto

### Missioni Aperte

```dataview
TABLE stato, pressione, prossima_mossa, committente, luoghi, personaggi
FROM "Mondi/Missioni"
WHERE (stato = "proposta" OR stato = "accettata" OR stato = "in corso") AND !startswith(file.name, "Prova -")
SORT pressione DESC, stato ASC, nome ASC
LIMIT 8
```

### Segreti E Indizi

```dataview
TABLE categoria, tipo, segreti, indizi
FROM "Mondi/Missioni" OR "Mondi/Luoghi" OR "Mondi/Personaggi" OR "Mondi/Fazioni"
WHERE ((segreti AND length(segreti) > 0) OR (indizi AND length(indizi) > 0)) AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT file.mtime DESC
LIMIT 8
```

### PNG Utilizzabili

```dataview
TABLE ruolo, stato, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE tipo = "png" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT stato ASC, nome ASC
LIMIT 10
```

### Incontri Pronti

```dataview
TABLE luogo, pericolo, creature
FROM "Mondi/Incontri"
WHERE stato = "pronto" AND !startswith(file.name, "Prova -")
SORT pericolo DESC
LIMIT 8
```

### Dispense Pronte

```dataview
TABLE tipo, luogo, personaggi
FROM "Mondi/Dispense"
WHERE stato = "pronto" AND !startswith(file.name, "Prova -")
SORT nome ASC
LIMIT 8
```

## Improvvisazione

> [!timer] Se serve una complicazione
> - Qualcuno arriva prima del previsto.
> - Una risorsa viene consumata o persa.
> - Un PNG cambia posizione.
> - Una minaccia avanza di un passo.

> [!luogo] Dettagli sensoriali
> - Rumore:
> - Odore:
> - Traccia:
> - Cosa stona:

> [!segreto]- Verita dietro la scena
> 

## Dopo La Preparazione

- [ ] Segna la sessione come `pronto`.
- [ ] Apri [[Durante il Gioco]] prima del tavolo.
- [ ] Dopo il tavolo apri [[z.bacheche/Post Sessione]].
