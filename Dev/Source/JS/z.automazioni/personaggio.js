async function personaggio(tp) {
    const helpers = tp.user.helpers;
    const profile = await helpers.runtimeProfile("personaggio");
    const prompts = profile.prompts ?? {};
    const name = await helpers.promptRequired(tp, profile.name_prompt ?? "Nome del personaggio");
    const id = helpers.slugify(name);

    const acDefault = profile.armor_class_default ?? "10";
    const hpDefault = profile.hit_points_default ?? "4";
    const hitDiceDefault = profile.hit_dice_default ?? "1d8";
    const speedDefault = profile.speed_default ?? "9 m.";
    const crDefault = profile.challenge_rating_default ?? "0";
    const statsDefault = profile.ability_scores_default ?? "10 10 10 10 10 10";
    const role = await helpers.promptOptional(tp, prompts.ruolo ?? "Ruolo o professione");
    const allineamento = await helpers.promptOptional(tp, prompts.allineamento ?? "Allineamento");
    const ac = await helpers.promptOptional(tp, prompts.ac ?? "Classe Armatura", acDefault) || acDefault;
    const hp = await helpers.promptOptional(tp, prompts.hp ?? "Punti Ferita", hpDefault) || hpDefault;
    const hitDice = await helpers.promptOptional(tp, prompts.hit_dice ?? "Dadi Vita", hitDiceDefault) || hitDiceDefault;
    const speed = await helpers.promptOptional(tp, prompts.speed ?? "Velocità", speedDefault) || speedDefault;
    const cr = await helpers.promptOptional(tp, prompts.cr ?? "Grado di Sfida", crDefault) || crDefault;
    const stats = await helpers.promptOptional(tp, prompts.stats ?? "Caratteristiche D&D: FOR DES COS INT SAG CAR", statsDefault);
    const stato = await helpers.chooseOptional(
        tp,
        profile.status_options ?? [],
        profile.status_prompt ?? "Stato del personaggio"
    );
    const mondo = await helpers.chooseWorld(tp, profile.world_prompt ?? "Mondo del personaggio");
    const context = { world: mondo };
    const luogo = await helpers.chooseLocation(tp, prompts.luogo ?? "Luogo del personaggio", context);
    const fazioni = await helpers.chooseFactions(tp, prompts.fazioni ?? "Fazioni del personaggio", context);
    const relazioni = await helpers.choosePeople(tp, prompts.relazioni ?? "Relazioni del personaggio", context);
    const missioni = await helpers.chooseMissions(tp, prompts.missioni ?? "Missioni collegate al personaggio", context);
    const vuole = await helpers.promptOptional(tp, prompts.vuole ?? "Cosa vuole");
    const sa = await helpers.promptOptional(tp, prompts.sa ?? "Cosa sa di utile");
    const gancio = await helpers.promptOptional(tp, prompts.gancio ?? "Gancio giocabile: perche entra in scena ora?");
    const playerSafe = await helpers.promptOptional(tp, prompts.player_safe ?? "Versione player-safe mostrabile");
    const segreto = await helpers.promptOptional(tp, prompts.segreto ?? "Segreto o contraddizione");
    const leva = await helpers.promptOptional(tp, prompts.leva ?? "Leva per coinvolgerlo al tavolo");
    const domandaAperta = await helpers.promptOptional(tp, prompts.domanda_aperta ?? "Domanda aperta sul personaggio");
    const connessioni = await helpers.chooseConnections(tp, profile.connection_prompt ?? "Connessioni vive del personaggio", context);

    const created = await helpers.moveNote(tp, helpers.path("personaggi"), name);
    await helpers.linkCreatedNoteToConnections(created, connessioni);

    return await helpers.renderFrontmatter("personaggio", {
        id,
        nome: helpers.yamlQuote(name),
        ruolo: helpers.yamlQuote(role),
        allineamento: helpers.yamlQuote(allineamento),
        stato: stato?.id ?? "bozza",
        mondo,
        fazioni: helpers.inlineYamlList(fazioni),
        luogo,
        relazioni: helpers.inlineYamlList(relazioni),
        missioni: helpers.inlineYamlList(missioni),
        vuole: helpers.yamlQuote(vuole),
        sa: helpers.yamlQuote(sa),
        leva: helpers.yamlQuote(leva),
        gancio: helpers.yamlQuote(gancio),
        uso_al_tavolo: helpers.yamlQuote(leva || vuole),
        player_safe: helpers.yamlQuote(playerSafe),
        segreto: helpers.yamlQuote(segreto),
        domande_aperte: helpers.inlineYamlTextList([domandaAperta]),
        connessioni: helpers.inlineYamlList(connessioni),
        ac: helpers.yamlNumber(ac) || 10,
        hp: helpers.yamlNumber(hp) || 4,
        hit_dice: helpers.yamlQuote(hitDice),
        speed: helpers.yamlQuote(speed),
        cr: helpers.yamlQuote(cr),
        stats: helpers.abilityArray(stats)
    });
}

module.exports = personaggio;
