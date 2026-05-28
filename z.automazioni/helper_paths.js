const PATHS = {
    campagne: "Campagne",
    creature: "Mondi/Creature",
    dispense: "Mondi/Dispense",
    fazioni: "Mondi/Fazioni",
    incontri: "Mondi/Incontri",
    luoghi: "Mondi/Luoghi",
    missioni: "Mondi/Missioni",
    mondi: "Mondi",
    oggetti: "Mondi/Oggetti",
    personaggi: "Mondi/Personaggi",
    religioni: "Mondi/Religioni",
    societa: "Mondi/Societa",
    relazioni: "Mondi/Relazioni",
    sessioni: "Mondi/Sessioni",
    mappe: "Risorse/Mappe",
    audio: "Risorse/Audio",
    immagini: "Risorse/Immagini",
    video: "Risorse/Video",
    culture: "Mondi/Culture",
    lingue: "Mondi/Lingue",
    storia: "Mondi/Storia",
    conflitti: "Mondi/Conflitti",
    cosmologia: "Mondi/Cosmologia",
    tracciati: "Mondi/Tracciati",
    rotte: "Mondi/Rotte",
    risorse_mondo: "Mondi/Risorse",
    mercati: "Mondi/Mercati",
    compendium: "Mondi/Compendium",
    calendario_diegetico: "Mondi/Calendario Diegetico"
};

function path(key) {
    return PATHS[key] ?? key;
}

module.exports = {
    PATHS,
    path
};
