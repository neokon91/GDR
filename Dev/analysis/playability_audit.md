# Playability Audit

Data: 2026-05-29

## Contratto usato

Una categoria e giocabile se puo generare:

1. scene
2. conflitti
3. scelte
4. conseguenze
5. prossima mossa

Il contratto non e un punteggio numerico. Se manca una delle cinque uscite, la categoria resta supporto o lore fino a quando non espone campi operativi.

## Audit entity_model + entity_depth

| Categoria | Scene | Conflitti | Scelte | Conseguenze | Prossima mossa | Stato | Note operative |
| --- | --- | --- | --- | --- | --- | --- | --- |
| luogo | Si | Si | Si | Si | Si | PLAYABLE | `entity_depth.luogo` copre gancio, uso al tavolo, tensione, costo, evoluzione, player-safe e connessioni. |
| fazione | Si | Si | Si | Si | Si | PLAYABLE | Agenda, pressione, obiettivo, rivali, conseguenze e prossima mossa sono gia centrali. |
| missione | Si | Si | Si | Si | Si | PLAYABLE | E la categoria piu direttamente giocabile: scelta, posta, rischi, ricompense, conseguenze e propagazione. |
| tracciato | Si | Si | Si | Si | Si | PLAYABLE | Produce pressione visibile, innesco, avanzamento, posta e prossima mossa. |
| cultura | Si | Si | Si | Si | Si | PLAYABLE | Ora espone `valore_dominante`, `tensione_culturale`, `conflitto_generato`, costo, missioni, conseguenze e prossima mossa. |
| religione | Si | Si | Si | Si | Si | PLAYABLE | Ora espone `dogma`, `costo_sociale`, `reazione_a_violazione`, missioni, conseguenze e pressione. |
| relazione | Si | Si | Parziale | Si | Si | PARTIALLY_PLAYABLE | Forte su posta, pressione e conseguenze; manca una scelta esplicita come contratto primario. |
| risorsa | Si | Si | Si | Si | Si | PLAYABLE | La catena operativa e `dipendenze` -> `crisi` -> `pressione` -> `missioni`. |
| conflitto | Si | Si | Si | Si | Si | PLAYABLE | Posta, fasi, cause, effetti, scelte, rischi, conseguenze e prossima mossa sono presenti. |
| campagna | Parziale | Si | Parziale | Si | Parziale | PARTIALLY_PLAYABLE | `campagna_da_regione` e giocabile; la campagna generica resta contenitore e dovrebbe dipendere dalla Regione Giocabile. |
| sessione | Si | Si | Si | Si | Si | PLAYABLE | Obiettivo, apertura, scelta, scene, decisioni, conseguenze, output e prossima apertura sono operativi. |

Nessuna delle categorie richieste resta `LORE_ONLY` dopo l'introduzione dei nuovi contratti. Le aree ancora parziali sono relazione e campagna generica.

## Profondita a livelli

`entity_depth.yaml` introduce `depth_level`:

| Livello | Campi minimi | Uso |
| --- | --- | --- |
| rapido | `gancio`, `uso_al_tavolo` | Cattura veloce senza attrito. |
| giocabile | rapido + `pressione`, `prossima_mossa`, `connessioni` | Nota pronta a produrre gioco. |
| profondo | giocabile + `dipendenze`, `costo_sociale`, `evoluzione_se_ignorata`, `propaga_a` | Entita ricorrente o canonica. |

Default di creazione: rapido. Default per note rilevanti al tavolo: giocabile. Profondo solo quando la nota torna in scena o diventa canone.

## Regione Giocabile

`region_playability_contract.yaml` definisce la Regione Giocabile come unita minima di valore.

Requisiti minimi:

- 3 luoghi
- 2 fazioni
- 1 conflitto
- 1 missione
- 1 pressione
- 1 uscita verso sessione
- 1 superficie player-safe

Se manca uno di questi elementi, la regione resta bozza utile ma non ancora prodotto giocabile.

## Culture e religioni

Intervento fatto:

- cultura: aggiunti `valore_dominante`, `tensione_culturale`, `conflitto_generato`, missioni, conseguenze e costo sociale.
- religione: aggiunti `dogma`, `costo_sociale`, `reazione_a_violazione`, missioni, conflitti, player-safe e connessioni.
- validation: aggiunte regole che bloccano cultura/religione senza output giocabile.

Obiettivo: una cultura o religione deve cambiare accoglienza, tabu, costo, missione o conseguenza. Se non lo fa, e solo lore.

## Economia giocabile

Modello operativo:

```text
risorsa -> dipendenza -> crisi -> pressione -> missione
```

| Area | Stato | Note |
| --- | --- | --- |
| risorse | PLAYABLE | Ora espongono crisi, dipendenze, pressione, missioni, conseguenze e prossima mossa. |
| rotte | PARTIALLY_PLAYABLE | Buone per viaggio, rischio e conseguenza se bloccata; possono appoggiarsi al contratto economia. |
| mercati | PARTIALLY_PLAYABLE | Forti come nodo sociale/economico; devono collegarsi a crisi o missione quando entrano in gioco. |

Validation aggiunta: una entita economica non deve restare merce statica; deve avere crisi, rischio, conseguenza di blocco o missione collegata.

## UX

Classificazione proposta e registrata in `user_path.yaml`.

CORE:

- Prima Sessione
- Regione Giocabile
- Prepara Sessione
- Durante il Gioco
- Post Sessione

ADVANCED:

- DM Dashboard
- Worldbuilder
- Campagna da Ambientazione
- Fuori Scena
- Atlante
- Economia e Rotte
- Lore Hub
- Motore Mondo Vivo
- Bibbia del Mondo
- Compendium

DEV_ONLY:

- Setup Guidato
- Controllo Vault
- Controllo Worldbuilding
- Controllo Canone
- Revisione Lore
- Quality Report

Decisione: onboarding resta gateway, non workflow principale. Il percorso verificato ora punta a onboarding + cinque superfici core; il resto supporta il ciclo, ma non deve essere la prima cosa che un utente nuovo deve capire.
