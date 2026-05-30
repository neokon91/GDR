async function png(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("png");
    const prompts = profile.prompts ?? {};
    const activeContext = helpers.getActiveSessionContext();
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome del PNG");
    const id = helpers.slugify(name);
    const creazioneCompleta = await helpers.askYesNo(tp, profile.completion_prompt ?? "Vuoi compilare collegamenti, statblock e dettagli ora? Scegli No per una scheda rapida.");
    const role = await helpers.promptOptional(tp, prompts.ruolo ?? "Ruolo o professione");
    const atteggiamento = await helpers.promptOptional(tp, prompts.atteggiamento ?? "Atteggiamento iniziale");
    const stato = await helpers.chooseOptional(
        tp,
        profile.status_options ?? [],
        profile.status_prompt ?? "Stato del PNG"
    );
    const mondo = await helpers.chooseWorld(tp, profile.world_prompt ?? "Mondo del PNG");
    const context = { world: mondo };
    const vuole = await helpers.promptOptional(tp, prompts.vuole ?? "Cosa vuole");
    const sa = await helpers.promptOptional(tp, prompts.sa ?? "Cosa sa di utile");
    const segreto = await helpers.promptOptional(tp, prompts.segreto ?? "Segreto o contraddizione");
    const leva = await helpers.promptOptional(tp, prompts.leva ?? "Leva per coinvolgerlo al tavolo");
    const luogo = creazioneCompleta ? await helpers.chooseLocation(tp, prompts.luogo ?? "Luogo del PNG", context) : "";
    const fazioni = creazioneCompleta ? await helpers.chooseFactions(tp, prompts.fazioni ?? "Fazioni del PNG", context) : [];
    const relazioni = creazioneCompleta ? await helpers.choosePeople(tp, prompts.relazioni ?? "Relazioni del PNG", context) : [];
    const missioni = creazioneCompleta ? await helpers.chooseMissions(tp, prompts.missioni ?? "Missioni collegate al PNG", context) : [];
    const domandaAperta = creazioneCompleta ? await helpers.promptOptional(tp, prompts.domanda_aperta ?? "Domanda aperta sul PNG") : "";
    const acDefault = profile.armor_class_default ?? "10";
    const hpDefault = profile.hit_points_default ?? "4";
    const hitDiceDefault = profile.hit_dice_default ?? "1d8";
    const speedDefault = profile.speed_default ?? "9 m.";
    const crDefault = profile.challenge_rating_default ?? "0";
    const statsDefault = profile.ability_scores_default ?? "10 10 10 10 10 10";
    const ac = creazioneCompleta ? await helpers.promptOptional(tp, prompts.ac ?? "Classe Armatura", acDefault) || acDefault : acDefault;
    const hp = creazioneCompleta ? await helpers.promptOptional(tp, prompts.hp ?? "Punti Ferita", hpDefault) || hpDefault : hpDefault;
    const hitDice = creazioneCompleta ? await helpers.promptOptional(tp, prompts.hit_dice ?? "Dadi Vita", hitDiceDefault) || hitDiceDefault : hitDiceDefault;
    const speed = creazioneCompleta ? await helpers.promptOptional(tp, prompts.speed ?? "Velocità", speedDefault) || speedDefault : speedDefault;
    const cr = creazioneCompleta ? await helpers.promptOptional(tp, prompts.cr ?? "Grado di Sfida", crDefault) || crDefault : crDefault;
    const stats = creazioneCompleta ? await helpers.promptOptional(tp, prompts.stats ?? "Caratteristiche D&D: FOR DES COS INT SAG CAR", statsDefault) : statsDefault;
    const connessioni = await helpers.chooseConnections(tp, profile.connection_prompt ?? "Connessioni vive del PNG", context);

    const sessioni = activeContext.link ? [activeContext.link] : [];
    const created = await helpers.moveNote(tp, helpers.path("personaggi"), name);
    // Un PNG creato durante la sessione entra subito nel cast attivo.
    await helpers.linkCreatedNoteToActiveSession(created, { sessionField: "personaggi" });
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return await helpers.renderFrontmatter("png", {
        id,
        nome: helpers.yamlQuote(name),
        ruolo: helpers.yamlQuote(role),
        stato: stato?.id ?? "bozza",
        mondo,
        luogo,
        fazioni: helpers.inlineYamlList(fazioni),
        relazioni: helpers.inlineYamlList(relazioni),
        missioni: helpers.inlineYamlList(missioni),
        sessioni: helpers.inlineYamlList(sessioni),
        connessioni: helpers.inlineYamlList(connessioni),
        vuole: helpers.yamlQuote(vuole),
        sa: helpers.yamlQuote(sa),
        leva: helpers.yamlQuote(leva),
        segreto: helpers.yamlQuote(segreto),
        domande_aperte: helpers.inlineYamlTextList([domandaAperta]),
        atteggiamento: helpers.yamlQuote(atteggiamento),
        ac: helpers.yamlNumber(ac) || 10,
        hp: helpers.yamlNumber(hp) || 4,
        hit_dice: helpers.yamlQuote(hitDice),
        speed: helpers.yamlQuote(speed),
        cr: helpers.yamlQuote(cr),
        stats: helpers.abilityArray(stats)
    });
}

module.exports = png;
