async function live_png(tp) {
    return await tp.user.lore_capture(tp, {
        tipo: "png improvvisato",
        defaultName: "PNG improvvisato",
        useActiveSession: true
    });
}

module.exports = live_png;
