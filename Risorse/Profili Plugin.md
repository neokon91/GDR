---
categoria: risorsa
tipo: guida
stato: pronto
---

# Profili Plugin

Questa pagina spiega gli strumenti inclusi nella release. Il vault arriva gia con plugin community, plugin core e configurazioni principali pronti: al primo avvio non devi scegliere cosa installare.

## Gia Incluso Nella Release

Il profilo consegnato e pensato per un DM non tecnico. Tieni attivi i plugin inclusi finche `[[Inizia Qui]]`, dashboard, pulsanti e tabelle funzionano. Disattivare strumenti prima di aver provato il vault puo far comparire codice `dataviewjs`, pulsanti `BUTTON[...]` non renderizzati o template non eseguiti.

### Non Disattivare Subito

| Strumento | Perche serve subito |
| --- | --- |
| `dataview` | Dashboard, tabelle, controlli e messaggi di stato. |
| `templater-obsidian` | Creazione guidata di sessioni, mondi, PNG, luoghi e azioni. |
| `obsidian-meta-bind-plugin` | Pulsanti, input, toggle e azioni nel corpo delle note. |
| `metadata-menu` | FileClass, campi guidati e coerenza dei metadata. |
| `homepage` | Apertura iniziale su [[Inizia Qui]]. |
| `folder-notes` | Cartelle principali apribili come indici. |
| `callout-manager` | Callout GDR coerenti e leggibili. |
| `obsidian-style-settings` | Impostazioni visuali dello snippet `gdr-vault`. |

## Plugin Core Obsidian

Questi plugin core sono abilitati nella release per navigazione, ricerca, proprietà, canvas, workspace e recupero file:

| Plugin core | Uso nel vault |
| --- | --- |
| `file-explorer` | Navigazione cartelle e note. |
| `global-search` | Ricerca nel vault. |
| `switcher` | Apertura rapida note. |
| `graph` | Vista grafo quando serve esplorare relazioni. |
| `backlink` | Collegamenti in ingresso. |
| `canvas` | Canvas e schemi visuali. |
| `outgoing-link` | Collegamenti in uscita. |
| `tag-pane` | Navigazione tag. |
| `properties` | Frontmatter leggibile e modificabile. |
| `page-preview` | Anteprima link. |
| `daily-notes` | Note giornaliere se il DM le usa. |
| `templates` | Supporto core ai template Obsidian. |
| `note-composer` | Fusione e divisione note. |
| `command-palette` | Comandi Obsidian. |
| `editor-status` | Stato editor. |
| `bookmarks` | Percorsi pronti nella barra laterale. |
| `outline` | Indice della nota. |
| `word-count` | Conteggio parole. |
| `workspaces` | Layout salvati per gioco e worldbuilding. |
| `file-recovery` | Recupero versioni locali. |
| `sync` | Compatibilita con Obsidian Sync se l'utente lo usa. |
| `bases` | Tabelle native `.base` e viste dati. |
| `webviewer` | Apertura riferimenti web quando serve. |

## Plugin Community Integrati

Tutti i plugin community sotto sono inclusi e mappati in `Dev/plugin_matrix.json`.

### Base Operativa

Per preparare, giocare e aggiornare il mondo con il flusso Prepara → Gioca → Aggiorna:

| Plugin | Ruolo nel vault |
|--------|-----------------|
| `dataview` | Dashboard, tabelle e blocchi `dataviewjs` |
| `templater-obsidian` | Creazione note da `z.modelli` e automazioni |
| `obsidian-meta-bind-plugin` | Pulsanti `BUTTON[...]` e input `INPUT[...]` |
| `metadata-menu` | FileClass, campi guidati e preset |
| `homepage` | Pagina iniziale su [[Inizia Qui]] |
| `folder-notes` | Note indice per cartelle `Mondi/`, `Campagne/`, ecc. |
| `callout-manager` | Stili callout coerenti con il tema GDR |
| `obsidian-style-settings` | Palette e densità del snippet `gdr-vault` |

**Snippet CSS:** `gdr-vault` e gia abilitato nella release. Se l'aspetto sembra piatto, controlla Impostazioni -> Aspetto -> Snippet CSS.

### Tavolo Completo

Questi strumenti sono gia presenti e diventano utili quando giochi con combattimenti, mappe, calendario diegetico e generazione rapida:

| Plugin | Ruolo |
|--------|--------|
| `obsidian-5e-statblocks` | Schede creature e blocchi incontro |
| `initiative-tracker` | Combattimenti e iniziativa |
| `calendarium` | Date `fc-date` / calendari del mondo |
| `obsidian-excalidraw-plugin` | Mappe fronti e diagrammi |
| `maps` | Mappe interattive collegate ai luoghi |
| `hex-cartographer` | Mappe esagonali |
| `zoom-map` | Mappe zoom per scene |
| `fantasy-content-generator` | Bozze in `Inbox/Generati` |
| `obsidian-tasks-plugin` | Task DM e follow-up |
| `obsidian-kanban` | Bacheche preparazione/post-sessione |
| `js-engine` | Script avanzati (opzionale; il vault usa soprattutto DataviewJS) |
| `tabs` | Schede nelle dashboard lunghe |
| `obsidian-icon-folder` | Icone cartelle nel vault |
| `media-extended` | Audio/video in sessione |
| `table-editor-obsidian` | Modifica tabelle markdown |
| `obsidian-dice-roller` | Tiri rapidi |
| `advanced-canvas` | Canvas avanzati |
| `obsidian-linter` | Formattazione markdown (opzionale in dev) |
| `obsidian42-brat` | Plugin beta da BRAT (solo se necessario) |

## Elenco Completo Community (27)

Come in `community-plugins.json`:

1. obsidian-icon-folder  
2. media-extended  
3. obsidian-5e-statblocks  
4. dataview  
5. table-editor-obsidian  
6. templater-obsidian  
7. obsidian-kanban  
8. fantasy-content-generator  
9. calendarium  
10. obsidian-meta-bind-plugin  
11. js-engine  
12. metadata-menu  
13. homepage  
14. callout-manager  
15. folder-notes  
16. obsidian42-brat  
17. obsidian-dice-roller  
18. initiative-tracker  
19. obsidian-excalidraw-plugin  
20. hex-cartographer  
21. zoom-map  
22. obsidian-style-settings  
23. tabs  
24. obsidian-tasks-plugin  
25. advanced-canvas  
26. obsidian-linter  
27. maps  

## Verifica

Dopo il primo avvio: apri [[Risorse/Primo Avvio Strumenti]] o [[Risorse/Setup Guidato]], poi [[Risorse/Se Qualcosa Non Funziona]] se qualcosa non si aggiorna. Cambia plugin solo dopo aver verificato il percorso base.
