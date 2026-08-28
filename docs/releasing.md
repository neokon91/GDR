# Rilascio, QA e pagina itch

Come confezionare, verificare e distribuire il vault. Gli artefatti sono **versionati** e
riproducibili; gli zip vivono in `dist/` (gitignorato) e si **allegano** a una release — non si
committano.

## Cosa esce

`npm run dist` (→ `Dev/Tools/release.py`) fa una build pulita e produce
`dist/GDR-vault-v<ver>.zip`: il **vault Obsidian pronto** (plugin inclusi) — si scompatta in una
cartella `GDR-vault/` → «Apri cartella come vault». Lo stato locale (workspace/cache/.DS_Store) è
escluso. *(Il sito dei giocatori NON è un artefatto di release: lo genera il DM in-app dal
bottone «Genera sito».)*

I **plugin sono bundlati, pinnati e riproducibili**: `release.py` invoca `fetch_plugins.py`, che
scarica i plugin con `repo`+`version` in `plugins.yaml` dalle loro **GitHub release** dentro
`.obsidian/plugins/<id>/` **prima** dello zip (idempotente; verifica che il manifest scaricato
combaci col pin). Non dipende dai plugin installati sul PC del maintainer → lo zip esce uguale da
un clone pulito. Un **gate** (`assert_critical_present`) fa fallire `npm run dist` se manca un
plugin `critico`. Il plugin autoriale `gdr` è **esente dal pin** (buildato da `plugin/`).

## Passi

1. **Versione**: `version` in `package.json` (SemVer) — single source per nomi-file e tag.
2. **Changelog**: sposta le voci da *Non rilasciato* a `## [<ver>] — AAAA-MM-GG` in `CHANGELOG.md`.
3. **Verifica**: `npm run check && npm test` verdi. Per una release pubblica, la **QA
   clean-install** (sotto).
4. **Pacchetto**: `npm run dist`.
5. **Pubblica**: GitHub (`gh release create v<ver> dist/GDR-vault-v<ver>.zip --title "GDR v<ver>"
   --notes-file CHANGELOG.md`) e/o **itch.io** (sotto).

## itch.io (via butler)

Canale di **scoperta** per i Game Master (GitHub resta sorgente + issue). CLI ufficiale **butler**.

**Una-tantum**: installa butler (https://itch.io/docs/butler/) + `butler login`; crea il progetto
itch tipo «Downloadable», free/name-your-price; imposta `config.itch` in `package.json`
(`"itch": "utente/gioco"`) o `ITCH_TARGET`; incolla la pagina dall'appendice sotto.
**Ogni release**: `npm run publish:itch` (build+zip + `butler push` sul canale `…:vault`,
versionato). `butler status <target>:vault` mostra la versione online.

## Licenze

- **Plugin bundlati** (verificato): redistribuibili (MIT/GPL-3.0/AGPL-3.0), inclusi **non
  modificati** come mera aggregazione. Attribuzione auto-generata da `plugins.yaml`
  (`author/repo/license`) in `THIRD-PARTY-LICENSES.md`, incluso nello zip (un test lo impone).
  Alternativa *lite* (senza `.obsidian/plugins/`): togli i `version` da `plugins.yaml` (i plugin
  si installano al primo avvio) — richiede prima di rendere non-critici i plugin critici.
- **SRD 5.2.1** = CC-BY-4.0 (attribuzione in `archivio`); codice/tooling = MIT.

---

## QA clean-install (pre-beta)

Checklist per il **path turnkey da zip pulito** — l'esperienza del **DM esterno**, non la
dev-copy. La suite automatica copre generazione + logica; **qui** si copre l'**integrazione
plugin** (Meta Bind, Dataview, il plugin `gdr` che disegna i blocchi ` ```gdr `, reattività
live) — non testabile headless, ed è dove ogni QA in-app ha trovato bug veri. Il sintomo n.1 di
rottura è **codice grezzo** (`INPUT[...]`, ` ```dataview `, ` ```gdr `) al posto di
pulsanti/schede. Ogni FAIL → issue **🎲 Feedback beta**.

- **§0 Setup** — `check && test` verdi; `npm run dist`; scompatta in una cartella **NUOVA** (non
  la dev-vault); *Apri cartella come vault*. ⚠️ **Primo-open in Restricted Mode** (plugin spenti):
  la vault è navigabile? *È qui che un DM non-tecnico rimbalza — trattalo come blocco di rilascio.*
- **§1 Attivazione** — *Trust author*; i plugin si attivano; **Diagnostica** li mostra attivi; su
  Home nessun codice grezzo.
- **§2 Onboarding** — Home rende le dashboard; tour *Crea il tuo mondo* (5 tappe) crea le note
  giuste; wizard **Mondo→Luogo→Fazione** (chiede solo nome+tipo, nota snella); **＋ Componenti**
  appende il blocco ed è idempotente.
- **§3 Integrazione** (rischio #1) — **Meta Bind** (VIEW mostra valori, INPUT persistono);
  **Dataview** (dashboard/relazioni popolate); **pannelli ```gdr** (Rete, radar Carattere SVG,
  Fronti); **Board** («Apri la Board» → ➕Nemico + 🎭PG → iniziativa → attacco applica danno →
  click nome = statblock nativo → reload persiste); **reattività** (slider asse → radar live);
  **statblock** (link `[[Afferrato]]` cliccabili, danno `(2d6+5)` e «+9 a colpire» tirabili).
- **§4 Demo Astaria** — un luogo (lore+pin), Korbin Salmastro (tiri col bonus reale, *Sali di
  livello*), incontro «Guardiani» (budget XP + *Schiera nella Board*), mappe zoom-map/import.
- **§5 Sito giocatori** — «Genera sito» → `Sito-giocatori/` spoiler-free (`rivelazione: segreto`
  non compare; `visibilita: dm` mai).
- **§6 Esito** — zero codice-grezzo lungo tutto il percorso.

---

## Appendice — Copy per la pagina itch.io

Testo da incollare nella pagina itch (adatta nomi/link).

**Titolo**: *GDR Italian Vault — il mondo che si calcola, il tavolo 5.5e che si gioca*
**Tagline**: Un vault Obsidian dove il **worldbuilding diventa tavolo**: scrivi la lore, la
prep-sessione si accende da sola. D&D 5.5e (2024) completo. **Locale, gratis, i tuoi file restano
tuoi.**

**Descrizione** — *Il tuo mondo non è uno schedario: è un motore.* Scrivi la lore di una nota (una
pressione, una prossima mossa) e la *superficie giocabile* si accende **da sola**, calcolata dal
grafo del mondo. Le fazioni si contendono le risorse; gli eventi muovono i **Fronti**.

- **🌍 Worldbuilding che fa qualcosa**: grafo di entità tipizzate (luoghi/fazioni/divinità/culti…)
  con inversi automatici; **assi tematici** (radar), motore di **coerenza**, economia, geografia,
  **timeline causale**; strato cosmico/teologico; World Board su Canvas + 🔎 Esplora (Bases).
- **🎲 Si gioca davvero a 5.5e (2024)**: PG **1-20** (creazione + level-up), **multiclasse** RAW,
  **statblock 2024**, incontri col budget 2024, condizioni "vere", maestrie, **tiri col bonus
  reale**; loop di sessione (Esaurimento/Dadi Vita/riposi/concentrazione/risorse di classe);
  **homebrew giocabile** accanto all'**SRD 5.2.1 in italiano**.
- **🗺️ Mappe**: disegna (Excalidraw) o immagine pannabile/zoomabile con segnaposto; **import da
  Azgaar/Watabou**; hexcrawl.
- **👥 Condividi senza spoiler**: **sito statico per i giocatori** (un clic, spoiler-free) con
  rivelazione progressiva anche per singole sezioni.
- **🔒 Locale, tuo, per sempre**: una cartella sul disco, offline, nessun account; gratis e aperto.

**Perché non una wiki?** Quella *descrive* il mondo; qui il mondo **si calcola**. **Non un VTT?**
Quello dà il tavolo ma non il mondo; qui **il tavolo nasce dal mondo**. **Non un cloud?** Markdown,
locale, tuo — niente lock-in.

**Come si parte (2 min)**: scarica, scompatta, *Apri cartella come vault* → *fidati dell'autore,
attiva i plugin*. Dentro un **mondo-esempio giocabile** (Astaria): apri **«Inizia da qui»** per
vedere *lore → superficie giocabile*, poi cancella Astaria per il foglio bianco (tour «Crea il tuo
mondo» + callout ℹ️ Guida su ogni nota).

> 🧪 **Beta aperta.** Template **«🎲 Feedback beta»** sul repo. Include materiale dal **SRD 5.2.1**
> (CC-BY-4.0) di Wizards of the Coast. Non affiliato né approvato da WotC.

**Campi itch**: Classificazione *Tool* · Prezzo *Name your own price* · Piattaforme
Windows/macOS/Linux (richiede [Obsidian](https://obsidian.md)) · Tag `worldbuilding`, `tabletop`,
`dnd`, `dnd-5e`, `obsidian`, `ttrpg`, `game-master`, `hexcrawl`, `italiano` · Canale butler `vault`.
