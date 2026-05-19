'use strict';

/**
 * warga-state.js
 *
 * Shared state dan DOM refs yang dipakai oleh semua modul warga.
 * Di-load PERTAMA sebelum modul lainnya.
 *
 * Urutan load di view:
 *   1. warga-state.js     ← shared state
 *   2. warga-kk.js        ← grid KK + modal KK
 *   3. warga-anggota.js   ← tabel anggota + modal warga
 *   4. warga-events.js    ← event binding + init
 */

const WargaState = (() => {

    // ── Data dari PHP ─────────────────────────────────────────────
    const KK_LIST = window.__KK_LIST__ || [];
    const RT_LIST = window.__RT_LIST__ || [];
    const ROLE    = window.__ROLE__    || 'rt';

    // ── State ─────────────────────────────────────────────────────
    let activeKk  = null;
    let isLoading = false;

    // ── DOM refs ──────────────────────────────────────────────────
    const dom = {
        kkGrid       : document.getElementById('kkGrid'),
        kkEmpty      : document.getElementById('kkEmpty'),
        kkSearch     : document.getElementById('kkSearch'),
        panelAnggota : document.getElementById('panelAnggota'),
        panelKkNama  : document.getElementById('panelKkNama'),
        panelKkInfo  : document.getElementById('panelKkInfo'),
        btnTutupPanel: document.getElementById('btnTutupPanel'),
        btnTambahKk  : document.getElementById('btnTambahKk'),
        btnTambahWrg : document.getElementById('btnTambahWarga'),
        tabelBody    : document.getElementById('tabelAnggotaBody'),
        infoTotal    : document.getElementById('infoTotal'),
    };

    // ── Util ──────────────────────────────────────────────────────
    function esc(s) {
        return String(s ?? '')
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function rowLoading() {
        return `<tr><td colspan="7" class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-primary"></div>
            <span class="ms-2 text-muted small">Memuat...</span>
        </td></tr>`;
    }

    function rowError(msg = 'Gagal memuat data.') {
        return `<tr><td colspan="7" class="text-center py-4 text-danger small">${msg}</td></tr>`;
    }

    function rowKosong(msg) {
        return `<tr><td colspan="7" class="text-center py-5 text-muted">
            <i class="bx bx-user-x d-block fs-3 mb-2 opacity-50"></i>${esc(msg)}
        </td></tr>`;
    }

    return {
        KK_LIST, RT_LIST, ROLE,
        dom,
        get activeKk()   { return activeKk; },
        set activeKk(v)  { activeKk = v; },
        get isLoading()  { return isLoading; },
        set isLoading(v) { isLoading = v; },
        esc, rowLoading, rowError, rowKosong,
    };

})();