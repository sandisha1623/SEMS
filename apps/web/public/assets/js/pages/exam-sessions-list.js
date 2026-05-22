/**
 * SEMS — Exam Sessions list (admin)
 *
 * Pattern sama dengan departments-list.js, custom render:
 * - Kolom Title: title + code kecil di bawahnya
 * - Kolom Department: icon dept + nama
 * - Kolom Status: pill berdasarkan status_badge dari API
 */
(() => {
    'use strict';

    const $table    = $('#examSessionsTable');
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

    const escapeHtml = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const editUrl   = (publicId) => `/exam-sessions/${publicId}/edit`;
    const deleteUrl = (publicId) => `/exam-sessions/${publicId}/delete`;

    /* ---------- renderers ---------- */

    const renderCode = (code) =>
        `<span class="badge bg-light text-dark">${escapeHtml(code)}</span>`;

    const renderTitle = (row) => `
        <div class="exam-title-cell">
            <div class="exam-title">${escapeHtml(row.title)}</div>
            <div class="exam-code text-muted">
                Mode: ${escapeHtml(row.mode)} · ${row.duration} min
            </div>
        </div>
    `;

    const renderDepartment = (row) => {
        if (!row.department_name) {
            return '<span class="text-muted">—</span>';
        }
        return `
            <div class="dept-cell">
                <div class="dept-icon-sm">
                    <i class="mdi mdi-${escapeHtml(row.department_icon || 'domain')}"></i>
                </div>
                <div>${escapeHtml(row.department_name)}</div>
            </div>
        `;
    };

    const renderStartsAt = (date) => {
        if (!date) return '<span class="text-muted">—</span>';
        const d = new Date(date.replace(' ', 'T'));
        if (isNaN(d.getTime())) return escapeHtml(date);
        return d.toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const renderStatus = (row) =>
        `<span class="status-pill ${row.status_badge}">${escapeHtml(row.status)}</span>`;

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
            url  : '/api/exam-sessions/data',
            type : 'GET',
            data : (d) => ({
                ...d,
                [CSRF_FIELD_NAME]: getCsrfHash(),
            }),
        },
        order: [[3, 'desc']],
        columns: [
            { data: 'code', render: renderCode },
            { data: null,   render: renderTitle },
            { data: null,   render: renderDepartment, orderable: false },
            { data: 'starts_at', render: renderStartsAt },
            {
                data: null,
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
            lengthMenu: '_MENU_ sesi per halaman',
            info: 'Menampilkan _START_–_END_ dari _TOTAL_ sesi',
            infoEmpty: 'Belum ada sesi ujian',
            zeroRecords: 'Tidak ada data yang cocok',
            paginate: { next: 'Next', previous: 'Prev' },
            processing: 'Memuat...',
        },
    });

    /* ---------- delete ---------- */

    $table.on('click', '.js-delete', async function () {
        const publicId = $(this).data('id');
        const code     = $(this).data('code');

        if (! confirm(`Hapus sesi "${code}"?\nTindakan ini tidak bisa dibatalkan.`)) {
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