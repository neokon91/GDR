function compact(value) {
    return String(value ?? "").replace(/\s+/g, " ").slice(0, 900);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForPageTarget(port, options = {}) {
    const timeoutMs = options.timeoutMs ?? 45000;
    const acceptPrompts = options.acceptPrompts ?? null;
    const deadline = Date.now() + timeoutMs;
    let lastError = "";

    while (Date.now() < deadline) {
        if (acceptPrompts) acceptPrompts();
        try {
            const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
            const page = targets.find(target => target.type === "page" && /vault-gdr-clean|Obsidian/.test(target.title ?? ""));
            if (page?.webSocketDebuggerUrl) return page;
        } catch (error) {
            lastError = error.message;
        }
        await sleep(750);
    }

    throw new Error(`target DevTools Obsidian non trovato sulla porta ${port}${lastError ? ` (${lastError})` : ""}`);
}

function cdpClient(wsUrl) {
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    const events = [];

    function send(method, params = {}, timeoutMs = 30000) {
        const id = ++seq;
        ws.send(JSON.stringify({ id, method, params }));
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`timeout CDP ${method}`)), timeoutMs);
            pending.set(id, { resolve, reject, timer, method });
        });
    }

    ws.onmessage = event => {
        const msg = JSON.parse(event.data);
        if (msg.id && pending.has(msg.id)) {
            const item = pending.get(msg.id);
            pending.delete(msg.id);
            clearTimeout(item.timer);
            if (msg.error) item.reject(new Error(`${item.method}: ${msg.error.message}`));
            else item.resolve(msg.result);
            return;
        }
        if (msg.method === "Runtime.exceptionThrown") {
            const details = msg.params.exceptionDetails ?? {};
            const stack = details.stackTrace?.callFrames
                ?.slice(0, 5)
                ?.map(frame => `${frame.functionName || "<anon>"} ${frame.url || ""}:${frame.lineNumber}:${frame.columnNumber}`)
                ?.join(" | ");
            events.push({
                type: "exception",
                text: compact(details.exception?.description || details.exception?.value || details.text),
                url: details.url ?? "",
                line: details.lineNumber ?? null,
                column: details.columnNumber ?? null,
                stack: compact(stack)
            });
        }
        if (msg.method === "Runtime.consoleAPICalled") {
            const level = msg.params.type;
            if (["error", "warning", "assert"].includes(level)) {
                events.push({ type: `console:${level}`, text: msg.params.args.map(arg => compact(arg.value ?? arg.description)).join(" | ") });
            }
        }
        if (msg.method === "Log.entryAdded") {
            const entry = msg.params.entry;
            if (["error", "warning"].includes(entry.level)) {
                events.push({ type: `log:${entry.level}`, text: compact(entry.text) });
            }
        }
    };

    async function open() {
        await new Promise((resolve, reject) => {
            ws.onopen = resolve;
            ws.onerror = reject;
        });
        await send("Runtime.enable");
        await send("Log.enable");
        await send("Page.enable");
    }

    async function evaluate(expression, options = {}) {
        const timeoutMs = options.timeoutMs ?? 30000;
        const result = await send("Runtime.evaluate", {
            expression,
            awaitPromise: options.awaitPromise ?? false,
            returnByValue: true,
            timeout: timeoutMs
        }, timeoutMs + 3000);
        if (result.exceptionDetails) {
            throw new Error(result.exceptionDetails.text || result.exceptionDetails.exception?.description || "Runtime exception");
        }
        return result.result.value;
    }

    return {
        events,
        evaluate,
        open,
        close() {
            ws.close();
        }
    };
}

module.exports = {
    cdpClient,
    waitForPageTarget
};
