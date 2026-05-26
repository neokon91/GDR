---
cssclasses:
  - indice
categoria: risorsa
tipo: setup
stato: pronto
---

# Setup Guidato

Usa questa pagina solo se qualcosa non risponde. La release del vault e gia configurata: questa pagina serve a recuperare strumenti che Obsidian ha bloccato, disabilitato o non caricato.

````tabs
tab: Percorso

> [!scena] Primo utilizzo
> Se tutto e pronto, non restare qui: torna a [[Inizia Qui]], Crea o apri un mondo, poi Prepara una sessione. Quando sei pronto apri [[Hub/Durante il Gioco]]; dopo la partita apri [[Hub/Cosa Succede Fuori Scena]].

tab: Problemi

> [!todo] Se non risponde
> - [ ] Riavvia Obsidian. #task
> - [ ] Riapri [[Risorse/Setup Guidato]]. #task
> - [ ] Apri [[Risorse/Se Qualcosa Non Funziona]] se il problema resta. #task
````

## Azioni

<!-- workflow:quick_actions:start setup_guidato -->
> [!regia] Azioni rapide
> Capire se il vault e pronto senza leggere impostazioni tecniche.
>
> **Torna all'inizio** - i controlli sono pronti o vuoi ripartire dal percorso semplice
> `BUTTON[inizia-qui-inizia-qui]`
>
> **Crea mondo** - gli strumenti base funzionano
> `BUTTON[nuovo-mondo-homebrew]`
>
> **Prepara sessione** - hai gia un mondo o vuoi preparare il primo tavolo
> `BUTTON[preparazione-sessione-risorse-preparazione-sessione]`
>
> **Apri tavolo** - vuoi verificare il cockpit live
> `BUTTON[durante-il-gioco-durante-il-gioco]`
>
> **Fuori scena** - vuoi verificare il ciclo dopo sessione
> `BUTTON[fuori-scena-hub-cosa-succede-fuori-scena-cosa-succede-fuori-scena]`
>
> [!regia]- Se qualcosa non va
> Usare guide di ripristino leggibili prima di toccare impostazioni avanzate.
>
> **Se qualcosa non funziona** - plugin, pulsanti o tabelle non sembrano pronti
> `BUTTON[aiuto-risorse-se-qualcosa-non-funziona]`
>
> **Prima sessione in 15 minuti** - vuoi saltare il setup profondo e giocare con il minimo
> `BUTTON[prima-sessione-in-15-minuti-risorse-prima-sessione-in-15-minuti]`
<!-- workflow:quick_actions:end setup_guidato -->

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderWorkflowCommandDeck(dv, "setup_guidato");
```

## Controllo Semplice

```dataviewjs
const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
await gdr.renderVaultReadiness(dv, "setup");
```

## Se Qualcosa E Da Controllare

1. Riavvia Obsidian.
2. Riapri questa pagina.
3. Se i pulsanti non rispondono, apri [[Risorse/Se Qualcosa Non Funziona]].
4. Se vuoi giocare comunque, apri [[Risorse/Prima Sessione In 15 Minuti]] e usa i link Markdown.

## Fallback Markdown

| Passo | Apri |
| --- | --- |
| Inizio | [[Inizia Qui]] |
| Crea o apri un mondo | [[Worldbuilder Dashboard]] |
| Prepara una sessione | [[Risorse/Preparazione Sessione]] |
| Durante il Gioco | [[Hub/Durante il Gioco]] |
| Dopo la sessione | [[Hub/Cosa Succede Fuori Scena]] |

## Prova Rapida

| Prova | Dove guardare |
| --- | --- |
| I pulsanti aprono pagine | [[Inizia Qui]] |
| Le dashboard mostrano carte o tabelle | [[1. DM Dashboard]] |
| Il tavolo mostra una sessione o un messaggio chiaro | [[Hub/Durante il Gioco]] |
| Il materiale giocatori non espone campi DM | [[Hub/Vista Giocatori]] |
| Il mondo vivo mostra pressioni e prossime mosse | [[Hub/Cosa Succede Fuori Scena]] |

## Cosa Ignorare

- Aree interne del vault.
- File tecnici.
- Impostazioni avanzate, finche le pagine principali funzionano.
