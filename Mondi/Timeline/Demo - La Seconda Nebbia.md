---
id: demo-la-seconda-nebbia
nome: "Demo - La Seconda Nebbia"
categoria: evento storico
tipo: evento
stato: canonico
stato_canonico: canonico
canonico: true
mondo: [[Demo - Terre della Soglia]]
data_mondo: "Seconda notte di nebbia"
fc-calendar:
fc-date:
fc-category: conseguenza
fc-display-name: "Demo - La Seconda Nebbia"
luoghi:
  - [[Demo - Ponte delle Campane]]
  - [[Demo - Santuario della Prima Pietra]]
personaggi:
  - [[Demo - Mira Ventofermo]]
  - [[Demo - Sella Neraluce]]
fazioni:
  - [[Demo - Custodi della Soglia]]
sessioni:
  - [[Demo - Sessione 2 - Il Santuario Sotto Nebbia]]
conseguenze:
  - Il ponte e minacciato dalla nebbia viva.
  - I Custodi dichiarano il coprifuoco.
  - La reliquia viene riconosciuta come serratura, non benedizione.
---

# Demo - La Seconda Nebbia

> [!lettura] Evento
> La nebbia ha preso il Ponte delle Campane durante la seconda notte. Le incisioni del santuario hanno rivelato che la reliquia non protegge la valle: tiene chiusa una soglia antica.

## Conseguenze

- Il ponte e minacciato.
- La pressione dei Custodi aumenta.
- La missione dei frammenti passa da mistero locale a crisi della valle.

## Collegamenti Dinamici

### PNG Coinvolti

```dataview
TABLE tipo, ruolo, stato, luogo
FROM "Mondi/Personaggi"
WHERE contains(this.personaggi, file.link)
SORT nome ASC
```

### Fazioni Coinvolte

```dataview
TABLE tipo, stato, pressione, prossima_mossa
FROM "Mondi/Fazioni"
WHERE contains(this.fazioni, file.link)
SORT pressione DESC, nome ASC
```

### Sessioni Collegate

```dataview
TABLE data, stato, campagne
FROM "Mondi/Sessioni"
WHERE contains(this.sessioni, file.link)
SORT data DESC
```
