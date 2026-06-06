# 🏠 GDR — Home

> [!tip] Nuovo qui? Il tuo mondo prende vita in **5 tappe**. Tour con spunti: **[[Crea il tuo mondo]]** · panoramica: **[[LEGGIMI]]**.
> Il vault parte **vuoto**: *scrivi lore → la superficie giocabile si calcola da sé*. Ogni nota ha in cima un callout **ℹ️ Guida** (cos'è, campi chiave, spunti).

```dataviewjs
// Spina di onboarding: il progresso delle 5 tappe «Crea il tuo mondo» derivato dallo
// stato REALE del vault (conta le note + cerca legami/Fronti) → si aggiorna da sé.
const p = dv.pages().where(x => !x.file.path.startsWith("z."));  // escludi i template z.modelli/z.*
const has = v => v != null && (typeof v.length !== "number" || v.length > 0);
const some = f => p.where(f).length > 0;
const steps = [
  [some(x => x.categoria == "mondo"),   "Il **Mondo** — la cornice"],
  [some(x => x.categoria == "luogo"),   "Un **Luogo** dove inizia l'azione"],
  [some(x => x.categoria == "fazione"), "Una **Fazione** che vuole qualcosa"],
  [some(x => has(x.connessioni) || has(x.controllata_da) || has(x.regione) || has(x.fazioni) || has(x.alleati) || has(x.rivali)),
                                        "**Collega** le note (tab *Collegamenti* → `Collega`)"],
  [some(x => (x.pressione || 0) >= 1 || has(x.clock_dim)),
                                        "**Accendi** un Fronte: Pressione + Prossima mossa → [[Fronti]]"],
];
const done = steps.filter(s => s[0]).length;
const next = steps.findIndex(s => !s[0]);
dv.header(3, `🧭 Crea il tuo mondo — ${done}/5`);
dv.paragraph(steps.map((s, i) =>
  `- ${s[0] ? "✅" : (i === next ? "👉" : "⬜")} **${i + 1}** · ${s[1]}` + (i === next ? "  ← *inizia da qui*" : "")
).join("\n"));
dv.paragraph(done === 5
  ? "🎉 **Il tuo mondo è vivo.** Apri **[[Fronti]]** e gioca, o condividilo coi giocatori: **[[Occhi del giocatore]]**."
  : "*I bottoni **Crea** sono qui sotto, organizzati per gruppo.*");
```

````tabs
--- 🌍 Worldbuilding
> [!abstract] Indici
> [[Atlante|🗺️ Atlante]]
> [[Bestiario|🐾 Bestiario]]
> [[Fazioni|⚔️ Fazioni]]
> [[Risorse|📦 Risorse]]
> [[Cast|🎭 Cast]]
> [[Cronologia|📜 Cronologia]]
> [[Geografia|🧭 Geografia & confini]]
> [[Economia|💰 Economia & rotte]]
> [[Missioni|🗺 Quest log]]
> [[Occhi del giocatore|👁 Occhi del giocatore]]

> [!example] 🌍 La cornice
> `BUTTON[crea-mondo]`

> [!example] 🗺 Geografia & luoghi
> `BUTTON[crea-luogo]`
> `BUTTON[crea-rotta]`
> `BUTTON[crea-bioma]`
> `BUTTON[crea-ecosistema]`
> `BUTTON[crea-risorsa]`

> [!example]- 🕰 Tempo & storia
> `BUTTON[crea-evento]`
> `BUTTON[crea-calamita]`
> `BUTTON[crea-epoca]`
> `BUTTON[crea-mito]`
> `BUTTON[crea-profezia]`

> [!example] 👥 Popoli & poteri
> `BUTTON[crea-cultura]`
> `BUTTON[crea-fazione]`
> `BUTTON[crea-lingua]`
> `BUTTON[crea-png]`
> `BUTTON[crea-specie]`
> `BUTTON[crea-culto]`
> `BUTTON[crea-regno]`
> `BUTTON[crea-esercito]`
> `BUTTON[crea-editto]`

> [!example]- 🌌 Cosmo & metafisica
> `BUTTON[crea-cosmologia]`
> `BUTTON[crea-divinita]`
> `BUTTON[crea-sistema_magico]`
> `BUTTON[crea-dominio]`
> `BUTTON[crea-legge_fondamentale]`
> `BUTTON[crea-entita_primordiale]`
> `BUTTON[crea-piano]`

> [!example]- ⚔ Regole 5.5e
> `BUTTON[crea-creatura]`
> `BUTTON[crea-oggetto]`
> `BUTTON[crea-oggetto_magico]`
> `BUTTON[crea-incantesimo]`
> `BUTTON[crea-insidia]`
> `BUTTON[crea-classe]`
> `BUTTON[crea-sottoclasse]`
> `BUTTON[crea-background]`
> `BUTTON[crea-talento]`
> `BUTTON[crea-bastione]`
> `BUTTON[crea-regola]`
> `BUTTON[crea-albero_evolutivo]`


## 🤝 Trame (alleati / rivali)
```dataview
table without id file.link as Chi, alleati as Alleati, rivali as Rivali
from ""
where alleati or rivali
sort file.name asc
```

## Cronologia eventi
```dataview
table without id file.link as Evento, quando as Quando, mondo as Mondo
from ""
where categoria = "evento"
sort quando asc
```

## Note per categoria
```dataview
table without id Categoria, length(rows) as Note
from ""
where categoria
group by categoria as Categoria
sort Categoria asc
```

## Da rifinire (bozze)
```dataview
table without id file.link as Nota, categoria as Categoria, mondo as Mondo
from ""
where stato = "bozza" and categoria
sort file.mtime desc
limit 20
```

--- 🎲 Al tavolo
> [!tip] Come si gioca uno scontro? **[[Guida al combattimento]]** — iniziativa, PF, condizioni e dadi coi plugin (Initiative Tracker + Statblocks + Dice Roller).

> [!example] Crea
> `BUTTON[crea-pg]`
> `BUTTON[crea-incontro]`
> `BUTTON[crea-sessione]`
> `BUTTON[crea-nota_rapida]`
> `BUTTON[crea-missione]`

> [!example]- 🔧 Strumenti
> Apri lo strumento giusto in un clic, senza cercarlo nelle impostazioni:
> `BUTTON[avanza-mondo]` (fa girare il mondo: avanza i Fronti, scatena i pieni, propaga le onde) · `BUTTON[apri-calendario]` (calendario del mondo · timeline) · `BUTTON[world-board]` (Canvas «a colpo d'occhio») · `BUTTON[prepara-gruppo]` (schiera i PG in Initiative Tracker)

## Sessione attiva
```dataview
list
where categoria = "sessione" and attiva = true
```

## In gioco
```dataview
list
where stato = "in gioco"
```

## 🔥 Fronti caldi
Cosa preme nel mondo adesso — ordina per pressione. Ogni riga è una mossa pronta da giocare;
`Clock` mostra il progresso del fronte e `Conseguenza` cosa accade quando si riempie.
```dataview
table without id file.link as Fronte, pressione as Pressione, prossima_mossa as "Prossima mossa", (clock + "/" + clock_dim) as Clock, conseguenza as Conseguenza
from ""
where (pressione >= 5 or clock_dim) and stato != "archiviata"
sort (default(clock, 0) / default(clock_dim, 1)) + (default(pressione, 0) / 10) desc
limit 12
```

## 🧵 Fili narrativi
Ganci da seminare (`#gancio`) e trame aperte (`#trama`). Scrivi in qualunque nota un task
taggato — es. `- [ ] Il duca scopre il tradimento #trama 📅 2025-01-30` — e comparirà qui.
```tasks
not done
(tags include #gancio) OR (tags include #trama)
sort by due
limit 20
```

## ✅ Da fare
Ogni altro task aperto (`- [ ] ...`) scritto in una nota. I fili narrativi stanno qui sopra.
```tasks
not done
(tags do not include #gancio) AND (tags do not include #trama)
sort by priority
limit 15
```
````
