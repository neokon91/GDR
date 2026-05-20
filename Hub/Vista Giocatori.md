---
cssclasses:
  - dashboard
  - gdr-player-view
categoria: risorsa
tipo: dashboard
stato: pronto
pubblico: true
---

# Vista Giocatori

> [!warning] Portale condivisibile
> Questa pagina e safe-by-default: mostra materiale emerso al tavolo o marcato `pubblico: true`. I link diretti alle note compaiono solo quando non ci sono campi DM evidenti.

`BUTTON[durante-il-gioco-durante-il-gioco-2]`

`BUTTON[party-control-hub-party-control]`

`BUTTON[materiali-al-tavolo-risorse-materiali-al-tavolo]`

`BUTTON[mappe-risorse-mappe-mappe]`

## In Breve

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderPlayerView(dv);
```

## Recap Pubblico

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderPlayerRecap(dv);
```

## Diario Visibile

```dataview
TABLE data, data_mondo, luoghi, missioni
FROM "Mondi/Sessioni"
WHERE (pubblico = true OR stato = "giocata") AND !startswith(file.name, "Prova -")
SORT data DESC
LIMIT 8
```

## Atlante Condiviso

```dataview
TABLE uso, mondo, luogo, luoghi
FROM "Risorse/Mappe"
WHERE pubblico = true AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT uso ASC, file.name ASC
```

## Handout

```dataview
TABLE tipo, mondo, luogo, stato
FROM "Mondi/Dispense"
WHERE pubblico = true AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT luogo ASC, file.name ASC
```

## Controllo Sicurezza

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.automazioni/session_context.js"));
gdr.renderPublicSafety(dv);
```

## Note Per La Prossima Sessione

- 
