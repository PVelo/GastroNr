import { listOrders, createOrder } from '$lib/server/store';
import { emitSafe } from '$lib/server/bus';

export const GET = ({ url }) => {
    const limit = Number(url.searchParams.get('limit') ?? 100);
    const only = url.searchParams.get('only'); // 'open' | 'done' | null
    const rows = listOrders({ only: only ?? undefined, limit });
    return new Response(JSON.stringify(rows), { headers: { 'content-type': 'application/json' } });
};

export const POST = () => {
    const order = createOrder();
    queueMicrotask(() => emitSafe('orders:changed', { type: 'create', order }));
    return new Response(JSON.stringify(order), { headers: { 'content-type': 'application/json' } });
};
