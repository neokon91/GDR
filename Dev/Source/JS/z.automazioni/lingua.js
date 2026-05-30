async function lingua(tp) {
    const helpers = tp.user.helpers;
    const name = await helpers.promptRequired(tp, "Nome della lingua");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, "Vuoi compilare suono, registri e storia della lingua ora? Scegli No per una lingua rapida.");
    const mondo = await helpers.chooseWorld(tp, "Mondo della lingua");
    const luoghi = creazioneCompleta ? await helpers.chooseLocations(tp, "Dove si parla", { world: mondo }) : [];
    const origine = await helpers.promptOptional(tp, "Origine o famiglia linguistica");
    const uso = await helpers.promptOptional(tp, "Dove si usa al tavolo");
    const suono = creazioneCompleta ? await helpers.promptOptional(tp, "Suono, ritmo o gesto riconoscibile") : "";
    const registro = creazioneCompleta ? await helpers.promptOptional(tp, "Registro sociale o uso formale") : "";
    const modoDiDire = creazioneCompleta ? await helpers.promptOptional(tp, "Modo di dire tipico") : "";
    const concetto = creazioneCompleta ? await helpers.promptOptional(tp, "Concetto difficile da tradurre") : "";

    await helpers.moveNote(tp, helpers.path("lingue"), name);

    return await helpers.renderFrontmatter("lingua", {
        id: id,
        nome: helpers.yamlQuote(name),
        categoria: 'lingua',
        tipo: 'lingua',
        stato: 'bozza',
        canonico: 'false',
        mondo: mondo,
        culture: '[]',
        luoghi: helpers.inlineYamlList(luoghi),
        origine: helpers.yamlQuote(origine),
        usi: helpers.inlineYamlTextList([uso]),
        alfabeto: "",
        parole_note: '[]',
        suono_ritmo_gesti: helpers.inlineYamlTextList([suono]),
        parlanti_esclusi: '[]',
        registri: helpers.inlineYamlTextList([registro]),
        scrittura_supporti: '[]',
        modi_di_dire: helpers.inlineYamlTextList([modoDiDire]),
        concetti_intraduicibili: helpers.inlineYamlTextList([concetto]),
        origine_evoluzione: helpers.inlineYamlTextList([origine]),
        prestiti_linguistici: '[]',
        indizi_linguistici: '[]',
        conflitti_linguistici: '[]',
        segreti: '[]'
    });
}

module.exports = lingua;
