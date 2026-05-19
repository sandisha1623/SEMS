(function () {

    const CFG  = window.STATUS_CONFIG;
    const role = CFG.role;

    let dtSemua  = null;
    let dtBelum  = null;
    let activeTab = 'semua';

    // =========================================================
    // INIT
    // =========================================================
    document.addEventListener('DOMContentLoaded', function () {
        initTabs();
        initTableSemua();

        if (role !== 'warga') {
            initTableBelum();
        }

        // Filter change
        ['filterBulan', 'filterTahun'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', function () {
                dtSemua?.ajax.reload();
                if (role !== 'warga') dtBelum?.ajax.reload();
            });
        });

        // Blast semua
        document.getElementById('btnIngatkanSemua')?.addEventListener('click', blastSemua);
    });

    function showBuktiModal(url, nama) {
        // Pastikan selalu absolute path dari root
        let fullUrl;
        if (url.startsWith('http')) {
            fullUrl = url;
        } else {
            // Hapus leading slash jika ada, lalu tambah /
            fullUrl = '/' + url.replace(/^\/+/, '');
        }

        document.getElementById('modalBuktiNama').textContent = nama;
        document.getElementById('modalBuktiImg').src          = fullUrl;
        document.getElementById('modalBuktiDownload').href    = fullUrl;

        new bootstrap.Modal(document.getElementById('modalBukti')).show();
    }

    // =========================================================
    // TABS
    // =========================================================
    function initTabs() {
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                activeTab = this.dataset.tab;

                document.getElementById('tabSemua').classList.toggle('d-none', activeTab !== 'semua');
                document.getElementById('tabBelum')?.classList.toggle('d-none', activeTab !== 'belum');

                // Reload table saat tab aktif (fix kolom width)
                if (activeTab === 'semua') dtSemua?.columns.adjust();
                if (activeTab === 'belum') dtBelum?.columns.adjust();
            });
        });
    }

    // =========================================================
    // TABLE SEMUA KK
    // =========================================================
    function initTableSemua() {
        dtSemua = $('#tableSemua').DataTable({
            processing : true,
            serverSide : true,
            searching  : true,
            pageLength : 10,
            ajax: {
            url  : '/api/v1' + CFG.api.datatableStatus,
            type : 'GET',
            data : function (d) {
                d.bulan  = document.getElementById('filterBulan').value;
                d.tahun  = document.getElementById('filterTahun').value;
                d.search = { 
                    value: d.search?.value ?? '' 
                };
                return d;
            },
            dataSrc: function (json) {
                return json.data?.data ?? [];
            }
        },
        columns: [
        {
            data: null,
            render: function (row) {
            const inisial = row.kepala_keluarga.substring(0, 2).toUpperCase();
            const warna   = stringToColor(inisial);
            return `
                <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                    style="width:36px;height:36px;background:${warna};font-size:12px;flex-shrink:0">
                    ${inisial}
                </div>
                <span>${row.kepala_keluarga}</span>
                </div>
            `;
            }
        },
        { data: 'alamat' },
        { data: 'rt_display', render: d => `RT ${d}` },
        {
            data: 'status_bayar',
            render: function (status, type, row) {
            if (status === 'paid') {
                return '<span class="badge bg-success px-3 py-2">LUNAS</span>';
            }

            if (status === 'pending') {
                // Dropdown konfirmasi/tolak untuk role non-warga
                const bukti = row.bukti_transfer
                ? `<li><hr class="dropdown-divider"></li>
                    <li>
                    <a class="dropdown-item lihat-bukti" href="#"
                        data-url="${row.bukti_transfer}"
                        data-nama="${row.kepala_keluarga}">
                        <i class="mdi mdi-image me-1"></i> Lihat Bukti Transfer
                    </a>
                    </li>`
                : '';

                if (role !== 'warga') {
                return `
                    <div class="btn-group">
                    <button type="button" class="btn btn-warning btn-sm">PENDING</button>
                    <button type="button" class="btn btn-warning btn-sm dropdown-toggle dropdown-toggle-split"
                            data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="mdi mdi-chevron-down"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li>
                        <a class="dropdown-item text-success konfirmasi-btn" href="#"
                            data-uuid="${row.payment_uuid}"
                            data-nama="${row.kepala_keluarga}">
                            <i class="mdi mdi-check me-1"></i> Konfirmasi Lunas
                        </a>
                        </li>
                        <li>
                        <a class="dropdown-item text-danger tolak-btn" href="#"
                            data-uuid="${row.payment_uuid}"
                            data-nama="${row.kepala_keluarga}">
                            <i class="mdi mdi-close me-1"></i> Tolak
                        </a>
                        </li>
                        ${bukti}
                    </ul>
                    </div>
                `;
                }

                // Warga hanya lihat badge + bukti
                return `
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-warning text-dark px-3 py-2">PENDING</span>
                    ${row.bukti_transfer
                    ? `<a href="#" class="small lihat-bukti"
                            data-url="${row.bukti_transfer}"
                            data-nama="${row.kepala_keluarga}">
                        <i class="mdi mdi-image"></i> Bukti
                        </a>`
                    : ''}
                </div>
                `;
            }

            return '-';
            }
        },
        {
            data: 'total_nominal',
            render: d => d ? formatRupiah(d) : '<span class="text-muted">-</span>'
        },
        {
            data: 'metode_bayar',
            render: function (m) {
            const map = {
                'tunai'         : 'Tunai',
                'transfer'      : 'Transfer',
                'dompet_digital': 'E-Wallet'
            };
            return m ? (map[m] ?? m) : '<span class="text-muted">-</span>';
            }
        },
        {
            data: 'paid_at',
            render: d => d
            ? `<span class="small">${formatDatetime(d)}</span>`
            : '<span class="text-muted">-</span>'
        }
        // ← kolom aksi dihapus
        ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/id.json'
        }
    });

    // Event konfirmasi
    $('#tableSemua').on('click', '.konfirmasi-btn', async function (e) {
        e.preventDefault();
        const uuid = this.dataset.uuid;
        const nama = this.dataset.nama;

        if (!confirm(`Konfirmasi pembayaran dari ${nama}?`)) return;

        try {
            const res = await Api.post(`${CFG.api.konfirmasiTransfer}/${uuid}`, {});
            if (!res.ok) throw new Error(res.data?.message || 'Gagal konfirmasi');
            Toast.success('Pembayaran dikonfirmasi');
            dtSemua.ajax.reload(null, false);
        } catch (err) {
            Toast.error(err.message);
        }
    });

    // Event tolak
    $('#tableSemua').on('click', '.tolak-btn', async function (e) {
        e.preventDefault();
        const uuid = this.dataset.uuid;
        const nama = this.dataset.nama;

        if (!confirm(`Tolak pembayaran dari ${nama}?`)) return;

        try {
            const res = await Api.post(`${CFG.api.tolakTransfer}/${uuid}`, {});
            if (!res.ok) throw new Error(res.data?.message || 'Gagal menolak');
            Toast.success('Pembayaran ditolak');
            dtSemua.ajax.reload(null, false);
        } catch (err) {
            Toast.error(err.message);
        }
    });

    // Event lihat bukti
    $('#tableSemua').on('click', '.lihat-bukti', function (e) {
        e.preventDefault();
        const url  = this.dataset.url;
        const nama = this.dataset.nama;
        showBuktiModal(url, nama);
    });
    }

    // =========================================================
    // TABLE BELUM BAYAR
    // =========================================================
    function initTableBelum() {
        dtBelum = $('#tableBelum').DataTable({
            processing : true,
            serverSide : true,
            searching  : true,
            pageLength : 10,
            ajax: {
                url  : '/api/v1' + CFG.api.datatableBelumBayar,
                type : 'GET',
                data : function (d) {
                    d.bulan = document.getElementById('filterBulan').value;
                    d.tahun = document.getElementById('filterTahun').value;
                    d.search = { value: d.search?.value ?? '' };
                    return d;
                },
                dataSrc: function (json) {
                    // Update badge & total tagihan
                    const total    = json.data?.recordsFiltered ?? 0;
                    const nominal  = json.data?.nominal ?? 0;
                    document.getElementById('badgeBelumBayar').textContent = total;
                    document.getElementById('totalTagihan').textContent    = formatRupiah(total * nominal);
                    return json.data?.data ?? [];
                }
            },
            columns: [
            {
                data: null,
                render: function (row) {
                    const inisial = row.kepala_keluarga.substring(0, 2).toUpperCase();
                    const warna   = stringToColor(inisial);
                    return `
                    <div class="d-flex align-items-center gap-2">
                        <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style="width:36px;height:36px;background:${warna};font-size:12px;flex-shrink:0">${inisial}</div>
                        <span>${row.kepala_keluarga}</span>
                    </div>`;
                }
            },
            { data: 'alamat' },
            { data: 'rt_display', render: d => `RT ${d}` },
            { data: 'tagihan', render: d => `<span class="text-danger fw-bold">${formatRupiah(d)}</span>` },
            {
                data: null,
                orderable: false,
                render: function (row) {
                    return `
                        <button class="btn btn-sm btn-outline-primary ingatkan-btn"
                                data-uuid="${row.uuid}"
                                data-nama="${row.kepala_keluarga}">
                            <i class="mdi mdi-send me-1"></i> Ingatkan
                        </button>
                    `;
                }
            }],
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/id.json'
            }
        });

        $('#tableBelum').on('click', '.ingatkan-btn', async function () {
            const uuid = this.dataset.uuid;
            const nama = this.dataset.nama;
            await ingatkan(this, uuid, nama);
        });
    }

    // =========================================================
    // INGATKAN SATU KK
    // =========================================================
    async function ingatkan(btn, uuid, nama) {
        if (!confirm(`Kirim pengingat iuran ke ${nama} via Telegram?`)) return;

        const original = btn.innerHTML;
        btn.disabled  = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        try {
            const res = await Api.post(`${CFG.api.ingatkan}/${uuid}`, {});
            if (!res.ok) throw new Error(res.data?.message || 'Gagal kirim');
            Toast.success(`Pengingat terkirim ke ${nama}`);
            btn.innerHTML = '<i class="mdi mdi-check"></i> Terkirim';
        } catch (err) {
            Toast.error(err.message);
            btn.disabled  = false;
            btn.innerHTML = original;
        }
    }

    // =========================================================
    // BLAST SEMUA PENUNGGAK
    // =========================================================
    async function blastSemua() {
        if (!confirm('Kirim pengingat ke semua penunggak bulan ini via Telegram?')) return;

        const btn = document.getElementById('btnIngatkanSemua');
        btn.disabled  = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Mengirim...';

        try {
            const res = await Api.post(CFG.api.blastPenunggak, {});
            if (!res.ok) throw new Error(res.data?.message || 'Gagal blast');

            const d = res.data.data;
            Toast.success(`Terkirim: ${d.success} | Gagal: ${d.failed} | Tanpa Telegram: ${d.no_telegram}`);
        } catch (err) {
            Toast.error(err.message);
        } finally {
            btn.disabled  = false;
            btn.innerHTML = '<i class="mdi mdi-send me-1"></i> Ingatkan Semua';
        }
    }

    // =========================================================
    // HELPERS
    // =========================================================
    function formatRupiah(angka) {
        return 'Rp ' + (angka || 0).toLocaleString('id-ID');
    }

    function formatDatetime(dt) {
        const d = new Date(dt);
        return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
        + ' ' + d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
    }

    function stringToColor(str) {
        const colors = [
            '#4e73df','#1cc88a','#36b9cc','#f6c23e',
            '#e74a3b','#858796','#5a5c69','#2e59d9'
        ];
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }

})();