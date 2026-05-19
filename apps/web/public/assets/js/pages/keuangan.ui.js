'use strict';

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function formatBulan(dateStr) {
  if (!dateStr) return '-';

  return new Date(dateStr).toLocaleDateString('id-ID', {
    month: 'short',
    year: 'numeric'
  });
}

function parseIuranAktif(item) {
  if (!item) return null;

  const dari = item.berlaku_dari;
  const sampai = item.berlaku_sampai;

  const tahun = dari
    ? new Date(dari).getFullYear()
    : '-';

  const periode = sampai
    ? `${formatBulan(dari)} - ${formatBulan(sampai)}`
    : `Mulai ${formatBulan(dari)}`;

  return {
    tahun,
    nominal: Number(item.nominal || 0),
    periode,
    keterangan: item.keterangan ?? '-'
  };
}

function getIuranAktif(list) {
  if (!Array.isArray(list)) return null;

  return list.find(i => !i.berlaku_sampai) || list[0] || null;
}

// ─────────────────────────────────────────
// FORMAT
// ─────────────────────────────────────────
export const fmtRupiah = n =>
  'Rp ' + Number(n || 0).toLocaleString('id-ID');

// ─────────────────────────────────────────
// MASTER IURAN TABLE
// ─────────────────────────────────────────
export function renderMasterIuran(list) {
  const el = document.getElementById('masterIuranTable');
  if (!el) return;

  if (!Array.isArray(list) || list.length === 0) {
    el.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-3 text-muted small">
          Belum ada data
        </td>
      </tr>`;
    return;
  }

  el.innerHTML = list.map(i => `
    <tr>
      <td>${fmtRupiah(i.nominal)}</td>
      <td>${i.berlaku_dari}</td>
      <td>${i.berlaku_sampai ?? 'Aktif'}</td>
      <td>${i.keterangan ?? '-'}</td>
    </tr>
  `).join('');
}

// ─────────────────────────────────────────
// IURAN AKTIF CARD (🔥 SINGLE SOURCE)
// ─────────────────────────────────────────
export function renderIuranAktifCard(list) {
  const el = document.getElementById('iuranAktifCard');
  if (!el) return;

  const aktif = getIuranAktif(list);
  const data  = parseIuranAktif(aktif);

  if (!data) {
    el.innerHTML = `
      <div class="text-center text-muted small py-3">
        Belum ada iuran aktif
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="d-flex flex-column gap-2">

      <div>
        <small class="text-muted">Nominal / bulan</small>
        <div class="fw-bold fs-5">${fmtRupiah(data.nominal)}</div>
      </div>

      <div>
        <small class="text-muted">Tahun</small>
        <div>${data.tahun}</div>
      </div>

      <div>
        <small class="text-muted">Periode</small>
        <div>${data.periode}</div>
      </div>

      <div>
        <small class="text-muted">Keterangan</small>
        <div>${data.keterangan}</div>
      </div>

    </div>
  `;
}

// ─────────────────────────────────────────
// KK DROPDOWN
// ─────────────────────────────────────────
export function renderKKList(list) {
  const sel = document.getElementById('selectKK');
  if (!sel) return;

  sel.innerHTML = '<option value="">Pilih KK</option>';

  if (!Array.isArray(list)) return;

  list.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k.id ?? k.kk_id;
    opt.textContent = k.kepala_keluarga ?? k.nama_kepala ?? 'Tanpa nama';
    sel.appendChild(opt);
  });
}

// ─────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────
export function showError(msg) {
  console.error(msg);
  alert(msg);
}