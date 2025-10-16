import { pickupOrder, getOrder } from '$lib/server/store';
import { emitSafe } from '$lib/server/bus';

export const PATCH = ({ params }) => {
    const before = getOrder(params.id);
    if (!before) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

    const order = pickupOrder(params.id);
    queueMicrotask(() => emitSafe('orders:changed', { type: 'pickup', order }));
     return new Response(JSON.stringify(order), { headers: { 'content-type': 'application/json' } });
};

// Optional: Fallback falls PATCH geblockt ist
export const POST = (ev) => PATCH(ev);
