'use strict';

/**
 * warga.js
 *
 * Halaman Data Warga — KK-first approach.
 * Depends on: Api, Toast, ModalManager, FormTemplates, Bootstrap 5
 *
 * Data PHP:
 *   window.__KK_LIST__ → array KK sesuai scope role
 *   window.__RT_LIST__ → array RT (untuk admin saat tambah KK)
 *   window.__ROLE__    → role user yang login
 */

(function () {

    const KK_LIST = window.__KK_LIST__ || [];
    const RT_LIST = window.__RT_LIST__ || [];
    const ROLE    = window.__ROLE__    || 'rt';

    let activeKk  = null;
    let isLoading = false;

    // ── DOM refs ──────────────────────────────────────────────────
    const kkGrid       = document.getElementById('kkGrid');
    const kkEmpty      = document.getElementById('kkEmpty');
    const kkSearch     = document.getElementById('kkSearch');
    const panelAnggota = document.getElementById('panelAnggota');
    const panelKkNama  = document.getElementById('panelKkNama');
    const panelKkInfo  = document.getElementById('panelKkInfo');
    const btnTutupPanel= document.getElementById('btnTutupPanel');
    const btnTambahKk  = document.getElementById('btnTambahKk');
    const btnTambahWrg = document.getElementById('btnTambahWarga');
    const tabelBody    = document.getElementById('tabelAnggotaBody');
    const infoTotal    = document.getElementById('infoTotal');

    // ══════════════════════════════════════════════════════════════
    // INIT
    // ══════════════════════════════════════════════════════════════

    renderKkGrid(KK_LIST);
    bindEvents();

    // Role warga: langsung load profil tanpa pilih KK
    if (ROLE === 'warga') {
        panelAnggota?.classList.remove('d-none');
        loadAnggotaWarga();
    }

    // ══════════════════════════════════════════════════════════════
    // RENDER GRID KK
    // ══════════════════════════════════════════════════════════════

    function renderKkGrid(list) {
        if (!kkGrid) return;
        kkGrid.innerHTML = '';

        if (!list.length) {
            kkEmpty?.classList.remove('d-none');
            return;
        }
        kkEmpty?.classList.add('d-none');

        list.forEach(kk => {
            const col = document.createElement('div');
            col.className = 'col-sm-6 col-lg-4';
            col.innerHTML = `
                <div class="card kk-card h-100 border cursor-pointer"
                     data-uuid="${esc(kk.uuid)}"
                     data-id="${kk.id}"
                     data-kepala="${esc(kk.kepala_keluarga || '')}"
                     data-rt="${esc(kk.rt_display || '')}"
                     data-rw="${esc(kk.rw_display || '')}"
                     data-rt-id="${kk.rt_id || ''}"
                     data-alamat="${esc(kk.alamat || '')}">
                    <div class="card-body pb-2">
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <div class="avatar flex-shrink-0">
                                <span class="avatar-initial rounded-circle bg-label-primary fw-bold">
                                    ${esc((kk.kepala_keluarga || 'K').charAt(0).toUpperCase())}
                                </span>
                            </div>
                            <div class="overflow-hidden">
                                <p class="mb-0 fw-semibold text-truncate">${esc(kk.kepala_keluarga || '-')}</p>
                                <small class="text-muted text-truncate d-block">${esc(kk.alamat || '-')}</small>
                            </div>
                        </div>
                        <div class="d-flex gap-1 flex-wrap">
                            ${kk.rt_display ? `<span class="badge bg-label-info">RT ${esc(kk.rt_display)}</span>` : ''}
                            ${kk.rw_display ? `<span class="badge bg-label-secondary">RW ${esc(kk.rw_display)}</span>` : ''}
                        </div>
                    </div>
                    <div class="card-footer py-2 bg-transparent border-top d-flex align-items-center justify-content-between">
                        <small class="text-muted">
                            <i class="bx bx-chevron-right me-1"></i>Lihat anggota
                        </small>
                        ${['administrator','rt'].includes(ROLE) ? `
                        <div class="d-flex gap-1" data-action="kk-aksi">
                            <button class="btn btn-sm btn-icon btn-outline-warning btn-edit-kk"
                                    data-uuid="${esc(kk.uuid)}"
                                    title="Edit KK">
                                <i class="bx bx-edit"></i>
                            </button>
                            ${ROLE === 'administrator' ? `
                            <button class="btn btn-sm btn-icon btn-outline-danger btn-hapus-kk"
                                    data-uuid="${esc(kk.uuid)}"
                                    data-kepala="${esc(kk.kepala_keluarga || '')}"
                                    title="Hapus KK">
                                <i class="bx bx-trash"></i>
                            </button>` : ''}
                        </div>` : ''}
                    </div>
                </div>`;

            // Klik kartu → pilih KK (stop propagation dari tombol aksi)
            col.querySelector('.kk-card').addEventListener('click', function (e) {
                // Jika klik dari tombol aksi, jangan pilih KK
                if (e.target.closest('[data-action="kk-aksi"]')) return;
                pilihKk({
                    uuid  : this.dataset.uuid,
                    id    : this.dataset.id,
                    kepala: this.dataset.kepala,
                    rt    : this.dataset.rt,
                    rw    : this.dataset.rw,
                    rt_id : this.dataset.rtId,
                    alamat: this.dataset.alamat,
                });
            });

            // Tombol edit KK
            col.querySelector('.btn-edit-kk')?.addEventListener('click', e => {
                e.stopPropagation();
                bukaModalEditKk(e.currentTarget.dataset.uuid);
            });

            // Tombol hapus KK
            col.querySelector('.btn-hapus-kk')?.addEventListener('click', e => {
                e.stopPropagation();
                hapusKk(e.currentTarget.dataset.uuid, e.currentTarget.dataset.kepala);
            });

            kkGrid.appendChild(col);
        });
    }

    function pilihKk(kk) {
        activeKk = kk;

        // Highlight kartu aktif
        kkGrid?.querySelectorAll('.kk-card').forEach(c => {
            c.classList.toggle('border-primary', c.dataset.uuid === kk.uuid);
            c.classList.toggle('shadow-sm',      c.dataset.uuid === kk.uuid);
        });

        // Update header panel
        if (panelKkNama) panelKkNama.textContent = kk.kepala;
        if (panelKkInfo) panelKkInfo.textContent = [
            kk.rt     ? `RT ${kk.rt}`   : '',
            kk.rw     ? `RW ${kk.rw}`   : '',
            kk.alamat || '',
        ].filter(Boolean).join(' · ');

        // Tampilkan panel dan aktifkan tombol tambah warga
        panelAnggota?.classList.remove('d-none');
        panelAnggota?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (btnTambahWrg) btnTambahWrg.disabled = false;

        loadAnggotaKk(kk.uuid);
    }

    // ══════════════════════════════════════════════════════════════
    // LOAD ANGGOTA
    // ══════════════════════════════════════════════════════════════

    async function loadAnggotaKk(kkUuid) {
        if (isLoading) return;
        isLoading = true;
        tabelBody.innerHTML = rowLoading();

        try {
            const res = await Api.get(`/kk/${kkUuid}/anggota`);
            if (!res.ok) { tabelBody.innerHTML = rowError('Gagal memuat anggota.'); return; }

            const rows  = res.data?.data  || [];
            const total = res.data?.meta?.total ?? rows.length;

            if (infoTotal) infoTotal.textContent = `${total} anggota`;

            tabelBody.innerHTML = rows.length
                ? rows.map((w, i) => renderBaris(w, i, kkUuid)).join('')
                : rowKosong('Belum ada anggota dalam KK ini.');

            bindAksiBaris();
        } catch (err) {
            console.error(err);
            tabelBody.innerHTML = rowError('Koneksi bermasalah.');
        } finally {
            isLoading = false;
        }
    }

    async function loadAnggotaWarga() {
        if (!tabelBody) return;
        tabelBody.innerHTML = rowLoading();
        try {
            const res = await Api.get('/warga/profil');
            if (!res.ok) { tabelBody.innerHTML = rowError(); return; }

            const w  = res.data?.data || res.data;
            const kk = w.kartu_keluarga || {};

            if (panelKkNama) panelKkNama.textContent = kk.kepala_keluarga || 'Keluarga Saya';
            if (panelKkInfo) panelKkInfo.textContent = [
                kk.rt_display ? `RT ${kk.rt_display}` : '',
                kk.rw_display ? `RW ${kk.rw_display}` : '',
                kk.alamat     || '',
            ].filter(Boolean).join(' · ');

            if (infoTotal) infoTotal.textContent = '1 anggota';
            tabelBody.innerHTML = renderBaris(w, 0, '');
        } catch (err) {
            console.error(err);
            tabelBody.innerHTML = rowError();
        }
    }

    // ── Render baris tabel ────────────────────────────────────────
    function renderBaris(w, i, kkUuid) {
        const jk       = w.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan';
        const domisili = w.status_domisili === 'pindah'
            ? `<span class="badge bg-warning text-dark">Pindah</span>`
            : `<span class="badge bg-label-success">Tetap</span>`;
        const statusKk = (w.status_keluarga || '').replace(/_/g,' ')
            .replace(/\b\w/g, c => c.toUpperCase());

        const canEdit   = ['administrator','rt'].includes(ROLE);
        const canDelete = ROLE === 'administrator';

        const aksiEdit = canEdit
            ? `<button class="btn btn-sm btn-icon btn-outline-primary btn-edit-wrg"
                       data-uuid="${esc(w.uuid)}" data-kk="${esc(kkUuid)}"
                       title="Edit"><i class="bx bx-edit"></i></button>`
            : '';
        const aksiHapus = canDelete
            ? `<button class="btn btn-sm btn-icon btn-outline-danger btn-hapus-wrg"
                       data-uuid="${esc(w.uuid)}" data-kk="${esc(kkUuid)}"
                       title="Hapus"><i class="bx bx-trash"></i></button>`
            : '';

        return `<tr>
            <td class="ps-3 text-muted small">${i + 1}</td>
            <td>
                <span class="fw-semibold">${esc(w.nama_lengkap)}</span>
                <br><small class="text-muted">${esc(statusKk)}</small>
            </td>
            <td class="font-monospace small text-muted">${esc(w.nik || '••••••••••••••••')}</td>
            <td>${jk}</td>
            <td>${esc(w.agama || '-')}</td>
            <td>${domisili}</td>
            ${canEdit || canDelete ? `
            <td class="text-center">
                <div class="d-flex gap-1 justify-content-center">
                    ${aksiEdit}${aksiHapus}
                </div>
            </td>` : '<td></td>'}
        </tr>`;
    }

    function bindAksiBaris() {
        tabelBody.querySelectorAll('.btn-edit-wrg').forEach(btn => {
            btn.onclick = () => bukaModalEditWarga(btn.dataset.uuid, btn.dataset.kk);
        });
        tabelBody.querySelectorAll('.btn-hapus-wrg').forEach(btn => {
            btn.onclick = () => hapusWarga(btn.dataset.uuid, btn.dataset.kk);
        });
    }

    // ── Placeholder rows ──────────────────────────────────────────
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

    // ══════════════════════════════════════════════════════════════
    // MODAL KK
    // ══════════════════════════════════════════════════════════════

    function bukaModalTambahKk() {
        ModalManager.open({
            title     : '<i class="bx bx-home-plus me-2 text-primary"></i>Tambah Kartu Keluarga',
            content   : FormTemplates.kk(null, RT_LIST, ROLE),
            saveLabel : 'Simpan KK',
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
            content   : FormTemplates.kk(data, RT_LIST, ROLE),
            saveLabel : 'Perbarui KK',
            onSave    : () => submitKk(uuid),
        });
        initFormKkEvents();
    }

    function initFormKkEvents() {
        // Format no KK: hanya angka
        document.getElementById('kkNoKk')?.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '').slice(0, 16);
        });
    }

    async function submitKk(editUuid) {
        const form = document.getElementById('formKk');
        if (!form) return false;

        const noKk  = document.getElementById('kkNoKk')?.value.trim();
        const kepala= document.getElementById('kkKepala')?.value.trim();
        const rtId  = document.getElementById('kkRtId')?.value;

        const errors = [];
        if (!noKk || noKk.length !== 16 || !/^\d+$/.test(noKk))
            errors.push('Nomor KK harus 16 digit angka.');
        if (!kepala)
            errors.push('Nama kepala keluarga wajib diisi.');
        if (ROLE !== 'rt' && !editUuid && !rtId)
            errors.push('RT wajib dipilih.');

        if (errors.length) {
            ModalManager.setError(errors[0]);
            return false;
        }

        const payload = {
            no_kk          : noKk,
            kepala_keluarga: kepala,
            rt_id          : rtId || undefined,
            alamat         : document.getElementById('kkAlamat')?.value.trim()    || null,
            rt_display     : document.getElementById('kkRtDisplay')?.value.trim() || null,
            rw_display     : document.getElementById('kkRwDisplay')?.value.trim() || null,
            kode_pos       : document.getElementById('kkKodePos')?.value.trim()   || null,
            is_active      : document.getElementById('kkIsActive')?.value ?? 1,
        };

        try {
            const res = editUuid
                ? await Api.put(`/kk/${editUuid}`, payload)
                : await Api.post('/kk', payload);

            if (res.ok) {
                Toast?.success(editUuid ? 'KK diperbarui.' : 'KK berhasil ditambahkan.');
                await refreshKkList();
                return true; // tutup modal
            }

            const d = res.data;
            ModalManager.setError(d.messages?.no_kk?.[0] || d.message || 'Gagal menyimpan.');
            return false;
        } catch {
            ModalManager.setError('Koneksi bermasalah.');
            return false;
        }
    }

    // ── Refresh daftar KK setelah tambah/edit ────────────────────
    async function refreshKkList() {
        const res = await Api.get('/warga/kk-list');
        if (!res.ok) return;
        const list = res.data?.data || [];
        // Update KK_LIST in place
        KK_LIST.length = 0;
        list.forEach(k => KK_LIST.push(k));
        renderKkGrid(KK_LIST);
    }

    // ══════════════════════════════════════════════════════════════
    // MODAL WARGA
    // ══════════════════════════════════════════════════════════════

    function bukaModalTambahWarga() {
        if (!activeKk) { Toast?.error('Pilih KK terlebih dahulu.'); return; }

        ModalManager.open({
            title     : '<i class="bx bx-user-plus me-2 text-primary"></i>Tambah Anggota',
            content   : FormTemplates.warga(null, activeKk.kepala),
            saveLabel : 'Simpan Anggota',
            onSave    : () => submitWarga(null, activeKk.uuid),
        });
        initFormWargaEvents(null);
    }

    async function bukaModalEditWarga(wargaUuid, kkUuid) {
        const res = await Api.get(`/kk/${kkUuid}/anggota/${wargaUuid}`);
        if (!res.ok) { Toast?.error('Gagal memuat data warga.'); return; }

        const data = res.data?.data || res.data;
        const namaKk = activeKk?.kepala || '';

        ModalManager.open({
            title     : '<i class="bx bx-edit me-2 text-warning"></i>Edit Anggota',
            content   : FormTemplates.warga(data, namaKk),
            saveLabel : 'Perbarui',
            onSave    : () => submitWarga(wargaUuid, kkUuid),
        });
        initFormWargaEvents(data);
    }

    function initFormWargaEvents(existingData) {
        // NIK: hanya angka
        const wNik = document.getElementById('wNik');
        if (wNik && !existingData) {
            wNik.addEventListener('input', () => {
                wNik.value = wNik.value.replace(/\D/g, '').slice(0, 16);
                resetNikStatus();
            });
            wNik.addEventListener('blur', () => {
                const nik = wNik.value.trim();
                if (nik.length === 16) cekNikDuplikat(nik);
            });
        } else if (existingData) {
            document.getElementById('wNikOk')?.classList.remove('d-none');
        }

        // HP: hanya angka
        document.getElementById('wHp')?.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '').slice(0, 14);
        });

        // Nama: title case saat blur
        document.getElementById('wNama')?.addEventListener('blur', function () {
            this.value = this.value.split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');
        });
    }

    async function cekNikDuplikat(nik) {
        document.getElementById('wNikLoader')?.classList.remove('d-none');
        document.getElementById('wNikOk')?.classList.add('d-none');
        document.getElementById('wNikErr')?.classList.add('d-none');

        try {
            const res = await Api.get(`/warga/cek-nik?nik=${encodeURIComponent(nik)}`);
            if (res.ok && res.data.exists) {
                document.getElementById('wNikLoader')?.classList.add('d-none');
                document.getElementById('wNikErr')?.classList.remove('d-none');
                document.getElementById('errWNik') && (document.getElementById('errWNik').textContent = 'NIK sudah terdaftar.');
                document.getElementById('wNik')?.classList.add('is-invalid');
            } else {
                document.getElementById('wNikLoader')?.classList.add('d-none');
                document.getElementById('wNikOk')?.classList.remove('d-none');
            }
        } catch {
            document.getElementById('wNikLoader')?.classList.add('d-none');
        }
    }

    function resetNikStatus() {
        ['wNikLoader','wNikOk','wNikErr'].forEach(id =>
            document.getElementById(id)?.classList.add('d-none'));
        document.getElementById('wNik')?.classList.remove('is-invalid');
        if (document.getElementById('errWNik'))
            document.getElementById('errWNik').textContent = '';
    }

    async function submitWarga(editUuid, kkUuid) {
        const errors = [];

        const nik    = document.getElementById('wNik')?.value.trim();
        const nama   = document.getElementById('wNama')?.value.trim();
        const jk     = document.querySelector('[name="jenis_kelamin"]:checked');
        const tempat = document.getElementById('wTempatLahir')?.value.trim();
        const tgl    = document.getElementById('wTglLahir')?.value;
        const agama  = document.getElementById('wAgama')?.value;
        const stKaw  = document.getElementById('wStatusKawin')?.value;
        const stKk   = document.getElementById('wStatusKk')?.value;
        const email  = document.getElementById('wEmail')?.value.trim();

        if (!editUuid && (!nik || nik.length !== 16 || !/^\d+$/.test(nik)))
            errors.push('NIK harus 16 digit angka.');
        if (!nama || nama.length < 3) errors.push('Nama minimal 3 karakter.');
        if (!jk)    errors.push('Jenis kelamin wajib dipilih.');
        if (!tempat) errors.push('Tempat lahir wajib diisi.');
        if (!tgl)    errors.push('Tanggal lahir wajib diisi.');
        if (!agama)  errors.push('Agama wajib dipilih.');
        if (!stKaw)  errors.push('Status perkawinan wajib dipilih.');
        if (!stKk)   errors.push('Status dalam keluarga wajib dipilih.');
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.push('Format email tidak valid.');

        if (errors.length) {
            ModalManager.setError(errors[0]);
            return false;
        }

        const payload = {
            nik:               nik,
            nama_lengkap:      nama,
            jenis_kelamin:     jk?.value || '',
            tempat_lahir:      tempat,
            tanggal_lahir:     tgl,
            agama:             agama,
            pendidikan:        document.getElementById('wPendidikan')?.value  || null,
            pekerjaan:         document.getElementById('wPekerjaan')?.value.trim()  || null,
            status_perkawinan: stKaw,
            status_keluarga:   stKk,
            telp:              document.getElementById('wHp')?.value.trim()         || null,
            email:             email || null,
            keterangan:        document.getElementById('wKeterangan')?.value.trim() || null,
        };

        try {
            const res = editUuid
                ? await Api.put(`/kk/${kkUuid}/anggota/${editUuid}`, payload)
                : await Api.post(`/kk/${kkUuid}/anggota`, payload);

            if (res.ok) {
                Toast?.success(editUuid ? 'Data diperbarui.' : 'Anggota ditambahkan.');
                loadAnggotaKk(activeKk?.uuid || kkUuid);
                return true;
            }

            const d = res.data;
            if (d.messages) {
                const firstErr = Object.values(d.messages)[0];
                ModalManager.setError(Array.isArray(firstErr) ? firstErr[0] : firstErr);
            } else {
                ModalManager.setError(d.message || 'Gagal menyimpan.');
            }
            return false;
        } catch {
            ModalManager.setError('Koneksi bermasalah.');
            return false;
        }
    }

    async function hapusWarga(uuid, kkUuid) {
        if (!confirm('Hapus anggota ini dari KK?')) return;
        const res = await Api.delete(`/kk/${kkUuid}/anggota/${uuid}`);
        res.ok
            ? (Toast?.success('Anggota dihapus.'), loadAnggotaKk(activeKk?.uuid || kkUuid))
            : Toast?.error(res.data?.message || 'Gagal menghapus.');
    }

    async function hapusKk(uuid, namaKepala) {
        if (!confirm(`Hapus KK atas nama "${namaKepala}"?\n\nSemua anggota dalam KK ini juga akan ikut dihapus.`)) return;

        const res = await Api.delete(`/kk/${uuid}`);

        if (res.ok) {
            Toast?.success("KK berhasil dihapus.");
            if (activeKk?.uuid === uuid) {
                panelAnggota?.classList.add("d-none");
                activeKk = null;
                if (btnTambahWrg) btnTambahWrg.disabled = true;
            }
            await refreshKkList();
        } else {
            Toast?.error(res.data?.message || "Gagal menghapus KK.");
        }
    }

    // ══════════════════════════════════════════════════════════════
    // EVENT BINDING
    // ══════════════════════════════════════════════════════════════

    function bindEvents() {
        // Tambah KK
        btnTambahKk?.addEventListener('click', bukaModalTambahKk);

        // Tambah warga
        btnTambahWrg?.addEventListener('click', bukaModalTambahWarga);

        // Tutup panel anggota
        btnTutupPanel?.addEventListener('click', () => {
            panelAnggota?.classList.add('d-none');
            kkGrid?.querySelectorAll('.kk-card').forEach(c =>
                c.classList.remove('border-primary', 'shadow-sm'));
            activeKk = null;
            if (btnTambahWrg) btnTambahWrg.disabled = true;
        });

        // Search KK di grid
        let timer;
        kkSearch?.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                const q = kkSearch.value.toLowerCase();
                renderKkGrid(q
                    ? KK_LIST.filter(kk =>
                        (kk.kepala_keluarga || '').toLowerCase().includes(q) ||
                        (kk.alamat || '').toLowerCase().includes(q) ||
                        (kk.rt_display || '').includes(q))
                    : KK_LIST);
            }, 300);
        });
    }

    // ── Util ──────────────────────────────────────────────────────
    function esc(s) {
        return String(s ?? '')
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

})();