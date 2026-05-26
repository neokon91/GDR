<% await tp.user.pg(tp) %>
# `=this.nome`









````tabs
tab: Stato

> [!infoboxwiki]- PG
> Mondo: `INPUT[mondo][:mondo]`
>
> Stato: `INPUT[stato][:stato]`
>
> Pubblico: `INPUT[toggle:pubblico]`
>
> Canonico: `INPUT[canonico][:canonico]`
>
> La scheda e usabile quando ha almeno un gancio, una connessione viva e una conseguenza o prossima mossa.

> [!regia] Azioni Scheda
> `BUTTON[marca-canonico]`
>
> `BUTTON[marca-rumor]`
>
> `BUTTON[collega-sessione-attiva]`
>
> `BUTTON[archivia-nota]`

tab: Tavolo

> [!scena] Identita Al Tavolo
> `INPUT[text:identita]`
>
> Gancio: `INPUT[text:gancio]`
>
> Uso al tavolo: `INPUT[text:uso_al_tavolo]`

> [!missione] Scelta E Conseguenza
> Scelta: `INPUT[text:scelta]`
>
> Posta: `INPUT[text:posta]`
>
> Rischi: `INPUT[list:rischi]`
>
> Ricompense: `INPUT[list:ricompense]`
>
> Prossima mossa: `INPUT[prossima_mossa][:prossima_mossa]`
>
> Conseguenza potenziale: `INPUT[text:conseguenza_potenziale]`


> [!lettura]- Versione Pubblica
> `INPUT[text:player_safe]`

> [!segreto]- Livello DM
> `INPUT[text:segreto]`

tab: Connessioni

> [!regia] Collegamenti Operativi
> Connessioni: `INPUT[connessioni][:connessioni]`
>
> Entita impattate: `INPUT[entita_impattate][:entita_impattate]`
>
> Propaga a: `INPUT[propaga_a][:propaga_a]`
>
> Fonti: `INPUT[fonti][:fonti]`
>
> Riferimenti SRD: `INPUT[riferimenti_srd][:riferimenti_srd]`
>
> Riferimenti regola: `INPUT[riferimenti_regola][:riferimenti_regola]`
>
> Sezioni collegate: `INPUT[sezioni_collegate][:sezioni_collegate]`
>
> Blocchi collegati: `INPUT[blocchi_collegati][:blocchi_collegati]`
>
> Tabelle collegate: `INPUT[tabelle_collegate][:tabelle_collegate]`
>
> Tag: `INPUT[tags][:tags]`


> [!conflitto]- Note Che Puntano Qui
> ```dataview
> TABLE categoria, tipo, stato, pressione, prossima_mossa
> FROM "Mondi"
> WHERE contains(this.connessioni, file.link) OR contains(this.entita_impattate, file.link) OR contains(this.propaga_a, file.link)
> SORT categoria ASC, file.name ASC
> ```

> [!regia]- Base Editabile
> Apri la base coerente con la famiglia della nota quando devi correggere molti campi insieme.
>
> - [[z.bases/Worldbuilding.base]]
> - [[z.bases/Luoghi.base]]
> - [[z.bases/Fazioni.base]]
> - [[z.bases/Missioni.base]]
> - [[z.bases/PNG.base]]
> - [[Risorse/Mappe/Schema Relazioni GDR.excalidraw]]





tab: Scheda

> [!infoboxwiki]- Identita Meccanica
> Classe: `=choice(this.classe, this.classe, "—")`
>
> Livello: `=this.livello`
>
> Bonus competenza: `=this.proficiency_bonus`
>
> Specie: `=choice(this.specie, this.specie, "—")`
>
> Sottospecie: `=choice(this.sottospecie, this.sottospecie, "—")`
>
> Background: `=choice(this.background, this.background, "—")`
>
> Allineamento: `INPUT[text:allineamento]`

## Punti ferita
```meta-bind-js-view
{punti_ferita.massimi} as maxHp
{punti_ferita.attuali} as hp
---
const str = `**Punti ferita**: ${context.bound.hp} / ${context.bound.maxHp} \`INPUT[slider(minValue(0), maxValue(${context.bound.maxHp})):punti_ferita.attuali]\``;
return engine.markdown.create(str);
```

```tabs
tab: Statistiche
| Statistica | Valore | Bonus | Bonus salvezza | Prof |
|:-:|:-:|:-:|:-:|:-:|

| Forza | `INPUT[number:caratteristiche.forza.stat]` | `VIEW[floor(({caratteristiche.forza.stat} - 10) / 2)]` | `VIEW[floor(({caratteristiche.forza.stat} - 10) / 2) + ({caratteristiche.forza.save_prof} * {proficiency_bonus})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):caratteristiche.forza.save_prof]` |

| Destrezza | `INPUT[number:caratteristiche.destrezza.stat]` | `VIEW[floor(({caratteristiche.destrezza.stat} - 10) / 2)]` | `VIEW[floor(({caratteristiche.destrezza.stat} - 10) / 2) + ({caratteristiche.destrezza.save_prof} * {proficiency_bonus})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):caratteristiche.destrezza.save_prof]` |

| Costituzione | `INPUT[number:caratteristiche.costituzione.stat]` | `VIEW[floor(({caratteristiche.costituzione.stat} - 10) / 2)]` | `VIEW[floor(({caratteristiche.costituzione.stat} - 10) / 2) + ({caratteristiche.costituzione.save_prof} * {proficiency_bonus})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):caratteristiche.costituzione.save_prof]` |

| Intelligenza | `INPUT[number:caratteristiche.intelligenza.stat]` | `VIEW[floor(({caratteristiche.intelligenza.stat} - 10) / 2)]` | `VIEW[floor(({caratteristiche.intelligenza.stat} - 10) / 2) + ({caratteristiche.intelligenza.save_prof} * {proficiency_bonus})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):caratteristiche.intelligenza.save_prof]` |

| Saggezza | `INPUT[number:caratteristiche.saggezza.stat]` | `VIEW[floor(({caratteristiche.saggezza.stat} - 10) / 2)]` | `VIEW[floor(({caratteristiche.saggezza.stat} - 10) / 2) + ({caratteristiche.saggezza.save_prof} * {proficiency_bonus})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):caratteristiche.saggezza.save_prof]` |

| Carisma | `INPUT[number:caratteristiche.carisma.stat]` | `VIEW[floor(({caratteristiche.carisma.stat} - 10) / 2)]` | `VIEW[floor(({caratteristiche.carisma.stat} - 10) / 2) + ({caratteristiche.carisma.save_prof} * {proficiency_bonus})]` | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):caratteristiche.carisma.save_prof]` |


tab: Abilita
| Abilita | Prof | Bonus |
|:-:|:-:|:-:|

| Acrobazia (Destrezza) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.acrobazia.prof]` | `VIEW[floor(({caratteristiche.destrezza.stat} - 10) / 2) + ({abilita.acrobazia.prof} * {proficiency_bonus})]` |

| Addestrare gli Animali (Saggezza) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.addestrare_animali.prof]` | `VIEW[floor(({caratteristiche.saggezza.stat} - 10) / 2) + ({abilita.addestrare_animali.prof} * {proficiency_bonus})]` |

| Arcano (Intelligenza) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.arcano.prof]` | `VIEW[floor(({caratteristiche.intelligenza.stat} - 10) / 2) + ({abilita.arcano.prof} * {proficiency_bonus})]` |

| Atletica (Forza) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.atletica.prof]` | `VIEW[floor(({caratteristiche.forza.stat} - 10) / 2) + ({abilita.atletica.prof} * {proficiency_bonus})]` |

| Inganno (Carisma) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.inganno.prof]` | `VIEW[floor(({caratteristiche.carisma.stat} - 10) / 2) + ({abilita.inganno.prof} * {proficiency_bonus})]` |

| Storia (Intelligenza) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.storia.prof]` | `VIEW[floor(({caratteristiche.intelligenza.stat} - 10) / 2) + ({abilita.storia.prof} * {proficiency_bonus})]` |

| Intuizione (Saggezza) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.intuizione.prof]` | `VIEW[floor(({caratteristiche.saggezza.stat} - 10) / 2) + ({abilita.intuizione.prof} * {proficiency_bonus})]` |

| Intimidire (Carisma) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.intimidire.prof]` | `VIEW[floor(({caratteristiche.carisma.stat} - 10) / 2) + ({abilita.intimidire.prof} * {proficiency_bonus})]` |

| Indagare (Intelligenza) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.indagare.prof]` | `VIEW[floor(({caratteristiche.intelligenza.stat} - 10) / 2) + ({abilita.indagare.prof} * {proficiency_bonus})]` |

| Medicina (Saggezza) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.medicina.prof]` | `VIEW[floor(({caratteristiche.saggezza.stat} - 10) / 2) + ({abilita.medicina.prof} * {proficiency_bonus})]` |

| Natura (Intelligenza) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.natura.prof]` | `VIEW[floor(({caratteristiche.intelligenza.stat} - 10) / 2) + ({abilita.natura.prof} * {proficiency_bonus})]` |

| Percezione (Saggezza) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.percezione.prof]` | `VIEW[floor(({caratteristiche.saggezza.stat} - 10) / 2) + ({abilita.percezione.prof} * {proficiency_bonus})]` |

| Intrattenere (Carisma) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.intrattenere.prof]` | `VIEW[floor(({caratteristiche.carisma.stat} - 10) / 2) + ({abilita.intrattenere.prof} * {proficiency_bonus})]` |

| Persuasione (Carisma) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.persuasione.prof]` | `VIEW[floor(({caratteristiche.carisma.stat} - 10) / 2) + ({abilita.persuasione.prof} * {proficiency_bonus})]` |

| Religione (Intelligenza) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.religione.prof]` | `VIEW[floor(({caratteristiche.intelligenza.stat} - 10) / 2) + ({abilita.religione.prof} * {proficiency_bonus})]` |

| Rapidità di Mano (Destrezza) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.rapidita_di_mano.prof]` | `VIEW[floor(({caratteristiche.destrezza.stat} - 10) / 2) + ({abilita.rapidita_di_mano.prof} * {proficiency_bonus})]` |

| Furtività (Destrezza) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.furtivita.prof]` | `VIEW[floor(({caratteristiche.destrezza.stat} - 10) / 2) + ({abilita.furtivita.prof} * {proficiency_bonus})]` |

| Sopravvivenza (Saggezza) | `INPUT[inlineSelect(option(0, "—"), option(1, "✓"), option(2, "★")):abilita.sopravvivenza.prof]` | `VIEW[floor(({caratteristiche.saggezza.stat} - 10) / 2) + ({abilita.sopravvivenza.prof} * {proficiency_bonus})]` |


tab: Talenti
`=join(this.talenti, ", ")`

tab: Tratti
`=join(this.tratti, ", ")`

tab: Addestramento
| Tipo | Valori |
|---|---|
| Armature | `=join(this.addestramento.armature, ", ")` |
| Armi | `=join(this.addestramento.armi, ", ")` |
```



tab: PNG

> [!scena] Persona Al Tavolo
> Motivazione: `INPUT[text:motivazione]`
>
> Atteggiamento: `INPUT[text:atteggiamento]`
>
> Luogo attuale:
> ```meta-bind
> INPUT[inlineListSuggester(optionQuery("Mondi/Luoghi"), useLinks(partial), allowOther):luoghi]
> ```
>
> Fazioni: `INPUT[fazioni][:fazioni]`
>
> Segreti rivelati: `INPUT[list:segreti_rivelati]`

> [!regia]- Stato PNG
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderM7FamilyCards(dv, dv.current(), "png");
> ```








tab: Controllo

> [!regia] Qualita Scheda
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderCreationFeedback(dv);
> ```


> [!timer] Impatto Sul Mondo
> ```dataviewjs
> const gdr = await eval(await app.vault.adapter.read("z.engine/session_views.js"));
> gdr.renderWorldImpact(dv);
> ```

````

## Fallback Markdown

| Blocco | Valore |
| --- | --- |
| Identita |  |
| Gancio |  |
| Uso al tavolo |  |
| Prossima mossa |  |
| Conseguenza potenziale |  |
| Connessioni |  |
| Entita impattate |  |
| Propaga a |  |

| Versione pubblica |  |
