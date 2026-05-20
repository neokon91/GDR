---
cssclasses:
  - dashboard
categoria: risorsa
tipo: dashboard
stato: pronto
---

# Vista Giocatori

Questa pagina e pensata per condividere solo materiale utile ai giocatori: recap, PNG conosciuti, luoghi scoperti, dispense consegnate e prossimi obiettivi.

> [!warning] Area pubblica
> Non scrivere qui segreti, verità nascoste, prossime mosse o appunti del DM.

```meta-bind-button
label: Durante Il Gioco
style: default
actions:
  - type: open
    link: "[[Durante il Gioco]]"
```

```meta-bind-button
label: Materiali Al Tavolo
style: default
actions:
  - type: open
    link: "[[Risorse/Materiali Al Tavolo]]"
```

## Recap Pubblico

> [!lettura] Da leggere ai giocatori
> 

## Obiettivi Conosciuti

```dataview
TABLE stato, scadenza_mondo, committente, luoghi
FROM "Mondi/Missioni"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (pubblico = true OR stato = "accettata" OR stato = "in corso")
SORT pressione DESC, scadenza_mondo ASC, nome ASC
LIMIT 10
```

## PNG Conosciuti

```dataview
TABLE ruolo, luogo, atteggiamento
FROM "Mondi/Personaggi"
WHERE tipo = "png" AND stato != "archiviata" AND !startswith(file.name, "Prova -") AND (pubblico = true OR stato = "in gioco")
SORT nome ASC
LIMIT 12
```

## Luoghi Scoperti

```dataview
TABLE tipo, bioma, luogo_padre
FROM "Mondi/Luoghi"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (pubblico = true OR stato = "in gioco")
SORT nome ASC
LIMIT 12
```

## Dispense Consegnate

```dataview
TABLE tipo, luogo, personaggi
FROM "Mondi/Dispense"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (pubblico = true OR stato = "consegnato")
SORT nome ASC
```

## Note Per La Prossima Sessione

- 
