---
cssclasses:
  - indice
categoria: mondo
tipo: stato mondo
stato: pronto
mondo_attivo:
campagne_attive: []
---

# Stato Del Mondo

Questa vista raccoglie le conseguenze che devono influenzare il tavolo: PNG fuori scena, luoghi in crisi, fazioni sotto pressione, missioni cambiate e lore da rendere canonica.

> [!scena] Filtro
> Mondo:
> `INPUT[suggester(optionQuery("Mondi"), useLinks(partial), allowOther):mondo_attivo]`
>
> Campagne:
> `INPUT[inlineListSuggester(optionQuery("Campagne"), useLinks(partial)):campagne_attive]`

```meta-bind-button
label: Durante Il Gioco
style: primary
actions:
  - type: open
    link: "[[Durante il Gioco]]"
```

```meta-bind-button
label: Timeline
style: primary
actions:
  - type: open
    link: "[[Mondi/Timeline/Timeline]]"
```

```meta-bind-button
label: Worldbuilder
style: primary
actions:
  - type: open
    link: "[[Worldbuilder Dashboard]]"
```

## Eventi Canonici Recenti

```dataview
TABLE evento_mondo, stato_canonico, sessioni, collegamenti, impatto
FROM "Inbox" OR "Mondi/Timeline"
WHERE (categoria = "lore capture" OR categoria = "evento storico") AND (canonico = true OR stato = "canonica" OR stato_canonico = "canonico") AND stato != "archiviata" AND stato != "ignorata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT file.mtime DESC
LIMIT 20
```

## Conseguenze Aperte

```dataview
TABLE tipo, stato, stato_canonico, sessioni, collegamenti, impatto, azioni
FROM "Inbox"
WHERE categoria = "lore capture" AND stato != "archiviata" AND stato != "ignorata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT file.mtime DESC
LIMIT 20
```

## PNG Cambiati

```dataview
TABLE ruolo, stato, luogo, fazioni, relazioni, prossima_mossa
FROM "Mondi/Personaggi"
WHERE tipo = "png" AND (stato = "morto" OR stato = "scomparso" OR stato = "ostile" OR stato = "in gioco" OR pressione > 0) AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT stato ASC, file.mtime DESC
LIMIT 20
```

## Luoghi Cambiati

```dataview
TABLE tipo, stato, pericolo, stabilita, luogo_padre, fazioni, prossima_mossa
FROM "Mondi/Luoghi"
WHERE (pericolo >= 6 OR stabilita <= 3 OR stato = "in gioco" OR stato = "minacciato" OR stato = "distrutto" OR pressione > 0) AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pericolo DESC, stabilita ASC, file.name ASC
LIMIT 20
```

## Fazioni In Movimento

```dataview
TABLE tipo, stato, pressione, prossima_mossa, luoghi, rivali
FROM "Mondi/Fazioni" OR "Mondi/Religioni"
WHERE (pressione > 0 OR stato = "in gioco" OR stato = "ostile" OR stato = "in guerra") AND !startswith(file.name, "Prova -") AND stato != "archiviata" AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pressione DESC, file.name ASC
LIMIT 20
```

## Missioni Influenzate

```dataview
TABLE stato, pressione, committente, prossima_mossa, luoghi, fazioni, conseguenze
FROM "Mondi/Missioni"
WHERE stato != "archiviata" AND (pressione > 0 OR (conseguenze AND length(conseguenze) > 0)) AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT pressione DESC, file.mtime DESC
LIMIT 20
```

## Timeline Recente

```dataview
TABLE data_mondo, stato_canonico, mondo, luoghi, fazioni, sessioni
FROM "Mondi/Timeline"
WHERE file.name != "Timeline" AND stato_canonico != "archiviata" AND !startswith(file.name, "Prova -") AND (!this.mondo_attivo OR mondo = this.mondo_attivo)
SORT file.mtime DESC
LIMIT 20
```
