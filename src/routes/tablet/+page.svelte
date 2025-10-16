<script>
    import { onMount } from 'svelte';
    /** @typedef {{ sid:string, bestellnr:number, dt_create:string, dt_finish:string|null, dt_pickup:string|null }} Order */

    /** @type {Order[]} */ let open = [];
    /** @type {Order[]} */ let ready = [];
    let creating = false;

    async function refresh() {
        const [o, r] = await Promise.all([
            fetch('/api/orders?only=open&limit=500').then(r => r.json()),
            fetch('/api/orders?only=ready&limit=500').then(r => r.json()),
        ]);
        open  = o.sort((a,b)=>a.bestellnr-b.bestellnr);
        ready = r.sort((a,b)=>a.bestellnr-b.bestellnr);
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

    // Fertig melden -> wandert von open -> ready
    async function finishOrder(sid) {
        let res = await fetch(`/api/orders/${sid}`, { method: 'PATCH' });
        if (res.status === 405 || res.status === 404) {
            res = await fetch(`/api/orders/${sid}`, { method: 'POST' }); // Fallback
        }
        if (res.ok) {
            const updated = await res.json();
            open  = open.filter(o => o.sid !== updated.sid);
            ready = [...ready, updated].sort((a,b)=>a.bestellnr-b.bestellnr);
        } else {
            await refresh();
            alert('Fehler beim Fertig-Melden.');
        }
    }

    async function pickupOrder(sid) {
        let res = await fetch(`/api/orders/${sid}/pickup`, { method: 'PATCH' });
        if (res.status === 405 || res.status === 404) {
            res = await fetch(`/api/orders/${sid}/pickup`, { method: 'POST' }); // Fallback
        }
        if (res.ok) {
            const updated = await res.json();
            ready = ready.filter(o => o.sid !== updated.sid);
        } else {
            await refresh();
            alert('Fehler beim Abholen.');
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
        <button class="btn btn-outline-secondary" on:click={refresh}>Aktualisieren</button>
    </div>

    <div class="row g-4">
        <div class="col-md-7">
            <div class="card">
                <div class="card-header fw-bold">In Zubereitung</div>
                <div class="card-body">
                    {#if open.length === 0}
                        <p class="text-muted mb-0">Keine offenen Bestellungen.</p>
                    {:else}
                        <div class="table-responsive">
                            <table class="table align-middle">
                                <thead>
                                <tr><th>#</th><th>Erstellt</th><th>Aktion</th></tr>
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

        <div class="col-md-5">
            <div class="card">
                <div class="card-header fw-bold">Zur Abholung bereit</div>
                <div class="card-body">
                    {#if ready.length === 0}
                        <p class="text-muted mb-0">Noch nichts fertig.</p>
                    {:else}
                        <div class="table-responsive">
                            <table class="table align-middle">
                                <thead><tr><th>#</th><th>Fertig</th><th>Aktion</th></tr></thead>
                                <tbody>
                                {#each ready as o}
                                    <tr>
                                        <td class="fw-bold fs-5">{o.bestellnr}</td>
                                        <td><small>{new Date(o.dt_finish).toLocaleString()}</small></td>
                                        <td>
                                            <button class="btn btn-outline-danger" on:click={() => pickupOrder(o.sid)}>
                                                Abgeholt
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
    </div>
</div>
