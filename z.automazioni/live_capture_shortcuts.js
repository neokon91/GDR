function liveCaptureShortcut(options) {
    return async function runLiveCapture(tp) {
        return await tp.user.lore_capture(tp, {
            ...options,
            useActiveSession: true
        });
    };
}

module.exports = {
    liveCaptureShortcut
};
