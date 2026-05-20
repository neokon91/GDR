---
cssclasses:
  - indice
categoria: risorsa
tipo: repository
stato: pronto
---

# Repository

Questa nota e tecnica. Serve solo a chi cura il vault, non al DM che lo usa per preparare o giocare. Per l'uso normale parti da [[Inizia Qui]].

## Aree Principali

| Percorso | Contiene | Regola pratica |
| --- | --- | --- |
| `Inizia Qui.md` | onboarding non tecnico | Deve restare la porta d'ingresso. |
| `Hub/` | dashboard e viste principali | Tiene la root pulita senza nascondere gli ingressi operativi. |
| `Hub/1. DM Dashboard.md` | preparazione e vista DM | Non spostare senza aggiornare link, Homepage e documentazione. |
| `Hub/Durante il Gioco.md` | schermata al tavolo | Deve restare rapida, non enciclopedica. |
| `Hub/Atlante del Mondo.md` | worldbuilding strutturale | Porta principale per ambientazioni grandi. |
| `Hub/Geopolitical Dashboard.md` | geopolitica operativa | Stati, confini, risorse e relazioni diplomatiche. |
| `Hub/Campagna da Ambientazione.md` | da mondo a campagna | Collega regioni e conflitti al gioco. |
| `Hub/Vista Giocatori.md` | materiale condivisibile | Non deve mostrare segreti o prossime mosse DM. |
| `Hub/Worldbuilder Dashboard.md` | costruzione mondo avanzata | Deve mostrare relazioni, buchi e pressioni, non solo archivi. |
| `Hub/Motore Mondo Vivo.md` | stato sistemico del mondo | Deve mostrare propagazione, causalita, faction dynamics e continuita narrativa. |
| `Giocatori/` | indice area giocatori | Area pubblica o condivisibile. |
| `Inbox/` | appunti grezzi e live | Qui entra cio che non e ancora canonico. |
| `Mondi/` | ambientazioni canoniche | Qui stanno luoghi, PNG, fazioni, relazioni, missioni, incontri e timeline. |
| `Risorse/` | guide, strumenti, mappe, media, tabelle | Materiale riutilizzabile e documentazione del vault. |
| `Dev/Roadmap/` | roadmap attiva e storiche | Archivio manutenzione, non percorso primario del DM. |
| `SRD/` | riferimento regolamentare generato | Non trattare come contenuto canonico del mondo. |
| `z.modelli/` | template Templater | Percorsi richiamati da pulsanti Meta Bind. |
| `z.modelli/azioni/` | template azione Meta Bind | Deve restare sottile: solo chiamate a `meta_actions.js`. |
| `z.modelli/wizard/` | wizard Templater centralizzati | Deve restare sottile: solo chiamate a `wizard_layer.js`. |
| `z.automazioni/` | script Templater e CLI | Cambiare nomi rompe template e controlli. |
| `z.engine/` | componenti JS riusabili | Viste operative da richiamare da DataviewJS o JS Engine. |
| `z.bacheche/` | board Kanban | Workflow operativo, non archivio permanente. |
| `.obsidian/` | configurazione Obsidian e plugin | Parte del prodotto: non e solo preferenza locale. |

## Cosa Toccare Prima

1. Note operative e dashboard se vuoi migliorare l'esperienza del DM.
2. Template in `z.modelli/` se vuoi cambiare come nascono le note.
3. Script in `z.automazioni/` se vuoi cambiare automazioni o controlli.
4. Plugin/config in `.obsidian/` solo quando sai quale comportamento dipende da quella impostazione.

## Cosa Non Spostare Alla Leggera

- `z.modelli`: Templater e Meta Bind usano percorsi espliciti come `templateFile`.
- `z.automazioni`: i template chiamano helper con `tp.user.nome_script`.
- `z.engine`: le dashboard possono importare componenti JS da qui; non duplicare logica lunga nei blocchi DataviewJS.
- `.obsidian/plugins/obsidian-meta-bind-plugin/data.json`: contiene input template e button template operativi.
- `.obsidian/plugins/metadata-menu/data.json` e `z.fileclass/`: insieme definiscono lo schema operativo.
- `.obsidian/plugins`: il vault include plugin e configurazioni necessarie.
- `SRD`: puo essere rigenerato da `z.automazioni/import_srd.js`.
- `Inizia Qui.md` resta l'unica dashboard root: le altre viste principali stanno in `Hub/`.

## Comandi

```bash
npm run check
npm run check:repo
npm run clean:repo
npm run import:srd
npm run release:clean
```

Se `npm` non e disponibile, usa direttamente:

```bash
node z.automazioni/check_vault.js
node z.automazioni/repo_hygiene.js
node z.automazioni/repo_hygiene.js --fix
node z.automazioni/import_srd.js
node z.automazioni/release_clean.js
```

## Regola Di Chiusura

Ogni modifica strutturale deve passare:

```bash
npm run check
```

Usa `npm run check:repo` prima di riprendere la roadmap quando vuoi verificare che non ci siano artefatti locali, note fittizie residue o script npm mancanti. Usa `npm run clean:repo` solo per rimuovere file locali di sistema e temporanei ignorati, non per archiviare contenuti del vault.

Poi apri manualmente in Obsidian:

- [[Inizia Qui]]
- [[1. DM Dashboard]]
- [[Durante il Gioco]]
- [[Atlante del Mondo]]
- [[Campagna da Ambientazione]]
- [[Vista Giocatori]]
- [[Worldbuilder Dashboard]]
