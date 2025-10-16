import { randomUUID } from 'node:crypto';

let nextNr = 1;
const orders = new Map();

export function listOrders({ only, limit = 100 } = {}) {
    let arr = Array.from(orders.values());
    if (only === 'open') arr = arr.filter(o => o.dt_finish === null);
    if (only === 'done') arr = arr.filter(o => o.dt_finish !== null);
    arr.sort((a, b) => b.bestellnr - a.bestellnr);
    return arr.slice(0, limit);
}

export function getOrder(sid) {
    return orders.get(sid) || null;
}

export function createOrder() {
    const sid = randomUUID();
    const o = { sid, bestellnr: nextNr++, dt_create: new Date().toISOString(), dt_finish: null };
    orders.set(sid, o);
    return o;
}

export function finishOrder(sid) {
    const o = orders.get(sid);
    if (!o) return null;
    if (!o.dt_finish) o.dt_finish = new Date().toISOString(); // idempotent: beim 2. Mal unverändert
    return o;
}
