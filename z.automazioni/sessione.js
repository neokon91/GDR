async function sessione(tp) {
    const helpers = tp.user.helpers;
    const titolo = await helpers.promptRequired(tp, "Titolo della sessione", "Sessione");
    const data = await helpers.promptOptional(tp, "Data", tp.date.now("YYYY-MM-DD")) || tp.date.now("YYYY-MM-DD");
    const id = helpers.slugify(`${data}-${titolo}`);
    const creazioneCompleta = await helpers.askYesNo(tp, "Vuoi collegare subito cast, luoghi, materiali e media? Scegli No per una sessione rapida.");
    const mondo = await helpers.chooseWorld(tp, "Mondo della sessione");
    const context = { world: mondo };
    const selectedType = await helpers.chooseOptional(
        tp,
        [
            { label: "Sessione di campagna", id: "sessione di campagna" },
            { label: "Sessione zero", id: "sessione zero" },
            { label: "Interludio", id: "interludio" },
            { label: "Downtime", id: "downtime" },
            { label: "Finale", id: "finale" },
            { label: "One-shot", id: "one-shot" }
        ],
        "Tipo di sessione"
    );
    const obiettivo = await helpers.promptOptional(tp, "Obiettivo della sessione");
    const campagne = creazioneCompleta ? await helpers.chooseCampaigns(tp, "Campagne collegate", context) : [];
    const luoghi = creazioneCompleta ? await helpers.chooseLocations(tp, "Luoghi in scena", context) : [];
    const personaggi = creazioneCompleta ? await helpers.choosePeople(tp, "Personaggi in scena", context) : [];
    const missioni = creazioneCompleta ? await helpers.chooseMissions(tp, "Missioni vive", context) : [];
    const tracciati = creazioneCompleta ? await helpers.chooseTracks(tp, "Clock e tracciati attivi", context) : [];
    const creature = creazioneCompleta ? await helpers.chooseCreatures(tp, "Creature in scena", context) : [];
    const incontri = creazioneCompleta ? await helpers.chooseEncounters(tp, "Incontri previsti", context) : [];
    const dispense = creazioneCompleta ? await helpers.chooseHandouts(tp, "Dispense previste", context) : [];
    const mappe = creazioneCompleta ? await helpers.chooseMaps(tp, "Mappe previste", context) : [];
    const audio = creazioneCompleta ? await helpers.chooseAudio(tp, "Audio previsti", context) : [];
    const immagini = creazioneCompleta ? await helpers.chooseImages(tp, "Immagini previste", context) : [];
    const video = creazioneCompleta ? await helpers.chooseVideos(tp, "Video previsti", context) : [];
    const fazioni = creazioneCompleta ? await helpers.chooseFactions(tp, "Fazioni in scena", context) : [];
    const oggetti = creazioneCompleta ? await helpers.chooseObjects(tp, "Oggetti in scena", context) : [];

    await helpers.moveNote(tp, helpers.path("sessioni"), `${data} - ${titolo}`);

    return `---
id: ${id}
nome: ${helpers.yamlQuote(titolo)}
cssclasses:
  - tavolo
categoria: sessione
fileClass: sessione
tipo: ${selectedType?.id ?? ""}
data: ${data}
data_mondo:
fc-calendar:
fc-date:
fc-category: sessione
fc-display-name: ${helpers.yamlQuote(titolo)}
fc-end:
stato: preparazione
attiva: false
mondo: ${mondo}
campagne: ${helpers.inlineYamlList(campagne)}
luoghi: ${helpers.inlineYamlList(luoghi)}
personaggi: ${helpers.inlineYamlList(personaggi)}
missioni: ${helpers.inlineYamlList(missioni)}
tracciati: ${helpers.inlineYamlList(tracciati)}
creature: ${helpers.inlineYamlList(creature)}
incontri: ${helpers.inlineYamlList(incontri)}
dispense: ${helpers.inlineYamlList(dispense)}
mappe: ${helpers.inlineYamlList(mappe)}
audio: ${helpers.inlineYamlList(audio)}
immagini: ${helpers.inlineYamlList(immagini)}
video: ${helpers.inlineYamlList(video)}
fazioni: ${helpers.inlineYamlList(fazioni)}
oggetti: ${helpers.inlineYamlList(oggetti)}
appunti_live: []
obiettivo: ${helpers.yamlQuote(obiettivo)}
scene: []
ricompense: []
segreti_rivelabili: []
domande_al_tavolo: []
decisioni_attese: []
pressioni: []
conseguenze: []
---
`;
}

module.exports = sessione;
