<% await tp.user.creatura(tp) %>
# `=this.name`
>[!infobox|wiki wfull]
>{img.placeholder}
>**Nome**: `=this.name`
>**Tipo**: `=this.type`
>**Dimensione**: `=this.size`
>**Allineamento**: `=this.alignment`
>**Habitat**: `=this.habitat`
>**Stato**: `=this.stato`
>
>Stato:
>`INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(archiviata, Archiviata)):stato]`

---
### Statblock 5e
```dataviewjs
const creature = dv.current().name
dv.paragraph(`
\`\`\`statblock
monster: ${creature}
\`\`\`
`)
```

## Descrizione

> [!incontro] Descrizione
> 

## Ecologia

> [!luogo] Ecologia
> 

## Tattiche

> [!pericolo] Tattiche
> 
