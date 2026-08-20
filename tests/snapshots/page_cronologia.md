# 📜 Cronologia

*Il mondo nel tempo — eventi e linee di vita delle entità (📜 le tappe), per epoca.*

> [!example] Crea
> `BUTTON[crea-evento]`
> `BUTTON[crea-epoca]` — le **ere** che raggruppano gli eventi sulla linea del tempo

## 🕰 Linea del tempo
> [!tip] La nostra timeline (nastro qui sotto) si popola sola dagli eventi e dalle tappe. Per il **calendario navigabile** (mesi/ere, agenda dei datati): `BUTTON[apri-calendario]`
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTimeline");
```

### 🎭 Fili paralleli
> [!tip] Le **corsie** qui sotto mostrano la stessa cronologia per ATTORE — un filo per Fazione/PNG (dai campi *Fazioni*/*Coinvolti* degli eventi) e per le entità con *tappe*: «cosa fa ciascuno nel tempo».
```js-engine
return (await engine.importJs("z.automazioni/boot.mjs")).panel(engine, app, container, "renderTimelineCorsie");
```

## Tutte le voci
![[Cronologia.base]]
