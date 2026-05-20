---
cssclasses:
  - indice
categoria: risorsa
tipo: matrice plugin
stato: pronto
---

# Matrice Plugin 1.0

Questa matrice e il contratto M2: ogni plugin abilitato deve avere una funzione, una classe 1.0, una guida breve, una pagina operativa e una smoke. Il controllo automatico legge `Dev/plugin_matrix.json` e fallisce se un plugin abilitato non e mappato o se una pagina citata manca.

| Plugin | Classe | Funzione | Guida | Operativo | Smoke |
| --- | --- | --- | --- | --- | --- |
| Dataview | core | Dashboard, indici e controlli automatici su frontmatter e link. | [[Dev/Plugin Technical Reference]] | [[Hub/1. DM Dashboard]] | [[Dev/Smoke 1.0 Professionale]] |
| Templater | core | Wizard e template generati senza YAML manuale. | [[Dev/Sviluppo Vault]] | [[z.modelli/dm/Sessione]] | [[Dev/Smoke 1.0 Professionale]] |
| Meta Bind | core | Pulsanti, input e azioni operative nel corpo nota. | [[Dev/Plugin Technical Reference]] | [[Inizia Qui]] | [[Dev/Smoke 1.0 Professionale]] |
| JS Engine | core tecnico | Runtime riusabile per viste complesse e cockpit. | [[Dev/Plugin Technical Reference]] | `z.engine/session_views.js` | [[Dev/Smoke 1.0 Professionale]] |
| Metadata Menu | core dati | FileClass e campi guidati per note operative. | [[Dev/Plugin Technical Reference]] | [[z.fileclass/sessione]] | [[Dev/Smoke 1.0 Professionale]] |
| Folder Notes | core navigazione | Cartelle principali apribili come indici utili. | [[Dev/Plugin Technical Reference]] | [[Mondi/Mondo]] | [[Dev/Smoke 1.0 Professionale]] |
| Homepage | core onboarding | Primo avvio su Inizia Qui. | [[Dev/Plugin Technical Reference]] | [[Inizia Qui]] | [[Dev/Smoke 1.0 Professionale]] |
| Callout Manager | core lettura | Callout GDR coerenti per scene, segreti e tavolo. | [[Risorse/Callout GDR]] | [[Hub/Durante il Gioco]] | [[Dev/Smoke 1.0 Professionale]] |
| Fantasy Statblocks | core combattimento | Schede creatura e mostri richiamabili dagli incontri. | [[Risorse/Iniziativa e Combattimenti]] | [[z.modelli/Creatura]] | [[Dev/Smoke 1.0 Professionale]] |
| Excalidraw | core mappe visuali | Fronti, relazioni, indizi e mappe linkate. | [[Risorse/Excalidraw Per GDR]] | [[Risorse/Mappe/Mappe]] | [[Dev/Smoke 1.0 Professionale]] |
| Kanban | supporto DM | Bacheche operative per preparazione, post-sessione e manutenzione. | [[Dev/Plugin Technical Reference]] | [[z.bacheche/Manutenzione Vault]] | [[Dev/Smoke 1.0 Professionale]] |
| Tasks | supporto DM | Task operative con priorita e scadenze, non lore. | [[Risorse/Task DM]] | [[Risorse/Task DM]] | [[Dev/Smoke 1.0 Professionale]] |
| Maps per Bases | supporto mappe | Marker geografici da Bases con coordinates, icon e color. | [[Risorse/Mappe Bases]] | [[z.bases/Atlante Mappe.base]] | [[Dev/Smoke 1.0 Professionale]] |
| Initiative Tracker | supporto tavolo | Combattimenti preparati con blocchi encounter. | [[Risorse/Iniziativa e Combattimenti]] | [[z.bases/Incontri.base]] | [[Dev/Smoke 1.0 Professionale]] |
| Dice Roller | supporto tavolo | Tiri rapidi e tabelle casuali con block id stabili. | [[Risorse/Tabelle/Tabelle]] | [[Risorse/Tabelle/Tabelle]] | [[Dev/Smoke 1.0 Professionale]] |
| Calendarium | supporto tempo | Calendari, eventi, scadenze e date diegetiche. | [[Mondi/Calendario]] | [[Mondi/Calendario]] | [[Dev/Smoke 1.0 Professionale]] |
| Advanced Canvas | supporto reti vive | Canvas strutturali di note, gruppi e connessioni. | [[Risorse/Canvas Per GDR]] | [[Risorse/Mappe/Schema Relazioni GDR.excalidraw]] | [[Dev/Smoke 1.0 Professionale]] |
| Media Extended | supporto tavolo | Audio, immagini e video pronti con contesto di scena. | [[Risorse/Media Scene]] | [[Hub/Durante il Gioco]] | [[Dev/Smoke 1.0 Professionale]] |
| Fantasy Content Generator | opzionale guidato | Bozze in Inbox/Generati da smistare e canonizzare manualmente. | [[Risorse/Smistamento Bozze Generate]] | [[Risorse/Smistamento Bozze Generate]] | [[Dev/Smoke 1.0 Professionale]] |
| Iconize | supporto orientamento | Icone per orientamento visivo, senza sostituire indici. | [[Dev/Integrazioni Plugin]] | [[Inizia Qui]] | [[Dev/Smoke 1.0 Professionale]] |
| Tabs | supporto UX | Schede in dashboard e template lunghi per ridurre scrolling. | [[Dev/Plugin Technical Reference]] | [[Hub/Worldbuilder Dashboard]] | [[Dev/Smoke 1.0 Professionale]] |
| Style Settings | supporto visuale | Opzioni visuali dello snippet senza modifica CSS manuale. | [[Risorse/Setup Guidato]] | [[Inizia Qui]] | [[Dev/Smoke 1.0 Professionale]] |
| Advanced Tables | supporto editing | Editing rapido di tabelle Markdown e tabelle casuali. | [[Dev/Integrazioni Plugin]] | [[Risorse/Tabelle/Tabelle]] | [[Dev/Smoke 1.0 Professionale]] |
| TTRPG Tools: Maps | supporto mappe tavolo | Mappe zoomabili con pin e riferimenti al tavolo. | [[Risorse/Mappe/Mappe]] | [[Risorse/Mappe/Mappe]] | [[Dev/Smoke 1.0 Professionale]] |
| Hex Cartographer | supporto esplorazione | Hexcrawl collegato a territori, incontri e conseguenze. | [[Risorse/Mappe/Mappe]] | [[Risorse/Mappe/Mappe]] | [[Dev/Smoke 1.0 Professionale]] |
| Linter | manutenzione | Pulizia manuale prudente, mai lint distruttivo. | [[Dev/Linter e Sviluppo]] | [[z.bacheche/Manutenzione Vault]] | [[Dev/Smoke 1.0 Professionale]] |
| BRAT | manutenzione | Gestione plugin beta/non ufficiali fuori dal flusso DM. | [[Dev/Integrazioni Plugin]] | [[z.bacheche/Manutenzione Vault]] | [[Dev/Smoke 1.0 Professionale]] |
