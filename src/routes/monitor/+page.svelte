<script>
    import { onMount } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { flip } from 'svelte/animate';

    let open = [];
    let ready = [];
    let live = false;

    // Spotlight
    let spotlight = null;
    let spotlightMs = 5000;

    // 🔊 Sound: eine persistente Instanz + Flag
    let notificationSoundFin;
    let soundReady = false;

    async function loadInitial() {
        const [o, r] = await Promise.all([
            fetch('/api/orders?only=open&limit=200').then((r) => r.json()),
            fetch('/api/orders?only=ready&limit=200').then((r) => r.json())
        ]);
        open = o.sort((a, b) => a.bestellnr - b.bestellnr);
        ready = r.sort((a, b) => a.bestellnr - b.bestellnr);
    }

    function applyEvent(evt) {
        const msg = JSON.parse(evt.data);

        if (msg.type === 'create') {
            open = [...open.filter((x) => x.sid !== msg.order.sid), msg.order]
                .sort((a, b) => a.bestellnr - b.bestellnr);

        } else if (msg.type === 'finish') {
            open = open.filter((x) => x.sid !== msg.order.sid);
            spotlight = msg.order;

            // 🔔 abspielen wenn entsperrt
            if (soundReady && notificationSoundFin) {
                notificationSoundFin.currentTime = 0;
                notificationSoundFin.play().catch(err =>
                    console.warn('Sound konnte nicht abgespielt werden:', err)
                );
            }

            setTimeout(() => {
                ready = [...ready, msg.order].sort((a, b) => a.bestellnr - b.bestellnr);
                spotlight = null;
            }, spotlightMs);

        } else if (msg.type === 'pickup') {
            ready = ready.filter((x) => x.sid !== msg.order.sid);
        }
    }

    onMount(async () => {
        await loadInitial();

        // 🔊 Sound vorbereiten (achte auf den korrekten Pfad!)
        // Bei dir liegt er unter /static/sound/notificationFin.mp3
        notificationSoundFin = new Audio('/sound/notificationFin.mp3');

        // Einmalig per User-Geste „freischalten“
        const unlock = () => {
            notificationSoundFin.play()
                .then(() => {
                    notificationSoundFin.pause();
                    notificationSoundFin.currentTime = 0;
                    soundReady = true;
                })
                .catch(err => console.warn('Audio unlock fehlgeschlagen:', err))
                .finally(() => {
                    window.removeEventListener('pointerdown', unlock);
                    window.removeEventListener('keydown', unlock);
                    window.removeEventListener('touchstart', unlock);
                });
        };
        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });

        // SSE
        const es = new EventSource('/api/stream');
        es.onopen = () => (live = true);
        es.onerror = () => (live = false);
        es.onmessage = applyEvent;
        return () => es.close();
    });
</script>

<div class="page">
    <header class="topbar">
        <div class="brand">
            <img src="/images/ManuFaktur.png" alt="ManuFaktur" />
            <h1>Bestellungen</h1>
        </div>
        <div class="live">
            <span class:ok={live} class="dot" aria-hidden="true"></span>
            {live ? 'Live' : 'Verbinde…'}
        </div>
    </header>

    <main class="layout">
        <section class="panel panel--open">
            <header>In Zubereitung <small>({open.length})</small></header>

            {#if open.length === 0}
                <p class="muted">Noch keine Bestellungen.</p>
            {:else}
                <div class="grid">
                    {#each open as o (o.sid)}
                        <div class="card card--open" animate:flip in:scale={{duration:160}} out:fade>
                            {o.bestellnr}
                        </div>
                    {/each}
                </div>
            {/if}
        </section>

        <section class="panel panel--ready">
            <header>Zur Abholung bereit <small>({ready.length})</small></header>
            <div class="icicles" aria-hidden="true"></div>

            {#if ready.length === 0}
                <p class="muted">Noch nichts fertig.</p>
            {:else}
                <div class="grid small">
                    {#each ready as o (o.sid)}
                        <div class="card card--ready" animate:flip in:scale={{duration:160}} out:fade>
                            {o.bestellnr}
                        </div>
                    {/each}
                </div>
            {/if}
        </section>
    </main>
</div>

<!-- Spotlight: Zahl auf Eisscholle -->

{#if spotlight}
    <div class="overlay" transition:fade|local={{ duration: 900 }}>
        <div class="spot" transition:scale|local={{ duration: 900, start: 0.65 }}>
            <span class="spot-label">Fertig</span>
            <span class="spot-num">{spotlight.bestellnr}</span>
            <div class="ice-sheen"></div>
        </div>
    </div>

{/if}


<!-- ❄ Schneeflocken-Layer -->
<div class="snow" aria-hidden="true">
    {#each Array(60) as _, i}
		<span style="
			left:{Math.random() * 100}%;
			--size:{0.6 + Math.random() * 2.5}rem;
			animation-duration:{6 + Math.random() * 10}s;
			animation-delay:{Math.random() * 10}s;
			--drift:{-30 + Math.random()*60}px">
			❄
		</span>
    {/each}
</div>

<style>
    @font-face {
        font-family: 'Frostbite';
        src: url('/fonts/CCFrostbiteBlock-Regular.woff') format('woff');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
    }

    :root {
        color-scheme: light;
        --ink: #0b1730;
        --muted: #6b7280;

        --open-from: #c8d8ea;
        --open-to: #9eb8d3;
        --open-text: #0b2540;

        --ready-from: #4da3ff;
        --ready-to: #1e6ff2;
        --ready-text: #ffffff;

        --panel-line: rgba(40, 100, 160, .28);
        --panel-grad: linear-gradient(180deg, rgba(255,255,255,.92), rgba(235,245,255,.90));
        --panel-shadow: 0 10px 28px rgba(55, 100, 160, .18);
    }

    :global(html, body) {
        font-family: 'Frostbite', system-ui, sans-serif;
        letter-spacing: 0.03em;
    }

    :global(body) {
        margin: 0;
        color: var(--ink);
        background:
                url('/images/eis-textur.jpg') center/cover fixed,
                radial-gradient(1000px 600px at 15% -10%, rgba(180, 210, 255, .4), transparent 70%),
                linear-gradient(180deg, rgba(255, 255, 255, .7), rgba(230, 245, 255, .6));
        background-blend-mode: overlay, lighten, normal;
        min-height: 100dvh;
    }

    .page { margin: 0 auto; padding: clamp(14px, 2.2vw, 28px); }

    /* ---------- Topbar ---------- */
    .topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom: 14px; }
    .brand { display:flex; align-items:center; gap: 12px; }
    .brand img { width: clamp(96px, 18vw, 160px); height:auto; object-fit:contain; filter: drop-shadow(0 6px 14px rgba(0,0,0,.08)); }
    .brand h1 { margin:0; font-size: clamp(26px, 3.6vw, 50px); text-transform: uppercase; letter-spacing: .05em; }
    .live { display:flex; align-items:center; gap:8px; color:#64748b; font-size:.95rem; }
    .dot { width:10px; height:10px; border-radius:999px; background:#94a3b8; }
    .dot.ok { background:#3b82f6; }

    /* Layout */
    .layout { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 900px){ .layout { grid-template-columns: 1fr; } }

    .panel {
        position:relative;
        background: var(--panel-grad);
        border: 1px solid var(--panel-line);
        border-radius: 20px;
        box-shadow: var(--panel-shadow);
        padding: 16px;
        overflow: hidden;
        backdrop-filter: saturate(140%) blur(8px);
    }

    .panel header {
        font-size: 35px; margin-bottom: 12px;
        display:flex; align-items:baseline; gap:8px;
        border-bottom: 1px dashed rgba(55, 100, 160, .25);
        padding-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: .05em;
    }



    @keyframes sway {
        0%,100% { transform: rotate(-0.6deg); }
        50%     { transform: rotate(0.6deg); }
    }

    /* ---------- Karten ---------- */
    .grid{ display:grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }
    .grid.small{ grid-template-columns: repeat(auto-fit, minmax(92px, 1fr)); }

    .card {
        display:grid; place-items:center;
        height: 100px;
        border-radius: 16px;
        font-weight: 900;
        max-width: 200px;
        font-size: clamp(30px, 5vw, 42px);
        letter-spacing: .06em;
        border: 1px solid rgba(55, 100, 160, .25);
        background: #fff;
        box-shadow: 0 8px 20px rgba(15, 23, 42, .09);
        user-select:none;
    }

    .card--open {
        color: var(--open-text);
        background: linear-gradient(180deg, var(--open-from), var(--open-to));
        border-color: rgba(55,100,160,.35);
    }

    .card--ready {
        color: var(--ready-text);
        background: linear-gradient(180deg, var(--ready-from), var(--ready-to));
        border-color: rgba(30,111,242,.55);
        text-shadow: 0 1px 0 rgba(0,0,0,.15);
    }

    /* ---------- Spotlight ---------- */
    .overlay {
        position: fixed; inset:0;
        display:grid; place-items:center;
        background: rgba(210, 230, 255, .45);
        backdrop-filter: blur(6px) saturate(120%);
        z-index: 1000;
    }


    .spot {
        position: absolute;
        display: grid;
        place-items: center;
        will-change: transform, opacity;
        transform-origin: 50% 100%;
    }

    /* Eisscholle PNG */
    .spot::before {
        content: "";
        position: absolute;
        width: clamp(500px, 40vw, 520px); /* ← DAS bestimmt ihre sichtbare Größe */
        aspect-ratio: 1 / 1;               /* grob anpassen an dein PNG-Verhältnis */
        transform: translate(-50%, -50%) scale(0.5);
        background: url('/images/Eisscholle.png') center/contain no-repeat;
        animation: bob 4s ease-in-out infinite;
        z-index: -1;
    }

    @media (prefers-reduced-motion: reduce) {
        .ice-sheen { animation: none !important; }
        .spot::before { animation: none !important; }
    }
    @keyframes bob {
        0%,100% { transform: translateY(0) scale(1.2) rotate(-1deg); }
        50%      { transform: translateY(-4px) scale(1.22) rotate(1deg); }
    }

    .spot-label {
        font-size: clamp(50px, 2vw, 22px);
        font-weight:2000;
        color:#2b7be9;
        text-shadow: 0 1px 3px rgba(0,0,0,.25);
    }

    .spot-num {
        font-size: clamp(120px, 14vw, 180px);
        font-weight: 2000;
        letter-spacing: .08em;
        color: #ffffff;
        text-shadow:
                0 0 12px rgba(0, 80, 180, 0.7),
                0 0 40px rgba(0, 140, 255, 0.8);
    }

    .ice-sheen {
        position:absolute; inset:-20%;
        background:
                conic-gradient(from 210deg at 80% -10%, rgba(77,163,255,.25), transparent 25%),
                linear-gradient(180deg, rgba(189,219,255,.22), transparent 45%);
        mix-blend-mode: screen;
        animation: sheen 3.2s ease-in-out infinite;
        pointer-events:none;
    }

    @keyframes sheen {
        0%,100%{ transform: translateX(-6%) translateY(-4%); opacity:.9; }
        50%    { transform: translateX(6%) translateY(3%);  opacity:1; }
    }

    /* ---------- Schneefall ---------- */
    .snow {
        position: fixed;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        z-index: 999;
    }

    .snow span {
        position: absolute;
        top: -10px;
        color: #739ae1;
        font-size: var(--size, 1rem);
        opacity: 0.9;
        text-shadow: 0 0 4px rgba(255,255,255,.6);
        filter: drop-shadow(0 0 2px rgba(255,255,255,0.6));
        animation: fall linear infinite, swayX ease-in-out infinite;
    }

    @keyframes fall {
        0%   { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 1; }
        100% { transform: translate3d(var(--drift, 0), 110vh, 0) rotate(360deg); opacity: 0.35; }
    }

    @keyframes swayX {
        0%,100% { margin-left: 0; }
        50%     { margin-left: 16px; }
    }
</style>
