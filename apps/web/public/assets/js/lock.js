/**
 * lock.js — Halaman /lock
 * ─────────────────────────────────────────────────────────────────
 * Isu #3: Ketika rate limiter habis → otomatis redirect ke /login
 * Isu #2: Cek lock untuk username DAN IP
 *
 * Flow:
 *   1. Baca seconds_left dari #lock-state data-*  (dirender PHP dari Redis)
 *   2. Jalankan countdown
 *   3. Saat timer = 00:00 → POST /api/v1/auth/unlock
 *   4. Jika sukses unlock → redirect /login
 *   5. Jika URL /lock diakses tanpa lock aktif → PHP sudah redirect /login
 *      (dilakukan di LockViewController::index())
 */

'use strict';

(function () {

    const API_VERSION = 'v1';
    const BASE        = '/api/' + API_VERSION;

    // Baca dari HTML yang dirender PHP
    const state    = document.getElementById('lock-state');
    const timerEl  = document.getElementById('lockTimer');
    const progress = document.getElementById('lockProgress');
    const backBtn  = document.getElementById('backToLogin');
    const statusEl = document.getElementById('lockStatus');

    if (!state) return;

    const secondsLeft = parseInt(state.dataset.seconds || '0', 10);
    const username    = state.dataset.username || '';
    const ip          = state.dataset.ip || '';
    const totalMs     = secondsLeft * 1000;
    const endMs       = Date.now() + totalMs;

    if (secondsLeft <= 0) {
        // Sudah tidak locked saat halaman dimuat → langsung ke login
        window.location.href = '/login';
        return;
    }

    let countdown = null;

    // ── Countdown ──────────────────────────────────────────────────
    countdown = setInterval(function () {
        const left = Math.max(0, endMs - Date.now());
        const mm   = String(Math.floor(left / 60000)).padStart(2, '0');
        const ss   = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');

        if (timerEl)  timerEl.textContent = mm + ':' + ss;

        // Update progress bar
        if (progress && totalMs > 0) {
            const pct = (left / totalMs) * 100;
            progress.style.width = pct + '%';
        }

        if (left <= 0) {
            clearInterval(countdown);
            onTimerEnd();
        }
    }, 1000);

    // ── Timer habis ────────────────────────────────────────────────
    async function onTimerEnd() {
        if (timerEl)  timerEl.textContent = '00:00';
        if (progress) progress.style.width = '0%';

        if (statusEl) statusEl.innerHTML = '<span class="badge bg-label-warning">Membuka akun...</span>';

        try {
            // Coba unlock via API
            // ISU #2: kirim username DAN biarkan server cek IP dari request
            const res  = await fetch(BASE + '/auth/unlock', {
                method:      'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept':       'application/json',
                },
                body: JSON.stringify({ username: username }),
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok || res.status === 404) {
                // Sukses atau user tidak ditemukan → redirect ke login
                onUnlocked();
            } else if (data.seconds_left) {
                // Masih locked (clock drift kecil) — tunggu sebentar lagi
                setTimeout(onTimerEnd, (data.seconds_left * 1000) + 500);
            } else {
                // Fallback → tetap redirect
                onUnlocked();
            }

        } catch (err) {
            // Network error — tunggu 3 detik lalu redirect
            console.warn('Unlock request gagal:', err.message);
            setTimeout(onUnlocked, 3000);
        }
    }

    // ── Redirect ke login ──────────────────────────────────────────
    function onUnlocked() {
        if (statusEl) statusEl.innerHTML = '<span class="badge bg-label-success">Terbuka ✓</span>';

        // ISU #3: Otomatis redirect ke /login
        if (backBtn) backBtn.classList.remove('d-none');

        // Redirect otomatis setelah 1.5 detik
        setTimeout(function () {
            window.location.href = '/login';
        }, 1500);
    }

})();
