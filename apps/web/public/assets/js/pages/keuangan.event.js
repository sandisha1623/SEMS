(function () {

  const API  = window.IURAN_CONFIG.api;

  const elSelect = $('#pilihwarga');
  const elMatrix = document.getElementById('kkMatrix');

  let selectedKk       = null; // UUID
  let selectedMonths   = [];
  let nominalPerBulan  = 0;
  let isWargaMode      = false; //
  let isSubmitting     = false;
  let uploadedBuktiPath = null;

  $(document).ready(init);

  // =========================================================
  // INIT
  // =========================================================
  async function init() {
    try {
      initMetodeBayar();
      bindFormSubmit();
      initUploadBukti();
      //await loadRiwayat();
      //await loadStatistik();
      await loadSummary();

      const res = await Api.get(API.daftarKartuKeluarga);
      if (!res.ok) throw new Error();

      const payload = res.data.data;

      // =============================
      // MODE WARGA
      // =============================
      if (payload.mode === 'single') {
        isWargaMode = true;

        selectedKk = payload.data.value; // UUID (optional, backend override)

        // sembunyikan dropdown
        const wrapper = document.getElementById('wrapperPilihWarga');
        if (wrapper) wrapper.style.display = 'none';

        const info = document.getElementById('infoWarga');
        if (info) {
          info.innerText = `Pembayaran untuk: ${payload.data.label}`;
          info.classList.remove('d-none');
        }

        await loadMatrix(selectedKk);
        return;
      }

      // =============================
      // MODE ADMIN
      // =============================
      isWargaMode = false;
      initAjaxSelect2();

    } catch (err) {
      console.error(err);
      Toast.error(err.message || 'Gagal memuat data KK');
    }
  }

  // =========================================================
  // SELECT2
  // =========================================================
  function initAjaxSelect2() {
    elSelect.select2({
      placeholder: 'Cari warga / kepala keluarga...',
      width: '100%',
      allowClear: true,

      ajax: {
        delay: 300,
        transport: async function (params, success, failure) {
          try {
            const keyword = params.data.q || '';

            const res = await Api.get(
              API.daftarKartuKeluarga + '?search=' + encodeURIComponent(keyword)
            );

            if (!res.ok) throw new Error();

            const list = res.data.data.data || [];

            success({
              results: list.map(item => ({
                id: item.value, // UUID
                text: item.label
              }))
            });

          } catch (e) {
            console.error(e);
            failure();
          }
        }
      }
    });

    elSelect.on('change', async function () {
      selectedKk = $(this).val(); // UUID

      if (selectedKk) {
        await loadMatrix(selectedKk);
      } else if (isWargaMode) {
        resetMatrix();
      }
    });
  }

  // =========================================================
  // LOAD MATRIX
  // =========================================================
  async function loadMatrix(kkUuid) {
    try {
      renderLoading();

      const res = await Api.get(
        `/iuran-warga/matrixKk?kk_uuid=${kkUuid}&tahun=${new Date().getFullYear()}`
      );

      if (!res.ok) throw new Error();

      const payload = res.data.data;

      nominalPerBulan = payload.nominal_per_bulan || 0;

      renderMatrix(payload.bulan || {});

    } catch (err) {
      console.error(err);
      Toast.error('Gagal memuat data iuran');
      resetMatrix();
    }
  }

  // RENDER MATRIX
  function renderMatrix(bulanData) {
    const bulanNama = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    selectedMonths = [];
    updateTotal();

    let html = `<div class="d-flex flex-wrap gap-3">`;

    for (let i = 1; i <= 12; i++) {
      const item   = bulanData[i] || { status: 'unpaid' };
      const isPaid = item.status === 'paid';

      html += `
        <div 
          class="bulan-item border rounded text-center p-2 
            ${isPaid ? 'bg-success-subtle text-success' : 'bg-light'}"
          data-bulan="${i}"
          data-paid="${isPaid}"
          style="width:90px; cursor:${isPaid ? 'not-allowed' : 'pointer'}"
        >
          <div class="small">${bulanNama[i - 1]}</div>
          <div>${isPaid ? '✔️' : '-'}</div>
        </div>
      `;
    }

    html += `</div>`;
    elMatrix.innerHTML = html;

    bindMonthClick();
  }

  function bindMonthClick() {
    document.querySelectorAll('.bulan-item').forEach(el => {
      el.addEventListener('click', function () {

        const isPaid = this.dataset.paid === 'true';
        if (isPaid) return;

        const bulan = parseInt(this.dataset.bulan);

        if (selectedMonths.includes(bulan)) {
          selectedMonths = selectedMonths.filter(b => b !== bulan);
          this.classList.remove('bg-primary', 'text-white');
          this.classList.add('bg-light');
        } else {
          selectedMonths.push(bulan);
          this.classList.remove('bg-light');
          this.classList.add('bg-primary', 'text-white');
        }

        updateTotal();
      });
    });
  }

  // TOTAL
  function updateTotal() {
    const total = selectedMonths.length * nominalPerBulan;

    document.getElementById('kalcNominal').innerText = formatRupiah(nominalPerBulan);
    document.getElementById('kalcTotal').innerText   = formatRupiah(total);
  }

  function isConsecutive(arr) {
    if (arr.length === 0) return true;

    const sorted = [...arr].sort((a, b) => a - b);
    return sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
  }

  // INIT UPLOAD BUKTI
  function initUploadBukti() {
    const fileInput = document.getElementById('formFile');
    if (!fileInput) return;

    fileInput.addEventListener('change', async function () {
      const file = this.files[0];
      if (!file) return;

      // Validasi sisi client
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        Toast.warning('Format file tidak didukung');
        this.value = '';
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        Toast.warning('Ukuran file maksimal 2MB');
        this.value = '';
        return;
      }

      // Tampilkan preview jika gambar
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewBukti').src = e.target.result;
            document.getElementById('previewWrapper').classList.remove('d-none');
        };
        reader.readAsDataURL(file);
      }

      // Upload ke server
      await uploadBukti(file);
    });
  }

  async function uploadBukti(file) {
    const statusEl = document.getElementById('uploadStatus');

    try {
      uploadedBuktiPath = null; // reset
      statusEl.classList.remove('d-none');

      const formData = new FormData();
      formData.append('bukti', file);

      // cookie otomatis terkirim, tidak perlu Authorization header
      const res = await fetch(`/api/v1${window.IURAN_CONFIG.api.uploadBukti}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const json = await res.json();

      if (!res.ok || json.status !== 'success') {
        Toast.error(json.message || 'Gagal upload');
        throw new Error(json.message);
      }

      uploadedBuktiPath = json.data.path; // ← simpan path
      Toast.success(json.message || 'Bukti berhasil diupload');

    } catch (err) {
      console.error(err);
      Toast.error(err.message || 'Gagal upload bukti');
      uploadedBuktiPath = null;

      // Reset file input
      document.getElementById('formFile').value = '';
      document.getElementById('previewWrapper').classList.add('d-none');

    } finally {
      statusEl.classList.add('d-none');
    }
  }

  // BUILD PAYLOAD (SUDAH ROLE-AWARE)
  function buildPayload() {

    if (selectedMonths.length === 0) {
      Toast.warning('Pilih bulan dulu');
      return null;
    }

    if (!isConsecutive(selectedMonths)) {
      Toast.warning('Bulan harus berurutan');
      return null;
    }

    const metode = document.getElementById('metodeBayar')?.value;
    if (!metode) {
      Toast.warning('Pilih metode bayar');
      return null;
    }

    // hanya validasi KK untuk ADMIN
    if (!isWargaMode && !selectedKk) {
      Toast.warning('Pilih warga dulu');
      return null;
    }

    const sorted = [...selectedMonths].sort((a, b) => a - b);
    const tahun  = new Date().getFullYear();

    const payload = {
      bulan_dari   : `${tahun}-${String(sorted[0]).padStart(2, '0')}-01`,
      bulan_sampai : `${tahun}-${String(sorted[sorted.length - 1]).padStart(2, '0')}-01`,
      jumlah_bulan : selectedMonths.length,
      metode_bayar : metode,
      keterangan   : document.getElementById('keterangan')?.value ?? null,
      bukti_transfer: uploadedBuktiPath ?? null
    };

    // hanya kirim kk_uuid jika ADMIN
    if (!isWargaMode && selectedKk) {
      payload.kk_uuid = selectedKk;
    }

    // e-wallet
    if (metode === 'dompet_digital') {
      const provider = document.getElementById('ewalletProvider')?.value;
      if (!provider) {
        Toast.warning('Pilih provider e-wallet');
        return null;
      }
      payload.ewallet_provider = provider;
    }

    return payload;
  }

  // =========================================================
  // METODE BAYAR
  // =========================================================
  function initMetodeBayar() {
    const metodeEl = document.getElementById('metodeBayar');
    const ewalletWrapper = document.getElementById('ewalletFields');
    const ewalletSelect = document.getElementById('ewalletProvider');
    const transferFields = document.getElementById('transferFields');

    if (!metodeEl) return;

    metodeEl.addEventListener('change', function () {
      const val = this.value;

      if (val === 'dompet_digital') {
        ewalletWrapper.classList.remove('d-none');
      } else {
        ewalletWrapper.classList.add('d-none');
        if (ewalletSelect) ewalletSelect.value = '';
      }

      // Transfer fields
      if (val === 'transfer') {
        transferFields.classList.remove('d-none');
      } else {
        transferFields.classList.add('d-none');
        // Reset upload state
        uploadedBuktiPath = null;
        document.getElementById('formFile').value = '';
        document.getElementById('previewWrapper')?.classList.add('d-none');
      }
    });
  }

  // =========================================================
  // FORM SUBMIT
  // =========================================================
  function bindFormSubmit() {
    const form = document.getElementById('formPembayaran');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      await submitPembayaran();
    });
  }

  async function submitPembayaran() {
    
    if (isSubmitting) return;

    const payload = buildPayload();
    if (!payload) return;

    isSubmitting = true;

    const btn = document.querySelector('#btnPayment');
    if (btn) btn.disabled = true;

    try {
      const res = await Api.post(API.bayar, payload);
      Toast.fromResponse(res, 'Pembayaran berhasil', 'Gagal memproses pembayaran');

      if (!res.ok) return;

      //loadRiwayat();
      await loadSummary();
      resetMatrix();

      if (selectedKk) {
        await loadMatrix(selectedKk);
      }
    } catch (err) {
      Toast.error('Gagal memproses pembayaran');
    } finally {
      isSubmitting = false;
      if (btn) btn.disabled = false;
    }
  }

  // =========================================================
  // SUMMARY (STATISTIK + RIWAYAT + DAFTAR KK)
  // =========================================================
  async function loadSummary(page = 1) {
    try {
      const role = window.IURAN_CONFIG.role;
      const rtId = window.IURAN_CONFIG.rtId;

      const url = (role === 'administrator' || role === 'rt' || role === 'warga')
        ? `${API.summary}?page=${page}&rt_id=${rtId}`
        : `${API.summary}?page=${page}`;

      const res = await Api.get(url);
      if (!res.ok) throw new Error(res.data?.message || 'Gagal memuat data');

      const d = res.data.data;

      renderStatistik(d.statistik);
      renderRiwayat(d.riwayat.data);
      renderBelumBayar(d.statistik, d.belum_bayar_list);

    } catch (err) {
      console.error(err);
      Toast.error('Gagal memuat data');
    }
  }

  function renderStatistik(d) {
    const descEl = document.getElementById('paymentactivity-desc');
    if (descEl) {
      descEl.textContent = `Sebanyak ${d.sudah_bayar} dari ${d.total_kk} KK telah melunasi iuran ${d.periode}.`;
    }

    const chartEl = document.querySelector('#paymentactivity');
    if (!chartEl) return;

    // Destroy chart lama jika ada (hindari duplikat)
    if (window._iuranChart) {
      window._iuranChart.destroy();
    }

    window._iuranChart = new ApexCharts(chartEl, {
      series      : [d.sudah_bayar, d.belum_bayar],
      chart       : { type: 'donut', width: 110, height: 99, sparkline: { enabled: true } },
      labels      : ['Sudah Bayar', 'Belum Bayar'],
      colors      : ['#1abc9c', '#e9ecef'],
      legend      : { show: false },
      dataLabels  : { enabled: false },
      tooltip     : { y: { formatter: val => val + ' KK' } },
      plotOptions : {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show  : true,
              total : {
                show      : true,
                label     : 'Bayar',
                fontSize  : '11px',
                color     : '#1abc9c',
                formatter : () => `${d.sudah_bayar}/${d.total_kk}`
              }
            }
          }
        }
      }
    });

    window._iuranChart.render();
  }

  // =========================================================
  // RENDER DAFTAR KK BELUM BAYAR
  // =========================================================
  function renderBelumBayar(statistik, list) {
    const countEl = document.getElementById('belumBayarCount');
    if (countEl) countEl.textContent = statistik.belum_bayar + ' KK';

    const el = document.getElementById('belumBayarList');
    if (!el) return;

    if (!list || list.length === 0) {
      el.innerHTML = `
        <div class="card-body py-2">
          <p class="text-center text-muted mb-0">Semua KK sudah bayar 🎉</p>
        </div>
      `;
      return;
    }

    el.innerHTML = list.map(kk => `
      <div class="card-body py-2 border-bottom">
        <div class="mb-0 d-flex align-items-center justify-content-between">
          <span class="mb-0 text-dark">${kk.alamat} - ${kk.kepala_keluarga}</span>
          <a href="#" class="mb-0 text-danger fw-bold ingatkan-kk" 
            data-uuid="${kk.uuid}" 
            data-nama="${kk.kepala_keluarga}">
            Ingatkan
          </a>
        </div>
      </div>
    `).join('');
  }

  // Konfirmasi transfer
  document.addEventListener('click', async function (e) {

    // KONFIRMASI
    const konfirmasiEl = e.target.closest('.konfirmasi-transfer');
    if (konfirmasiEl) {
      e.preventDefault();

      const id   = konfirmasiEl.dataset.id;
      const nama = konfirmasiEl.dataset.nama;

      if (!confirm(`Konfirmasi pembayaran dari ${nama}?`)) return;

      const btnGroup = konfirmasiEl.closest('.btn-group');
      setLoadingBtn(btnGroup, true);

      try {
        const res = await Api.post(`${API.konfirmasiTransfer}/${id}`, {});
        if (!res.ok) throw new Error(res.data?.message || 'Gagal konfirmasi');

        // ganti btn-group dengan badge LUNAS tanpa reload
        btnGroup.outerHTML = `<span class="badge bg-primary px-3 py-2">LUNAS</span>`;
        Toast.success('Pembayaran dikonfirmasi');

      } catch (err) {
        setLoadingBtn(btnGroup, false);
        Toast.error(err.message);
      }
      return;
    }

    // TOLAK
    const tolakEl = e.target.closest('.tolak-transfer');
    if (tolakEl) {
      e.preventDefault();

      const id = tolakEl.dataset.id;

      if (!confirm('Tolak pembayaran ini?')) return;

      const btnGroup = tolakEl.closest('.btn-group');
      setLoadingBtn(btnGroup, true);

      try {
        const res = await Api.post(`${API.tolakTransfer}/${id}`, {});
        if (!res.ok) throw new Error(res.data?.message || 'Gagal menolak');

        // ganti btn-group dengan badge GAGAL tanpa reload
        btnGroup.outerHTML = `<span class="badge bg-danger px-3 py-2">DITOLAK</span>`;
        Toast.success('Pembayaran ditolak');
      } catch (err) {
        setLoadingBtn(btnGroup, false);
        Toast.error(err.message);
      }
      return;
    }

    // INGATKAN KK
    const ingatkanEl = e.target.closest('.ingatkan-kk');
    if (ingatkanEl) {
      e.preventDefault();

      const uuid = ingatkanEl.dataset.uuid;
      const nama = ingatkanEl.dataset.nama;

      if (!confirm(`Kirim pengingat iuran ke ${nama} via Telegram?`)) return;

      ingatkanEl.textContent = '...';
      ingatkanEl.classList.add('disabled');

      try {
        const res = await Api.post(`${API.ingatkan}/${uuid}`, {});
        if (!res.ok) throw new Error(res.data?.message || 'Gagal kirim');
        Toast.success(`Pengingat terkirim ke ${nama}`);
        ingatkanEl.textContent = 'Terkirim ✓';
      } catch (err) {
        Toast.error(err.message);
        ingatkanEl.textContent = 'Ingatkan';
        ingatkanEl.classList.remove('disabled');
      }
      return;
    }
  });

  document.getElementById('btnBlastPenunggak')?.addEventListener('click', async function () {
    if (!confirm('Kirim pengingat ke semua penunggak bulan ini via Telegram?')) return;

    this.disabled = true;
    this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Mengirim...';

    try {
      const res = await Api.post(API.blastPenunggak, {});
      if (!res.ok) throw new Error(res.data?.message || 'Gagal blast');

      const d = res.data.data;
      Toast.success(`Terkirim: ${d.success}, Gagal: ${d.failed}, Tanpa Telegram: ${d.no_telegram}`);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      this.disabled = false;
      this.innerHTML = '<i class="mdi mdi-send"></i> INGATKAN SEMUA VIA TELEGRAM';
    }
  });

  // loading state pada tombol
  function setLoadingBtn(btnGroup, isLoading) {
    const mainBtn   = btnGroup.querySelector('button:first-child');
    const toggleBtn = btnGroup.querySelector('.dropdown-toggle-split');

    if (isLoading) {
      mainBtn.disabled   = true;
      toggleBtn.disabled = true;
      mainBtn.innerHTML  = `
        <span class="spinner-border spinner-border-sm me-1"></span>
      `;
    } else {
      mainBtn.disabled   = false;
      toggleBtn.disabled = false;
      mainBtn.innerHTML  = 'PENDING';
    }
  }

  async function loadRiwayat() {
    try {
      const res = await Api.get(API.riwayat);
      if (!res.ok) throw new Error();

      const { data } = res.data.data;
      renderRiwayat(data);

    } catch (err) {
      console.error(err);
    }
  }

  function renderRiwayat(list) {
    const el = document.getElementById('riwayatList');
    if (!el) return;

    if (list.length === 0) {
      el.innerHTML = `<div class="text-center text-muted py-3">Belum ada riwayat pembayaran</div>`;
      return;
    }

    el.innerHTML = list.map(item => `
      <div class="card-body border-bottom py-2">
        <div class="widget-first">
          <div class="d-flex align-items-center mb-0">
            <div class="bg-primary-subtle rounded-circle p-2 me-2 border border-dashed border-primary">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div class="d-flex flex-column justify-content-center w-75">
              <p class="mb-0 text-black fs-15 fw-bold">${item.nama_kk}</p>
              <p class="mb-0 small">${item.alamat} • ${timeAgo(item.created_at)}</p>
              <p class="mb-0 small">Metode: ${formatMetode(item.metode_bayar)}</p>
            </div>
            <div class="d-flex flex-column justify-content-center align-items-end w-25">
              <p class="mb-1 text-black fs-15 fw-bold">${formatRupiah(item.total_nominal)}</p>
              ${renderStatusBadge(item)}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderStatusBadge(item) {
    if (item.status === 'paid') {
      return `<span class="badge bg-primary px-3 py-2">LUNAS</span>`;
    }

    if (item.status === 'pending' && item.metode_bayar === 'transfer') {
      return `
        <div class="btn-group">
          <button type="button" class="btn btn-warning btn-sm">PENDING</button>
          <button type="button" class="btn btn-warning btn-sm dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="mdi mdi-chevron-down"></i>
          </button>
          <ul class="dropdown-menu">
            <li>
              <a class="dropdown-item text-success konfirmasi-transfer" href="#" data-id="${item.uuid}" data-nama="${item.nama_kk}">
                <i class="mdi mdi-check me-1"></i> Konfirmasi Lunas
              </a>
            </li>
            <li>
              <a class="dropdown-item text-danger tolak-transfer" href="#" data-id="${item.uuid}">
                <i class="mdi mdi-close me-1"></i> Tolak
              </a>
            </li>
          </ul>
        </div>
      `;
    }

    if (item.status === 'pending') {
      return `<span class="badge bg-warning text-dark px-3 py-2">PENDING</span>`;
    }

    if (item.status === 'failed' || item.status === 'expired') {
      return `<span class="badge bg-danger px-3 py-2">GAGAL</span>`;
    }

    return '';
  }

  function formatMetode(metode) {
    const map = {
      'tunai'          : 'Tunai',
      'transfer'       : 'Transfer Bank',
      'dompet_digital' : 'E-Wallet'
    };
    return map[metode] ?? metode;
  }

  function timeAgo(datetime) {
    const diff = Math.floor((Date.now() - new Date(datetime)) / 1000);
    if (diff < 60)     return 'Baru saja';
    if (diff < 3600)   return Math.floor(diff / 60) + ' menit yang lalu';
    if (diff < 86400)  return Math.floor(diff / 3600) + ' jam yang lalu';
    return Math.floor(diff / 86400) + ' hari yang lalu';
  }

  // =========================================================
  // HELPER
  // =========================================================
  function renderLoading() {
    elMatrix.innerHTML = `<div class="text-muted small">Memuat data...</div>`;
  }

  function resetMatrix() {
    elMatrix.innerHTML = '';
    selectedMonths = [];
    updateTotal();
  }

  function formatRupiah(angka) {
    return 'Rp ' + (angka || 0).toLocaleString('id-ID');
  }

  // =========================================================
  // STATISTIK WIDGET (DONUT CHART)
  // =========================================================
  async function loadStatistik() {
    const role = window.IURAN_CONFIG.role;
    const rtId = window.IURAN_CONFIG.rtId;

    const url = role === 'administrator'
      ? `${API.statistik}?rt_id=${rtId}`
      : API.statistik;

    try {
      const res = await Api.get(url);
      if (!res.ok) throw new Error(res.data?.message || 'Gagal memuat statistik');

      const d = res.data.data;

      const descEl = document.getElementById('paymentactivity-desc');
      if (descEl) {
        descEl.textContent = `Sebanyak ${d.sudah_bayar} dari ${d.total_kk} KK telah melunasi iuran ${d.periode}.`;
      }

      const chartEl = document.querySelector('#paymentactivity');
      if (!chartEl) return;

      new ApexCharts(chartEl, {
        series      : [d.sudah_bayar, d.belum_bayar],
        chart       : { type: 'donut', width: 110, height: 100, sparkline: { enabled: true } },
        labels      : ['Sudah Bayar', 'Belum Bayar'],
        colors      : ['#1abc9c', '#e9ecef'],
        legend      : { show: false },
        dataLabels  : { enabled: false },
        tooltip     : { y: { formatter: val => val + ' KK' } },
        plotOptions : {
          pie: {
            donut: {
              size: '70%',
              labels: {
                show  : true,
                total : {
                  show      : true,
                  label     : 'Bayar',
                  fontSize  : '11px',
                  color     : '#1abc9c',
                  formatter : () => `${d.sudah_bayar}/${d.total_kk}`
                }
              }
            }
          }
        }
      }).render();

    } catch (err) {
      console.error(err);
      const descEl = document.getElementById('paymentactivity-desc');
      if (descEl) descEl.textContent = 'Gagal memuat data.';
    }
  }

  // DEBUG
  window.IuranState = {
    submit: submitPembayaran,
    getKkUuid: () => selectedKk
  };

})();