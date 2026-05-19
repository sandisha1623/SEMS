/**
 * assets/js/pages/keuangan-transaksi.js
 * Halaman Transaksi Keuangan
 */
'use strict';

if (!window.TRANSAKSI_CONFIG || !document.getElementById('transaksiApp')) {
  throw new Error('keuangan-transaksi.js: config not found');
}

const { role: ROLE, api: API } = window.TRANSAKSI_CONFIG;
const fmtRp = (n) => 'Rp ' + Number(n ?? 0).toLocaleString('id-ID');

const JENIS_CLS  = { pemasukan: 'success', pengeluaran: 'danger', iuran: 'primary' };
const JENIS_ICON = { pemasukan: 'bx-plus-circle', pengeluaran: 'bx-minus-circle', iuran: 'bx-money' };

let _kategoriList  = [];
let _hapusUuid     = null;

/* ── Load kategori ── */
async function loadKategori() {
  const res = await Api.get(API.kategori);
  if (!res.ok) return;
  _kategoriList = res.data?.data ?? [];
  populateKategoriSelect();
  renderKategoriList();
}

function populateKategoriSelect(jenisFilter = '') {
  const sel     = document.getElementById('inputKategori');
  const selFilter = document.getElementById('filterKategori');
  if (!sel) return;

  const list = jenisFilter ? _kategoriList.filter(k => k.jenis === jenisFilter) : _kategoriList;

  sel.innerHTML = '<option value="">— Tanpa kategori —</option>' +
    list.map(k => `<option value="${k.id}">${k.nama} (${k.jenis})</option>`).join('');

  if (selFilter) {
    selFilter.innerHTML = '<option value="">Semua Kategori</option>' +
      _kategoriList.map(k => `<option value="${k.id}">${k.nama}</option>`).join('');
  }
}

function renderKategoriList() {
  const el = document.getElementById('kategoriList');
  if (!el) return;
  if (!_kategoriList.length) {
    el.innerHTML = `<p class="text-muted small text-center py-2">Belum ada kategori.</p>`;
    return;
  }
  el.innerHTML = _kategoriList.map(k => `
    <div class="d-flex align-items-center gap-2 py-2 border-bottom">
      <span class="rounded-circle" style="width:12px;height:12px;background:${k.warna};flex-shrink:0"></span>
      <span class="small flex-grow-1">${k.nama}</span>
      <span class="badge bg-${JENIS_CLS[k.jenis] ?? 'secondary'}-subtle text-${JENIS_CLS[k.jenis] ?? 'secondary'}-emphasis small">
        ${k.jenis}
      </span>
      ${k.rt_id ? `<button class="btn btn-sm p-0 text-danger border-0" onclick="hapusKategori(${k.id})">
        <i class="bx bx-trash small"></i></button>` : ''}
    </div>`).join('');
}

window.hapusKategori = async function(id) {
  if (!confirm('Hapus kategori ini?')) return;
  const res = await Api.delete(`${API.kategori}/${id}`);
  if (res.ok) { await loadKategori(); await loadTransaksi(); }
  else if (typeof Toast !== 'undefined') Toast.error(res.data?.message ?? 'Gagal hapus.');
};

document.getElementById('btnTambahKat')?.addEventListener('click', async () => {
  const nama  = document.getElementById('inputNamaKat').value.trim();
  const jenis = document.getElementById('inputJenisKat').value;
  const warna = document.getElementById('inputWarnaKat').value;

  if (!nama) return;

  const res = await Api.post(API.kategori, { nama, jenis, warna });
  if (res.ok) {
    document.getElementById('inputNamaKat').value = '';
    await loadKategori();
  } else if (typeof Toast !== 'undefined') Toast.error(res.data?.message ?? 'Gagal tambah.');
});

/* ── Load transaksi ── */
async function loadTransaksi() {
  const jenis    = document.getElementById('filterJenis')?.value ?? '';
  const kategori = document.getElementById('filterKategori')?.value ?? '';
  const limit    = document.getElementById('filterLimit')?.value ?? 20;

  const params = new URLSearchParams({ limit });
  if (jenis)    params.append('jenis', jenis);
  if (kategori) params.append('kategori_id', kategori);

  const res = await Api.get(`${API.transaksi}?${params}`);
  const tbody = document.getElementById('transaksiTableBody');
  const count = document.getElementById('totalTransaksiCount');
  if (!tbody) return;

  if (!res.ok) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger small">Gagal memuat data.</td></tr>`;
    return;
  }

  const list = res.data?.data ?? [];
  if (count) count.textContent = list.length;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted small">Tidak ada transaksi.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(t => {
    const cls  = JENIS_CLS[t.jenis]  ?? 'secondary';
    const icon = JENIS_ICON[t.jenis] ?? 'bx-file';
    const sign = t.jenis === 'pengeluaran' ? '-' : '+';
    const tgl  = new Date(t.tanggal).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
    const dot  = t.warna_kategori ? `<span class="rounded-circle me-1" style="width:8px;height:8px;background:${t.warna_kategori};display:inline-block"></span>` : '';

    return `
      <tr>
        <td class="px-3 py-2 text-muted" style="white-space:nowrap">${tgl}</td>
        <td class="py-2">
          <p class="mb-0 small fw-medium">${t.keterangan ?? '—'}</p>
          ${t.bukti_url ? `<a href="${t.bukti_url}" target="_blank" class="text-muted" style="font-size:.72rem">Lihat bukti</a>` : ''}
        </td>
        <td class="py-2 small">${dot}${t.nama_kategori ?? '—'}</td>
        <td class="py-2">
          <span class="badge rounded-pill bg-${cls}-subtle text-${cls}-emphasis">${t.jenis}</span>
        </td>
        <td class="py-2 text-end fw-semibold text-${cls}">${sign}${fmtRp(t.jumlah)}</td>
        <td class="py-2 text-center">
          <button class="btn btn-sm p-1 text-danger border-0" onclick="confirmHapus('${t.uuid}')">
            <i class="bx bx-trash"></i>
          </button>
        </td>
      </tr>`;
  }).join('');
}

document.getElementById('btnFilter')?.addEventListener('click', loadTransaksi);

/* ── Input transaksi ── */
window.setJenisTransaksi = function(jenis) {
  document.getElementById('inputJenis').value = jenis;
  const title = document.getElementById('modalTransaksiTitle');
  if (title) {
    title.textContent = jenis === 'pemasukan' ? 'Input Pemasukan' : 'Input Pengeluaran';
    title.className   = `modal-title fw-semibold text-${JENIS_CLS[jenis]}`;
  }
  populateKategoriSelect(jenis);
};

document.getElementById('btnSimpanTransaksi')?.addEventListener('click', async () => {
  const alertEl = document.getElementById('transaksiAlert');
  alertEl.classList.add('d-none');

  const jenis      = document.getElementById('inputJenis').value;
  const jumlah     = parseInt(document.getElementById('inputJumlah').value || '0');
  const tanggal    = document.getElementById('inputTanggal').value;
  const keterangan = document.getElementById('inputKeterangan').value.trim();
  const kategoriId = document.getElementById('inputKategori').value;
  const buktiUrl   = document.getElementById('inputBukti').value.trim();

  if (!jenis)  { showAlert(alertEl, 'Jenis wajib dipilih.'); return; }
  if (jumlah <= 0) { showAlert(alertEl, 'Jumlah harus lebih dari 0.'); return; }
  if (!tanggal) { showAlert(alertEl, 'Tanggal wajib diisi.'); return; }

  setLoading('transaksiText', 'transaksiSpin', 'btnSimpanTransaksi', true);

  const res = await Api.post(API.transaksi, {
    jenis, jumlah, tanggal, keterangan,
    kategori_id: kategoriId || null,
    bukti_url  : buktiUrl   || null,
  });

  setLoading('transaksiText', 'transaksiSpin', 'btnSimpanTransaksi', false);

  if (res.ok) {
    bootstrap.Modal.getInstance(document.getElementById('modalTransaksi'))?.hide();
    // Reset form
    ['inputJumlah','inputKeterangan','inputBukti'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    if (typeof Toast !== 'undefined') Toast.success('Transaksi berhasil disimpan.');
    loadTransaksi();
  } else {
    showAlert(alertEl, res.data?.message ?? 'Gagal menyimpan.');
  }
});

/* ── Hapus transaksi ── */
window.confirmHapus = function(uuid) {
  _hapusUuid = uuid;
  new bootstrap.Modal(document.getElementById('modalHapus')).show();
};

document.getElementById('btnKonfirmHapus')?.addEventListener('click', async () => {
  if (!_hapusUuid) return;
  setLoading('hapusText', 'hapusSpin', 'btnKonfirmHapus', true);
  const res = await Api.delete(`${API.transaksi}/${_hapusUuid}`);
  setLoading('hapusText', 'hapusSpin', 'btnKonfirmHapus', false);

  bootstrap.Modal.getInstance(document.getElementById('modalHapus'))?.hide();
  _hapusUuid = null;

  if (res.ok) {
    if (typeof Toast !== 'undefined') Toast.success('Transaksi dihapus. Saldo disesuaikan.');
    loadTransaksi();
  } else {
    if (typeof Toast !== 'undefined') Toast.error(res.data?.message ?? 'Gagal menghapus.');
  }
});

/* ── Util ── */
function showAlert(el, msg, type = 'warning') {
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.classList.remove('d-none');
}

function setLoading(textId, spinId, btnId, loading) {
  document.getElementById(textId)?.classList.toggle('d-none', loading);
  document.getElementById(spinId)?.classList.toggle('d-none', !loading);
  const btn = document.getElementById(btnId);
  if (btn) btn.disabled = loading;
}

/* ── Init ── */
loadKategori();
loadTransaksi();