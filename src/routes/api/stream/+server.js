import { bus } from '$lib/server/bus';

export const GET = ({ request }) => {
    const encoder = new TextEncoder();
    let closed = false;

    const stream = new ReadableStream({
        start(controller) {
            const sendRaw = (str) => {
                if (closed) return;
                try {
                    controller.enqueue(encoder.encode(str));
                } catch {
                    // Controller ist zu -> aufräumen
                    cleanup();
                }
            };
            const send = (data) => sendRaw(`data: ${JSON.stringify(data)}\n\n`);
            const onChange = (payload) => send(payload);

            // keep-alive & initial hello
            send({ type: 'hello' });
            const keepAlive = setInterval(() => sendRaw(`: keep-alive\n\n`), 15000);

            // Listener registrieren
            bus.on('orders:changed', onChange);

            // Cleanup-Logik gemeinsam an einer Stelle
            function cleanup() {
                if (closed) return;
                closed = true;
                clearInterval(keepAlive);
                bus.off('orders:changed', onChange);
                try { controller.close(); } catch {}
            }

            // Client trennt Verbindung (Tab zu / reload / Navigation)
            request.signal.addEventListener('abort', cleanup);

            // Damit cancel() auch aufräumt:
            this._cleanup = cleanup;
        },
        cancel() {
            // Falls der Reader cancel sagt
            this._cleanup?.();
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive'
        }
    });
};
