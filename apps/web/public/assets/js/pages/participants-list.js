/**
 * SEMS — Participants list (scoped per exam session)
 *
 * Expose window.examParticipants.reload() supaya enroll modal bisa
 * trigger refresh setelah enroll sukses.
 */
(() => {
    'use strict';

    const sessionPublicId = document
        .querySelector('meta[name="session-public-id"]')
        ?.getAttribute('content');

    if (!sessionPublicId) {
        console.error('[participants] session-public-id meta tag not found');
        return;
    }

    const $table        = $('#participantsTable');
    const $alertBox     = $('#alertBox');
    const $statusFilter = $('#statusFilter');

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

    const initial = (str) => {
        const s = String(str ?? '').trim();
        if (!s) return '?';
        const parts = s.split(/\s+/);
        const first = parts[0]?.charAt(0) ?? '';
        const last  = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
        return (first + last).toUpperCase() || '?';
    };

    const statusUrl = (participantId) =>
        `/exam-sessions/${sessionPublicId}/participants/${participantId}/status`;
    const deleteUrl = (participantId) =>
        `/exam-sessions/${sessionPublicId}/participants/${participantId}/delete`;

    /* ---------- renderers ---------- */

    const renderUser = (row) => `
        <div class="user-cell">
            <div class="user-avatar">${initial(row.full_name || row.username)}</div>
            <div>
                <div class="user-name">${escapeHtml(row.full_name || row.username)}</div>
                <div class="user-email">${escapeHtml(row.email)}</div>
            </div>
        </div>
    `;

    const renderDept = (row) => {
        if (!row.department_name) return '<span class="text-muted">—</span>';
        return `
            <div class="dept-cell">
                <div class="dept-icon-sm">
                    <i class="mdi mdi-${escapeHtml(row.department_icon || 'domain')}"></i>
                </div>
                <div>${escapeHtml(row.department_name)}</div>
            </div>
        `;
    };

    const renderStatus = (row) => {
        const label = String(row.status || '').replace('_', ' ');
        return `<span class="status-pill ${row.status_badge}">${escapeHtml(label)}</span>`;
    };

    const renderVerification = (row) => {
        if (row.verification_score === null || row.verification_score === undefined) {
            return '<span class="text-muted">—</span>';
        }
        const pct = (parseFloat(row.verification_score) * 100).toFixed(1);
        return `<span class="fw-semibold">${pct}%</span>`;
    };

    const renderDate = (date) => {
        if (!date) return '<span class="text-muted">—</span>';
        const d = new Date(date.replace(' ', 'T'));
        if (isNaN(d.getTime())) return escapeHtml(date);
        return d.toLocaleString('id-ID', {
            day: '2-digit', month: 'short',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const renderActions = (row) => `
        <div class="d-flex gap-1 justify-content-end">
            <button type="button"
                    class="btn btn-sm btn-light js-edit-status"
                    data-id="${row.public_id}"
                    data-username="${escapeHtml(row.username)}"
                    data-status="${escapeHtml(row.status)}"
                    title="Change Status">
                <i class="mdi mdi-pencil"></i>
            </button>
            <button type="button"
                    class="btn btn-sm btn-light text-danger js-delete"
                    data-id="${row.public_id}"
                    data-username="${escapeHtml(row.username)}"
                    title="Remove from session">
                <i class="mdi mdi-delete"></i>
            </button>
        </div>
    `;

    /* ---------- DataTables ---------- */

    const dt = $table.DataTable({
        processing : true,
        serverSide : true,
        ajax: {
            url  : `/api/exam-sessions/${sessionPublicId}/participants/data`,
            type : 'GET',
            data : (d) => ({
                ...d,
                status_filter: $statusFilter.val(),
                [CSRF_FIELD_NAME]: getCsrfHash(),
            }),
        },
        order: [[4, 'desc']],
        columns: [
            { data: null, render: renderUser },
            { data: null, render: renderDept },
            { data: null, className: 'text-center', render: renderStatus },
            { data: null, className: 'text-center', render: renderVerification },
            { data: 'created_at', render: renderDate },
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
            info: 'Menampilkan _START_–_END_ dari _TOTAL_ peserta',
            infoEmpty: 'Belum ada peserta enrolled. Klik "Enroll Students" untuk menambahkan.',
            zeroRecords: 'Tidak ada peserta yang cocok',
            paginate: { next: 'Next', previous: 'Prev' },
            processing: 'Memuat...',
        },
    });

    $statusFilter.on('change', () => dt.ajax.reload());

    /* ---------- Expose reload API for enroll modal ---------- */

    window.examParticipants = {
        reload: () => {
            dt.ajax.reload(null, false);
            // Reload stats card via full page refresh — sederhana untuk sekarang
            // Nanti bisa diganti dengan API endpoint khusus summary.
            // Atau biarkan stats agak stale sampai user refresh manual.
        },
    };

    /* ---------- Change status modal ---------- */

    const statusModalEl   = document.getElementById('statusModal');
    const statusModalUser = document.getElementById('statusModalUser');
    const statusSelect    = document.getElementById('statusModalSelect');
    const statusSaveBtn   = document.getElementById('statusModalSave');
    const statusSpinner   = document.getElementById('statusModalSpinner');
    const statusModal     = new bootstrap.Modal(statusModalEl);

    let currentParticipantId = null;

    $table.on('click', '.js-edit-status', function () {
        currentParticipantId = $(this).data('id');
        const username = $(this).data('username');
        const status   = $(this).data('status');

        statusModalUser.textContent = `@${username}`;
        statusSelect.value = status;

        statusModal.show();
    });

    statusSaveBtn.addEventListener('click', async () => {
        if (!currentParticipantId) return;

        const newStatus = statusSelect.value;

        statusSaveBtn.disabled = true;
        statusSpinner.classList.remove('d-none');

        const params = new URLSearchParams();
        params.append('status', newStatus);
        params.append(CSRF_FIELD_NAME, getCsrfHash());

        try {
            const res = await fetch(statusUrl(currentParticipantId), {
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
                showAlert(data.message || 'Status diperbarui.', 'success');
                statusModal.hide();
                dt.ajax.reload(null, false);
            } else {
                showAlert(data.message || 'Gagal mengubah status.', 'danger');
            }
        } catch (err) {
            console.error('[status-update]', err);
            showAlert('Tidak dapat terhubung ke server.', 'danger');
        } finally {
            statusSaveBtn.disabled = false;
            statusSpinner.classList.add('d-none');
        }
    });

    /* ---------- Delete ---------- */

    $table.on('click', '.js-delete', async function () {
        const participantId = $(this).data('id');
        const username      = $(this).data('username');

        if (! confirm(`Keluarkan @${username} dari sesi ini?\nMereka harus di-enroll ulang.`)) {
            return;
        }

        const params = new URLSearchParams();
        params.append(CSRF_FIELD_NAME, getCsrfHash());

        try {
            const res = await fetch(deleteUrl(participantId), {
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
                showAlert(data.message || 'Dihapus.', 'success');
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