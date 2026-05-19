<%*
const dm = await tp.user.dm(tp);

const contentType = await dm.chooseContent();
const templatePath = dm.getContentTemplate(contentType);

tp.user.helpers.setRoute({
  contentType
});

const includePath = String.fromCharCode(91, 91) + templatePath + String.fromCharCode(93, 93);
tR += await tp.file.include(includePath);
%>
