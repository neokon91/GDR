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

> [!timer] Clock mossi
> -

> [!png] PNG fuori scena
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
| Clock o tracciato | Aggiorna `progress_value`, `pressione`, `prossima_mossa` e conseguenze. |

## 3. Lavorazione Seria

Trasforma ogni appunto live in una decisione operativa: canonico, rumor, conseguenza aperta o materiale da archiviare.

```dataview
TABLE tipo, stato, sessioni, collegamenti, impatto, azioni
FROM "Inbox"
WHERE file.name != "Inbox" AND stato != "smistata" AND stato != "archiviata" AND !startswith(file.name, "Prova -")
SORT file.ctime DESC
LIMIT 12
```

## 4. Percorso Conseguenza

Usa questa sequenza per non perdere continuita.

| Passo | Azione |
| --- | --- |
| Appunto live | Apri la nota in [[Inbox/Inbox]] e decidi se e canonica. |
| Conseguenza | Se cambia il mondo, crea o aggiorna una nota `Conseguenza`. |
| Evento storico | Se e successo davvero, crea o aggiorna una nota in [[Mondi/Timeline/Timeline]]. |
| Tracciato | Se produce pressione futura, crea o aggiorna un clock in [[Mondi/Tracciati/Tracciati]]. |
| Stato Campagna | Riapri [[Mondi/Stato del Mondo]] e controlla che compaia nella vista operativa. |

```meta-bind-button
label: Nuova Conseguenza
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Live Conseguenza.md"
    folderPath: "Inbox"
    open: true
```

```meta-bind-button
label: Nuovo Evento Storico
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/Evento Storico.md"
    folderPath: "Mondi/Timeline"
    open: true
```

```meta-bind-button
label: Nuovo Clock
style: primary
actions:
  - type: templaterCreateNote
    templateFile: "z.modelli/dm/Tracciato.md"
    folderPath: "Mondi/Tracciati"
    open: true
```

## 5. Aggiorna Pressioni

```dataview
TABLE categoria, tipo, stato, progress_value, progress_max, pressione, prossima_mossa
FROM "Mondi/Tracciati" OR "Mondi/Missioni" OR "Mondi/Fazioni"
WHERE stato != "archiviata" AND !startswith(file.name, "Prova -") AND (pressione > 0 OR progress_value > 0)
SORT pressione DESC, progress_value DESC
LIMIT 12
```

## 6. Sessioni Attive

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

## 7. Cosa Preparare Dopo

```dataview
TABLE stato, pressione, scadenza_mondo, prossima_mossa
FROM "Mondi/Missioni"
WHERE (stato = "proposta" OR stato = "accettata" OR stato = "in corso") AND !startswith(file.name, "Prova -")
SORT pressione DESC, scadenza_mondo ASC
LIMIT 8
```

## 8. Chiusura Rapida

- [ ] Appunti live smistati o lasciati in [[Inbox/Inbox]] con un nome chiaro.
- [ ] Conseguenze importanti aggiunte a mondo, PNG, luoghi, fazioni, missioni o tracciati.
- [ ] Clock e progress track aggiornati.
- [ ] Ricompense e dispense segnate.
- [ ] Prossima sessione scelta.
- [ ] [[Risorse/Controllo Vault]] aperto almeno una volta.
