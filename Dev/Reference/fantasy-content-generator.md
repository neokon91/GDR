# Reference: Fantasy Content Generator (`fantasy-content-generator`)

Versione vault: **v1.2.4** (Gregory Jagermeister).

> **Stato: cablato (in corpo nota), verificato in-app.** Due vie alla generazione di
> nomi/spunti su PNG/luogo/fazione (macro `genera_nome()` nel loro Lore). **NON** nel
> wizard: FCG non espone un'API di generazione richiamabile (scelta utente: saltare l'hook).
>
> **Vedi anche il generatore HOMEBREW** (`Dev/Source/YAML/generatori.yaml` + `genera.js`,
> bottone *Genera (locale)*): nomi **italiani e a tema**, legati all'ontologia (lo
> `stile_nomi` di cultura/specie). È la via primaria per i nomi che contano; FCG resta per
> spunti rapidi generici (EN).

## Cos'è
Generatore di contenuti fantasy/TTRPG: **nomi** (PNG, luoghi, taverne…), spunti, tabelle
casuali. Espone due superfici (reverse del `main.js` v1.2.4):
1. **Suggester INLINE** (editor-suggest): trigger `settings.inlineCallout` (default **`@`**);
   digiti `@<categoria>` (es. `@HumanFemale`, `@Settlement`, `@InnsTaverns`) e selezioni dal
   popup → il risultato si inserisce **in linea** (niente clipboard). `possibleOptions` =
   la lista delle categorie.
2. **Comando** `fantasy-content-generator:open-fantasy-generator` → apre il **modale**;
   generi e premi *Copy* → il risultato va negli **appunti** (poi incolli).
Le funzioni generatrici sono **private** al plugin (suggester/modale): nessuna API JS
chiamabile da Templater/JS Engine → niente generazione nel wizard.

## Aggancio (roadmap #8) — fatto
- **`write_fantasy_content_generator`** (render.py): pinna `inlineCallout: "@"`
  (merge non distruttivo; il plugin riempie il resto da DEFAULT_SETTINGS).
- **Bottone Genera** (Meta Bind `command`): `plugins.yaml:buttons` con campo `command`
  (`genera-contenuto`); `action_buttons()` emette `{type:"command", command:…}` →
  i command-button NON richiedono un'azione-nota Templater. Apre il modale.
- **Macro `genera_nome()`** (`_macros.j2`): callout pieghevole con il trigger inline + il
  bottone Genera; agganciata in `character`/`luogo`/`fazione` (Lore).
- ✅ **QA in-app**: il bottone apre il modale (Settlement → "Joosceby", Copy); il trigger
  `@Settle` → Settlement → inserisce in linea (`Name/Population/Type`).

## ⚠️ Gotcha
- Genera testo **generico** (non legato all'ontologia/assi del progetto): va trattato come
  *spunto*, non come dato canonico — l'utente cura e tipizza dopo.
- Il modale copia in **clipboard** (non inserisce); il suggester inline inserisce ma è
  l'unica via "in linea". Nessun ritorno-valore programmatico → wizard non agganciabile.
- Il trigger `@` è di FCG: se collidesse con altri plugin si cambia in `inlineCallout`.
