---
id: demo-la-seconda-nebbia
nome: "Demo - La Seconda Nebbia"
categoria: evento storico
tipo: evento
stato: canonico
stato_canonico: canonico
canonico: true
mondo: "[[Demo - Terre della Soglia]]"
data_mondo: "Seconda notte di nebbia"
fc-calendar: "Brumafonda"
fc-date: "1-1-2"
fc-category: conseguenza
fc-display-name: "La Seconda Nebbia"
luoghi:
  - "[[Demo - Ponte delle Campane]]"
  - "[[Demo - Santuario della Prima Pietra]]"
personaggi:
  - "[[Demo - Mira Ventofermo]]"
  - "[[Demo - Sella Neraluce]]"
fazioni:
  - "[[Demo - Custodi della Soglia]]"
tracciati:
  - "[[Demo - I Custodi Chiudono il Ponte]]"
sessioni:
  - "[[Demo - Sessione 2 - Il Santuario Sotto Nebbia]]"
causa: "La reliquia e stata avvicinata al santuario mentre la soglia era gia instabile."
cause:
  - "[[Demo - La Nebbia Ha Preso il Ponte]]"
effetti:
  - "[[Demo - I Custodi Chiudono il Ponte]]"
  - "[[Demo - Custodi e Brumafonda]]"
  - "[[Demo - Marca della Soglia]]"
entita_impattate:
  - "[[Demo - Ponte delle Campane]]"
  - "[[Demo - Custodi della Soglia]]"
  - "[[Demo - Recuperare i Frammenti]]"
  - "[[Demo - Custodi e Brumafonda]]"
  - "[[Demo - Marca della Soglia]]"
propaga_a:
  - "[[Demo - I Custodi Chiudono il Ponte]]"
  - "[[Demo - Recuperare i Frammenti]]"
  - "[[Demo - Custodi e Brumafonda]]"
  - "[[Demo - Marca della Soglia]]"
stato_mondo:
  - La valle tratta la nebbia come crisi politica oltre che mistica.
conseguenze:
  - Il ponte e minacciato dalla nebbia viva.
  - I Custodi dichiarano il coprifuoco.
  - La reliquia viene riconosciuta come serratura, non benedizione.
prossima_mossa: "I Custodi usano la seconda nebbia per giustificare blocchi, interrogatori e requisizione dei frammenti."
---

# Demo - La Seconda Nebbia

> [!lettura] Evento
> La nebbia ha preso il Ponte delle Campane durante la seconda notte. Le incisioni del santuario hanno rivelato che la reliquia non protegge la valle: tiene chiusa una soglia antica.

## Conseguenze

- Il ponte e minacciato.
- La pressione dei Custodi aumenta.
- La missione dei frammenti passa da mistero locale a crisi della valle.

## Propagazione

- Il clock [[Demo - I Custodi Chiudono il Ponte]] avanza perche la fazione ora ha una giustificazione pubblica.
- La relazione [[Demo - Custodi e Brumafonda]] peggiora: protezione e occupazione diventano indistinguibili.
- La [[Demo - Marca della Soglia]] nasce come territorio politico de facto attorno al ponte.
- [[Demo - Recuperare i Frammenti]] diventa urgente: ogni frammento trovato dai Custodi rafforza il loro controllo.
- [[Demo - Ponte delle Campane]] passa da luogo di transito a frontiera contesa.

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
