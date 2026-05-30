async function live_conseguenza(tp) {
    return await tp.user.lore_capture(tp, {
        tipo: "conseguenza",
        defaultName: "Conseguenza emersa",
        useActiveSession: true
    });
}

module.exports = live_conseguenza;
