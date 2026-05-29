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
| `Inizia Qui.md` | onboarding non tecnico | Output root generato da `root_pages.yaml`; deve restare la porta d'ingresso in release. |
| `Hub/` | dashboard e viste principali | Output generato da `hub_pages.yaml`; tiene la root pulita senza nascondere gli ingressi operativi. |
| `Hub/1. DM Dashboard.md` | preparazione e vista DM | Non spostare senza aggiornare link, Homepage e documentazione. |
| `Hub/Durante il Gioco.md` | schermata al tavolo | Deve restare rapida, non enciclopedica. |
| `Hub/Atlante del Mondo.md` | worldbuilding strutturale | Porta principale per ambientazioni grandi. |
| `Hub/Geopolitical Dashboard.md` | geopolitica operativa | Stati, confini, risorse e relazioni diplomatiche. |
| `Hub/Campagna da Ambientazione.md` | da mondo a campagna | Collega regioni e conflitti al gioco. |
| `Hub/Vista Giocatori.md` | materiale condivisibile | Non deve mostrare segreti o prossime mosse DM. |
| `Hub/Worldbuilder Dashboard.md` | costruzione mondo avanzata | Deve mostrare relazioni, buchi e pressioni, non solo archivi. |
| `Hub/Motore Mondo Vivo.md` | stato sistemico del mondo | Deve mostrare propagazione, causalita, faction dynamics e continuita narrativa. |
| `Giocatori/` | indice area giocatori | Cartella utente materializzata in release, non sorgente tracciato. |
| `Inbox/` | appunti grezzi e live | Cartella utente materializzata in release, non sorgente tracciato. |
| `Mondi/` | ambientazioni canoniche | Cartella utente materializzata in release, non sorgente tracciato. |
| `Risorse/` | guide, strumenti, mappe, media, tabelle | Materiale riutilizzabile e documentazione del vault. |
| `Dev/Roadmap/` | roadmap attiva e storiche | Archivio manutenzione, non percorso primario del DM. |
| `SRD/` | riferimento regolamentare generato | Materializzato in release, non sorgente tracciato. |
| `z.modelli/` | template Templater | Output TemplateFactory materializzato localmente o in release. |
| `z.modelli/azioni/` | template azione Meta Bind | Deve restare sottile: solo chiamate a `meta_actions.js`. |
| `z.modelli/wizard/` | wizard Templater centralizzati | Deve restare sottile: solo chiamate a `wizard_layer.js`. |
| `z.automazioni/` | runtime Templater, helper e CLI | Cambiare nomi rompe template e controlli. I wrapper `z.automazioni/templater/` sono generati. |
| `z.engine/` | componenti JS riusabili | Viste operative da richiamare da DataviewJS o JS Engine. |
| `z.bacheche/` | board Kanban | Output YAML/Jinja materializzato dal modulo `bacheche`. |
| `.obsidian/` | configurazione Obsidian e plugin | Parte del prodotto: non e solo preferenza locale. |

## Cosa Toccare Prima

1. Note operative e dashboard se vuoi migliorare l'esperienza del DM.
2. Moduli YAML/Jinja in `Dev/TemplateFactory/` se vuoi cambiare come nascono le note.
3. Script in `z.automazioni/` se vuoi cambiare automazioni runtime o controlli usati dentro Obsidian.
4. Plugin/config in `.obsidian/` solo quando sai quale comportamento dipende da quella impostazione.

## Cosa Non Spostare Alla Leggera

- `z.modelli`: Templater e Meta Bind usano percorsi espliciti come `templateFile`.
- `z.automazioni/templater`: wrapper funzione caricati da Templater con `tp.user.nome_script`; la logica runtime resta in `z.automazioni`, il tooling repo resta in `Dev/TemplateFactory/tools`.
- `z.engine`: le dashboard possono importare componenti JS da qui; non duplicare logica lunga nei blocchi DataviewJS.
- `.obsidian/plugins/obsidian-meta-bind-plugin/data.json`: contiene input template e button template operativi, ma e generato da YAML.
- `.obsidian/plugins/metadata-menu/data.json` e `z.fileclass/`: insieme definiscono lo schema operativo; i target generati non vanno tracciati.
- `.obsidian/plugins`: il vault include plugin e configurazioni necessarie.
- `SRD`: puo essere rigenerato da `Dev/TemplateFactory/tools/import_srd.js`, ma resta fuori dall'indice Git.
- `Inizia Qui.md` resta l'unica dashboard root in release, ma nel repository e generata da YAML/Jinja.

## Comandi

```bash
npm run check
npm run sync:sources
npm run check:repo
npm run clean:repo
npm run import:srd
npm run release:clean
```

Se `npm` non e disponibile, usa direttamente:

```bash
node Dev/TemplateFactory/tools/check_vault.js
python3 Dev/TemplateFactory/tools/run_source_pipeline.py --mode render
node Dev/TemplateFactory/tools/repo_hygiene.js
node Dev/TemplateFactory/tools/repo_hygiene.js --fix
node Dev/TemplateFactory/tools/import_srd.js
node Dev/TemplateFactory/tools/release_clean.js
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
