/**
 * assets/js/pages/inbox.js
 *
 * Halaman Inbox Pengajuan Surat — untuk RT, RW, dan Administrator.
 * Menggunakan Api.get() / Api.post() dari assets/js/core/api.js.
 */

'use strict';

const { role: CURRENT_ROLE, api: API } = window.INBOX_CONFIG;

/* ════════════════════════════════════════════════════════
   Konstanta
════════════════════════════════════════════════════════ */
const STATUS_MAP = {
  draft        : { cls: 'bg-secondary-subtle text-secondary-emphasis', label: 'Draft'        },
  menunggu_rt  : { cls: 'bg-warning-subtle text-warning-emphasis',     label: 'Menunggu RT'  },
  diproses_rw  : { cls: 'bg-info-subtle text-info-emphasis',           label: 'Diproses RW'  },
  disetujui    : { cls: 'bg-primary-subtle text-primary-emphasis',     label: 'Disetujui'    },
  ditolak_rt   : { cls: 'bg-danger-subtle text-danger-emphasis',       label: 'Ditolak RT'   },
  ditolak_rw   : { cls: 'bg-danger-subtle text-danger-emphasis',       label: 'Ditolak RW'   },
  selesai      : { cls: 'bg-success-subtle text-success-emphasis',     label: 'Selesai ✓'   },
};

// Status yang bisa di-approve oleh role tertentu
const CAN_APPROVE = {
  rt            : ['menunggu_rt'],
  rw            : ['diproses_rw'],
  administrator : ['menunggu_rt', 'diproses_rw'],
};

/* ════════════════════════════════════════════════════════
   State
════════════════════════════════════════════════════════ */
let _activeUuid    = null;   // uuid pengajuan yang sedang dibuka di modal
let _currentFilter = '';

// Preset filter default berdasarkan role
if (CURRENT_ROLE === 'rt')  _currentFilter = 'menunggu_rt';
if (CURRENT_ROLE === 'rw')  _currentFilter = 'diproses_rw';

/* ════════════════════════════════════════════════════════
   Util
════════════════════════════════════════════════════════ */
function formatTgl(iso, withTime = false) {
  if (!iso) return '—';
  const opts = { day: '2-digit', month: 'short', year: 'numeric' };
  if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
  return new Date(iso).toLocaleString('id-ID', opts);
}

function setLoading(btnTextId, btnSpinId, btnEl, loading) {
  document.getElementById(btnTextId).classList.toggle('d-none', loading);
  document.getElementById(btnSpinId).classList.toggle('d-none', !loading);
  btnEl.disabled = loading;
}

/* ════════════════════════════════════════════════════════
   Load & render list
════════════════════════════════════════════════════════ */
async function loadInbox() {
  // Reset state list
  document.getElementById('listInbox').innerHTML   = '';
  document.getElementById('emptyInbox').classList.add('d-none');
  document.getElementById('skelInbox').classList.remove('d-none');

  const path = _currentFilter
    ? `${API.pengajuan}?status=${_currentFilter}`
    : API.pengajuan;

  const res = await Api.get(path);

  document.getElementById('skelInbox').classList.add('d-none');

  if (!res.ok) {
    document.getElementById('listInbox').innerHTML =
      `<div class="alert alert-danger small">${res.data?.message ?? 'Gagal memuat data.'}</div>`;
    return;
  }

  const list = res.data?.data ?? [];
  updateCounters(list);

  if (!list.length) {
    document.getElementById('emptyInbox').classList.remove('d-none');
    return;
  }

  document.getElementById('listInbox').innerHTML = list.map(renderItem).join('');

  document.querySelectorAll('[data-open-uuid]').forEach(el => {
    el.addEventListener('click', () => openDetail(el.dataset.openUuid, el.dataset.nama));
  });
}

function updateCounters(list) {
  const menunggu  = list.filter(r => ['menunggu_rt','diproses_rw'].includes(r.status)).length;
  const disetujui = list.filter(r => ['disetujui','selesai'].includes(r.status)).length;
  const ditolak   = list.filter(r => ['ditolak_rt','ditolak_rw'].includes(r.status)).length;

  document.getElementById('cntMenunggu').textContent  = menunggu;
  document.getElementById('cntDisetujui').textContent = disetujui;
  document.getElementById('cntDitolak').textContent   = ditolak;
  document.getElementById('cntTotal').textContent     = list.length;
}

function renderItem(r) {
  const sm        = STATUS_MAP[r.status] ?? { cls: 'bg-secondary-subtle text-secondary', label: r.status };
  const canAct    = (CAN_APPROVE[CURRENT_ROLE] ?? []).includes(r.status);
  const tgl       = formatTgl(r.created_at);

  return `
    <div class="card border shadow-none mb-3 inbox-item" style="cursor:pointer"
         data-open-uuid="${r.uuid}" data-nama="${r.nama_surat ?? ''}">
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1 me-3">
            <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <span class="fw-semibold small">${r.nama_surat ?? '—'}</span>
              ${canAct ? '<span class="badge bg-warning text-dark rounded-pill" style="font-size:.65rem">Perlu Tindakan</span>' : ''}
            </div>
            <p class="text-muted mb-1" style="font-size:.78rem">
              <i class="bx bx-user me-1"></i>${r.nama_warga ?? '—'}
              ${r.kode_rt ? `<span class="ms-2"><i class="bx bx-map-pin me-1"></i>RT ${r.kode_rt}</span>` : ''}
            </p>
            <p class="text-muted mb-0" style="font-size:.75rem">
              <i class="bx bx-time me-1"></i>${tgl}
              ${r.nomor_surat ? `<span class="ms-2 font-monospace">${r.nomor_surat}</span>` : ''}
            </p>
          </div>
          <span class="badge rounded-pill ${sm.cls} flex-shrink-0">${sm.label}</span>
        </div>
      </div>
    </div>`;
}

/* ════════════════════════════════════════════════════════
   Modal Detail
════════════════════════════════════════════════════════ */
async function openDetail(uuid, namaSurat) {
  _activeUuid = uuid;

  document.getElementById('modalDetailTitle').textContent = namaSurat || 'Detail Pengajuan';
  document.getElementById('modalDetailSub').textContent   = '';
  document.getElementById('modalDetailBody').innerHTML    =
    `<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>`;
  document.getElementById('modalDetailFooter').classList.add('d-none');

  new bootstrap.Modal(document.getElementById('modalDetail')).show();

  const res = await Api.get(`${API.pengajuan}/${uuid}`);

  if (!res.ok) {
    document.getElementById('modalDetailBody').innerHTML =
      `<div class="alert alert-danger small">${res.data?.message ?? 'Gagal memuat detail.'}</div>`;
    return;
  }

  const p  = res.data?.data ?? {};
  const sm = STATUS_MAP[p.status] ?? { cls: 'bg-secondary-subtle text-secondary', label: p.status };

  document.getElementById('modalDetailSub').innerHTML =
    `<span class="badge rounded-pill ${sm.cls}">${sm.label}</span>`;

  // Timeline
  const timelineHtml = (p.timeline ?? []).map(t => {
    const icon = t.action === 'approve'
      ? 'bx-check-circle text-success'
      : t.action === 'tolak'
        ? 'bx-x-circle text-danger'
        : 'bx-radio-circle text-muted';
    return `
      <div class="d-flex gap-2 mb-2 align-items-start">
        <i class="bx ${icon} mt-1 flex-shrink-0"></i>
        <div>
          <p class="mb-0 small fw-medium">
            ${t.actor_name ?? t.aktor_nama ?? 'Sistem'}
            <span class="text-muted fw-normal">· ${formatTgl(t.created_at, true)}</span>
          </p>
          ${t.catatan ? `<p class="mb-0 small text-muted">${t.catatan}</p>` : ''}
        </div>
      </div>`;
  }).join('') || '<p class="text-muted small mb-0">Belum ada aktivitas.</p>';

  document.getElementById('modalDetailBody').innerHTML = `
    <table class="table table-sm table-borderless mb-3">
      <tbody>
        <tr><td class="text-muted small ps-0" style="width:38%">Jenis Surat</td>
            <td class="small fw-medium">${p.nama_surat ?? '—'}</td></tr>
        <tr><td class="text-muted small ps-0">Pemohon</td>
            <td class="small">${p.nama_warga ?? '—'}</td></tr>
        <tr><td class="text-muted small ps-0">Keperluan</td>
            <td class="small">${p.keperluan ?? '—'}</td></tr>
        ${p.catatan_pengaju
          ? `<tr><td class="text-muted small ps-0">Keterangan</td>
                 <td class="small">${p.catatan_pengaju}</td></tr>` : ''}
        <tr><td class="text-muted small ps-0">Tanggal Ajuan</td>
            <td class="small">${formatTgl(p.created_at)}</td></tr>
        ${p.nomor_surat
          ? `<tr><td class="text-muted small ps-0">Nomor Surat</td>
                 <td class="small font-monospace">${p.nomor_surat}</td></tr>` : ''}
      </tbody>
    </table>

    <p class="text-uppercase text-muted fw-semibold mb-2" style="font-size:.65rem;letter-spacing:.07em">Timeline</p>
    ${timelineHtml}`;

  // Selalu tampilkan footer — isi tombol sesuai status
  const footer  = document.getElementById('modalDetailFooter');
  const canAct  = (CAN_APPROVE[CURRENT_ROLE] ?? []).includes(p.status);
  const canDown = ['disetujui', 'selesai'].includes(p.status) && p.pdf_path;

  // Sembunyikan / tampilkan tombol aksi
  document.getElementById('btnApprove').classList.toggle('d-none', !canAct);
  document.getElementById('btnTolak').classList.toggle('d-none', !canAct);

  // Tombol preview — selalu ada selama ada body_html (semua status)
  document.getElementById('btnPreview').dataset.uuid = p.uuid;

  // Tombol download — hanya jika PDF sudah ada
  const btnDown = document.getElementById('btnDownload');
  if (canDown) {
    btnDown.href = `/api/v1/surat/pengajuan/${p.uuid}/download`;
    btnDown.classList.remove('d-none');
  } else {
    btnDown.classList.add('d-none');
  }

  footer.classList.remove('d-none');
}

/* ════════════════════════════════════════════════════════
   Preview surat
════════════════════════════════════════════════════════ */
document.getElementById('btnPreview').addEventListener('click', function () {
  const uuid = this.dataset.uuid;
  // Buka di tab baru — browser tampilkan HTML surat langsung
  window.open(`/api/v1/surat/pengajuan/${uuid}/preview`, '_blank');
});

/* ════════════════════════════════════════════════════════
   Approve
════════════════════════════════════════════════════════ */
document.getElementById('btnApprove').addEventListener('click', () => {
  document.getElementById('approveNote').value = '';
  bootstrap.Modal.getInstance(document.getElementById('modalDetail'))?.hide();
  new bootstrap.Modal(document.getElementById('modalApprove')).show();
});

document.getElementById('btnConfirmApprove').addEventListener('click', async () => {
  const btn     = document.getElementById('btnConfirmApprove');
  const catatan = document.getElementById('approveNote').value.trim();

  setLoading('approveText', 'approveSpin', btn, true);

  const res = await Api.post(`${API.pengajuan}/${_activeUuid}/approve`, { catatan });

  setLoading('approveText', 'approveSpin', btn, false);

  if (res.ok) {
    bootstrap.Modal.getInstance(document.getElementById('modalApprove'))?.hide();
    if (typeof Toast !== 'undefined') Toast.success('Pengajuan berhasil disetujui.');
    loadInbox();
  } else {
    if (typeof Toast !== 'undefined') Toast.error(res.data?.message ?? 'Gagal menyetujui pengajuan.');
  }
});

/* ════════════════════════════════════════════════════════
   Tolak
════════════════════════════════════════════════════════ */
document.getElementById('btnTolak').addEventListener('click', () => {
  document.getElementById('tolakAlasan').value = '';
  document.getElementById('tolakAlasan').classList.remove('is-invalid');
  bootstrap.Modal.getInstance(document.getElementById('modalDetail'))?.hide();
  new bootstrap.Modal(document.getElementById('modalTolak')).show();
});

document.getElementById('btnConfirmTolak').addEventListener('click', async () => {
  const btn    = document.getElementById('btnConfirmTolak');
  const alasan = document.getElementById('tolakAlasan').value.trim();

  if (!alasan) {
    document.getElementById('tolakAlasan').classList.add('is-invalid');
    return;
  }
  document.getElementById('tolakAlasan').classList.remove('is-invalid');

  setLoading('tolakText', 'tolakSpin', btn, true);

  const res = await Api.post(`${API.pengajuan}/${_activeUuid}/tolak`, { alasan });

  setLoading('tolakText', 'tolakSpin', btn, false);

  if (res.ok) {
    bootstrap.Modal.getInstance(document.getElementById('modalTolak'))?.hide();
    if (typeof Toast !== 'undefined') Toast.success('Pengajuan berhasil ditolak.');
    loadInbox();
  } else {
    if (typeof Toast !== 'undefined') Toast.error(res.data?.message ?? 'Gagal menolak pengajuan.');
  }
});

/* ════════════════════════════════════════════════════════
   Filter & refresh
════════════════════════════════════════════════════════ */
document.getElementById('filterStatus').value = _currentFilter;

document.getElementById('filterStatus').addEventListener('change', function () {
  _currentFilter = this.value;
  loadInbox();
});

document.getElementById('btnRefresh').addEventListener('click', () => loadInbox());

/* ════════════════════════════════════════════════════════
   Init
════════════════════════════════════════════════════════ */
loadInbox();