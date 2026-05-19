/**
 * assets/js/pages/surat.js
 *
 * Halaman Pengajuan Surat.
 * Menggunakan Api.get() / Api.post() dari assets/js/core/api.js.
 * Data PHP dibaca dari window.SURAT_CONFIG yang di-set di view.
 *
 * Catatan path: Api sudah prepend BASE_URL '/api/v1',
 * jadi path di sini cukup '/surat/template', '/surat/pengajuan', dst.
 */

'use strict';

const { role: CURRENT_ROLE, api: API, warga: WARGA } = window.SURAT_CONFIG;

// Path relatif terhadap BASE_URL '/api/v1'
const PATH = {
  templates : '/surat/template',
  pengajuan : '/surat/pengajuan',
};

/* ════════════════════════════════════════════════════════
   Konstanta UI
════════════════════════════════════════════════════════ */
const ICON_MAP = {
  'surat-keterangan-domisili'    : { icon: 'bi-house-door',    bg: '#E6F1FB', color: '#185FA5' },
  'surat-keterangan-tidak-mampu' : { icon: 'bi-clipboard2',    bg: '#FAEEDA', color: '#854F0B' },
  'surat-keterangan-usaha'       : { icon: 'bi-shop',          bg: '#EAF3DE', color: '#3B6D11' },
  'surat-pengantar-ktp'          : { icon: 'bi-person-vcard',  bg: '#FBEAF0', color: '#993556' },
  'surat-keterangan-kelahiran'   : { icon: 'bi-balloon-heart', bg: '#E1F5EE', color: '#0F6E56' },
  'surat-keterangan-kematian'    : { icon: 'bi-file-earmark',  bg: '#F1EFE8', color: '#5F5E5A' },
  'surat-keterangan-pindah'      : { icon: 'bi-truck',         bg: '#EEEDFE', color: '#534AB7' },
};
const ICON_DEFAULT = { icon: 'bi-file-text', bg: '#E9ECEF', color: '#495057' };

const STATUS_MAP = {
  draft     : { cls: 'bg-secondary-subtle text-secondary-emphasis', label: 'Draft'       },
  menunggu  : { cls: 'bg-warning-subtle text-warning-emphasis',     label: 'Menunggu RT' },
  diproses  : { cls: 'bg-info-subtle text-info-emphasis',           label: 'Diproses RW' },
  disetujui : { cls: 'bg-success-subtle text-success-emphasis',     label: 'Disetujui'   },
  ditolak   : { cls: 'bg-danger-subtle text-danger-emphasis',       label: 'Ditolak'     },
  selesai   : { cls: 'bg-success-subtle text-success-emphasis',     label: 'Selesai ✓'  },
};

const KEPERLUAN_MAP = {
  'surat-keterangan-domisili'    : ['Pendaftaran sekolah','Melamar pekerjaan','Keperluan perbankan','Keperluan BPJS'],
  'surat-keterangan-tidak-mampu' : ['Beasiswa pendidikan','Keringanan biaya kesehatan','Program bantuan sosial'],
  'surat-keterangan-usaha'       : ['Pendaftaran izin usaha','Keperluan perbankan','Tender / kontrak'],
  'surat-pengantar-ktp'          : ['Pembuatan KTP baru','Perubahan data KTP','KTP hilang / rusak'],
};

/* ════════════════════════════════════════════════════════
   TAB 1 — Grid template surat
════════════════════════════════════════════════════════ */
let selectedTemplate = null;

function kategori(slug) {
  const lainnya = ['surat-keterangan-kelahiran','surat-keterangan-kematian','surat-keterangan-pindah'];
  return lainnya.includes(slug) ? 'lainnya' : 'kependudukan';
}

async function loadTemplates() {
  const res = await Api.get(PATH.templates);

  if (!res.ok) {
    document.getElementById('skelTemplate').innerHTML =
      `<div class="col-12"><div class="alert alert-danger small">Gagal memuat template: ${res.data?.message ?? 'Terjadi kesalahan.'}</div></div>`;
    return;
  }

  const templates = res.data?.data ?? [];
  const groups    = { kependudukan: [], lainnya: [] };
  templates.forEach(t => groups[kategori(t.slug)].push(t));

  let html = '';
  for (const [grp, list] of Object.entries(groups)) {
    if (!list.length) continue;
    const label = grp === 'kependudukan' ? 'Surat Kependudukan' : 'Surat Lainnya';
    html += `<p class="text-uppercase text-muted fw-semibold mb-3" style="font-size:.7rem;letter-spacing:.08em">${label}</p>`;
    html += `<div class="row g-3 mb-4">`;
    list.forEach(t => {
      const ic = ICON_MAP[t.slug] ?? ICON_DEFAULT;
      html += `
        <div class="col-6 col-md-3">
          <div class="card surat-card h-100 border shadow-none"
               data-id="${t.id}" data-slug="${t.slug}" data-nama="${t.nama_surat}"
               style="cursor:pointer;transition:border-color .15s,transform .1s">
            <div class="card-body p-3">
              <div class="rounded-3 mb-3 d-flex align-items-center justify-content-center"
                   style="width:40px;height:40px;background:${ic.bg}">
                <i class="bi ${ic.icon}" style="font-size:1.1rem;color:${ic.color}"></i>
              </div>
              <p class="fw-semibold mb-1 small">${t.nama_surat}</p>
              <p class="text-muted mb-0" style="font-size:.78rem;line-height:1.4">${t.deskripsi ?? ''}</p>
            </div>
          </div>
        </div>`;
    });
    html += `</div>`;
  }

  document.getElementById('skelTemplate').classList.add('d-none');
  const grid = document.getElementById('gridTemplate');
  grid.innerHTML = html;
  grid.classList.remove('d-none');
  bindCardSelect();
}

function bindCardSelect() {
  document.querySelectorAll('.surat-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (!card.classList.contains('selected')) card.style.borderColor = '#86b7fe';
    });
    card.addEventListener('mouseleave', () => {
      if (!card.classList.contains('selected')) card.style.borderColor = '';
    });
    card.addEventListener('click', () => {
      document.querySelectorAll('.surat-card').forEach(c => {
        c.classList.remove('selected');
        c.style.borderColor = '';
        c.style.transform   = '';
      });
      card.classList.add('selected');
      card.style.borderColor = '#0d6efd';
      card.style.transform   = 'translateY(-2px)';
      selectedTemplate = { id: card.dataset.id, slug: card.dataset.slug, nama: card.dataset.nama };
      document.getElementById('btnLanjut').disabled = false;
    });
  });
}

document.getElementById('btnLanjut').addEventListener('click', () => {
  if (selectedTemplate) openModalAjukan(selectedTemplate);
});

/* ════════════════════════════════════════════════════════
   TAB 2 — Riwayat pengajuan
════════════════════════════════════════════════════════ */
async function loadRiwayat() {
  const res = await Api.get(PATH.pengajuan);

  if (!res.ok) {
    document.getElementById('skelRiwayat').innerHTML =
      `<div class="alert alert-danger small">Gagal memuat riwayat: ${res.data?.message ?? 'Terjadi kesalahan.'}</div>`;
    return;
  }

  const list = res.data?.data ?? [];
  document.getElementById('skelRiwayat').classList.add('d-none');

  const aktif = list.filter(r => !['selesai','ditolak'].includes(r.status));
  if (aktif.length) {
    const badge = document.getElementById('badgeAktif');
    badge.textContent = aktif.length;
    badge.classList.remove('d-none');
  }

  const totalEl = document.getElementById('riwayatTotal');
  if (totalEl) totalEl.textContent = list.length;

  if (!list.length) {
    document.getElementById('emptyRiwayat').classList.remove('d-none');
    return;
  }

  document.getElementById('listRiwayat').innerHTML = list.map(renderRiwayatItem).join('');

  document.querySelectorAll('[data-open-detail]').forEach(el => {
    el.addEventListener('click', () => openModalDetail(el.dataset.openDetail, el.dataset.namaSurat));
  });

  document.querySelectorAll('[data-download-uuid]').forEach(el => {
    el.addEventListener('click', () => {
      window.location.href = `/api/v1${PATH.pengajuan}/${el.dataset.downloadUuid}/download`;
    });
  });
}

function renderRiwayatItem(r) {
  const sm        = STATUS_MAP[r.status] ?? { cls: 'bg-secondary-subtle text-secondary', label: r.status };
  const stepIndex = { draft:0, menunggu:1, diproses:2, disetujui:3, selesai:4, ditolak:-1 }[r.status] ?? 0;
  const STEPS     = ['Diajukan','RT','RW','Selesai'];

  const progressDots = STEPS.map((lbl, i) => {
    const pos = i + 1;
    let dotStyle, dotContent;
    if (r.status === 'ditolak' && pos === 2) {
      dotStyle   = 'background:#f09595;border:0.5px solid #e24b4a';
      dotContent = '✕';
    } else if (pos < stepIndex) {
      dotStyle   = 'background:#0d6efd;color:#fff';
      dotContent = '✓';
    } else if (pos === stepIndex) {
      dotStyle   = 'background:#0d6efd;color:#fff;box-shadow:0 0 0 3px rgba(13,110,253,.2)';
      dotContent = pos;
    } else {
      dotStyle   = 'background:#e9ecef;border:0.5px solid #dee2e6;color:#6c757d';
      dotContent = pos;
    }
    const lineColor = pos <= stepIndex ? '#0d6efd' : '#dee2e6';
    return `
      <div class="text-center" style="flex:1">
        <div class="d-flex align-items-center justify-content-center mb-1">
          ${i > 0 ? `<div style="height:1px;background:${lineColor};flex:1;margin-right:3px"></div>` : ''}
          <div class="rounded-circle d-flex align-items-center justify-content-center fw-semibold"
               style="width:20px;height:20px;font-size:9px;flex-shrink:0;${dotStyle}">${dotContent}</div>
          ${i < 3 ? `<div style="height:1px;background:${pos < stepIndex ? '#0d6efd' : '#dee2e6'};flex:1;margin-left:3px"></div>` : ''}
        </div>
        <span style="font-size:.6rem" class="${pos === stepIndex ? 'text-dark fw-semibold' : 'text-muted'}">${lbl}</span>
      </div>`;
  }).join('');

  const tgl           = new Date(r.created_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
  const namaWargaHtml = (r.nama_warga && CURRENT_ROLE !== 'warga')
    ? `<span class="badge bg-secondary-subtle text-secondary-emphasis rounded-pill ms-1" style="font-size:.68rem">
         <i class="bi bi-person me-1"></i>${r.nama_warga}
       </span>` : '';
  const rejNote       = (r.status === 'ditolak' && r.catatan_penolakan)
    ? `<div class="mt-2 p-2 rounded-2 bg-danger-subtle small text-danger-emphasis">
         <i class="bi bi-info-circle me-1"></i> Alasan: ${r.catatan_penolakan}
       </div>` : '';
  const dlBtn         = (r.status === 'selesai' && r.pdf_path)
    ? `<div class="mt-3">
         <button class="btn btn-sm btn-outline-success" data-download-uuid="${r.uuid}">
           <i class="bi bi-file-earmark-pdf me-1"></i> Unduh PDF
         </button>
       </div>` : '';

  return `
    <div class="card border shadow-none mb-3" style="cursor:pointer"
         data-open-detail="${r.uuid}" data-nama-surat="${r.nama_surat}">
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <p class="fw-semibold mb-0 small">${r.nama_surat} ${namaWargaHtml}</p>
            <p class="text-muted mb-0" style="font-size:.72rem">${r.nomor_surat ?? '—'} &middot; ${tgl}</p>
          </div>
          <span class="badge rounded-pill ${sm.cls}">${sm.label}</span>
        </div>
        <div class="d-flex align-items-center gap-0">${progressDots}</div>
        ${rejNote}${dlBtn}
      </div>
    </div>`;
}

/* ════════════════════════════════════════════════════════
   Modal Detail
════════════════════════════════════════════════════════ */
async function openModalDetail(uuid, namaSurat) {
  document.getElementById('modalDetailTitle').textContent = namaSurat ?? 'Detail Pengajuan';
  document.getElementById('modalDetailBody').innerHTML =
    `<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>`;
  document.getElementById('modalDetailFooter').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('modalDetail')).show();

  const res = await Api.get(`${PATH.pengajuan}/${uuid}`);

  if (!res.ok) {
    document.getElementById('modalDetailBody').innerHTML =
      `<div class="alert alert-danger small">Gagal memuat detail: ${res.data?.message ?? 'Terjadi kesalahan.'}</div>`;
    return;
  }

  const p   = res.data?.data ?? {};
  const sm  = STATUS_MAP[p.status] ?? { cls:'bg-secondary-subtle text-secondary', label: p.status };
  const tgl = new Date(p.created_at).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});

  const timelineHtml = (p.timeline ?? []).map(t => {
    const tTime = new Date(t.created_at).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const icon  = t.action === 'approve'
      ? 'bi-check-circle-fill text-success'
      : t.action === 'tolak'
        ? 'bi-x-circle-fill text-danger'
        : 'bi-circle text-muted';
    return `
      <div class="d-flex gap-2 mb-2 align-items-start">
        <i class="bi ${icon} mt-1 flex-shrink-0" style="font-size:.85rem"></i>
        <div>
          <p class="mb-0 small fw-medium">${t.actor_name ?? t.aktor_nama ?? 'Sistem'}
            <span class="text-muted fw-normal">· ${tTime}</span></p>
          ${t.catatan ? `<p class="mb-0 small text-muted">${t.catatan}</p>` : ''}
        </div>
      </div>`;
  }).join('') || '<p class="text-muted small">Belum ada aktivitas.</p>';

  document.getElementById('modalDetailBody').innerHTML = `
    <table class="table table-sm table-borderless mb-3">
      <tbody>
        <tr><td class="text-muted small ps-0" style="width:38%">Jenis Surat</td>
            <td class="small fw-medium">${p.nama_surat ?? '—'}</td></tr>
        <tr><td class="text-muted small ps-0">Nomor Tiket</td>
            <td class="small">${p.nomor_surat ?? '—'}</td></tr>
        <tr><td class="text-muted small ps-0">Tanggal Ajuan</td>
            <td class="small">${tgl}</td></tr>
        <tr><td class="text-muted small ps-0">Keperluan</td>
            <td class="small">${p.keperluan ?? '—'}</td></tr>
        <tr><td class="text-muted small ps-0">Status</td>
            <td><span class="badge rounded-pill ${sm.cls}">${sm.label}</span></td></tr>
      </tbody>
    </table>
    <p class="text-uppercase text-muted fw-semibold mb-2" style="font-size:.65rem;letter-spacing:.07em">Timeline</p>
    ${timelineHtml}`;

  if (p.status === 'selesai' && p.pdf_path) {
    document.getElementById('btnDownloadPdf').href = `/api/v1${PATH.pengajuan}/${uuid}/download`;
    document.getElementById('modalDetailFooter').classList.remove('d-none');
  }
}

/* ════════════════════════════════════════════════════════
   Modal Ajukan (step 1 → 2 → 3)
════════════════════════════════════════════════════════ */
let ajukanStep     = 1;
let ajukanData     = {};
let ajukanTemplate = null;

function setModalStep(n) {
  ajukanStep = n;

  document.querySelectorAll('.modal-step-dot').forEach(el => {
    const s = +el.dataset.step;
    el.textContent      = s < n ? '✓' : s;
    el.style.background = s <= n ? '#0d6efd' : '#e9ecef';
    el.style.color      = s <= n ? '#fff' : '#6c757d';
    el.style.boxShadow  = s === n ? '0 0 0 3px rgba(13,110,253,.2)' : '';
  });

  document.querySelectorAll('.modal-step-lbl').forEach(el => {
    const s      = +el.dataset.step;
    el.className = `modal-step-lbl ${s === n ? 'text-primary fw-semibold' : 'text-muted'}`;
    el.style.fontSize = '.65rem';
  });

  document.querySelectorAll('.modal-step-line').forEach(el => {
    const after  = el.dataset.after  !== undefined ? +el.dataset.after  : null;
    const before = el.dataset.before !== undefined ? +el.dataset.before : null;
    if (after  !== null) el.style.background = after  < n ? '#0d6efd' : '#dee2e6';
    if (before !== null) el.style.background = before < n ? '#0d6efd' : '#dee2e6';
  });

  document.getElementById('btnAjukanBack').classList.toggle('d-none', n === 1);
  const nextBtn = document.getElementById('btnAjukanNext');
  const labels  = {
    1: 'Lanjut <i class="bi bi-arrow-right ms-1"></i>',
    2: 'Kirim Pengajuan <i class="bi bi-send ms-1"></i>',
    3: 'Tutup',
  };
  nextBtn.innerHTML = labels[n];
  nextBtn.disabled  = false;
}

function renderStep1(tpl) {
  const opts     = KEPERLUAN_MAP[tpl.slug] ?? ['Keperluan administrasi','Keperluan lainnya'];
  const optsHtml = opts.map(o => `<option value="${o}">${o}</option>`).join('');

  document.getElementById('modalAjukanBody').innerHTML = `
    <div class="alert alert-info d-flex gap-2 py-2 px-3 mb-3 small">
      <i class="bi bi-info-circle-fill mt-1 flex-shrink-0"></i>
      <div>Data kependudukan diisi otomatis dari KK Anda. Hubungi RT jika ada ketidaksesuaian.</div>
    </div>
    <div class="p-3 rounded-3 mb-3 border" style="background:var(--bs-light-bg-subtle)">
      <p class="text-uppercase text-muted fw-semibold mb-2" style="font-size:.65rem;letter-spacing:.07em">
        Data Pemohon
        <span class="badge bg-primary-subtle text-primary-emphasis rounded-pill ms-1" style="font-size:.6rem">Auto-fill</span>
      </p>
      <div class="row g-2">
        <div class="col-md-6">
          <label class="form-label small fw-medium text-muted mb-1">Nama Lengkap</label>
          <input type="text" class="form-control form-control-sm bg-light" value="${WARGA.nama_lengkap}" readonly>
        </div>
        <div class="col-md-6">
          <label class="form-label small fw-medium text-muted mb-1">NIK</label>
          <input type="text" class="form-control form-control-sm bg-light" value="${WARGA.nik_masked}" readonly>
        </div>
        <div class="col-md-3">
          <label class="form-label small fw-medium text-muted mb-1">RT</label>
          <input type="text" class="form-control form-control-sm bg-light" value="${WARGA.rt}" readonly>
        </div>
        <div class="col-md-3">
          <label class="form-label small fw-medium text-muted mb-1">RW</label>
          <input type="text" class="form-control form-control-sm bg-light" value="${WARGA.rw}" readonly>
        </div>
        <div class="col-md-6">
          <label class="form-label small fw-medium text-muted mb-1">Alamat</label>
          <input type="text" class="form-control form-control-sm bg-light" value="${WARGA.alamat}" readonly>
        </div>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label small fw-medium">Keperluan <span class="text-danger">*</span></label>
        <select class="form-select form-select-sm" id="ajKeperluan" required>
          <option value="">-- Pilih --</option>
          ${optsHtml}
          <option value="__lain__">Lainnya…</option>
        </select>
      </div>
      <div class="col-md-6 d-none" id="wrapKepLain">
        <label class="form-label small fw-medium">Tulis keperluan <span class="text-danger">*</span></label>
        <input type="text" class="form-control form-control-sm" id="ajKepLain" placeholder="Keperluan Anda...">
      </div>
      <div class="col-12">
        <label class="form-label small fw-medium">Keterangan Tambahan</label>
        <textarea class="form-control form-control-sm" id="ajCatatan" rows="2" placeholder="Opsional..."></textarea>
      </div>
      <div class="col-md-6">
        <label class="form-label small fw-medium">No. WhatsApp <span class="text-danger">*</span></label>
        <div class="input-group input-group-sm">
          <span class="input-group-text"><i class="bi bi-whatsapp text-success"></i></span>
          <input type="tel" class="form-control" id="ajNoWa"
                 value="${WARGA.no_wa}" placeholder="08xxxxxxxxxx"
                 required pattern="^(08|628)\\d{8,11}$">
        </div>
        <div class="form-text" style="font-size:.68rem">Notifikasi dikirim ke nomor ini</div>
      </div>
    </div>`;

  document.getElementById('ajKeperluan').addEventListener('change', function () {
    document.getElementById('wrapKepLain').classList.toggle('d-none', this.value !== '__lain__');
    document.getElementById('ajKepLain').required = this.value === '__lain__';
  });
}

function renderStep2(tpl, payload) {
  document.getElementById('modalAjukanBody').innerHTML = `
    <div class="alert alert-success d-flex gap-2 py-2 px-3 mb-3 small">
      <i class="bi bi-check-circle-fill mt-1 flex-shrink-0"></i>
      <div>Periksa kembali sebelum mengirim. Pengajuan tidak dapat diubah setelah dikirim.</div>
    </div>
    <table class="table table-sm table-borderless mb-0">
      <tbody>
        <tr><td class="text-muted small ps-0" style="width:38%">Jenis Surat</td>
            <td class="small fw-medium">${tpl.nama}</td></tr>
        <tr><td class="text-muted small ps-0">Nama</td>
            <td class="small">${WARGA.nama_lengkap}</td></tr>
        <tr><td class="text-muted small ps-0">RT / RW</td>
            <td class="small">${WARGA.rt} / ${WARGA.rw}</td></tr>
        <tr><td class="text-muted small ps-0">Keperluan</td>
            <td class="small fw-medium">${payload.keperluan}</td></tr>
        ${payload.catatan
          ? `<tr><td class="text-muted small ps-0">Keterangan</td><td class="small">${payload.catatan}</td></tr>`
          : ''}
        <tr><td class="text-muted small ps-0">No. WA</td>
            <td class="small"><i class="bi bi-whatsapp text-success me-1"></i>${payload.no_wa}</td></tr>
      </tbody>
    </table>
    <div class="alert alert-warning d-flex gap-2 py-2 px-3 mt-3 mb-0 small">
      <i class="bi bi-bell-fill flex-shrink-0 mt-1"></i>
      <div>Notifikasi status akan dikirim ke <strong>${payload.no_wa}</strong> via WhatsApp</div>
    </div>`;
}

function renderStep3(result) {
  document.getElementById('modalAjukanBody').innerHTML = `
    <div class="text-center py-2">
      <div style="font-size:2.5rem" class="mb-2">✅</div>
      <h6 class="fw-semibold text-success mb-1">Pengajuan berhasil dikirim!</h6>
      <p class="text-muted small mb-0">Nomor tiket: <strong>${result.uuid ?? '—'}</strong></p>
    </div>
    <hr>
    <div class="d-flex flex-column gap-2 small">
      ${[
        'RT akan memverifikasi dalam <strong class="text-dark">1–2 hari kerja</strong>',
        'Notifikasi dikirim via WhatsApp',
        'PDF dapat diunduh setelah disetujui RW',
      ].map((txt, i) => `
        <div class="d-flex gap-2 align-items-start">
          <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-semibold flex-shrink-0"
               style="width:20px;height:20px;font-size:10px">${i + 1}</div>
          <span class="text-muted">${txt}</span>
        </div>`).join('')}
    </div>`;
}

function openModalAjukan(tpl) {
  ajukanTemplate = tpl;
  ajukanData     = {};
  document.getElementById('modalAjukanTitle').textContent = tpl.nama;
  document.getElementById('modalAjukanSub').textContent   = 'Isi data pengajuan';
  setModalStep(1);
  renderStep1(tpl);
  new bootstrap.Modal(document.getElementById('modalAjukan')).show();
}

/* ── Next button ── */
document.getElementById('btnAjukanNext').addEventListener('click', async () => {

  if (ajukanStep === 1) {
    const kepSel  = document.getElementById('ajKeperluan').value;
    const kepLain = document.getElementById('ajKepLain')?.value ?? '';
    const noWa    = document.getElementById('ajNoWa').value.trim();

    if (!kepSel)                                    { document.getElementById('ajKeperluan').classList.add('is-invalid'); return; }
    if (kepSel === '__lain__' && !kepLain)           { document.getElementById('ajKepLain').classList.add('is-invalid');   return; }
    if (!noWa || !/^(08|628)\d{8,11}$/.test(noWa)) { document.getElementById('ajNoWa').classList.add('is-invalid');      return; }

    ajukanData = {
      template_id: +ajukanTemplate.id,
      keperluan  : kepSel === '__lain__' ? kepLain : kepSel,
      catatan    : document.getElementById('ajCatatan').value.trim(),
      no_wa      : noWa,
      form_data  : {},
    };
    setModalStep(2);
    renderStep2(ajukanTemplate, ajukanData);

  } else if (ajukanStep === 2) {
    const btn     = document.getElementById('btnAjukanNext');
    btn.disabled  = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Mengirim…';

    const res = await Api.post(PATH.pengajuan, ajukanData);

    if (res.ok) {
      setModalStep(3);
      renderStep3(res.data?.data ?? {});
      loadRiwayat();
    } else {
      btn.disabled  = false;
      btn.innerHTML = 'Kirim Pengajuan <i class="bi bi-send ms-1"></i>';
      document.getElementById('modalAjukanBody').insertAdjacentHTML('afterbegin',
        `<div class="alert alert-danger alert-dismissible small fade show mb-3">
           <i class="bi bi-exclamation-circle me-1"></i> ${res.data?.message ?? 'Gagal mengirim pengajuan.'}
           <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
         </div>`);
    }

  } else if (ajukanStep === 3) {
    bootstrap.Modal.getInstance(document.getElementById('modalAjukan')).hide();
    bootstrap.Tab.getOrCreateInstance(document.getElementById('tabRiwayat')).show();
  }
});

/* ── Back button ── */
document.getElementById('btnAjukanBack').addEventListener('click', () => {
  if (ajukanStep !== 2) return;
  setModalStep(1);
  renderStep1(ajukanTemplate);
  setTimeout(() => {
    if (!ajukanData.keperluan) return;
    const sel  = document.getElementById('ajKeperluan');
    const opts = [...sel.options].map(o => o.value);
    if (opts.includes(ajukanData.keperluan)) {
      sel.value = ajukanData.keperluan;
    } else {
      sel.value = '__lain__';
      document.getElementById('wrapKepLain').classList.remove('d-none');
      document.getElementById('ajKepLain').value = ajukanData.keperluan;
    }
    document.getElementById('ajNoWa').value    = ajukanData.no_wa   ?? '';
    document.getElementById('ajCatatan').value = ajukanData.catatan ?? '';
  }, 50);
});

/* ════════════════════════════════════════════════════════
   Init
════════════════════════════════════════════════════════ */
loadTemplates();

document.getElementById('tabRiwayat').addEventListener('shown.bs.tab', () => {
  if (document.getElementById('skelRiwayat').innerHTML) loadRiwayat();
});

if (location.hash === '#riwayat') {
  bootstrap.Tab.getOrCreateInstance(document.getElementById('tabRiwayat')).show();
}