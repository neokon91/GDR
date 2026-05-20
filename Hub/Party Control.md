---
cssclasses:
  - dashboard
  - gdr-party-control
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Party Control

Cockpit rapido per party, HP, condizioni, risorse, inventario, loot, quest personali e spotlight durante la sessione.

`BUTTON[durante-il-gioco-durante-il-gioco]`

`BUTTON[nuovo-pg-z-modelli-personaggio-pg-md]`

> [!regia]- Strumenti
> `BUTTON[personaggi-mondi-personaggi-personaggi]`
>
> `BUTTON[vista-giocatori-hub-vista-giocatori-vista-giocatori]`

## Party

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderPartyControl(dv);
```

## HP, Condizioni E Risorse

```dataview
TABLE giocatore, classe, livello, hp_attuali, hp_massimi, hp_temporanei, condizioni, risorse_rapide, ispirazione, stato
FROM "Mondi/Personaggi"
WHERE tipo = "pg" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT giocatore ASC, nome ASC
```

Apri la card del PG per modificare HP, condizioni e risorse con gli input del template.

## Quest Personali, Legami E Spotlight

```dataview
TABLE quest_personali, vuole, leva, relazioni, fazioni, spotlight
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

## Inventario Party E Loot Non Assegnato

```dataview
TABLE tipo, stato, luogo, possessore, proprietario, valore, uso
FROM "Mondi/Oggetti"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (!possessore OR !proprietario OR contains(string(possessore), "party") OR contains(string(proprietario), "party"))
SORT possessore ASC, proprietario ASC, nome ASC
LIMIT 20
```

## Inventario Rapido Dei PG

```dataview
TABLE inventario_rapido, loot_da_assegnare
FROM "Mondi/Personaggi"
WHERE tipo = "pg" AND stato != "archiviata" AND !startswith(file.name, "Prova -") AND (inventario_rapido OR loot_da_assegnare)
SORT giocatore ASC, nome ASC
```

## Flags Da Ricordare

```dataview
TABLE stato, progress_value, progress_max, innesco, conseguenze
FROM "Mondi/Tracciati"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT progress_value DESC, file.mtime DESC
LIMIT 12
```
