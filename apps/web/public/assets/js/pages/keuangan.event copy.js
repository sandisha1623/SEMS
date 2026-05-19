'use strict';

import {
  getMasterIuran,
  createMasterIuran,
  bayarIuran,
  getKKList,
  inputManual
} from './keuangan.service.js';

import {
  renderMasterIuran,
  renderKKList,
  renderIuranAktifCard,
  showError
} from './keuangan.ui.js';

(() => {

  const CFG = window.IURAN_CONFIG ?? {};
  const API = CFG.api ?? {};

  let IURAN_AKTIF = null;

  function updateManualKalkulasi() {
    const nominalEl = document.getElementById('mnKalcNominal');
    const periodeEl = document.getElementById('mnKalcPeriode');
    const totalEl   = document.getElementById('mnKalcTotal');

    const bulanMulai = document.getElementById('selectBulanMulai')?.value;
    const tahun      = document.getElementById('selectTahunManual')?.value;
    const jumlah     = document.getElementById('selectJumlahBulanManual')?.value;

    if (!IURAN_AKTIF || !bulanMulai || !tahun || !jumlah) {
      return;
    }

    const nominal = Number(IURAN_AKTIF.nominal || 0);
    const jml     = Number(jumlah);

    // hitung periode
    const start = new Date(`${tahun}-${String(bulanMulai).padStart(2, '0')}-01`);
    const end   = new Date(start);
    end.setMonth(end.getMonth() + jml - 1);

    const format = d =>
      d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

    const periode = jml === 1
      ? format(start)
      : `${format(start)} - ${format(end)}`;

    // render
    nominalEl.textContent = 'Rp ' + nominal.toLocaleString('id-ID');
    periodeEl.textContent = periode;
    totalEl.textContent   = 'Rp ' + (nominal * jml).toLocaleString('id-ID');
  }

  function initManualKalkulasiEvent() {
    ['selectBulanMulai', 'selectTahunManual', 'selectJumlahBulanManual']
      .forEach(id => {
        document.getElementById(id)?.addEventListener('change', updateManualKalkulasi);
      });
  }

  // ─────────────────────────────────────────
  // LOAD MASTER IURAN
  // ─────────────────────────────────────────

  async function loadMasterIuran() {
    try {
      const data = await getMasterIuran(API);

      // 🔥 ambil iuran aktif
      IURAN_AKTIF = Array.isArray(data)
        ? data.find(i => !i.berlaku_sampai)
        : data;

      renderMasterIuran(data);
      renderIuranAktifCard(data);

      updateManualKalkulasi(); // 🔥 langsung hitung

    } catch (e) {
      showError(e.message);
    }
  }

  // ─────────────────────────────────────────
  // LOAD KK
  // ─────────────────────────────────────────

  async function loadKK() {
    try {
      const data = await getKKList(API);
      renderKKList(data);
    } catch (e) {
      showError(e.message);
    }
  }

  // ─────────────────────────────────────────
  // SIMPAN MASTER IURAN
  // ─────────────────────────────────────────

  function initMasterIuranEvents() {
    document.addEventListener('click', async (e) => {

      const btn = e.target.closest('#btnSimpanMasterIuran');
      if (!btn) return;

      const spin    = document.getElementById('masterIuranSpin');
      const text    = document.getElementById('masterIuranText');
      const alertEl = document.getElementById('masterIuranAlert');

      const nominal = document.getElementById('inputNominalIuran')?.value;
      const berlaku = document.getElementById('inputBerlakuDari')?.value;
      const ket     = document.getElementById('inputKetIuran')?.value;

      if (!nominal || !berlaku) {
        alertEl.className = 'alert alert-danger';
        alertEl.textContent = 'Nominal dan tanggal wajib diisi';
        alertEl.classList.remove('d-none');
        return;
      }

      btn.disabled = true;
      spin?.classList.remove('d-none');
      text?.classList.add('d-none');

      try {
        await createMasterIuran(API, {
          nominal      : parseInt(nominal),
          berlaku_dari : berlaku + '-01',
          keterangan   : ket || null,
        });

        bootstrap.Modal
          .getInstance(document.getElementById('modalMasterIuran'))
          ?.hide();

        await loadMasterIuran();

      } catch (err) {
        alertEl.className = 'alert alert-danger';
        alertEl.textContent = err.message;
        alertEl.classList.remove('d-none');
      } finally {
        btn.disabled = false;
        spin?.classList.add('d-none');
        text?.classList.remove('d-none');
      }
    });
  }

  function initSelectTahunManual() {
    const el = document.getElementById('selectTahunManual');
    if (!el) return;

    const currentYear = new Date().getFullYear();

    // reset
    el.innerHTML = '';

    // range tahun (bebas, ini best practice: -3 sampai +1)
    for (let y = currentYear - 3; y <= currentYear + 1; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;

      if (y === currentYear) opt.selected = true;

      el.appendChild(opt);
    }
  }

  // ─────────────────────────────────────────
  // QRIS BAYAR
  // ─────────────────────────────────────────

  function initBayarEvent() {
    document.getElementById('btnGenerateQris')?.addEventListener('click', async () => {
      try {
        await bayarIuran(API, {
          jumlah_bulan: 1,
          bulan_mulai : '2026-01'
        });
      } catch (e) {
        showError(e.message);
      }
    });
  }

  // ─────────────────────────────────────────
  // INPUT MANUAL
  // ─────────────────────────────────────────

  function initManualEvent() {
    document.getElementById('btnSimpanManual')?.addEventListener('click', async () => {
      try {
        const kkId        = document.getElementById('selectKK')?.value;
        const bulanMulai  = document.getElementById('selectBulanMulai')?.value;
        const tahun       = document.getElementById('selectTahunManual')?.value;
        const jumlahBulan = document.getElementById('selectJumlahBulanManual')?.value;
        const tanggal     = document.getElementById('inputTglBayar')?.value;
        const metode      = document.getElementById('selectMetodeBayar')?.value;
        const ket         = document.getElementById('inputKetManual')?.value;

        if (!kkId || !bulanMulai || !tahun || !jumlahBulan || !tanggal) {
          showError('Semua field wajib diisi');
          return;
        }

        await inputManual(API, {
          kk_id: parseInt(kkId),
          bulan_mulai: parseInt(bulanMulai),
          tahun: parseInt(tahun),
          jumlah_bulan: parseInt(jumlahBulan),
          tanggal_bayar: tanggal,
          metode_bayar: metode,
          keterangan: ket || null
        });

        showError('Pembayaran berhasil disimpan'); // atau toast success
      } catch (e) {
        showError(e.message);
      }
    });
  }

  // ─────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {

    if (!API.masterIuran) {
      console.error('API config belum ter-load');
      return;
    }

    initMasterIuranEvents();
    initBayarEvent();
    initManualEvent();
    initSelectTahunManual();
    initManualKalkulasiEvent();

    loadMasterIuran();
    loadKK();
  });

})();