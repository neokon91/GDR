<%*
const name = await tp.system.prompt("Nome dell'oggetto");
const id = tp.user.helpers.slugify(name);
const title = tp.user.helpers.yamlQuote(name);
await tp.file.move(`Mondo/Oggetti/${name}`);
tR += `---
id: ${id}
nome: ${title}
categoria: oggetto
tipo:
rarita:
stato: bozza
canonico: false
proprietario:
luogo:
---
`;
%>
# `=this.nome`

>[!infobox|wiki]- Oggetto
> Tipo:
> `INPUT[text:tipo]`
>
> Rarità:
> `INPUT[inlineSelect(option(comune, Comune), option(non comune, Non Comune), option(raro, Raro), option(molto raro, Molto Raro), option(leggendario, Leggendario), option(artefatto, Artefatto)):rarita]`
>
> Stato:
> `INPUT[inlineSelect(option(bozza, Bozza), option(pronto, Pronto), option(in gioco, In Gioco), option(consegnato, Consegnato), option(archiviata, Archiviata)):stato]`
>
> Canonico:
> `INPUT[toggle:canonico]`
>
> Proprietario:
> `INPUT[suggester(optionQuery("Mondo/Personaggi"), useLinks(partial), allowOther):proprietario]`
>
> Luogo:
> `INPUT[suggester(optionQuery("Mondo/Luoghi"), useLinks(partial), allowOther):luogo]`

> [!tesoro] Descrizione
> 

## Proprietà

> [!regola] Proprietà
> 

## Storia

> [!indizio] Storia
> 

## Proprietario

`INPUT[suggester(optionQuery("Mondo/Personaggi"), useLinks(partial), allowOther):proprietario]`

## Luogo

`INPUT[suggester(optionQuery("Mondo/Luoghi"), useLinks(partial), allowOther):luogo]`

## Segreti

> [!segreto]- Segreti
> 
