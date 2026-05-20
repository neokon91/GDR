---
cssclasses:
  - dashboard
  - gdr-party-control
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Party Control

Cockpit rapido per party, HP, spotlight, missioni aperte e scelte da ricordare durante la sessione.

`BUTTON[durante-il-gioco-durante-il-gioco]`

`BUTTON[nuovo-pg-z-modelli-personaggio-pg-md]`

`BUTTON[personaggi-mondi-personaggi-personaggi]`

`BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`

## Party

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderPartyControl(dv);
```

## Stato Rapido

```dataview
TABLE giocatore, classe, livello, hp_attuali, hp_massimi, hp_temporanei, ispirazione, stato
FROM "Mondi/Personaggi"
WHERE tipo = "pg" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT giocatore ASC, nome ASC
```

## Obiettivi E Leve

```dataview
TABLE vuole, sa, leva, missioni, relazioni
FROM "Mondi/Personaggi"
WHERE tipo = "pg" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT giocatore ASC, nome ASC
```

## Missioni Del Party

```dataview
TABLE stato, committente, luoghi, personaggi, pressione, prossima_mossa
FROM "Mondi/Missioni"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (stato = "accettata" OR stato = "in corso" OR stato = "proposta")
SORT pressione DESC, stato ASC, nome ASC
LIMIT 16
```

## Inventario E Ricompense

```dataview
TABLE tipo, stato, luogo, possessore, valore, uso
FROM "Mondi/Oggetti"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT possessore ASC, nome ASC
LIMIT 20
```

## Flags Da Ricordare

```dataview
TABLE stato, progress_value, progress_max, innesco, conseguenze
FROM "Mondi/Tracciati"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT progress_value DESC, file.mtime DESC
LIMIT 12
```
