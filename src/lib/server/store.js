import { randomUUID } from 'node:crypto';

let nextNr = 1;
/** sid -> { sid, bestellnr, dt_create, dt_finish, dt_pickup } */
const orders = new Map();

export function listOrders({ only, limit = 100 } = {}) {
    let arr = Array.from(orders.values());
    if (only === 'open')   arr = arr.filter(o => o.dt_finish === null);
    if (only === 'ready')  arr = arr.filter(o => o.dt_finish !== null && o.dt_pickup === null);
    if (only === 'picked') arr = arr.filter(o => o.dt_pickup !== null);
    arr.sort((a, b) => b.bestellnr - a.bestellnr);
    return arr.slice(0, limit);
}

export function getOrder(sid) {
    return orders.get(sid) || null;
}

export function createOrder() {
    const sid = randomUUID();
    const o = {
        sid,
        bestellnr: nextNr++,
        dt_create: new Date().toISOString(),
        dt_finish: null,     // „fertig“ gesetzt
        dt_pickup: null      // „abgeholt“ gesetzt
    };
    orders.set(sid, o);
    return o;
}

// „Fertig melden“ (idempotent)
export function finishOrder(sid) {
    const o = orders.get(sid);
    if (!o) return null;
    if (!o.dt_finish) o.dt_finish = new Date().toISOString();
    return o;
}

// „Abgeholt“ (idempotent)
export function pickupOrder(sid) {
    const o = orders.get(sid);
    if (!o) return null;
    if (!o.dt_pickup) o.dt_pickup = new Date().toISOString();
    return o;
}
