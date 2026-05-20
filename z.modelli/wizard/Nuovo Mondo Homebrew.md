<% await tp.user.nuovo_mondo_homebrew(tp) %>
# `=this.nome`

> [!scena] Promessa
> `=this.premessa`

> [!regia] Tono, Scala E Conflitto
> Tono: `=this.tono`
>
> Scala iniziale: `=this.scala`
>
> Magia: `=this.magia`
>
> Conflitto centrale: `=this.conflitto_centrale`

## Codex In 6 Blocchi

| Blocco | Stato |
| --- | --- |
| Identita | `=this.gancio` |
| Tono | `=this.tono` |
| Luoghi fondativi | `=this.luoghi_iconici` |
| Poteri fondativi | `=this.fazioni_principali` |
| Culture fondative | `=this.culture_fondative` |
| Mistero e pressione | `=this.misteri_pubblici` / `=this.pressione_iniziale` |

## Spina Dorsale Del Mondo

### Luoghi

`=this.luoghi_iconici`

### Poteri

`=this.fazioni_principali`

### Culture

`=this.culture_fondative`

### Mistero

`=this.misteri_pubblici`

### Pressione

`=this.pressione_iniziale`

## Cosa Manca Per Diventare Giocabile

```dataviewjs
const current = dv.current();
const ok = value => Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
const checks = [
  ["identita", current.gancio],
  ["luoghi", current.luoghi_iconici],
  ["poteri", current.fazioni_principali],
  ["culture", current.culture_fondative],
  ["mistero", current.misteri_pubblici],
  ["pressione", current.pressione_iniziale],
  ["materiale pubblico", current.materiale_pubblico],
  ["prima missione", current.campagne]
];
const missing = checks.filter(([, value]) => !ok(value)).map(([label]) => label);
dv.paragraph(missing.length ? `Manca: ${missing.join(", ")}.` : "Il mondo e pronto per generare campagna, avventura o sessione.");
```

## Prossime Entita Consigliate

`=this.prossime_entita_consigliate`

`BUTTON[wizard-nuova-entita-viva]`

`BUTTON[atlante-del-mondo-atlante-del-mondo]`
