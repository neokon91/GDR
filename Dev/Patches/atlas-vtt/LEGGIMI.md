# Patch ad Atlas VTT (non applicate)

Modifiche al codice di Atlas VTT scritte e provate per il nostro uso, **non applicate al vault**
(che include Atlas non modificato, `Dev/Source/YAML/plugins.yaml`) e **non inviate** al progetto
(deciso ott 2026). Sono codice derivato da Atlas VTT, quindi sotto la sua licenza, AGPL-3.0
(non la MIT di questo repo).

## `0001-link-senza-fantasy-statblocks.patch`

Senza Fantasy Statblocks la finestra «Link Statblock» di Atlas non elenca nessuna nota, benché
un token collegato funzioni già senza quel plugin (nome e PF dal frontmatter della nota). La
patch le fa elencare le note-statblock del vault (`statblock: true` nel frontmatter, o un blocco
statblock), come già fa per quelle che Fantasy Statblocks non ha letto; l'anteprima resta del
plugin. Con le pagine mostro dell'SRD, che sono note-statblock, i token si collegherebbero
senza Fantasy Statblocks.

Scritta sul branch `beta` di Atlas dopo la 0.7.0 (base `24eaf327`). Provata lì: typecheck, lint
e build puliti, suite unitaria intera verde (7035 test, 2 saltati; due test nuovi). Non provata a
mano in Obsidian. Per applicarla a un checkout di Atlas:
`git am < 0001-link-senza-fantasy-statblocks.patch`. Il testo russo del messaggio nuovo va
rivisto da un madrelingua.
