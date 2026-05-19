'use strict';

/**
 * warga-anggota.js
 *
 * Tanggung jawab:
 *   - Load dan render tabel anggota KK
 *   - Load profil warga (role=warga)
 *   - Modal tambah/edit anggota warga
 *   - Cek NIK duplikat
 *   - Hapus anggota
 *
 * Depends on: WargaState, ModalManager, FormTemplates, Api, Toast
 */

const WargaAnggota = (() => {

    const { ROLE, dom, esc, rowLoading, rowError, rowKosong } = WargaState;

    // ── Load anggota KK ───────────────────────────────────────────

    async function loadAnggotaKk(kkUuid) {
        const { tabelBody, infoTotal } = dom;
        if (WargaState.isLoading) return;

        // Dispose tooltip lama
        window.App?.disposeComponents?.(tabelBody);
        WargaState.isLoading = true;
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
            WargaState.isLoading = false;
        }

        // Init tooltip baru
        window.App?.initComponents?.(tabelBody);
    }

    async function loadAnggotaWarga() {
        const { tabelBody, infoTotal, panelKkNama, panelKkInfo } = dom;
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
            ? `<span class="badge bg-warning-subtle text-warning fw-semibold">Pindah</span>`
            : `<span class="badge bg-primary-subtle text-primary fw-semibold">Tetap</span>`;
        const statusKk = (w.status_keluarga || '').replace(/_/g,' ')
            .replace(/\b\w/g, c => c.toUpperCase());

        const canEdit   = ['administrator','rt'].includes(ROLE);
        const canDelete = ROLE === 'administrator';

        const aksiEdit = canEdit
            ? `<button class="btn btn-sm bg-warning-subtle btn-edit-wrg border border-solid border-warning" data-uuid="${esc(w.uuid)}" data-kk="${esc(kkUuid)}" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Edit">
                <i class="mdi mdi-square-edit-outline fs-16 text-warning"></i>
                </button>`
            : '';
        const aksiHapus = canDelete
            ? `<button class="btn btn-sm bg-danger-subtle btn-hapus-wrg border border-solid border-danger" data-uuid="${esc(w.uuid)}" data-kk="${esc(kkUuid)}" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Hapus">
                <i class="mdi mdi-delete-outline fs-16 text-danger"></i>
                </button>`
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
        const { tabelBody } = dom;
        tabelBody.querySelectorAll('.btn-edit-wrg').forEach(btn => {
            btn.onclick = () => bukaModalEditWarga(btn.dataset.uuid, btn.dataset.kk);
        });
        tabelBody.querySelectorAll('.btn-hapus-wrg').forEach(btn => {
            btn.onclick = () => hapusWarga(btn.dataset.uuid, btn.dataset.kk);
        });
    }

    // ── Modal warga ───────────────────────────────────────────────

    function bukaModalTambahWarga() {
        const activeKk = WargaState.activeKk;
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

        const data   = res.data?.data || res.data;
        const namaKk = WargaState.activeKk?.kepala || '';

        ModalManager.open({
            title     : '<i class="bx bx-edit me-2 text-warning"></i>Edit Anggota',
            content   : FormTemplates.warga(data, namaKk),
            saveLabel : 'Perbarui',
            onSave    : () => submitWarga(wargaUuid, kkUuid),
        });
        initFormWargaEvents(data);
    }

    function initFormWargaEvents(existingData) {
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

        document.getElementById('wHp')?.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '').slice(0, 14);
        });

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
        if (!jk)     errors.push('Jenis kelamin wajib dipilih.');
        if (!tempat) errors.push('Tempat lahir wajib diisi.');
        if (!tgl)    errors.push('Tanggal lahir wajib diisi.');
        if (!agama)  errors.push('Agama wajib dipilih.');
        if (!stKaw)  errors.push('Status perkawinan wajib dipilih.');
        if (!stKk)   errors.push('Status dalam keluarga wajib dipilih.');
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.push('Format email tidak valid.');

        if (errors.length) { ModalManager.setError(errors[0]); return false; }

        const payload = {
            nik:               nik,
            nama_lengkap:      nama,
            jenis_kelamin:     jk?.value || '',
            tempat_lahir:      tempat,
            tanggal_lahir:     tgl,
            agama:             agama,
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
                loadAnggotaKk(WargaState.activeKk?.uuid || kkUuid);
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

    // ── Hapus anggota ─────────────────────────────────────────────

    async function hapusWarga(uuid, kkUuid) {
        if (!confirm('Hapus anggota ini dari KK?')) return;
        const res = await Api.delete(`/kk/${kkUuid}/anggota/${uuid}`);
        res.ok
            ? (Toast?.success('Anggota dihapus.'), loadAnggotaKk(WargaState.activeKk?.uuid || kkUuid))
            : Toast?.error(res.data?.message || 'Gagal menghapus.');
    }

    return { loadAnggotaKk, loadAnggotaWarga, bukaModalTambahWarga };

})();