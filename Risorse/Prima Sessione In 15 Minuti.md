---
cssclasses:
  - indice
categoria: risorsa
tipo: guida rapida
stato: pronto
---

# Prima Sessione In 15 Minuti

Questa guida serve per giocare subito senza capire tutta la struttura del vault. Segui i passi in ordine: prepari una sessione minima, la rendi attiva, giochi, poi trasformi quello che succede in conseguenze.

## 1. Controlla Che Il Vault Sia Pronto

```meta-bind-button
label: Setup Guidato
style: primary
actions:
  - type: open
    link: "[[Risorse/Setup Guidato]]"
```

```meta-bind-button
label: Inizia Qui
style: default
actions:
  - type: open
    link: "[[Inizia Qui]]"
```

```meta-bind-button
label: Creazione Guidata Entità
style: default
actions:
  - type: open
    link: "[[Risorse/Creazione Guidata Entità]]"
```

Se i pulsanti funzionano e le tabelle mostrano testo leggibile, puoi proseguire.

## 2. Guarda La Demo

```meta-bind-button
label: Apri Demo
style: primary
actions:
  - type: open
    link: "[[Demo - La Reliquia Spezzata]]"
```

Usa la demo come esempio, non come manuale. Guarda soprattutto:

- una campagna con sessioni, PNG, luoghi, missione e clock gia collegati;
- una sessione attiva visibile in [[Durante il Gioco]];
- un clock che mostra pressione;
- una conseguenza che passa da appunto a canone;
- una prossima mossa fuori scena.

## 3. Crea O Scegli Una Campagna

```meta-bind-button
label: DM Dashboard
style: primary
actions:
  - type: open
    link: "[[1. DM Dashboard]]"
```

Da [[1. DM Dashboard]] puoi creare una nuova campagna oppure usare la demo per provare. Per una prima sessione reale basta avere:

- una campagna;
- una sessione;
- un luogo;
- un PNG;
- una missione o una domanda centrale;
- un clock se c'e una minaccia che avanza.

## 4. Prepara Solo Il Necessario

```meta-bind-button
label: Preparazione Sessione
style: primary
actions:
  - type: open
    link: "[[Risorse/Preparazione Sessione]]"
```

Compila solo questi elementi:

| Elemento | Cosa scrivere |
| --- | --- |
| Obiettivo | Cosa devono decidere o scoprire i personaggi. |
| Apertura | Prima scena da giocare. |
| PNG | Chi vuole qualcosa subito. |
| Luogo | Dove la scena puo cambiare. |
| Missione | Cosa e in gioco. |
| Clock | Cosa peggiora se nessuno interviene. |
| Segreti | 1-3 informazioni rivelabili. |

## 5. Rendi Attiva La Sessione

Apri la nota della sessione e imposta:

- `stato`: `preparazione` o `pronto`;
- `attiva`: acceso.

Tieni una sola sessione attiva alla volta.

## 6. Gioca Dal Tavolo Operativo

```meta-bind-button
label: Durante Il Gioco
style: primary
actions:
  - type: open
    link: "[[Durante il Gioco]]"
```

Durante la sessione usa questa pagina per:

- vedere sessione, PNG, missioni, incontri e clock;
- creare note rapide;
- catturare eventi o lore;
- creare PNG, luoghi, missioni o clock improvvisati;
- segnare segreti rivelati e conseguenze.

Non sistemare tutto mentre giochi. Cattura prima, ordina dopo.

## 7. Chiudi La Sessione

```meta-bind-button
label: Post Sessione Guidato
style: primary
actions:
  - type: open
    link: "[[Risorse/Post Sessione Guidato]]"
```

Dopo la partita decidi:

- cosa e diventato canonico;
- quali missioni cambiano stato;
- quali clock avanzano;
- quali PNG o fazioni reagiscono;
- quali conseguenze vanno propagate;
- quale sara la prossima apertura.

## 8. Guarda Cosa Si Muove Fuori Scena

```meta-bind-button
label: Cosa Succede Fuori Scena
style: primary
actions:
  - type: open
    link: "[[Cosa Succede Fuori Scena]]"
```

Scegli almeno una riga da trasformare in gioco:

- una fazione fa una prossima mossa;
- un clock avanza;
- una missione ignorata peggiora;
- un segreto diventa rivelabile;
- una conseguenza cambia un luogo, PNG o relazione.

## Checklist Finale

- [ ] Una sola sessione ha `attiva: true`.
- [ ] La sessione giocata ha un breve resoconto.
- [ ] I fatti veri sono segnati come canonici o collegati.
- [ ] Missioni e clock hanno stato aggiornato.
- [ ] Almeno una conseguenza ha `entita_impattate` o `propaga_a`.
- [ ] La prossima sessione ha una prima scena.
- [ ] [[Cosa Succede Fuori Scena]] mostra almeno una pressione utilizzabile.
