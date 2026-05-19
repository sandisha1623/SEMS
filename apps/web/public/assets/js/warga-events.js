'use strict';

/**
 * warga-events.js
 *
 * Tanggung jawab:
 *   - Event binding (tombol, search, tutup panel)
 *   - Init halaman saat DOM ready
 *
 * Di-load TERAKHIR setelah semua modul lain siap.
 * Depends on: WargaState, WargaKk, WargaAnggota
 */

(function () {

    const { KK_LIST, ROLE, dom } = WargaState;

    // ── Init ──────────────────────────────────────────────────────

    WargaKk.renderKkGrid(KK_LIST);
    bindEvents();

    if (ROLE === 'warga') {
        dom.panelAnggota?.classList.remove('d-none');
        WargaAnggota.loadAnggotaWarga();
    }

    // ── Event binding ─────────────────────────────────────────────

    function bindEvents() {
        const { btnTambahKk, btnTambahWrg, btnTutupPanel, kkGrid, kkSearch, panelAnggota } = dom;

        // Tambah KK
        btnTambahKk?.addEventListener('click', WargaKk.bukaModalTambahKk);

        // Tambah anggota
        btnTambahWrg?.addEventListener('click', WargaAnggota.bukaModalTambahWarga);

        // Tutup panel anggota
        btnTutupPanel?.addEventListener('click', () => {
            panelAnggota?.classList.add('d-none');
            kkGrid?.querySelectorAll('.kk-card').forEach(c =>
                c.classList.remove('border-primary', 'shadow-sm'));
            WargaState.activeKk = null;
            if (btnTambahWrg) btnTambahWrg.disabled = true;
        });

        // Search KK di grid — filter client-side dari KK_LIST
        let timer;
        kkSearch?.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                const q = kkSearch.value.toLowerCase();
                WargaKk.renderKkGrid(q
                    ? KK_LIST.filter(kk =>
                        (kk.kepala_keluarga || '').toLowerCase().includes(q) ||
                        (kk.alamat || '').toLowerCase().includes(q) ||
                        (kk.rt_display || '').includes(q))
                    : KK_LIST);
            }, 300);
        });

        // Tombol tambah KK di empty state (jika ada)
        document.getElementById('btnTambahKkEmpty')?.addEventListener('click', () => {
            btnTambahKk?.click();
        });
    }

})();