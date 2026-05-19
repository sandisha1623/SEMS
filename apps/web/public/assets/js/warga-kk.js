'use strict';

/**
 * warga-kk.js
 *
 * Tanggung jawab:
 *   - Render grid kartu KK
 *   - Pilih KK aktif
 *   - Search & pagination
 *   - Modal tambah/edit KK
 *   - Hapus KK
 *   - Event delegation grid
 */

window.WargaKk = (() => {

    // ─────────────────────────────────────────────────────────────
    // STATE & CONFIG
    // ─────────────────────────────────────────────────────────────

    const {
        KK_LIST,
        RT_LIST,
        ROLE,
        PERUMAHAN_LIST,
        CLUSTER_LIST,
        dom,
        esc
    } = WargaState;

    let _currentPage    = 1;
    let _currentQ       = '';
    let _currentCluster = '';
    let _searchTimer    = null;

    // ─────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────

    function init() {
        initSearch();
        initGridEvents();
        refreshKkList();
    }

    // ─────────────────────────────────────────────────────────────
    // GRID EVENTS (EVENT DELEGATION)
    // ─────────────────────────────────────────────────────────────

    function initGridEvents() {

        const { kkGrid } = dom;

        if (!kkGrid) return;

        kkGrid.addEventListener('click', function (e) {

            // ── EDIT KK ──────────────────────────────────────────
            const editBtn = e.target.closest('.btn-edit-kk');

            if (editBtn) {
                e.stopPropagation();

                bukaModalEditKk(editBtn.dataset.uuid);
                return;
            }

            // ── HAPUS KK ─────────────────────────────────────────
            const hapusBtn = e.target.closest('.btn-hapus-kk');

            if (hapusBtn) {
                e.stopPropagation();

                hapusKk(
                    hapusBtn.dataset.uuid,
                    hapusBtn.dataset.kepala
                );

                return;
            }

            // ── PILIH KK ─────────────────────────────────────────
            const card = e.target.closest('.kk-card');

            if (!card) return;

            pilihKk({
                uuid    : card.dataset.uuid,
                kepala  : card.dataset.kepala,
                rt      : card.dataset.rt,
                rw      : card.dataset.rw,
                rt_id   : card.dataset.rtId,
                cluster : card.dataset.cluster,
            });
        });
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER GRID
    // ─────────────────────────────────────────────────────────────

    function renderKkGrid(list) {

        const { kkGrid, kkEmpty } = dom;

        if (!kkGrid) return;

        // Dispose tooltip lama
        window.App?.disposeComponents?.(kkGrid);

        // Empty
        kkGrid.innerHTML = '';

        if (!list.length) {
            kkEmpty?.classList.remove('d-none');
            return;
        }

        kkEmpty?.classList.add('d-none');

        kkGrid.innerHTML = list.map(kk => `
            <div class="col-sm-6 col-lg-4">

                <div
                    class="card kk-card h-100 border cursor-pointer"
                    data-uuid="${esc(kk.uuid)}"
                    data-kepala="${esc(kk.kepala_keluarga || '')}"
                    data-rt="${esc(kk.rt || '')}"
                    data-rw="${esc(kk.rw || '')}"
                    data-rt-id="${kk.rt_id || ''}"
                    data-cluster="${esc(kk.cluster || '')}"
                >

                    <div class="card-body">

                        <div class="d-flex align-items-start mb-2 position-relative">

                            <div
                                class="bg-primary-subtle rounded-2 fs-18 p-2 me-2 border border-solid border-primary text-center flex-shrink-0"
                                style="width:50px;height:50px;line-height:30px"
                            >
                                ${esc(
                                    (kk.kepala_keluarga || 'KK')
                                        .split(' ')
                                        .map(n => n[0])
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase()
                                )}
                            </div>

                            <div>
                                <h5 class="mb-1 fw-medium text-dark fs-16">
                                    ${esc(kk.kepala_keluarga || '-')}
                                </h5>

                                <div class="fs-14 text-muted">
                                    ${esc(kk.role_warga || 'warga')}
                                    ${esc(kk.cluster || '-')}
                                    No. ${esc(kk.no_rumah || '-')}
                                </div>
                            </div>

                        </div>

                    </div>

                    <div class="card-footer py-2 border-top d-flex align-items-center justify-content-between">

                        <button class="btn bg-primary-subtle btn-sm border border-solid border-primary">
                            Lihat
                        </button>

                        ${['administrator', 'rt'].includes(ROLE) ? `
                            <div class="d-flex gap-1">

                                <button
                                    class="btn btn-sm bg-warning-subtle btn-edit-kk border border-solid border-warning"
                                    data-uuid="${esc(kk.uuid)}"
                                    data-bs-toggle="tooltip"
                                    data-bs-placement="top"
                                    data-bs-title="Edit KK"
                                >
                                    <i class="mdi mdi-square-edit-outline fs-16 text-warning"></i>
                                </button>

                                ${ROLE === 'administrator' ? `
                                    <button
                                        class="btn btn-sm bg-danger-subtle btn-hapus-kk border border-solid border-danger"
                                        data-uuid="${esc(kk.uuid)}"
                                        data-kepala="${esc(kk.kepala_keluarga || '')}"
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        data-bs-title="Hapus KK"
                                    >
                                        <i class="mdi mdi-delete-outline fs-16 text-danger"></i>
                                    </button>
                                ` : ''}

                            </div>
                        ` : ''}

                    </div>

                </div>

            </div>
        `).join('');

        // Init tooltip baru
        window.App?.initComponents?.(kkGrid);
    }

    // ─────────────────────────────────────────────────────────────
    // PILIH KK
    // ─────────────────────────────────────────────────────────────

    function pilihKk(kk) {

        const {
            kkGrid,
            panelKkNama,
            panelKkInfo,
            panelAnggota,
            btnTambahWrg
        } = dom;

        WargaState.activeKk = kk;

        kkGrid?.querySelectorAll('.kk-card').forEach(card => {

            const active = card.dataset.uuid === kk.uuid;

            card.classList.toggle('border-primary', active);
            card.classList.toggle('shadow-sm', active);
        });

        if (panelKkNama) {
            panelKkNama.textContent = kk.kepala;
        }

        if (panelKkInfo) {

            panelKkInfo.textContent = [
                kk.rt ? `RT ${kk.rt}` : '',
                kk.rw ? `RW ${kk.rw}` : '',
                kk.cluster || '',
            ]
                .filter(Boolean)
                .join(' · ');
        }

        panelAnggota?.classList.remove('d-none');

        panelAnggota?.scrollIntoView({
            behavior : 'smooth',
            block    : 'nearest'
        });

        if (btnTambahWrg) {
            btnTambahWrg.disabled = false;
        }

        WargaAnggota.loadAnggotaKk(kk.uuid);

        document.dispatchEvent(
            new CustomEvent('kkSelected', {
                detail : kk
            })
        );
    }

    // ─────────────────────────────────────────────────────────────
    // REFRESH LIST
    // ─────────────────────────────────────────────────────────────

    async function refreshKkList(q = '', page = 1) {

        _currentQ    = q;
        _currentPage = page;

        const {
            kkGrid,
            kkEmpty,
            kkPagination
        } = dom;

        kkEmpty?.classList.add('d-none');
        kkPagination?.classList.add('d-none');

        if (kkGrid) {
            kkGrid.innerHTML = _skeletonCards(3);
        }

        const params = new URLSearchParams({
            page
        });

        if (q) {
            params.set('q', q);
        }

        if (_currentCluster) {
            params.set('cluster', _currentCluster);
        }

        const res = await Api.get(`/warga/kk-list?${params}`);

        if (!res.ok) {

            if (kkGrid) {
                kkGrid.innerHTML = '';
            }

            return;
        }

        const list = res.data?.data || [];
        const meta = res.data?.meta || {};

        KK_LIST.length = 0;

        list.forEach(k => KK_LIST.push(k));

        renderKkGrid(KK_LIST);
        renderPagination(meta);
        renderClusterFilter(meta.clusters || []);
    }

    // ─────────────────────────────────────────────────────────────
    // SEARCH
    // ─────────────────────────────────────────────────────────────

    function initSearch() {

        const input = document.getElementById('kkSearch');

        if (!input) return;

        input.addEventListener('input', function () {

            clearTimeout(_searchTimer);

            const q = this.value.trim();

            _searchTimer = setTimeout(() => {
                refreshKkList(q, 1);
            }, 400);
        });
    }

    // ─────────────────────────────────────────────────────────────
    // PAGINATION
    // ─────────────────────────────────────────────────────────────

    function renderPagination(meta) {

        const { kkPagination } = dom;

        if (!kkPagination) return;

        if (!meta.pages || meta.pages <= 1) {

            kkPagination.innerHTML = '';
            kkPagination.classList.add('d-none');

            return;
        }

        kkPagination.classList.remove('d-none');

        const {
            page,
            pages
        } = meta;

        let html = `
            <ul class="pagination pagination-sm mb-0">
        `;

        for (let i = 1; i <= pages; i++) {

            html += `
                <li class="page-item ${i === page ? 'active' : ''}">
                    <a
                        class="page-link"
                        href="#"
                        data-page="${i}"
                    >
                        ${i}
                    </a>
                </li>
            `;
        }

        html += '</ul>';

        kkPagination.innerHTML = html;

        kkPagination
            .querySelectorAll('.page-link')
            .forEach(link => {

                link.addEventListener('click', e => {

                    e.preventDefault();

                    refreshKkList(
                        _currentQ,
                        parseInt(link.dataset.page)
                    );
                });
            });
    }

    // ─────────────────────────────────────────────────────────────
    // CLUSTER FILTER
    // ─────────────────────────────────────────────────────────────

    function renderClusterFilter(clusters) {

        const { kkClusterFilter } = dom;

        if (!kkClusterFilter) return;

        if (!clusters.length) {

            kkClusterFilter.classList.add('d-none');
            kkClusterFilter.innerHTML = '';

            return;
        }

        kkClusterFilter.classList.remove('d-none');

        kkClusterFilter.innerHTML = '';

        const allBtn = document.createElement('button');

        allBtn.className = `
            btn btn-sm
            ${_currentCluster === ''
                ? 'btn-primary'
                : 'btn-outline-secondary'}
        `;

        allBtn.innerHTML = `
            <i class="mdi mdi-home-group me-1"></i>
            Semua Blok
        `;

        allBtn.addEventListener('click', () => {

            _currentCluster = '';

            refreshKkList(_currentQ, 1);
        });

        kkClusterFilter.appendChild(allBtn);

        clusters.forEach(cluster => {

            const btn = document.createElement('button');

            btn.className = `
                btn btn-sm
                ${_currentCluster === cluster
                    ? 'btn-primary'
                    : 'btn-outline-secondary'}
            `;

            btn.textContent = cluster;

            btn.addEventListener('click', () => {

                _currentCluster = cluster;

                refreshKkList(_currentQ, 1);
            });

            kkClusterFilter.appendChild(btn);
        });
    }

    // Skeleton placeholder cards
    function _skeletonCards(count = 3) {
        return Array.from({ length: count }, () => `
            <div class="col-sm-6 col-lg-4">
                <div class="card h-100 border" aria-hidden="true">
                    <div class="card-body">
                        <div class="d-flex align-items-start mb-2">
                            <div class="rounded-circle me-2 flex-shrink-0 placeholder-glow"
                                style="width:40px;height:40px">
                                <span class="placeholder rounded-circle w-100 h-100 d-block"></span>
                            </div>
                            <div class="w-100 placeholder-glow">
                                <h5 class="card-title mb-1">
                                    <span class="placeholder col-7"></span>
                                </h5>
                                <span class="placeholder col-4 fs-12"></span>
                                <div class="mt-1">
                                    <span class="placeholder col-3 rounded-pill"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer py-2 border-top d-flex align-items-center justify-content-between placeholder-glow">
                        <span class="placeholder col-2 rounded"></span>
                        <span class="placeholder col-2 rounded"></span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ── Modal KK ──────────────────────────────────────────────────

    function bukaModalTambahKk() {
        ModalManager.open({
            title     : '<i class="bx bx-home-plus me-2 text-primary"></i>Tambah Kartu Keluarga',
            content   : FormTemplates.kk(null, RT_LIST, ROLE, PERUMAHAN_LIST, CLUSTER_LIST),
            saveLabel : 'Simpan KK',
            size      : 'lg',   // form lebih panjang karena ada data warga
            onSave    : () => submitKk(null),
        });
        initFormKkEvents();
    }

    async function bukaModalEditKk(uuid) {
        const res = await Api.get(`/kk/${uuid}`);
        if (!res.ok) { Toast?.error('Gagal memuat data KK.'); return; }

        const data = res.data?.data || res.data;
        ModalManager.open({
            title     : '<i class="bx bx-edit me-2 text-warning"></i>Edit Kartu Keluarga',
            content   : FormTemplates.kk(data, RT_LIST, ROLE, PERUMAHAN_LIST, CLUSTER_LIST),
            saveLabel : 'Perbarui KK',
            onSave    : () => submitKk(uuid),
        });
        initFormKkEvents();
    }

    async function hapusKk(uuid, namaKepala) {
        const { panelAnggota, btnTambahWrg } = dom;

        if (!confirm(`Hapus KK atas nama "${namaKepala}"?\n\nSemua anggota dalam KK ini juga akan ikut dihapus.`)) return;

        const res = await Api.delete(`/kk/${uuid}`);

        if (res.ok) {
            Toast?.success('KK berhasil dihapus.');
            if (WargaState.activeKk?.uuid === uuid) {
                panelAnggota?.classList.add('d-none');
                WargaState.activeKk = null;
                if (btnTambahWrg) btnTambahWrg.disabled = true;
            }
            await refreshKkList();
        } else {
            Toast?.error(res.data?.message || 'Gagal menghapus KK.');
        }
    }

    function initFormKkEvents() {
        const tglInput = document.getElementById('kkTglLahir');
        if (tglInput) {
            flatpickr(tglInput, {
                dateFormat: "Y-m-d", // sesuaikan format
                altFormat: "d-m-Y",
                allowInput: false,
                disableMobile: "true",
            });
        }
        // Numeric only untuk no_kk
        document.getElementById('kkNoKk')?.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '').slice(0, 16);
        });

        // Auto-fill rt_display, rw_display, rw_id saat RT dipilih
        const kkRtId = document.getElementById('kkRtId');
        if (kkRtId) {
            kkRtId.addEventListener('change', function () {
                const selected = this.options[this.selectedIndex];
                const kodeRt   = selected?.dataset.kodeRt ?? '';
                const kodeRw   = selected?.dataset.kodeRw ?? '';
                const rwId     = selected?.dataset.rwId   ?? '';

                const rtDisplay = document.getElementById('kkRtDisplay');
                const rwDisplay = document.getElementById('kkRwDisplay');
                const rwIdField = document.getElementById('kkRwId');

                if (rtDisplay) rtDisplay.value = kodeRt;
                if (rwDisplay) rwDisplay.value = kodeRw;
                if (rwIdField) rwIdField.value = rwId;
            });
        }

        // Numeric only + cek NIK duplikat (hanya saat tambah baru)
        const nikInput = document.getElementById('kkNik');
        if (nikInput) {
            nikInput.addEventListener('input', function () {
                this.value = this.value.replace(/\D/g, '').slice(0, 16);
                // Reset indikator
                document.getElementById('kkNikLoader')?.classList.add('d-none');
                document.getElementById('kkNikOk')?.classList.add('d-none');
                document.getElementById('kkNikErr')?.classList.add('d-none');
            });

            nikInput.addEventListener('blur', async function () {
                const nik = this.value.trim();
                if (nik.length !== 16) return;

                document.getElementById('kkNikLoader')?.classList.remove('d-none');
                document.getElementById('kkNikOk')?.classList.add('d-none');
                document.getElementById('kkNikErr')?.classList.add('d-none');

                try {
                    const res = await Api.get(`/warga/cek-nik?nik=${nik}`);
                    document.getElementById('kkNikLoader')?.classList.add('d-none');
                    if (res.data?.exists) {
                        document.getElementById('kkNikErr')?.classList.remove('d-none');
                        document.getElementById('errKkNik').textContent = 'NIK sudah terdaftar.';
                        nikInput.classList.add('is-invalid');
                    } else {
                        document.getElementById('kkNikOk')?.classList.remove('d-none');
                        nikInput.classList.remove('is-invalid');
                        document.getElementById('errKkNik').textContent = '';
                    }
                } catch {
                    document.getElementById('kkNikLoader')?.classList.add('d-none');
                }
            });
        }

        // Cascading perumahan → cluster
        const kkPerumahanId = document.getElementById('kkPerumahanId');
        const kkClusterId   = document.getElementById('kkClusterId');

        if (kkPerumahanId && kkClusterId) {
            kkPerumahanId.addEventListener('change', function () {
                const pid = this.value;

                // Reset cluster
                kkClusterId.innerHTML = '<option value="">-- Pilih Cluster --</option>';

                if (!pid) {
                    kkClusterId.disabled = true;
                    return;
                }

                // Filter cluster sesuai perumahan
                const filtered = CLUSTER_LIST.filter(c => String(c.perumahan_id) === String(pid));
                filtered.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value       = c.id;
                    opt.textContent = c.nama_cluster;
                    kkClusterId.appendChild(opt);
                });

                kkClusterId.disabled = filtered.length === 0;
            });
        }

        // Auto-sync nama kepala KK → nama warga
        document.getElementById('kkKepala')?.addEventListener('input', function () {
            // Tidak ada field nama terpisah untuk warga di form KK
            // nama_lengkap diambil dari kepala_keluarga di backend
        });
    }

    // ── Submit KK ─────────────────────────────────────────────────

    async function submitKk(editUuid) {
        const isEdit = !!editUuid;

        const noKk   = document.getElementById('kkNoKk')?.value.trim();
        const kepala = document.getElementById('kkKepala')?.value.trim();
        const rtId   = document.getElementById('kkRtId')?.value;

        // Validasi KK
        const errors = [];

        // no_kk: wajib saat tambah baru
        // saat edit: field readonly, skip validasi (tidak bisa diubah)
        if (!isEdit) {
            if (!noKk || noKk.length !== 16 || !/^\d+$/.test(noKk))
                errors.push('Nomor KK harus 16 digit angka.');
        }

        if (!kepala)
            errors.push('Nama kepala keluarga wajib diisi.');
        if (ROLE !== 'rt' && !isEdit && !rtId)
            errors.push('RT wajib dipilih.');

        // Validasi NIK (hanya saat tambah baru)
        if (!isEdit) {
            const nik = document.getElementById('kkNik')?.value.trim();
            if (!nik || nik.length !== 16 || !/^\d+$/.test(nik))
                errors.push('NIK kepala keluarga harus 16 digit angka.');
            if (document.getElementById('kkNik')?.classList.contains('is-invalid'))
                errors.push('NIK sudah terdaftar, gunakan NIK lain.');
        }

        if (errors.length) { ModalManager.setError(errors[0]); return false; }

        // ── Build payload ──────────────────────────────────────────
        const payload = {
            no_kk           : noKk,
            kepala_keluarga : kepala,
            rt_id           : rtId || undefined,
            rw_id           : document.getElementById('kkRwId')?.value || null,
            alamat          : document.getElementById('kkAlamat')?.value.trim() || null,
            alamat_sekarang : document.getElementById('kkAlamatSekarang')?.value.trim() || null,
            perumahan_id    : document.getElementById('kkPerumahanId')?.value || null,
            cluster_id      : document.getElementById('kkClusterId')?.value || null,
            no_rumah        : document.getElementById('kkNoRumah')?.value.trim() || null,
            rt_display      : document.getElementById('kkRtDisplay')?.value.trim() || null,
            rw_display      : document.getElementById('kkRwDisplay')?.value.trim() || null,
            kode_pos        : document.getElementById('kkKodePos')?.value.trim() || null,
            is_active       : document.getElementById('kkIsActive')?.value ?? 1,
        };

        // Data warga kepala keluarga (hanya saat tambah baru)
        if (!isEdit) {
            payload.nik               = document.getElementById('kkNik')?.value.trim() || null;
            payload.tempat_lahir      = document.getElementById('kkTempatLahir')?.value.trim() || null;
            payload.tanggal_lahir     = document.getElementById('kkTglLahir')?.value || null;
            payload.jenis_kelamin     = document.querySelector('input[name="jenis_kelamin"]:checked')?.value || 'L';
            payload.agama             = document.getElementById('kkAgama')?.value || null;
            payload.status_perkawinan = document.getElementById('kkStatusKawin')?.value || null;
            payload.pendidikan        = document.getElementById('kkPendidikan')?.value || null;
            payload.pekerjaan         = document.getElementById('kkPekerjaan')?.value.trim() || null;
            payload.telp              = document.getElementById('kkTelp')?.value.trim() || null;
            payload.status_hidup      = document.getElementById('kkStatusHidup')?.value || 'hidup';
            payload.status_domisili   = document.getElementById('kkStatusDomisili')?.value || 'tetap';
        }

        try {
            const res = isEdit
                ? await Api.put(`/kk/${editUuid}`, payload)
                : await Api.post('/kk', payload);

            if (res.ok) {
                // Tampilkan kredensial akun jika ada (tambah baru)
                const akun = res.data?.data?.akun;
                if (akun) {
                    Toast?.success(`KK berhasil ditambahkan. Akun: ${akun.username} / ${akun.password_sementara}`);
                    // Tampilkan modal info kredensial
                    _tampilKredensial(akun, kepala);
                } else {
                    Toast?.success(isEdit ? 'KK diperbarui.' : 'KK berhasil ditambahkan.');
                }
                await refreshKkList();
                return true;
            }

            const d = res.data;
            ModalManager.setError(
                d.messages?.no_kk?.[0]  ||
                d.messages?.nik?.[0]    ||
                d.message               ||
                'Gagal menyimpan.'
            );
            return false;
        } catch {
            ModalManager.setError('Koneksi bermasalah.');
            return false;
        }
    }

    // ── Tampilkan kredensial akun baru ────────────────────────────

    function _tampilKredensial(akun, namaKepala) {
        // Buka modal info kredensial setelah modal KK ditutup
        setTimeout(() => {
            ModalManager.open({
                title    : '<i class="bx bx-key me-2 text-success"></i>Akun Warga Dibuat',
                content  : `
                    <div class="alert alert-warning d-flex gap-2 py-2 small mb-3">
                        <i class="bx bx-error flex-shrink-0 mt-1"></i>
                        <span>Catat kredensial ini sekarang. Tidak akan ditampilkan lagi.</span>
                    </div>
                    <table class="table table-sm table-borderless mb-3">
                        <tr>
                            <td class="text-muted small" style="width:40%">Nama</td>
                            <td class="fw-semibold small">${namaKepala}</td>
                        </tr>
                        <tr>
                            <td class="text-muted small">Username</td>
                            <td>
                                <code class="fw-semibold">${akun.username}</code>
                                <button class="btn btn-sm btn-link p-0 ms-2"
                                        onclick="navigator.clipboard.writeText('${akun.username}')">
                                    <i class="bx bx-copy"></i>
                                </button>
                            </td>
                        </tr>
                        <tr>
                            <td class="text-muted small">Password sementara</td>
                            <td>
                                <code class="fw-semibold">${akun.password_sementara}</code>
                                <button class="btn btn-sm btn-link p-0 ms-2"
                                        onclick="navigator.clipboard.writeText('${akun.password_sementara}')">
                                    <i class="bx bx-copy"></i>
                                </button>
                            </td>
                        </tr>
                    </table>
                    <p class="small text-muted mb-0">${akun.catatan}</p>`,
                saveLabel  : 'Tutup',
                hideCancelBtn: true,
                onSave     : () => true,
            });
        }, 300);
    }

    // ─────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────

    return {
        init,
        renderKkGrid,
        pilihKk,
        refreshKkList,
        bukaModalTambahKk,
        bukaModalEditKk,
        hapusKk,
    };

})();

// AUTO INIT
document.addEventListener('DOMContentLoaded', () => {
    window.WargaKk.init();
});