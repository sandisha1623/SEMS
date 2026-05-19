/**
 * keuangan-setting.js
 * Halaman Konfigurasi Pembayaran — hanya Tab Master Iuran dan Konfigurasi QRIS
 *
 */

'use strict';

(() => {
  const CFG = window.SETTING_CONFIG ?? {};
  const API = CFG.api ?? {};

  // ── helpers ────────────────────────────────────────────
  async function apiGet(url) {
    const res = await Api.get(url);
    if (!res.ok) throw new Error(res.data?.message || `HTTP ${res.status}`);
    return res.data;
  }

  async function apiPost(url, body) {
    const res = await Api.post(url, body);
    if (!res.ok) throw new Error(res.data?.message || `HTTP ${res.status}`);
    return res.data;
  }

  async function apiPatch(url, body) {
    const res = await Api.put(url, body);
    if (!res.ok) throw new Error(res.data?.message || `HTTP ${res.status}`);
    return res.data;
  }

  function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  }

  function showAlert(id, msg, type = 'danger') {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    el.classList.remove('d-none');
    setTimeout(() => el.classList.add('d-none'), 5000);
  }

  function setLoading(btnId, spinId, textId, state) {
    const btn  = document.getElementById(btnId);
    const spin = document.getElementById(spinId);
    const txt  = document.getElementById(textId);
    if (btn)  btn.disabled = state;
    spin?.classList.toggle('d-none', !state);
    txt?.classList.toggle('d-none',  state);
  }

  // MASTER IURAN
  function initMasterIuranDataTable() {
    const table = $('#tableMasterIuran');

    if (!table.length) return;

    table.DataTable({
      scrollX: false, 
      scrollCollapse: false,
      processing: true,
      serverSide: true,
      ajax: async function(data, callback, settings) {
        try {
          // $.param(data) mengirimkan parameter draw, start, length, dll ke helper
          const urlWithParams = API.paymentSetting + '?' + $.param(data);
          const response = await apiGet(urlWithParams);
          
          // DataTables butuh callback(response) untuk merender data
          callback(response);
        } catch (err) {
          console.error("DataTables Error:", err);
          // Tampilkan pesan error kosong agar tabel tidak 'stuck' loading
          callback({
            draw: data.draw,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: []
          });
        }
      },
      columns: [
        {
          data: 'nominal',
          render: (d) => `Rp ${formatRupiah(d)}`
        },
        { data: 'berlaku_dari' },
        {
          data: 'berlaku_sampai',
          render: d => d ?? '-'
        },
        {
          data: 'is_active',
          render: d => d == 1
            ? '<span class="badge text-bg-primary">Aktif</span>'
            : '<span class="badge text-bg-danger">Nonaktif</span>'
        },
        {
          data: 'keterangan',
          render: d => d ?? '-'
        }
      ],
      order: [[1, 'desc']]
    });
  }

  function initMasterIuranEvents() {
    document.getElementById('btnSimpanMasterIuran')?.addEventListener('click', async () => {
      const nominal = document.getElementById('inputNominalIuran')?.value;
      const berlaku = document.getElementById('inputBerlakuDari')?.value;
      const ket     = document.getElementById('inputKetIuran')?.value;

      if (!nominal || !berlaku) {
        showAlert('masterIuranAlert', 'Nominal & tanggal wajib diisi');
        return;
      }

      setLoading('btnSimpanMasterIuran', 'masterIuranSpin', 'masterIuranText', true);

      try {
        await apiPost(API.paymentSetting, {
          method : 'POST',
          body   : JSON.stringify({
            nominal: parseInt(nominal),
            berlaku_dari: berlaku,
            keterangan: ket
          }),
        });

        showAlert('masterIuranAlert', 'Master iuran berhasil disimpan', 'success');

        // reset form
        document.getElementById('inputNominalIuran').value = '';
        document.getElementById('inputKetIuran').value     = '';

        // Cek jika tabel sudah diinisialisasi, langsung reload
        if ($.fn.dataTable.isDataTable('#tableMasterIuran')) {
          $('#tableMasterIuran').DataTable().ajax.reload(null, false);
        } else {
          // Jika belum pernah ada, baru panggil fungsi init
          initMasterIuranDataTable();
        }
      } catch (e) {
        showAlert('masterIuranAlert', e.message);
      } finally {
        setLoading('btnSimpanMasterIuran', 'masterIuranSpin', 'masterIuranText', false);
      }
    });
  }

  // ══════════════════════════════════════════════════════
  // TAB: KONFIGURASI QRIS
  // ══════════════════════════════════════════════════════
  function initQrisEvents() {
    // Toggle show/hide server key
    document.getElementById('btnToggleKey')?.addEventListener('click', () => {
      const input = document.getElementById('inputServerKey');
      const icon  = document.getElementById('iconToggleKey');
      if (!input) return;
      const hidden   = input.type === 'password';
      input.type     = hidden ? 'text' : 'password';
      icon.className = hidden ? 'bx bx-show' : 'bx bx-hide';
    });

    // Copy webhook URL
    document.getElementById('btnCopyWebhook')?.addEventListener('click', () => {
      const url = document.getElementById('webhookUrlDisplay')?.textContent?.trim();
      if (!url) return;
      navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('btnCopyWebhook');
        btn.innerHTML = '<i class="bx bx-check text-success"></i>';
        setTimeout(() => { btn.innerHTML = '<i class="bx bx-copy"></i>'; }, 2000);
      });
    });

    // Simpan konfigurasi QRIS
    document.getElementById('btnSimpanQrisConfig')?.addEventListener('click', async () => {
      const payload = {
        qris_provider : document.getElementById('selectQrisProvider')?.value,
        qris_env      : document.querySelector('input[name="qrisEnv"]:checked')?.value,
        qris_client_key  : document.getElementById('inputClientKey')?.value?.trim()  || null,
        qris_merchant_id : document.getElementById('inputMerchantId')?.value?.trim() || null,
      };

      // Field sensitif hanya dikirim jika diisi agar tidak menimpa nilai lama
      const serverKey  = document.getElementById('inputServerKey')?.value?.trim();
      const webhookSec = document.getElementById('inputWebhookSecret')?.value?.trim();
      if (serverKey)  payload.qris_server_key     = serverKey;
      if (webhookSec) payload.qris_webhook_secret = webhookSec;

      setLoading('btnSimpanQrisConfig', 'simpanQrisSpin', 'simpanQrisText', true);
      try {
        // Kirim payload langsung, bukan wrapped dalam { method, body }
        await apiPatch(API.config, payload);

        showAlert('qrisConfigAlert', 'Konfigurasi QRIS berhasil disimpan.', 'success');

        // Bersihkan field sensitif setelah simpan
        const keyEl = document.getElementById('inputServerKey');
        if (keyEl) { keyEl.value = ''; keyEl.placeholder = '••••••••••••••••• (tersimpan)'; }
        const secEl = document.getElementById('inputWebhookSecret');
        if (secEl) secEl.value = '';
      } catch (e) {
        showAlert('qrisConfigAlert', e.message);
      } finally {
        setLoading('btnSimpanQrisConfig', 'simpanQrisSpin', 'simpanQrisText', false);
      }
    });

    // Test koneksi
    document.getElementById('btnTestKoneksi')?.addEventListener('click', async () => {
      const btn  = document.getElementById('btnTestKoneksi');
      const body = document.getElementById('qrisStatusBody');
      btn.disabled  = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Testing…';
      body.innerHTML = '<div class="text-center py-2"><div class="spinner-border spinner-border-sm text-primary"></div></div>';

      try {
        const data = await apiGet(API.testQris);
        body.innerHTML = `
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
              <i class="bx bx-check me-1"></i>Terhubung
            </span>
          </div>
          <p class="small text-muted mb-0">${data.message ?? 'Koneksi berhasil.'}</p>`;
      } catch (e) {
        body.innerHTML = `
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
              <i class="bx bx-x me-1"></i>Gagal
            </span>
          </div>
          <p class="small text-danger mb-0">${e.message}</p>`;
      } finally {
        btn.disabled  = false;
        btn.innerHTML = '<i class="bx bx-wifi me-1"></i>Test Koneksi';
      }
    });
  }

  // ══════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    initMasterIuranDataTable();
    initMasterIuranEvents();
    initQrisEvents();
  });
})();
