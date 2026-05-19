'use strict';

/**
 * warga-export.js
 *
 * Tanggung jawab:
 *   - Modal pilih scope export
 *   - Trigger download file Excel
 *
 * Depends on: WargaState, Api, Toast, ModalManager
 *
 * Cara pakai di view:
 *   <script src="assets/js/warga-export.min.js"></script>
 *   Panggil WargaExport.buka() dari tombol manapun.
 */

const WargaExport = (() => {

    const BASE = '/api/v1/warga/export';

    // ── Buka modal pilih scope ────────────────────────────────────

    function buka(defaultScope = 'all') {
        const { ROLE } = WargaState;
        const activeKk = WargaState.activeKk;

        // Opsi scope yang tersedia berdasarkan role
        const scopeOptions = _buildScopeOptions(ROLE, activeKk);

        ModalManager.open({
            title    : '<i class="bx bx-download me-2 text-success"></i>Export Data Warga',
            content  : _buildForm(scopeOptions, defaultScope, activeKk, ROLE),
            saveLabel: '<span class="mdi mdi-file-download-outline"></span> Download Excel',
            onSave   : () => _doExport(),
        });

        // Bind scope change → tampilkan/sembunyikan field RT
        document.getElementById('exportScope')?.addEventListener('change', _onScopeChange);
        _onScopeChange();
    }

    // ── Build opsi scope ──────────────────────────────────────────

    function _buildScopeOptions(role, activeKk) {
        const opts = [];

        if (['administrator','rw'].includes(role)) {
            opts.push({ value: 'all', label: 'Semua warga (sesuai wilayah)' });
        }

        if (['administrator','rw','rt'].includes(role)) {
            opts.push({ value: 'rt',  label: 'Per RT' });
        }

        if (activeKk) {
            opts.push({ value: 'kk', label: `KK aktif: ${activeKk.kepala} (${activeKk.rt ? 'RT '+activeKk.rt : ''})` });
        }

        opts.push({ value: 'kk_all', label: 'Per KK (tiap KK = satu sheet)' });

        return opts;
    }

    // ── Build HTML form ───────────────────────────────────────────

    function _buildForm(scopeOptions, defaultScope, activeKk, role) {
        const scopeHtml = scopeOptions.map(o =>
            `<option value="${o.value}" ${o.value === defaultScope ? 'selected' : ''}>
                ${o.label}
             </option>`
        ).join('');

        // Dropdown RT (hanya untuk admin/rw)
        const rtDropdown = ['administrator','rw'].includes(role)
            ? `<div class="mb-3 d-none" id="wrapExportRt">
                <label class="form-label fw-semibold small" for="exportRtId">Pilih RT</label>
                <select class="form-select form-select-sm" id="exportRtId">
                    <option value="">-- Semua RT --</option>
                    ${(WargaState.RT_LIST || []).map(rt =>
                        `<option value="${rt.id}">RT ${rt.kode_rt} — ${rt.nama_rt}</option>`
                    ).join('')}
                </select>
               </div>`
            : '';

        return `
<div class="mb-3">
    <label class="form-label fw-semibold small" for="exportScope">Scope Export</label>
    <select class="form-select form-select-sm" id="exportScope">
        ${scopeHtml}
    </select>
</div>

${rtDropdown}

<div class="mb-3">
    <label class="form-label fw-semibold small">Filter Tambahan <span class="text-muted">(opsional)</span></label>
    <div class="row g-2">
        <div class="col-6">
            <select class="form-select form-select-sm" id="exportStatusDomisili">
                <option value="">Semua domisili</option>
                <option value="tetap">Tetap</option>
                <option value="pindah">Pindah</option>
            </select>
        </div>
        <div class="col-6">
            <select class="form-select form-select-sm" id="exportStatusHidup">
                <option value="">Semua status</option>
                <option value="hidup">Hidup</option>
                <option value="meninggal">Meninggal</option>
            </select>
        </div>
    </div>
</div>

<div class="alert alert-info d-flex gap-2 py-2 small" id="exportInfo">
    <i class="bx bx-info-circle flex-shrink-0 mt-1"></i>
    <span id="exportInfoText">File Excel akan diunduh ke perangkat Anda.</span>
</div>`;
    }

    // ── Handle scope change ───────────────────────────────────────

    function _onScopeChange() {
        const scope    = document.getElementById('exportScope')?.value;
        const wrapRt   = document.getElementById('wrapExportRt');
        const infoText = document.getElementById('exportInfoText');

        if (!scope) return;

        // Tampilkan dropdown RT jika scope = rt
        wrapRt?.classList.toggle('d-none', scope !== 'rt');

        // Update info text
        const infoMap = {
            all   : 'Export semua warga sesuai wilayah Anda.',
            rt    : 'Export warga dari satu RT. Pilih RT di atas.',
            kk    : 'Export anggota KK yang sedang aktif dipilih.',
            kk_all: 'Export semua KK — tiap KK menjadi satu sheet terpisah dalam file Excel.',
        };
        if (infoText) infoText.textContent = infoMap[scope] ?? '';
    }

    // ── Eksekusi export ───────────────────────────────────────────

    async function _doExport() {
        const scope    = document.getElementById('exportScope')?.value ?? 'all';
        const rtId     = document.getElementById('exportRtId')?.value;
        const domisili = document.getElementById('exportStatusDomisili')?.value;
        const hidup    = document.getElementById('exportStatusHidup')?.value;
        const activeKk = WargaState.activeKk;

        // Build query params
        const params = new URLSearchParams();

        switch (scope) {
            case 'all':
                params.set('scope', 'all');
                break;
            case 'rt':
                params.set('scope', 'rt');
                if (rtId) params.set('rt_id', rtId);
                break;
            case 'kk':
                params.set('scope', 'kk');
                if (activeKk?.uuid) params.set('kk_uuid', activeKk.uuid);
                break;
            case 'kk_all':
                params.set('scope', 'all');
                params.set('groupBy', 'kk');
                break;
        }

        if (domisili) params.set('status_domisili', domisili);
        if (hidup)    params.set('status_hidup', hidup);

        // Tampilkan loading
        const saveBtn = document.querySelector('#modalManager .btn-primary');
        const origText = saveBtn?.innerHTML;
        if (saveBtn) {
            saveBtn.disabled  = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Menyiapkan...';
        }

        try {
            // Fetch dengan credentials (JWT cookie)
            const token = _getCsrfToken();
            const res   = await fetch(`/api/v1/warga/export?${params.toString()}`, {
                credentials: 'same-origin',
                headers    : { 'X-XSRF-TOKEN': token },
            });

            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                Toast?.error(json.message || 'Export gagal.');
                return false;
            }

            // Trigger download
            const blob     = await res.blob();
            const url      = URL.createObjectURL(blob);
            const a        = document.createElement('a');
            const cd       = res.headers.get('Content-Disposition') ?? '';
            const match    = cd.match(/filename="?([^"]+)"?/);
            a.href         = url;
            a.download     = match ? match[1] : 'data-warga.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            Toast?.success('Export berhasil diunduh.');
            return true;

        } catch (e) {
            Toast?.error('Export gagal: ' + e.message);
            return false;
        } finally {
            if (saveBtn && origText) {
                saveBtn.disabled  = false;
                saveBtn.innerHTML = origText;
            }
        }
    }

    // ── Helper CSRF ───────────────────────────────────────────────

    function _getCsrfToken() {
        const match = document.cookie.split(';')
            .map(c => c.trim())
            .find(c => c.startsWith('XSRF-TOKEN='));
        return match ? decodeURIComponent(match.split('=')[1]) : '';
    }

    // ── Shortcut per scope ────────────────────────────────────────

    function bukaPerRt()  { buka('rt');     }
    function bukaPerKk()  { buka('kk');     }
    function bukaSemuaKk(){ buka('kk_all'); }

    return { buka, bukaPerRt, bukaPerKk, bukaSemuaKk };

})();