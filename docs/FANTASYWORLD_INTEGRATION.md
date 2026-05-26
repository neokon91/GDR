# Integrazione FantasyWorld → GDR

FantasyWorld (`/Users/andrea/Desktop/projects/FantasyWorld`) è il laboratorio di riferimento; il vault GDR possiede la **pipeline di produzione** (TemplateFactory + release).

## Cosa è stato portato

| FantasyWorld | GDR |
|---|---|
| `YAML/yaml2json/srd/core.yaml` | `Dev/TemplateFactory/modules/srd_character_build.yaml` (sezione `core`) |
| `YAML/yaml2json/srd/opzioni_personaggio.yaml` | stesso modulo (sezione `opzioni`, adattato a slug GDR: `guerriero`, `ranger`, `goliath`, …) |
| `JINJA/personaggio/components/macro.jinja` | `Dev/TemplateFactory/jinja/macros/pg_mechanics.j2` |
| `YAML/template4jinja/template_personaggio.yaml` | `Dev/TemplateFactory/modules/pg_mechanics_schema.yaml` |
| `JS/creaPersonaggio.js` | `z.automazioni/pg.js` (integrato con `helpers`, mondo, connessioni) |

## Cosa resta in FantasyWorld

- `converter.py` e la catena YAML→JSON generica del repo lab.
- Template e dati worldbuilding non necessari al vault GDR.
- Test pytest del laboratorio (`tests/test_srd.py`, `tests/test_render.py`).

## Idee utili da sfruttare ancora

FantasyWorld non va importato in blocco: va usato come laboratorio da cui promuovere solo idee che rafforzano il sistema operativo narrativo del vault GDR.

| Area FantasyWorld | Valore per GDR | Azione consigliata |
|---|---|---|
| `tests/test_srd.py` | Contratti meccanici semplici e verificabili per classi, abilita, talenti, point buy e background. | Portare test equivalenti in `z.automazioni/check_*` o in un gate dedicato `check:srd-character-data`, evitando pytest come dipendenza runtime del vault. |
| `YAML/yaml2json/srd/talenti.yaml` | Talenti modellati come scelte, prerequisiti e benefici, non solo testo. | Estendere `srd_character_build.yaml` con talenti e scelte meccaniche quando il wizard PG deve superare il livello 1. |
| `JINJA/components/macro.jinja` | Macro riusabili per `VIEW`, `INPUT`, bonus caratteristica, tiri salvezza e abilita. | Mantenere la versione GDR in `Dev/TemplateFactory/jinja/macros/pg_mechanics.j2` e aggiungere controlli contro macro Meta Bind non dichiarate. |
| `JS/creaPersonaggio.js` | Sequenza guidata completa: classe, specie, background, competenze, statistiche, HP, tratti. | Continuare ad assorbire solo la logica di scelta in `z.automazioni/pg.js`, usando `helpers.js` e campi narrativi GDR. |
| `YAML/altro/assi_tematici/*.yaml` | Profondita worldbuilding parametrica per fazioni, culture, magia, luoghi, culti, lingue, insediamenti, artefatti. | Creare un modulo opzionale `worldbuilding_depth_axes.yaml` o estendere `entity_depth.yaml`; usare 3-5 assi per profilo, non come campi obbligatori su ogni nota. |
| `YAML/altro/cosmologia/*` | Leggi fondamentali, piani, domini, entita primordiali, eventi e magia come generatori di conflitti metafisici. | Usare come materiale generativo per template `Cosmologia`, `Religione`, `Magia` e `Conflitto`; non trasformarlo in canone preinstallato. |
| README Meta Bind / Templater / Tabs | Regole operative chiare su sintassi, performance e anti-pattern. | Promuovere le regole in check automatici: no dynamic commands Templater, no tab vuoti, no nesting profondo, no Meta Bind inline complessi dove serve block. |
| `YAML/altro/TTRPG/alberi_evolutivi.yaml` | Alberi abilita e progressione custom. | Tenere fuori dalla 1.0: e un sistema meccanico parallelo. Rivalutare solo dopo stabilizzazione PG/SRD. |

## Decisioni architetturali

- FantasyWorld resta **laboratorio**, GDR resta **prodotto/release pipeline**.
- La direzione corretta e: YAML dichiarativo in TemplateFactory, JSON generato in `z.automazioni/data`, runtime Templater/JS nel vault, check automatici nel repository.
- Non usare symlink, watcher o copia diretta da FantasyWorld: ogni promozione deve passare da modulo YAML, script npm e `npm run check`.
- I contenuti worldbuilding profondi vanno trattati come generatori o profili opzionali, non come contenuto canonico imposto al DM.
- I dati D&D/SRD devono restare separati dal Codex del mondo: la scheda PG puo collegarsi a mondo, fazioni e sessioni, ma il regolamento non deve diventare lore.

## Backlog consigliato

1. Aggiungere un gate `check:srd-character-data` che replichi i test utili di FantasyWorld: statistiche valide, abilita con stat valida, classi/background/talenti coerenti, point buy completo.
2. Estendere `srd_character_build.yaml` con talenti e scelte del livello 1, mantenendo slug e label allineati al resto del vault.
3. Portare gli assi tematici in un modulo dichiarativo piccolo e selettivo, iniziando da fazione, cultura, magia e luogo.
4. Aggiungere controlli statici sulle tabs generate: tab non vuoti, separatori corretti, niente nesting profondo nei template utente.
5. Usare la cosmologia FantasyWorld solo come profilo opzionale per mondi ad alta componente metafisica.

## Pipeline GDR (non duplicare converter.py)

```
srd_character_build.yaml
        ↓  npm run import:srd-data
z.automazioni/data/srd/*.json
        ↓  Templater pg.js
frontmatter PG nella nota
        ↓  TemplateFactory Jinja
z.modelli/personaggio/PG.md (+ tab Scheda)
```

## Sincronizzare modifiche future

1. Aggiorna i YAML in FantasyWorld se stai sperimentando.
2. Porta manualmente le differenze rilevanti in `srd_character_build.yaml` (mantieni slug allineati a `dnd55_options.yaml`).
3. Esegui `npm run import:srd-data` e `npm run check`.
4. Rigenera template con `npm run render:templates` / `release:clean`.

Non symlinkare l’intero repo FantasyWorld nel vault: solo contenuti necessari e licenza dell’utente su entrambi i progetti.
