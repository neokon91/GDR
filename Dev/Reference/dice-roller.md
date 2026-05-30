# Reference: Dice Roller (`obsidian-dice-roller`)

Doc: https://plugins.javalent.com/dice

## Inline
`` `dice: 1d20` `` — tiro base. `` `dice: 1d20+5` ``, `` `dice: 4d6` ``.
Modificatori: keep highest/lowest `4d6kh3` / `2d20kl1`, esplosivi `1d6!`, reroll `1d6r1`,
min/max `1d20mi2`, `1d20ma19`.
Condizioni/medie: `` `dice: 1d20|avg` ``, `` `dice: 1d20|noform` `` (solo risultato).

## Da tabelle / note
`` `dice: [[Tabella Incontri]]` `` — pesca da una nota/tabella.
`` `dice-mod: 1d20` `` — risultato modificabile (ritirabile).

## Note pipeline
Plugin installato in dist/GDR-vault → `` `dice:` `` rende. Usato nei template
incontro/sessione per tiri rapidi al tavolo.
