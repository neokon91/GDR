---
id: demo-la-nebbia-ha-preso-il-ponte
nome: "Demo - La Nebbia Ha Preso il Ponte"
categoria: lore capture
tipo: conseguenza
stato: canonica
stato_canonico: canonico
canonico: true
mondo: [[Demo - Terre della Soglia]]
sessioni:
  - [[Demo - Sessione 2 - Il Santuario Sotto Nebbia]]
collegamenti:
  - [[Demo - Ponte delle Campane]]
  - [[Demo - Custodi della Soglia]]
  - [[Demo - Recuperare i Frammenti]]
evento_mondo: "Seconda notte di nebbia"
fc-calendar:
fc-date:
fc-category: conseguenza
fc-display-name: "Demo - La Nebbia Ha Preso il Ponte"
impatto:
  - Il ponte non e piu attraversabile senza guida.
  - I Custodi usano la crisi per requisire i frammenti.
  - Mira deve scegliere se collaborare con Sella o forzare il blocco.
azioni:
  - Aggiornare la pressione dei Custodi.
  - Segnare il Ponte delle Campane come minacciato.
  - Aggiungere l'evento alla timeline.
---

# Demo - La Nebbia Ha Preso il Ponte

> [!indizio] Cosa e emerso
> Alla fine della seconda sessione la nebbia viva ha coperto il Ponte delle Campane. Le campane suonano senza vento e chi attraversa sente voci dal lato sbagliato della Soglia.

> [!missione] Impatto sul mondo
> - Il passaggio verso il santuario diventa instabile.
> - I Custodi della Soglia ottengono una scusa pubblica per imporre il coprifuoco.
> - La missione per recuperare i frammenti diventa urgente.

## Azioni

```meta-bind-button
label: Canonizza
style: primary
actions:
  - type: updateMetadata
    bindTarget: stato
    evaluate: false
    value: canonica
  - type: updateMetadata
    bindTarget: stato_canonico
    evaluate: false
    value: canonico
  - type: updateMetadata
    bindTarget: canonico
    evaluate: false
    value: true
```

```meta-bind-button
label: Collega
style: primary
actions:
  - type: updateMetadata
    bindTarget: stato
    evaluate: false
    value: collegata
```

```meta-bind-button
label: Archivia
style: default
actions:
  - type: updateMetadata
    bindTarget: stato
    evaluate: false
    value: archiviata
```

```meta-bind-button
label: Ignora
style: default
actions:
  - type: updateMetadata
    bindTarget: stato
    evaluate: false
    value: ignorata
  - type: updateMetadata
    bindTarget: canonico
    evaluate: false
    value: false
```

- [x] Collegare a ponte, Custodi e missione.
- [x] Decidere lo stato canonico.
- [x] Aggiornare timeline e note impattate.
