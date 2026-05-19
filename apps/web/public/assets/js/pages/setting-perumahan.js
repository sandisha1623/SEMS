'use strict';

/**
 * setting-perumahan.js
 *
 * Tanggung jawab:
 *   - Render list perumahan
 *   - Render list cluster (dengan filter perumahan)
 *   - CRUD perumahan & cluster via ModalManager + Api
 */

const SettingPerumahan = (() => {

    const _cfg      = window.SETTING_PERUMAHAN ?? {};
    let   perumahan = _cfg.perumahan ?? [];
    let   clusters  = _cfg.clusters  ?? [];
    const _api      = _cfg.api ?? {};

    // ── Util ──────────────────────────────────────────────────────

    function esc(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ── Render Perumahan ──────────────────────────────────────────

    function renderPerumahan() {
        const list  = document.getElementById('listPerumahan');
        const empty = document.getElementById('emptyPerumahan');
        if (!list) return;

        if (!perumahan.length) {
            empty?.classList.remove('d-none');
            list.innerHTML = '';
            renderPerumahanFilter();
            return;
        }
        empty?.classList.add('d-none');

        list.innerHTML = perumahan.map(p => `
            <li class="list-group-item d-flex align-items-center justify-content-between px-3 py-2">
                <div>
                    <span class="fw-medium">${esc(p.nama_perumahan)}</span>
                    ${p.kode_perumahan
                        ? `<span class="badge bg-secondary-subtle text-secondary ms-2 fs-11">${esc(p.kode_perumahan)}</span>`
                        : ''}
                </div>
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-icon btn-outline-warning btn-edit-perumahan"
                            data-uuid="${esc(p.uuid)}"
                            data-nama="${esc(p.nama_perumahan)}"
                            data-kode="${esc(p.kode_perumahan || '')}"
                            title="Edit">
                        <span class="mdi mdi-square-edit-outline fs-16"></span>
                    </button>
                    <button class="btn btn-sm btn-icon btn-outline-danger btn-hapus-perumahan"
                            data-uuid="${esc(p.uuid)}"
                            data-nama="${esc(p.nama_perumahan)}"
                            title="Hapus">
                        <span class="mdi mdi-delete-outline fs-16"></span>
                    </button>
                </div>
            </li>
        `).join('');

        list.querySelectorAll('.btn-edit-perumahan').forEach(btn => {
            btn.addEventListener('click', () =>
                editPerumahan(btn.dataset.uuid, btn.dataset.nama, btn.dataset.kode)
            );
        });
        list.querySelectorAll('.btn-hapus-perumahan').forEach(btn => {
            btn.addEventListener('click', () =>
                hapusPerumahan(btn.dataset.uuid, btn.dataset.nama)
            );
        });

        renderPerumahanFilter();
    }

    function renderPerumahanFilter() {
        const select = document.getElementById('filterPerumahanCluster');
        if (!select) return;

        const current = select.value;
        select.innerHTML = '<option value="">Semua Perumahan</option>';

        perumahan.forEach(p => {
            const opt = document.createElement('option');
            opt.value       = p.id;
            opt.textContent = p.nama_perumahan;
            if (String(p.id) === current) opt.selected = true;
            select.appendChild(opt);
        });
    }

    // ── Render Cluster ────────────────────────────────────────────

    function renderCluster(filterPerumahanId = null) {
        const list  = document.getElementById('listCluster');
        const empty = document.getElementById('emptyCluster');
        if (!list) return;

        const filtered = filterPerumahanId
            ? clusters.filter(c => String(c.perumahan_id) === String(filterPerumahanId)) 
            : clusters;

        if (!filtered.length) {
            empty?.classList.remove('d-none');
            list.innerHTML = '';
            return;
        }
        empty?.classList.add('d-none');

        list.innerHTML = filtered.map(c => {
            const namaP = perumahan.find(p => p.id === c.perumahan_id)?.nama_perumahan ?? '-';
            return `
                <li class="list-group-item d-flex align-items-center justify-content-between px-3 py-2">
                    <div>
                        <span class="fw-medium">${esc(c.nama_cluster)}</span>
                        ${c.kode_cluster
                            ? `<span class="badge bg-secondary-subtle text-secondary ms-1 fs-11">${esc(c.kode_cluster)}</span>`
                            : ''}
                        <small class="text-muted ms-2">· ${esc(namaP)}</small>
                    </div>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-icon btn-outline-warning btn-edit-cluster"
                                data-uuid="${esc(c.uuid)}"
                                data-nama="${esc(c.nama_cluster)}"
                                data-kode="${esc(c.kode_cluster || '')}"
                                data-perumahan-id="${c.perumahan_id}"
                                title="Edit">
                            <span class="mdi mdi-square-edit-outline fs-16"></span>
                        </button>
                        <button class="btn btn-sm btn-icon btn-outline-danger btn-hapus-cluster"
                                data-uuid="${esc(c.uuid)}"
                                data-nama="${esc(c.nama_cluster)}"
                                title="Hapus">
                            <span class="mdi mdi-delete-outline fs-16"></span>
                        </button>
                    </div>
                </li>
            `;
        }).join('');

        list.querySelectorAll('.btn-edit-cluster').forEach(btn => {
            btn.addEventListener('click', () =>
                editCluster(btn.dataset.uuid, btn.dataset.nama, btn.dataset.kode, +btn.dataset.perumahanId)
            );
        });
        list.querySelectorAll('.btn-hapus-cluster').forEach(btn => {
            btn.addEventListener('click', () =>
                hapusCluster(btn.dataset.uuid, btn.dataset.nama)
            );
        });
    }

    // ── Form templates ────────────────────────────────────────────

    function formPerumahan(nama = '', kode = '') {
        return `
            <div class="mb-3">
                <label class="form-label fw-medium">
                    Nama Perumahan <span class="text-danger">*</span>
                </label>
                <input type="text" class="form-control" id="inputNamaPerumahan"
                       value="${esc(nama)}" placeholder="Contoh: Grand Singhajaya">
            </div>
            <div class="mb-0">
                <label class="form-label fw-medium">
                    Kode Perumahan <small class="text-muted fw-normal">(opsional)</small>
                </label>
                <input type="text" class="form-control" id="inputKodePerumahan"
                       value="${esc(kode)}" placeholder="Contoh: GS1">
                <div class="form-text">Kode singkat untuk identifikasi perumahan.</div>
            </div>`;
    }

    function perumahanOptions(selectedId = null) {
        return perumahan.map(p => `
            <option value="${p.id}" ${String(p.id) === String(selectedId) ? 'selected' : ''}>
                ${esc(p.nama_perumahan)}
            </option>
        `).join('');
    }

    function formCluster(nama = '', kode = '', perumahanId = null) {
        return `
            <div class="mb-3">
                <label class="form-label fw-medium">
                    Perumahan <span class="text-danger">*</span>
                </label>
                <select class="form-select" id="inputPerumahanCluster">
                    <option value="">-- Pilih Perumahan --</option>
                    ${perumahanOptions(perumahanId)}
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label fw-medium">
                    Nama Cluster / Blok <span class="text-danger">*</span>
                </label>
                <input type="text" class="form-control" id="inputNamaCluster"
                       value="${esc(nama)}" placeholder="Contoh: Alessandria">
            </div>
            <div class="mb-0">
                <label class="form-label fw-medium">
                    Kode Cluster <small class="text-muted fw-normal">(opsional)</small>
                </label>
                <input type="text" class="form-control" id="inputKodeCluster"
                       value="${esc(kode)}" placeholder="Contoh: AL">
            </div>`;
    }

    // ── CRUD Perumahan ────────────────────────────────────────────

    function tambahPerumahan() {
        ModalManager.open({
            title    : '<i class="bx bx-buildings me-2 text-primary"></i>Tambah Perumahan',
            content  : formPerumahan(),
            size     : 'md',
            saveLabel: 'Simpan Perumahan',
            onSave   : async () => {
                const nama = document.getElementById('inputNamaPerumahan')?.value.trim();
                const kode = document.getElementById('inputKodePerumahan')?.value.trim();

                if (!nama) {
                    ModalManager.setError('Nama perumahan wajib diisi.');
                    return false;
                }

                const res = await Api.post(_api.perumahan, {
                    nama_perumahan: nama,
                    kode_perumahan: kode || null,
                });

                if (res.ok) {
                    perumahan = res.data.data;
                    renderPerumahan();
                    await loadWilayah();
                    Toast?.success('Perumahan berhasil ditambahkan.');
                    return true;
                }

                ModalManager.setError(res.data?.message || 'Gagal menyimpan.');
                return false;
            },
        });
    }

    function editPerumahan(uuid, namaSaat, kodeSaat) {
        ModalManager.open({
            title    : '<i class="bx bx-edit me-2 text-warning"></i>Edit Perumahan',
            content  : formPerumahan(namaSaat, kodeSaat),
            size     : 'md',
            saveLabel: 'Perbarui',
            onSave   : async () => {
                const nama = document.getElementById('inputNamaPerumahan')?.value.trim();
                const kode = document.getElementById('inputKodePerumahan')?.value.trim();

                if (!nama) {
                    ModalManager.setError('Nama perumahan wajib diisi.');
                    return false;
                }

                const res = await Api.put(`${_api.perumahan}/${uuid}`, {
                    nama_perumahan: nama,
                    kode_perumahan: kode || null,
                });

                if (res.ok) {
                    perumahan = res.data.data;
                    renderPerumahan();
                    renderCluster(); // update label perumahan di list cluster
                    Toast?.success('Perumahan diperbarui.');
                    return true;
                }

                ModalManager.setError(res.data?.message || 'Gagal memperbarui.');
                return false;
            },
        });
    }

    async function hapusPerumahan(uuid, nama) {
        if (!confirm(`Hapus perumahan "${nama}"?\n\nSemua cluster dalam perumahan ini juga akan dihapus.`)) return;

        const res = await Api.delete(`${_api.perumahan}/${uuid}`);

        if (res.ok) {
            perumahan = res.data.data;
            // Refresh cluster dari server agar sinkron
            const rc = await Api.get(_api.clusters);
            if (rc.ok) clusters = rc.data.data;
            renderPerumahan();
            renderCluster();
            Toast?.success('Perumahan berhasil dihapus.');
        } else {
            Toast?.error(res.data?.message || 'Gagal menghapus.');
        }
    }

    // ── CRUD Cluster ──────────────────────────────────────────────

    function tambahCluster() {
        if (!perumahan.length) {
            Toast?.error('Tambahkan perumahan terlebih dahulu.');
            return;
        }
        ModalManager.open({
            title    : '<i class="bx bx-map-pin me-2 text-primary"></i>Tambah Cluster',
            content  : formCluster(),
            size     : 'md',
            saveLabel: 'Simpan Cluster',
            onSave   : async () => {
                const nama        = document.getElementById('inputNamaCluster')?.value.trim();
                const kode        = document.getElementById('inputKodeCluster')?.value.trim();
                const perumahanId = +document.getElementById('inputPerumahanCluster')?.value;

                if (!perumahanId) {
                    ModalManager.setError('Perumahan wajib dipilih.');
                    return false;
                }
                if (!nama) {
                    ModalManager.setError('Nama cluster wajib diisi.');
                    return false;
                }

                /*const res = await Api.post(_api.clusters, {
                    nama_cluster : nama,
                    kode_cluster : kode || null,
                    perumahan_id : perumahanId,
                });*/
                const payload = {
                    nama_cluster : nama,
                    kode_cluster : kode || null,
                    perumahan_id : perumahanId,
                };
                console.log('payload cluster:', payload);
                const res = await Api.post(_api.clusters, payload);

                if (res.ok) {
                    clusters = res.data.data;
                    renderCluster();
                    Toast?.success('Cluster berhasil ditambahkan.');
                    return true;
                }

                ModalManager.setError(res.data?.message || 'Gagal menyimpan.');
                return false;
            },
        });
    }

    function editCluster(uuid, namaSaat, kodeSaat, perumahanIdSaat) {
        ModalManager.open({
            title    : '<i class="bx bx-edit me-2 text-warning"></i>Edit Cluster',
            content  : formCluster(namaSaat, kodeSaat, perumahanIdSaat),
            size     : 'md',
            saveLabel: 'Perbarui',
            onSave   : async () => {
                const nama        = document.getElementById('inputNamaCluster')?.value.trim();
                const kode        = document.getElementById('inputKodeCluster')?.value.trim();
                const perumahanId = +document.getElementById('inputPerumahanCluster')?.value;

                if (!perumahanId) {
                    ModalManager.setError('Perumahan wajib dipilih.');
                    return false;
                }
                if (!nama) {
                    ModalManager.setError('Nama cluster wajib diisi.');
                    return false;
                }

                const res = await Api.put(`${_api.clusters}/${uuid}`, {
                    nama_cluster : nama,
                    kode_cluster : kode || null,
                    perumahan_id : perumahanId,
                });

                if (res.ok) {
                    clusters = res.data.data;
                    renderCluster();
                    Toast?.success('Cluster diperbarui.');
                    return true;
                }

                ModalManager.setError(res.data?.message || 'Gagal memperbarui.');
                return false;
            },
        });
    }

    async function hapusCluster(uuid, nama) {
        if (!confirm(`Hapus cluster "${nama}"?`)) return;

        const res = await Api.delete(`${_api.clusters}/${uuid}`);

        if (res.ok) {
            clusters = res.data.data;
            renderCluster();
            Toast?.success('Cluster berhasil dihapus.');
        } else {
            Toast?.error(res.data?.message || 'Gagal menghapus.');
        }
    }

    // ── Render Wilayah (Manajemen Wilayah tab) ────────────────────

    async function loadWilayah() {
        const grid    = document.getElementById('gridWilayah');
        const empty   = document.getElementById('emptyWilayah');
        const loading = document.getElementById('loadingWilayah');
        if (!grid) return;

        loading?.classList.remove('d-none');
        empty?.classList.add('d-none');
        grid.innerHTML = '';

        const res = await Api.get(_api.summary);
        loading?.classList.add('d-none');

        if (!res.ok) return;

        const data = res.data?.data || [];

        if (!data.length) {
            empty?.classList.remove('d-none');
            return;
        }

        grid.innerHTML = data.map(p => {
            const clusterBadges = p.clusters.length
                ? p.clusters.map(c => `
                    <span class="badge rounded-pill text-bg-light px-2 py-2 fs-12">
                        ${esc(c.nama_cluster.toUpperCase())}
                    </span>`
                ).join('')
                : `<span class="text-white-50 small">Belum ada cluster</span>`;

            return `
                <div class="col-md-6 col-xl-6">
                    <div class="card text-bg-primary h-100">
                        <div class="card-body">
                            <div class="card-item d-flex align-items-center justify-content-between mb-3">
                                <div class="card-wrapper">
                                    <h5 class="card-title mb-0">${esc(p.nama_perumahan)}</h5>
                                    <span class="small opacity-75">
                                        Total: ${p.total_kk} KK Terdaftar
                                    </span>
                                </div>
                            </div>
                            <div class="card-block d-flex gap-2 flex-wrap">
                                ${clusterBadges}
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    // ── Init ──────────────────────────────────────────────────────

    document.getElementById('btnTambahPerumahan')
        ?.addEventListener('click', tambahPerumahan);

    document.getElementById('btnTambahCluster')
        ?.addEventListener('click', tambahCluster);

    document.getElementById('filterPerumahanCluster')
        ?.addEventListener('change', function () {
            const id = +this.value || null;
            renderCluster(id);
        });

    // Tab Manajemen Wilayah — load saat diklik
    document.getElementById('v-pills-profile-tab')
        ?.addEventListener('shown.bs.tab', () => loadWilayah());

    // Render awal — dibungkus async IIFE
    (async () => {
        renderPerumahan();
        renderCluster();
        await loadWilayah();
    })();

})();