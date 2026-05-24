/**
 * SEMS — Users list
 *
 * Pattern sama dengan departments-list.js + filter role/status
 * via meta tag custom params yang dikirim ke DataTables AJAX.
 */
(() => {
    'use strict';

    const $table        = $('#usersTable');
    const $alertBox     = $('#alertBox');
    const $roleFilter   = $('#roleFilter');
    const $statusFilter = $('#statusFilter');

    const CSRF_FIELD_NAME = 'csrf_test_name';
    const CSRF_HEADER     = 'X-CSRF-TOKEN';

    const currentUserPublicId = document
        .querySelector('meta[name="current-user-id"]')
        ?.getAttribute('content') ?? '';

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

    const initial = (str) => {
        const s = String(str ?? '').trim();
        if (!s) return '?';
        const parts = s.split(/\s+/);
        const first = parts[0]?.charAt(0) ?? '';
        const last  = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
        return (first + last).toUpperCase() || '?';
    };

    const editUrl   = (publicId) => `/users/${publicId}/edit`;
    const deleteUrl = (publicId) => `/users/${publicId}/delete`;

    /* ---------- renderers ---------- */

    const renderUser = (row) => `
        <div class="user-cell">
            <div class="user-avatar">${initial(row.full_name || row.username)}</div>
            <div>
                <div class="user-name">${escapeHtml(row.username)}</div>
                <div class="user-email">${escapeHtml(row.email)}</div>
            </div>
        </div>
    `;

    const renderFullName = (name) => name
        ? escapeHtml(name)
        : '<span class="text-muted">—</span>';

    const renderRole = (row) =>
        `<span class="role-pill">${escapeHtml(row.role_name)}</span>`;

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

    const renderStatus = (active) => active
        ? '<span class="status-pill active">Aktif</span>'
        : '<span class="status-pill inactive">Non-Aktif</span>';

    const renderActions = (row) => {
        // Proteksi: tidak bisa hapus diri sendiri
        const isSelf = row.public_id === currentUserPublicId;
        const deleteBtn = isSelf
            ? `<button type="button" class="btn btn-sm btn-light text-muted" disabled
                       title="Tidak dapat menghapus akun sendiri">
                   <i class="mdi mdi-delete"></i>
               </button>`
            : `<button type="button" class="btn btn-sm btn-light text-danger js-delete"
                       data-id="${row.public_id}"
                       data-username="${escapeHtml(row.username)}"
                       title="Delete">
                   <i class="mdi mdi-delete"></i>
               </button>`;

        return `
            <div class="d-flex gap-1 justify-content-end">
                <a href="${editUrl(row.public_id)}" class="btn btn-sm btn-light" title="Edit">
                    <i class="mdi mdi-pencil"></i>
                </a>
                ${deleteBtn}
            </div>
        `;
    };

    /* ---------- DataTables ---------- */

    const dt = $table.DataTable({
        processing : true,
        serverSide : true,
        ajax: {
            url  : '/api/users/data',
            type : 'GET',
            data : (d) => ({
                ...d,
                role_filter   : $roleFilter.val(),
                status_filter : $statusFilter.val(),
                [CSRF_FIELD_NAME]: getCsrfHash(),
            }),
        },
        order: [[0, 'asc']],
        columns: [
            { data: null,        render: renderUser },
            { data: 'full_name', render: renderFullName },
            { data: null,        render: renderRole, orderable: true },
            { data: null,        render: renderDepartment, orderable: true },
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
            info: 'Menampilkan _START_–_END_ dari _TOTAL_ user',
            infoEmpty: 'Belum ada user',
            zeroRecords: 'Tidak ada data yang cocok',
            paginate: { next: 'Next', previous: 'Prev' },
            processing: 'Memuat...',
        },
    });

    /* ---------- Filter handlers ---------- */

    $roleFilter.on('change',   () => dt.ajax.reload());
    $statusFilter.on('change', () => dt.ajax.reload());

    /* ---------- Delete handler ---------- */

    $table.on('click', '.js-delete', async function () {
        const publicId = $(this).data('id');
        const username = $(this).data('username');

        if (! confirm(`Hapus user "${username}"?\nTindakan ini tidak bisa dibatalkan.`)) {
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