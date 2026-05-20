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

```meta-bind-button
label: Smistamento Bozze Generate
style: default
actions:
  - type: open
    link: "[[Risorse/Smistamento Bozze Generate]]"
```

```meta-bind-button
label: Motore Mondo Vivo
style: primary
actions:
  - type: open
    link: "[[Motore Mondo Vivo]]"
```

```meta-bind-button
label: Cosa Succede Fuori Scena
style: primary
actions:
  - type: open
    link: "[[Cosa Succede Fuori Scena]]"
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
| Propagazione | Se cambia fazioni, luoghi, missioni, relazioni o stato del mondo, compila `entita_impattate`, `propaga_a`, `conseguenze` e `prossima_mossa`. |
| Geopolitica | Se cambia autorita, confini, risorse o legittimita, aggiorna il territorio politico e [[Geopolitical Dashboard]]. |
| Stato Campagna | Riapri [[Mondi/Stato del Mondo]] e controlla che compaia nella vista operativa. |
| Mondo Vivo | Apri [[Motore Mondo Vivo]] e chiudi le continuita aperte prima della prossima prep. |

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

## 6. Propagazione Mondo Vivo

```dataview
TABLE categoria, tipo, stato, entita_impattate, propaga_a, conseguenze, prossima_mossa
FROM "Mondi" OR "Inbox"
WHERE stato != "archiviata" AND stato != "ignorata" AND !startswith(file.name, "Prova -") AND (entita_impattate OR propaga_a OR conseguenze OR prossima_mossa)
SORT file.mtime DESC
LIMIT 12
```

## 7. Cosa Succede Fuori Scena

Questa sezione trasforma la chiusura sessione in prossime mosse. Ogni riga dovrebbe uscire da qui con una decisione: aggiornare una nota, creare un clock, portare un segreto al tavolo o archiviare.

```dataview
TABLE categoria, tipo, stato, pressione, progress_value, progress_max, innesco, prossima_mossa, conseguenze
FROM "Mondi/Fazioni" OR "Mondi/Religioni" OR "Mondi/Personaggi" OR "Mondi/Tracciati" OR "Mondi/Missioni" OR "Mondi/Conflitti"
WHERE stato != "archiviata" AND stato != "ignorata" AND !startswith(file.name, "Prova -") AND (pressione >= 5 OR progress_value >= 3 OR prossima_mossa OR innesco)
SORT pressione DESC, progress_value DESC, file.mtime DESC
LIMIT 16
```

```dataview
TABLE categoria, tipo, stato, entita_impattate, propaga_a, conseguenze, prossima_mossa
FROM "Mondi" OR "Inbox"
WHERE stato != "archiviata" AND stato != "ignorata" AND !startswith(file.name, "Prova -") AND (conseguenze OR entita_impattate OR propaga_a) AND (!entita_impattate OR !propaga_a OR !prossima_mossa)
SORT file.mtime DESC
LIMIT 16
```

## 8. Sessioni Attive

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

## 9. Cosa Preparare Dopo

```dataview
TABLE stato, pressione, scadenza_mondo, prossima_mossa
FROM "Mondi/Missioni"
WHERE (stato = "proposta" OR stato = "accettata" OR stato = "in corso") AND !startswith(file.name, "Prova -")
SORT pressione DESC, scadenza_mondo ASC
LIMIT 8
```

## 10. Chiusura Rapida

- [ ] Appunti live smistati o lasciati in [[Inbox/Inbox]] con un nome chiaro.
- [ ] Bozze generate utili collegate o archiviate in [[Risorse/Smistamento Bozze Generate]].
- [ ] Conseguenze importanti aggiunte a mondo, PNG, luoghi, fazioni, missioni o tracciati.
- [ ] Propagazione compilata su eventi, fazioni, luoghi, missioni o relazioni toccate dalla sessione.
- [ ] Territori politici, confini, risorse o legittimita aggiornati se il potere e cambiato.
- [ ] Clock e progress track aggiornati.
- [ ] Ricompense e dispense segnate.
- [ ] Prossima sessione scelta.
- [ ] [[Motore Mondo Vivo]] controllato per continuita aperte, faction dynamics e causalita storica.
- [ ] [[Risorse/Controllo Vault]] aperto almeno una volta.
