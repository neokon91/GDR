---
cssclasses:
  - indice
---

# Preparazione Sessione

Usa questa pagina quando devi preparare la prossima sessione senza perderti nei dettagli.

`BUTTON[nuova-sessione-z-modelli-dm-sessione-md]`

`BUTTON[durante-il-gioco-durante-il-gioco]`

`BUTTON[materiali-al-tavolo-risorse-materiali-al-tavolo]`

`BUTTON[mondo-vivo-motore-mondo-vivo-2]`

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

### Pressioni Di Mondo

```dataview
TABLE categoria, tipo, pressione, prossima_mossa, soggetti, entita_impattate
FROM "Mondi/Relazioni" OR "Mondi/Luoghi" OR "Mondi/Fazioni" OR "Mondi/Tracciati"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (pressione >= 6 OR progress_value >= progress_max - 1)
SORT pressione DESC, progress_value DESC
LIMIT 10
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
- [ ] Dopo il tavolo apri [[Risorse/Post Sessione Guidato]].
