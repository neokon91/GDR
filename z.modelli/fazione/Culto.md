<%*
const name = await tp.system.prompt("Nome della religione, divinità o culto");
const id = tp.user.helpers.slugify(name);
const title = tp.user.helpers.yamlQuote(name);
await tp.file.move(`Mondo/Religioni/${name}`);
tR += `---
id: ${id}
nome: ${title}
categoria: religione
tipo:
sottotipo:
stato: bozza
canonico: false
divinita: []
templi: []
fazioni: []
---
`;
%>
# `=this.nome`

>[!infobox|wiki]- Religione
> Tipo:
> `INPUT[text:tipo]`
>
> Sottotipo:
> `INPUT[inlineSelect(option(religione, Religione), option(culto, Culto), option(divinità, Divinità), option(entità, Entità)):sottotipo]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(archiviata, Archiviata)):stato]`
>
> Canonica:
> `INPUT[toggle:canonico]`

## Dottrina

> [!regola] Dottrina
> 

## Divinità o Entità

## Simboli

## Rituali

## Templi

`INPUT[inlineListSuggester(optionQuery("Mondo/Luoghi"), useLinks(partial)):templi]`

## Fazioni collegate

`INPUT[inlineListSuggester(optionQuery("Mondo/Fazioni"), useLinks(partial)):fazioni]`

## Segreti

> [!segreto]- Segreti
> 
