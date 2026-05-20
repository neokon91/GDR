<%*
const wb = await tp.user.worldbuilding(tp);
await wb.chooseCreative("religione");
const includePath = String.fromCharCode(91, 91) + wb.getCreativeTemplate() + String.fromCharCode(93, 93);
tR += await tp.file.include(includePath);
%>
