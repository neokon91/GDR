<%*
const wb = await tp.user.worldbuilding(tp);

const { category, subtype } = await wb.chooseLocation();

const templatePath = wb.getLocationTemplate(category, subtype);

tp.config.extra = {
  category,
  subtype
};

const includePath = String.fromCharCode(91, 91) + templatePath + String.fromCharCode(93, 93);
tR += await tp.file.include(includePath);
%>
