<script>
    import { onMount } from 'svelte';

    let open = [];
    let done = [];

    async function loadInitial() {
        const [o, d] = await Promise.all([
            fetch('/api/orders?only=open&limit=200').then(r => r.json()),
            fetch('/api/orders?only=done&limit=30').then(r => r.json()),
        ]);
        open = o.sort((a,b)=>a.bestellnr-b.bestellnr);
        done = d.sort((a,b)=>b.bestellnr-a.bestellnr);
    }

    function applyEvent(evt) {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'create') {
            open = [...open.filter(x => x.sid !== msg.order.sid), msg.order].sort((a,b)=>a.bestellnr-b.bestellnr);
        } else if (msg.type === 'finish') {
            open = open.filter(x => x.sid !== msg.order.sid);
            done = [msg.order, ...done].slice(0, 30);
        }
    }

    onMount(async () => {
        await loadInitial();
        const es = new EventSource('/api/stream');
        es.onmessage = applyEvent;
        return () => es.close();
    });
</script>

<div class="container py-4">
    <h1 class="display-4 mb-4 text-center">Abholnummern</h1>

    <div class="row g-4">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header bg-warning-subtle fw-bold">In Zubereitung</div>
                <div class="card-body">
                    {#if open.length === 0}
                        <p class="text-muted">Noch keine Bestellungen.</p>
                    {:else}
                        <div class="d-flex flex-wrap gap-3">
                            {#each open as o}
                                <div class="border rounded px-3 py-2 fs-2 fw-bold">{o.bestellnr}</div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card">
                <div class="card-header bg-success-subtle fw-bold">Fertig</div>
                <div class="card-body">
                    {#if done.length === 0}
                        <p class="text-muted">Noch nichts fertig.</p>
                    {:else}
                        <div class="d-flex flex-wrap gap-2">
                            {#each done as o}
                                <span class="badge text-bg-success fs-5">{o.bestellnr}</span>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
