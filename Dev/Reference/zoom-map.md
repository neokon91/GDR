# Reference: TTRPG Tools - Maps (`zoom-map`)

Versione vault: **v2.0.2** (Jareika). Plugin id: `zoom-map` · nome: "TTRPG Tools - Maps".

> **Stato: installato, NON ancora cablato.** Candidato per **mappe interattive** del mondo
> (roadmap Worldbuilder #4) — alternativa "image + pin" a Excalidraw (disegno libero).

## Cos'è
Toolbox per **mappe fantasy interattive**: parte da un'immagine (mappa del mondo/regione),
permette zoom/pan e **pin/marker** collegati a note. Pensato per TTRPG.

## Uso (da verificare in-app)
Tipicamente un **code-block** che punta a un'immagine nel vault, con marker posizionati su
coordinate. La sintassi esatta del blocco e dei marker va **verificata sulla v2.0**
(documentazione del plugin) prima di generarla dalla pipeline — qui non è ancora usata.

## Aggancio previsto (roadmap #4)
- Una mappa per `mondo`/`luogo` da un'immagine caricata; i **pin** linkano alle note
  `luogo` collegate → atlante navigabile coerente con le relazioni tipizzate.
- Decidere **Zoom Map vs Excalidraw**: immagine+pin (questo) per mappe "reali"/raster;
  Excalidraw per schizzi vettoriali e dungeon.

## ⚠️ Gotcha
- Dipende da un'**immagine sorgente** nel vault (asset binario) → gestire dove vivono gli
  asset mappa.
- Plugin di nicchia: schema/sintassi **non garantiti stabili**; non automatizzare finché
  non confermato in-app. Senza il plugin il blocco non rende.
