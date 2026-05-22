/**
 * SEMS — Departments list
 *
 * Custom row rendering sesuai desain:
 * - Kolom Departemen: icon + name + faculty (multi-line)
 * - Kolom Mahasiswa: placeholder kalau null
 * - Kolom Ujian Aktif: badge pill kalau > 0, dash kalau 0
 * - Kolom Status: pill ALTIF / NON-AKTIF
 */
(() => {
    'use strict';

    const $table    = $('#departmentsTable');
    const $alertBox = $('#alertBox');

    const CSRF_FIELD_NAME = 'csrf_test_name';
    const CSRF_HEADER     = 'X-CSRF-TOKEN';

    /* ---------- helpers ---------- */

    const getCsrfHash = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    const updateCsrfHash = (hash) => {
        if (!hash) return;
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) meta.setAttribute('content', hash);
    };

    const showAlert = (message, type = 'success') => {
        $alertBox
            .removeClass('d-none alert-success alert-danger alert-warning')
            .addClass(`alert-${type}`)
            .text(message);

        setTimeout(() => $alertBox.addClass('d-none'), 4000);
    };

    const editUrl   = (publicId) => `/departments/${publicId}/edit`;
    const deleteUrl = (publicId) => `/departments/${publicId}/delete`;

    const escapeHtml = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    /* ---------- renderers ---------- */

    const renderDepartment = (row) => `
        <div class="d-flex gap-2 dept-name-cell">
            <div class="dept-icon">
                <i class="mdi ${escapeHtml(row.icon || 'domain')}"></i>
            </div>
            <div class="d-flex flex-column">
                <div class="dept-name">${escapeHtml(row.name)}</div>
                <div class="dept-faculty">${escapeHtml(row.faculty || '—')}</div>
            </div>
        </div>
    `;

    const renderKaprodi = (head) => head
        ? escapeHtml(head)
        : '<span class="text-muted">—</span>';

    const renderStudents = (count) => count === null || count === undefined
        ? '<span class="text-muted">—</span>'
        : count.toLocaleString('id-ID');

    const renderActiveExams = (count) => count > 0
        ? `<span class="badge-active-exams">${count}<small>Aktif</small></span>`
        : '<span class="text-muted">—</span>';

    const renderStatus = (active) => active
        ? '<span class="badge bg-primary-subtle text-primary fw-semibold active">Aktif</span>'
        : '<span class="badge bg-danger-subtle text-danger fw-semibold inactive">Non-Aktif</span>';

    const renderActions = (row) => `
        <div class="d-flex gap-1 justify-content-end">
            <a href="${editUrl(row.public_id)}" class="btn btn-sm btn-light" title="Edit">
                <i class="mdi mdi-pencil"></i>
            </a>
            <button type="button"
                    class="btn btn-sm btn-light text-danger js-delete"
                    data-id="${row.public_id}"
                    data-code="${escapeHtml(row.code)}"
                    title="Delete">
                <i class="mdi mdi-delete"></i>
            </button>
        </div>
    `;

    /* ---------- DataTables ---------- */

    const dt = $table.DataTable({
        processing : true,
        serverSide : true,
        ajax: {
            url  : '/api/departments/data',
            type : 'GET',
            data : (d) => ({
                ...d,
                [CSRF_FIELD_NAME]: getCsrfHash(),
            }),
        },
        order: [[0, 'asc']],
        columns: [
            { data: null, render: renderDepartment },
            { data: 'head_name', render: renderKaprodi },
            {
                data: 'students',
                orderable: false,
                className: 'text-center',
                render: renderStudents,
            },
            {
                data: 'active_exams',
                orderable: false,
                className: 'text-center',
                render: renderActiveExams,
            },
            {
                data: 'is_active',
                className: 'text-center',
                render: renderStatus,
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                className: 'text-end',
                render: renderActions,
            },
        ],
        language: {
            search: 'Cari:',
            lengthMenu: '_MENU_ data per halaman',
            info: 'Menampilkan _START_–_END_ dari _TOTAL_ departemen',
            infoEmpty: 'Belum ada departemen',
            zeroRecords: 'Tidak ada data yang cocok',
            paginate: { next: 'Next', previous: 'Prev' },
            processing: 'Memuat...',
        },
    });

    /* ---------- delete ---------- */

    $table.on('click', '.js-delete', async function () {
        const publicId = $(this).data('id');
        const code     = $(this).data('code');

        if (! confirm(`Hapus departemen "${code}"?\nTindakan ini tidak bisa dibatalkan.`)) {
            return;
        }

        const params = new URLSearchParams();
        params.append(CSRF_FIELD_NAME, getCsrfHash());

        try {
            const res = await fetch(deleteUrl(publicId), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept'          : 'application/json',
                    'Content-Type'    : 'application/x-www-form-urlencoded',
                    [CSRF_HEADER]     : getCsrfHash(),
                },
                body: params.toString(),
            });

            let data = {};
            try { data = await res.json(); } catch (_) {}

            if (data.csrf && data.csrf.hash) {
                updateCsrfHash(data.csrf.hash);
            }

            if (res.ok && data.success) {
                showAlert(data.message || 'Terhapus.', 'success');
                dt.ajax.reload(null, false);
            } else {
                showAlert(data.message || 'Gagal menghapus.', 'danger');
            }
        } catch (err) {
            console.error('[delete]', err);
            showAlert('Tidak dapat terhubung ke server.', 'danger');
        }
    });
})();