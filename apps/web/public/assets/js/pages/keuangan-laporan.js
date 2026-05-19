/**
 * assets/js/pages/keuangan-laporan.js
 * Laporan Keuangan per Bulan
 */
'use strict';

if (!window.LAPORAN_CONFIG || !document.getElementById('laporanApp')) {
  throw new Error('keuangan-laporan.js: config not found');
}

const { role: ROLE, api: API } = window.LAPORAN_CONFIG;
const fmtRp = (n) => 'Rp ' + Number(n ?? 0).toLocaleString('id-ID');
const JENIS_CLS = { pemasukan:'success', pengeluaran:'danger', iuran:'primary' };

/* ── Init tahun ── */
(function initTahun() {
  const sel = document.getElementById('laporanTahun');
  const now = new Date().getFullYear();
  for (let y = now; y >= now - 4; y--) {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    sel.appendChild(opt);
  }
})();

/* ── Load laporan ── */
document.getElementById('btnLoadLaporan')?.addEventListener('click', loadLaporan);

async function loadLaporan() {
  const tahun = document.getElementById('laporanTahun').value;
  const bulan = document.getElementById('laporanBulan').value;

  document.getElementById('laporanPlaceholder').classList.add('d-none');
  document.getElementById('laporanContent').classList.add('d-none');
  document.getElementById('summaryBulan').style.setProperty('display', 'none', 'important');

  const res = await Api.get(`${API.transaksiPerBulan}?tahun=${tahun}&bulan=${bulan}`);
  if (!res.ok) {
    document.getElementById('laporanPlaceholder').innerHTML =
      `<p class="text-danger small">Gagal memuat data.</p>`;
    document.getElementById('laporanPlaceholder').classList.remove('d-none');
    return;
  }

  const d    = res.data?.data ?? {};
  const rows = d.transaksi ?? [];

  // Summary
  const net = (d.total_pemasukan ?? 0) + (d.total_iuran ?? 0) - (d.total_pengeluaran ?? 0);
  const setEl = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };

  setEl('laporanTotalMasuk',  fmtRp((d.total_pemasukan ?? 0) + (d.total_iuran ?? 0)));
  setEl('laporanTotalKeluar', fmtRp(d.total_pengeluaran ?? 0));
  setEl('laporanSaldo',       fmtRp(net));

  const netEl = document.getElementById('laporanSaldo');
  if (netEl) netEl.className = 'mb-0 fw-bold ' + (net >= 0 ? 'text-success' : 'text-danger');

  document.getElementById('summaryBulan').style.removeProperty('display');

  // Badge counts
  const pemasukan   = rows.filter(r => r.jenis === 'pemasukan');
  const pengeluaran = rows.filter(r => r.jenis === 'pengeluaran');
  const iuran       = rows.filter(r => r.jenis === 'iuran');

  setEl('badgeSemua',       rows.length);
  setEl('badgePemasukan',   pemasukan.length);
  setEl('badgePengeluaran', pengeluaran.length);
  setEl('badgeIuranL',      iuran.length);

  // Render tabel per pane
  renderTable('tableSemua',       rows);
  renderTable('tablePemasukan',   pemasukan);
  renderTable('tablePengeluaran', pengeluaran);
  renderTable('tableIuranL',      iuran);

  document.getElementById('laporanContent').classList.remove('d-none');
}

function renderTable(containerId, rows) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!rows.length) {
    el.innerHTML = `<p class="text-muted small text-center py-4">Tidak ada transaksi.</p>`;
    return;
  }

  const total = rows.reduce((s, r) => s + (r.jenis === 'pengeluaran' ? -(+r.jumlah) : +(+r.jumlah)), 0);

  el.innerHTML = `
    <div class="card border shadow-none">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0" style="font-size:.82rem">
            <thead class="table-light">
              <tr>
                <th class="px-3 py-2">Tanggal</th>
                <th class="py-2">Keterangan</th>
                <th class="py-2">Kategori</th>
                <th class="py-2">Jenis</th>
                <th class="py-2 text-end">Jumlah</th>
                <th class="py-2 text-muted small">Oleh</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => {
                const cls  = JENIS_CLS[r.jenis] ?? 'secondary';
                const sign = r.jenis === 'pengeluaran' ? '-' : '+';
                const tgl  = new Date(r.tanggal).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
                const dot  = r.warna_kategori
                  ? `<span class="rounded-circle me-1" style="width:8px;height:8px;background:${r.warna_kategori};display:inline-block;vertical-align:middle"></span>` : '';
                return `
                  <tr>
                    <td class="px-3 py-2 text-muted" style="white-space:nowrap">${tgl}</td>
                    <td class="py-2">
                      ${r.keterangan ?? '—'}
                      ${r.bukti_url ? `<a href="${r.bukti_url}" target="_blank" class="ms-1 text-muted" title="Lihat bukti"><i class="bx bx-link-external small"></i></a>` : ''}
                    </td>
                    <td class="py-2 small">${dot}${r.nama_kategori ?? '—'}</td>
                    <td class="py-2"><span class="badge rounded-pill bg-${cls}-subtle text-${cls}-emphasis">${r.jenis}</span></td>
                    <td class="py-2 text-end fw-semibold text-${cls}">${sign}${fmtRp(r.jumlah)}</td>
                    <td class="py-2 text-muted small">${r.created_by_name ?? '—'}</td>
                  </tr>`;
              }).join('')}
            </tbody>
            <tfoot class="table-light">
              <tr>
                <td colspan="4" class="px-3 py-2 fw-semibold text-end">Total</td>
                <td class="py-2 text-end fw-bold ${total >= 0 ? 'text-success' : 'text-danger'}">
                  ${total >= 0 ? '+' : ''}${fmtRp(total)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>`;
}