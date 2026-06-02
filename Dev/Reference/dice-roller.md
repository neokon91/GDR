# Reference: Dice Roller (`obsidian-dice-roller`)

Versione vault: **v11.4.2**. Doc: https://plugins.javalent.com/dice · Repo: https://github.com/javalent/dice-roller (ex `valentine195`)

## Inline
`` `dice: 1d20` `` — tiro base. `` `dice: 1d20+5` ``, `` `dice: 4d6` ``.
Modificatori: keep highest/lowest `4d6kh3` / `2d20kl1`, esplosivi `1d6!`, reroll `1d6r1`,
min/max `1d20mi2`, `1d20ma19`.
Condizioni/medie: `` `dice: 1d20|avg` ``, `` `dice: 1d20|noform` `` (solo risultato).

## Da tabelle / note
`` `dice: [[Tabella Incontri]]` `` — pesca da una nota/tabella.
`` `dice-mod: 1d20` `` — risultato modificabile (ritirabile).

## Note pipeline
Plugin installato in dist/GDR-vault → `` `dice:` `` rende. Usi nel vault:
- **Scheda PG** (`_macros.j2:scheda_pg_rules`): tiri col **bonus reale** che leggono i campi
  dal frontmatter — prova `` `dice: 1d20 + mod_<car>` ``, TS `` `+ ts_<car> * competenza` ``,
  abilità `` `+ prof_<id> * competenza` ``, iniziativa, TS contro morte. `crea_pg` seeda
  `mod_<car>` (✅ **verificato in-app**: DR risolve i campi dal frontmatter — tooltip
  «1d20 + mod_forza [15] + 3»).
- **Incontro/sessione**: macro `tiri()` (d20 normale/vantaggio/svantaggio).
- **Liste di consultazione richiamabili**: `` `dice: [[Nota]]` `` **incorpora** inline una
  nota-elenco dove serve (es. «Incontri delle Marche» nel mondo-esempio) — tabella di
  riferimento al tavolo. ⚠️ *Verificato in-app*: una nota-lista mista NON pesca una singola
  voce (mostra l'intero elenco); il tiro casuale di UNA riga richiede il **formato tabella**
  di Dice Roller (da approfondire). I tiri `dice:` sono strumenti del DM: `build_site` li
  **strippa** dal sito dei giocatori.
