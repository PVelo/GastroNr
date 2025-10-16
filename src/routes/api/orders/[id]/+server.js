import { finishOrder, getOrder } from '$lib/server/store';
import { emitSafe } from '$lib/server/bus'; // falls du emitSafe nutzt; sonst bus.emit

export const PATCH = ({ params }) => {
    const before = getOrder(params.id);
    if (!before) {
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }
    const order = finishOrder(params.id);
    queueMicrotask(() => emitSafe?.('orders:changed', { type: 'finish', order }));

    return new Response(JSON.stringify(order), {
        headers: { 'content-type': 'application/json' }
    });
};
