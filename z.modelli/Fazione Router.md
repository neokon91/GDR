<%*
const name = await tp.system.prompt("Nome della fazione");
const id = tp.user.helpers.slugify(name);
const title = tp.user.helpers.yamlQuote(name);
await tp.file.move(`Mondo/Fazioni/${name}`);
tR += `---
id: ${id}
nome: ${title}
categoria: fazione
tipo:
stato: bozza
canonico: false
leader: []
luoghi: []
alleati: []
nemici: []
---
`;
%>
# `=this.nome`

>[!infobox|wiki]- Fazione
> Tipo:
> `INPUT[text:tipo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(archiviata, Archiviata)):stato]`
>
> Canonica:
> `INPUT[toggle:canonico]`
>
> Leader:
> `INPUT[inlineListSuggester(optionQuery("Mondo/Personaggi"), useLinks(partial)):leader]`
>
> Luoghi:
> `INPUT[inlineListSuggester(optionQuery("Mondo/Luoghi"), useLinks(partial)):luoghi]`

## Identità

> [!scena] Identità pubblica
> 

## Obiettivi

> [!missione] Obiettivi
> 

## Leader

`INPUT[inlineListSuggester(optionQuery("Mondo/Personaggi"), useLinks(partial)):leader]`

## Luoghi controllati

`INPUT[inlineListSuggester(optionQuery("Mondo/Luoghi"), useLinks(partial)):luoghi]`

## Alleati

`INPUT[inlineListSuggester(optionQuery("Mondo/Fazioni"), useLinks(partial)):alleati]`

## Nemici

`INPUT[inlineListSuggester(optionQuery("Mondo/Fazioni"), useLinks(partial)):nemici]`

## Segreti

> [!segreto]- Segreti
> 
