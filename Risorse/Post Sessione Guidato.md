---
cssclasses:
  - indice
categoria: risorsa
tipo: guida
stato: pronto
---

# Post Sessione Guidato

Apri questa pagina subito dopo la partita. Serve a chiudere la sessione senza dimenticare conseguenze, ricompense e prossima apertura.

```meta-bind-button
label: Apri Bacheca Post Sessione
style: primary
actions:
  - type: open
    link: "[[z.bacheche/Post Sessione]]"
```

```meta-bind-button
label: Controllo Vault
style: default
actions:
  - type: open
    link: "[[Risorse/Controllo Vault]]"
```

## 1. Cosa E Successo

Scrivi prima in modo grezzo. Non serve sistemare tutto subito.

> [!scena] Fatti della sessione
> - 

> [!indizio] Segreti rivelati
> - 

> [!timer] Conseguenze aperte
> - 

## 2. Cosa Diventa Vero Nel Mondo

Usa questa sezione per decidere cosa resta canonico.

| Tipo | Cosa fare |
| --- | --- |
| Evento importante | Crea o aggiorna una nota in [[Mondi/Timeline/Timeline]]. |
| PNG cambiato | Aggiorna la nota del PNG. |
| Luogo cambiato | Aggiorna la nota del luogo. |
| Fazione in movimento | Aggiorna pressione e prossima mossa. |
| Missione cambiata | Aggiorna stato, pressione, ricompense e conseguenze. |

## 3. Sessioni Attive

```dataview
TABLE data, data_mondo, stato, campagne
FROM "Mondi/Sessioni"
WHERE attiva = true AND !startswith(file.name, "Prova -")
SORT data DESC
```

Quando hai finito:

- porta la sessione giocata a `giocata`;
- togli `attiva: true` alla sessione chiusa;
- scegli o crea la prossima sessione;
- metti `attiva: true` solo sulla prossima sessione.

## 4. Cosa Preparare Dopo

```dataview
TABLE stato, pressione, scadenza_mondo, prossima_mossa
FROM "Mondi/Missioni"
WHERE (stato = "proposta" OR stato = "accettata" OR stato = "in corso") AND !startswith(file.name, "Prova -")
SORT pressione DESC, scadenza_mondo ASC
LIMIT 8
```

## 5. Chiusura Rapida

- [ ] Appunti live smistati o lasciati in [[Inbox/Inbox]] con un nome chiaro.
- [ ] Conseguenze importanti aggiunte a mondo, PNG, luoghi, fazioni o missioni.
- [ ] Ricompense e dispense segnate.
- [ ] Prossima sessione scelta.
- [ ] [[Risorse/Controllo Vault]] aperto almeno una volta.
