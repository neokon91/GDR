async function live_luogo(tp) {
    return await tp.user.lore_capture(tp, {
        tipo: "luogo improvvisato",
        defaultName: "Luogo improvvisato",
        useActiveSession: true
    });
}

module.exports = live_luogo;
