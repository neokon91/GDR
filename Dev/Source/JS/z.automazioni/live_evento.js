async function live_evento(tp) {
    return await tp.user.lore_capture(tp, {
        tipo: "evento",
        defaultName: "Evento live",
        useActiveSession: true
    });
}

module.exports = live_evento;
