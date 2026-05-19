'use strict';

(() => {
  const CFG = window.IURAN_CONFIG ?? {};
  const API = CFG.api ?? {};

  const $  = (sel, ctx = document) => ctx.querySelector(sel);

  // ─────────────────────────────────────────────
  // API WRAPPER (pakai Api dari api.js)
  // ─────────────────────────────────────────────
  async function apiGet(url) {
    const res = await Api.get(url);
    if (!res.ok) throw new Error(res.data?.message || 'Request gagal');
    return res.data;
  }

  async function apiPost(url, body) {
    const res = await Api.post(url, body);
    if (!res.ok) throw new Error(res.data?.message || 'Request gagal');
    return res.data;
  }

  async function apiDelete(url) {
    const res = await Api.delete(url);
    if (!res.ok) throw new Error(res.data?.message || 'Request gagal');
    return res.data;
  }

  const fmtRupiah = n => 'Rp ' + Number(n).toLocaleString('id-ID');

  // ════════════════════════════════════════════
  // INFO IURAN
  // ════════════════════════════════════════════
  async function loadInfoIuran() {
    try {
      const list = await apiGet(API.masterIuran);
      console.log('[INFO IURAN]', list);
    } catch (e) {
      console.error('loadInfoIuran:', e);
    }
  }

  // ════════════════════════════════════════════
  // BAYAR
  // ════════════════════════════════════════════
  async function generateQris() {
    try {
      const payload = {
        jumlah_bulan: parseInt($('#selectJumlahBulan').value),
        bulan_mulai: $('#inputBulanMulai').value
      };

      const data = await apiPost(API.bayar, payload);
      console.log('[QRIS]', data);
    } catch (e) {
      alert(e.message);
    }
  }

  // ════════════════════════════════════════════
  // REKAP
  // ════════════════════════════════════════════
  async function loadRekap() {
    try {
      const data = await apiGet(API.rekapMatriks);
      console.log('[REKAP]', data);
    } catch (e) {
      console.error(e);
    }
  }

  // ════════════════════════════════════════════
  // MANUAL
  // ════════════════════════════════════════════
  async function loadKKList() {
    try {
      const data = await apiGet(API.kkList);
      console.log('[KK LIST]', data);
    } catch (e) {
      console.error(e);
    }
  }

  async function simpanManual() {
    try {
      const payload = { kk_id: 1 };
      await apiPost(API.inputManual, payload);
    } catch (e) {
      alert(e.message);
    }
  }

  async function hapus(uuid) {
    try {
      await apiDelete(`${API.hapusBayar}/${uuid}`);
    } catch (e) {
      alert(e.message);
    }
  }

  // ════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    loadInfoIuran();

    $('#btnGenerateQris')?.addEventListener('click', generateQris);
    $('#btnLoadRekap')?.addEventListener('click', loadRekap);
    $('#btnSimpanManual')?.addEventListener('click', simpanManual);
  });
})();