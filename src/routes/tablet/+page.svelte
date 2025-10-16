<script>
    import { onMount } from 'svelte';
    /** @typedef {{ sid: string, bestellnr: number, dt_create: string, dt_finish: string|null }} Order */
    let open = [];
    let creating = false;

    async function refresh() {
        open = await fetch('/api/orders?only=open&limit=500').then(r => r.json());
        open.sort((a,b)=>a.bestellnr-b.bestellnr);
    }

    async function createOrder() {
        if (creating) return;
        creating = true;
        try {
            const res = await fetch('/api/orders', { method: 'POST' });
            if (!res.ok) { alert('Fehler beim Anlegen'); return; }
            const o = await res.json();
            open = [...open, o].sort((a,b)=>a.bestellnr-b.bestellnr);
        } finally { creating = false; }
    }

    async function finishOrder(sid) {
        const res = await fetch(`/api/orders/${sid}`, { method: 'PATCH' });
        if (res.ok) {
            const updated = await res.json();
            // Falls die Bestellung bereits fertig war, ist sie eh nicht mehr "open"
            open = open.filter(o => o.sid !== updated.sid);
        } else if (res.status === 404) {
           await refresh();
            alert('Der Server wurde neu gestartet – Liste wurde aktualisiert.');
        } else {
            alert('Fehler beim Fertig-Melden.');
        }
    }

    onMount(refresh);
</script>

<div class="container py-4">
    <h1 class="mb-4">Tablet – Bestellungen</h1>

    <div class="d-flex gap-3 mb-4">
        <button class="btn btn-primary btn-lg" on:click={createOrder} disabled={creating}>
            {creating ? '…' : 'Neue Bestellnummer'}
        </button>
    </div>

    <div class="card">
        <div class="card-header fw-bold">Offene Bestellungen</div>
        <div class="card-body">
            {#if open.length === 0}
                <p class="text-muted mb-0">Keine offenen Bestellungen.</p>
            {:else}
                <div class="table-responsive">
                    <table class="table align-middle">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Erstellt</th>
                            <th>Aktion</th>
                        </tr>
                        </thead>
                        <tbody>
                        {#each open as o}
                            <tr>
                                <td class="fw-bold fs-4">{o.bestellnr}</td>
                                <td><small>{new Date(o.dt_create).toLocaleString()}</small></td>
                                <td>
                                    <button class="btn btn-success" on:click={() => finishOrder(o.sid)}>
                                        Fertig melden
                                    </button>
                                </td>
                            </tr>
                        {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    </div>
</div>
