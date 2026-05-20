<%*
const wb = await tp.user.worldbuilding(tp);

await wb.chooseLocation();

const templatePath = wb.getCreativeTemplate();

const includePath = String.fromCharCode(91, 91) + templatePath + String.fromCharCode(93, 93);
tR += await tp.file.include(includePath);
%>
