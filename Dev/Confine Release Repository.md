---
cssclasses:
  - indice
categoria: risorsa
tipo: sviluppo
stato: pronto
---

# Confine Release Repository

Questa nota definisce cosa entra nella ZIP utente e cosa resta solo nel repository di sviluppo.

## Principio

La release deve essere usabile da un DM non tecnico. Deve includere tutto cio che serve a usare il vault in Obsidian: plugin abilitati, configurazioni, template, automazioni Templater, viste JS runtime, basi editabili, bacheche operative, fileClass, SRD e pagine operative.

La release non deve includere strumenti di manutenzione repository, import massivi, changelog interno, roadmap, issue template o artefatti generati.

## Entra Nella Release

| Area | Motivo |
| --- | --- |
| `.obsidian` | Plugin, configurazioni, snippet, homepage, callout, workspace e impostazioni necessarie. |
| `Inizia Qui.md` | Porta di ingresso non tecnica. |
| `Campagne`, `Giocatori`, `Hub`, `Inbox`, `Mondi`, `Risorse`, `SRD` | Contenuto operativo, player portal, dashboard, modelli di lavoro e regolamento. |
| `z.modelli` | Template usati dai pulsanti e dai wizard. Sono materializzati da `Dev/TemplateFactory` durante `npm run release:clean`. |
| `z.automazioni` runtime | Script Templater necessari ai template e alle azioni utente. |
| `z.engine` | Componenti JS riusabili dalle dashboard. |
| `z.bacheche` | Kanban e Tasks operativi del DM. |
| `z.bases` | Viste Bases editabili. |
| `z.fileclass` | FileClass Metadata Menu per campi guidati. |
| `LICENSE.md`, `VERSION.md` | Informazioni essenziali di distribuzione. |

## Resta Solo Nel Repository

| Area | Motivo |
| --- | --- |
| `.git`, `.github`, `docs`, `Import`, `node_modules`, `dist` | Sviluppo, import, CI o artefatti generati. |
| `Dev/CHANGELOG.md`, `Dev/CONTRIBUTING.md`, `Dev/RELEASE.md`, `Dev/Repository.md`, `package.json` | Manutenzione repository, non uso al tavolo. |
| `Dev/Roadmap`, `Dev/Sviluppo Vault`, `Dev/Integrazioni Plugin`, `Dev/TemplateFactory/modules/plugin_contracts.yaml` | Direzione e audit di sviluppo, non percorso utente finale. |
| `Dev/Confine Release Repository`, `Dev/Smoke 1.0 Professionale` | Controlli pre-release e confini di manutenzione. |
| Script CLI di check, import e release in `z.automazioni` | Servono al manutentore, non al DM. |

## Regole

- Nessun plugin installato viene escluso se e abilitato e necessario a una funzione reale.
- Nessuna demo entra finche non e stata creata con template e wizard ufficiali.
- Nessun artefatto `dist/` resta nel repository sorgente.
- `z.modelli` non deve dipendere dallo stato locale del manutentore: `npm run release:clean` deve rigenerarlo da TemplateFactory prima di copiare la ZIP utente.
- Ogni modifica al confine release deve aggiornare `z.automazioni/release_clean.js`.
