# 🩺 Diagnostica — il vault funziona?

> [!info] A cosa serve
> Se in una nota vedi del **codice grezzo** (es. `INPUT[...]`, o blocchi che iniziano
> con ` ```dataview `) invece di pulsanti, schede o tabelle, quasi sempre manca un
> **plugin**. Questa pagina ti dice quale e come riattivarlo. *(Consiglio: tieni le
> note in modalità **Lettura** — i campi restano comunque cliccabili.)*

> [!warning] Se qui sotto vedi del codice invece di una checklist
> Allora manca **JS Engine** (è lui che disegna la checklist). Aprilo da *Impostazioni
> → Plugin della community*, assicurati che il *Restricted mode* sia **off** e attiva
> **JS Engine**; poi riapri questa nota. L'elenco completo è comunque più in basso.

```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderDiagnostica");
```

> [!tip] Come si attiva un plugin
> *Impostazioni* (⚙️, in basso a sinistra) → *Plugin della community* → trova il
> plugin nell'elenco → interruttore su **on**. Se l'elenco è bloccato, disattiva
> prima il *Restricted mode* (stesso pannello). I plugin sono **già nel vault**.

> [!note]- Elenco completo dei plugin essenziali *(si vede sempre, anche senza plugin)*
> Questi devono essere **attivi**. Senza, ecco cosa non si vede:
>
> | Plugin | Cosa non si vede senza |
> |:--|:--|
> | **Templater** | I pulsanti «Crea» non funzionano: non puoi creare nuove note. |
> | **Dataview** | La Home e gli indici (Atlante, Cast, Fronti…) restano vuoti o come codice. |
> | **Meta Bind** | I campi da compilare (slider, menu, testo) restano come codice grezzo. |
> | **JS Engine** | I pannelli dinamici (radar, Stato del Mondo, questa diagnostica) non si disegnano. |
> | **Tab Panels** | Le note a schede (Lore / Al tavolo / Collegamenti) appaiono come testo grezzo. |
> | **Fantasy Statblocks** | Gli statblock dei mostri e il blocco incontro non si vedono. |
> | **Dice Roller** | I tiri di dado sulla scheda e negli incontri non funzionano. |
> | **Initiative Tracker** | Il tracciatore d'iniziativa per i combattimenti non è disponibile. |
