<%*
const helpers = tp.user.helpers;

const selected = await helpers.chooseRequired(
  tp,
  [
    { label: "Fazione generica", id: "fazione", template: "z.modelli/fazione/Fazione", tipo: "" },
    { label: "Gilda", id: "gilda", template: "z.modelli/fazione/Gilda", tipo: "gilda" },
    { label: "Confraternita", id: "confraternita", template: "z.modelli/fazione/Confraternita", tipo: "confraternita" },
    { label: "Culto politico", id: "culto politico", template: "z.modelli/fazione/Fazione", tipo: "culto politico" }
  ],
  "Che tipo di fazione vuoi creare?"
);

helpers.setRoute({
  tipoFazione: selected.tipo
});

const includePath = String.fromCharCode(91, 91) + selected.template + String.fromCharCode(93, 93);
tR += await tp.file.include(includePath);
%>
