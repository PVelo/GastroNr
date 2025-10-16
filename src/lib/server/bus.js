import { EventEmitter } from 'node:events';

export const bus = new EventEmitter();
bus.setMaxListeners(1000);

// "safe" Emit: jeder Listener in try/catch, damit nichts nach außen durchschlägt
export function emitSafe(event, payload) {
    for (const listener of bus.listeners(event)) {
        try {
            listener(payload);
        } catch (e) {
            // optional: loggen
            console.warn(`[bus:${event}] listener error`, e);
        }
    }
}
