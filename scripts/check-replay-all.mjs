const base = "http://127.0.0.1:9225";
const target = await fetch(
    `${base}/json/new?${encodeURIComponent("http://localhost:5199/#email-input")}`,
    { method: "PUT" },
);
const page = await target.json();
const ws = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 1;
const pending = new Map();
const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
    });

ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const item = pending.get(message.id);
    if (item) {
        pending.delete(message.id);
        message.error ? item.reject(message.error) : item.resolve(message.result);
    }
});

await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
await send("Runtime.enable");
await new Promise((resolve) => setTimeout(resolve, 3500));

const result = await send("Runtime.evaluate", {
    expression: `(async () => {
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const inspect = async (layout, label) => {
            const field = layout.querySelector('input, textarea');
            const row = layout.querySelector('.input-layout__row');
            if (!field || !row) return { label, error: 'missing field' };
            let focusCount = 0;
            field.addEventListener('focus', () => { focusCount += 1; });
            field.focus();
            await delay(1400);
            const edge = layout.querySelector('.input-layout__edge');
            const before = edge?.getAnimations()[0]?.currentTime ?? 0;
            const rect = row.getBoundingClientRect();
            row.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', clientX: rect.left + 4, clientY: rect.top + 4 }));
            row.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.left + 4, clientY: rect.top + 4 }));
            await delay(250);
            const after = edge?.getAnimations()[0]?.currentTime ?? 0;
            return {
                label,
                focusCount,
                before,
                after,
                active: document.activeElement === field,
                animation: getComputedStyle(edge).animationName,
            };
        };
        const layouts = [...document.querySelectorAll('.input-layout')];
        const emailLayout = layouts.find((layout) => layout.querySelector('input[type="email"]'));
        const textAreaLayout = layouts.find((layout) => layout.querySelector('textarea'));
        return [
            emailLayout ? await inspect(emailLayout, 'email') : { label: 'email', error: 'not found' },
            textAreaLayout ? await inspect(textAreaLayout, 'textarea') : { label: 'textarea', error: 'not found' },
        ];
    })()`,
    awaitPromise: true,
    returnByValue: true,
});

console.log(JSON.stringify(result.result.value, null, 2));
ws.close();
