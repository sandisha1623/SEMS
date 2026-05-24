/**
 * SEMS — Participants Enroll Modal
 *
 * Handles modal #enrollModal dengan 2 tab:
 * - Single Enroll: search → klik baris → enroll
 * - Bulk Enroll:   search → checkbox → submit bulk
 *
 * Modal di-trigger oleh tombol [data-bs-target="#enrollModal"] di header.
 */
(() => {
    'use strict';

    const sessionPublicId = document
        .querySelector('meta[name="session-public-id"]')
        ?.getAttribute('content');

    if (!sessionPublicId) return;

    const CSRF_FIELD_NAME = 'csrf_test_name';
    const CSRF_HEADER     = 'X-CSRF-TOKEN';
    const DEBOUNCE_MS     = 300;

    /* ---------- Elements ---------- */

    const modalEl     = document.getElementById('enrollModal');
    const modal       = new bootstrap.Modal(modalEl);

    // Single tab
    const singleSearch    = document.getElementById('singleSearch');
    const singleDeptFilter = document.getElementById('singleDeptFilter');
    const singleResults   = document.getElementById('singleResults');

    // Bulk tab
    const bulkSearch       = document.getElementById('bulkSearch');
    const bulkDeptFilter   = document.getElementById('bulkDeptFilter');
    const bulkResults      = document.getElementById('bulkResults');
    const bulkSelectAllBtn = document.getElementById('bulkSelectAll');
    const bulkSelectedCount = document.getElementById('bulkSelectedCount');

    // Footer
    const bulkEnrollBtn     = document.getElementById('bulkEnrollBtn');
    const bulkEnrollSpinner = document.getElementById('bulkEnrollSpinner');
    const bulkEnrollCount   = document.getElementById('bulkEnrollCount');

    // Show feature warning icon for users without face reference?
    // Set true setelah Step 4C (Face References) selesai dan ada data.
    const SHOW_NO_FACE_WARNING = false;

    /* ---------- Helpers ---------- */

    const getCsrfHash = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    const updateCsrfHash = (hash) => {
        if (!hash) return;
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) meta.setAttribute('content', hash);
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

    const showOuterAlert = (message, type = 'success') => {
        const $alert = $('#alertBox');
        $alert
            .removeClass('d-none alert-success alert-danger alert-warning')
            .addClass(`alert-${type}`)
            .text(message);
        setTimeout(() => $alert.addClass('d-none'), 4500);
    };

    /* ---------- Search API ---------- */

    const searchStudents = async (q, departmentId, limit = 50) => {
        const params = new URLSearchParams({
            q,
            department_id: departmentId || '',
            session_id: sessionPublicId,
            limit: String(limit),
        });

        try {
            const res = await fetch(`/api/users/searchable-students?${params}`, {
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' },
            });

            if (!res.ok) return { data: [] };
            return await res.json();
        } catch (err) {
            console.error('[search]', err);
            return { data: [] };
        }
    };

    /* ---------- Renderers ---------- */

    const renderStudentSingle = (student) => {
        const warning = (SHOW_NO_FACE_WARNING && !student.has_face_reference)
            ? '<i class="mdi mdi-alert-circle-outline text-warning ms-1" '
            +   'title="Belum punya foto referensi"></i>'
            : '';

        const dept = student.department_name
            ? `<i class="mdi mdi-${escapeHtml(student.department_icon)} me-1"></i>${escapeHtml(student.department_name)}`
            : '<span class="text-muted">—</span>';

        return `
            <div class="search-result-item js-single-enroll"
                 data-public-id="${escapeHtml(student.public_id)}"
                 data-username="${escapeHtml(student.username)}">
                <div class="user-avatar">${initial(student.full_name || student.username)}</div>
                <div class="flex-grow-1">
                    <div class="user-name">${escapeHtml(student.full_name || student.username)} ${warning}</div>
                    <div class="user-email">${escapeHtml(student.email)} · ${dept}</div>
                </div>
                <i class="mdi mdi-plus-circle text-primary fs-4"></i>
            </div>
        `;
    };

    const renderStudentBulk = (student) => {
        const warning = (SHOW_NO_FACE_WARNING && !student.has_face_reference)
            ? '<i class="mdi mdi-alert-circle-outline text-warning ms-1" '
            +   'title="Belum punya foto referensi"></i>'
            : '';

        const dept = student.department_name
            ? `<i class="mdi mdi-${escapeHtml(student.department_icon)} me-1"></i>${escapeHtml(student.department_name)}`
            : '<span class="text-muted">—</span>';

        return `
            <div class="search-result-item">
                <div class="form-check m-0">
                    <input class="form-check-input js-bulk-check" type="checkbox"
                           value="${escapeHtml(student.public_id)}"
                           id="bulk_${escapeHtml(student.public_id)}">
                </div>
                <label class="user-avatar" for="bulk_${escapeHtml(student.public_id)}"
                       style="cursor: pointer;">
                    ${initial(student.full_name || student.username)}
                </label>
                <label class="flex-grow-1" for="bulk_${escapeHtml(student.public_id)}"
                       style="cursor: pointer; margin: 0;">
                    <div class="user-name">${escapeHtml(student.full_name || student.username)} ${warning}</div>
                    <div class="user-email">${escapeHtml(student.email)} · ${dept}</div>
                </label>
            </div>
        `;
    };

    const renderResults = (container, students, mode) => {
        if (!students.length) {
            container.innerHTML = `
                <div class="search-empty">
                    <i class="mdi mdi-account-search fs-3 d-block mb-2"></i>
                    Tidak ada mahasiswa yang cocok.
                </div>`;
            return;
        }

        const renderer = mode === 'bulk' ? renderStudentBulk : renderStudentSingle;
        container.innerHTML = students.map(renderer).join('');
    };

    const renderLoading = (container) => {
        container.innerHTML = `
            <div class="search-loading">
                <div class="spinner-border spinner-border-sm me-2"></div>
                Mencari mahasiswa...
            </div>`;
    };

    /* ---------- Debounce ---------- */

    let singleDebounce;
    let bulkDebounce;

    const debouncedSearch = (mode) => {
        if (mode === 'single') {
            clearTimeout(singleDebounce);
            singleDebounce = setTimeout(() => runSearch('single'), DEBOUNCE_MS);
        } else {
            clearTimeout(bulkDebounce);
            bulkDebounce = setTimeout(() => runSearch('bulk'), DEBOUNCE_MS);
        }
    };

    const runSearch = async (mode) => {
        const q       = (mode === 'single' ? singleSearch.value : bulkSearch.value).trim();
        const deptId  = (mode === 'single' ? singleDeptFilter.value : bulkDeptFilter.value);
        const container = mode === 'single' ? singleResults : bulkResults;

        // Empty query + no dept filter: show empty state
        if (!q && !deptId) {
            container.innerHTML = `
                <div class="search-empty">
                    <i class="mdi mdi-magnify fs-3 d-block mb-2"></i>
                    Ketik di kolom search ${mode === 'bulk' ? 'atau pilih department ' : ''}untuk mulai.
                </div>`;
            updateBulkSelection();
            return;
        }

        renderLoading(container);
        const result = await searchStudents(q, deptId, mode === 'bulk' ? 100 : 20);
        renderResults(container, result.data || [], mode);

        if (mode === 'bulk') {
            updateBulkSelection();
        }
    };

    /* ---------- Search listeners ---------- */

    singleSearch.addEventListener('input',     () => debouncedSearch('single'));
    singleDeptFilter.addEventListener('change', () => runSearch('single'));

    bulkSearch.addEventListener('input',     () => debouncedSearch('bulk'));
    bulkDeptFilter.addEventListener('change', () => runSearch('bulk'));

    /* ---------- Reset on modal open ---------- */

    modalEl.addEventListener('show.bs.modal', () => {
        singleSearch.value = '';
        singleDeptFilter.value = '';
        bulkSearch.value = '';
        bulkDeptFilter.value = '';

        singleResults.innerHTML = `
            <div class="search-empty">
                <i class="mdi mdi-magnify fs-3 d-block mb-2"></i>
                Ketik di kolom search untuk mencari mahasiswa.
            </div>`;
        bulkResults.innerHTML = `
            <div class="search-empty">
                <i class="mdi mdi-magnify fs-3 d-block mb-2"></i>
                Ketik di kolom search atau pilih department untuk mulai.
            </div>`;

        updateBulkSelection();
    });

    /* ---------- Single enroll (click row) ---------- */

    singleResults.addEventListener('click', async (e) => {
        const item = e.target.closest('.js-single-enroll');
        if (!item) return;

        const publicId = item.dataset.publicId;
        const username = item.dataset.username;

        // Visual feedback
        item.style.opacity = '0.5';
        item.style.pointerEvents = 'none';

        const result = await postEnroll([publicId]);

        if (result.success) {
            showOuterAlert(`@${username} berhasil di-enroll.`, 'success');
            // Refresh list di belakang
            if (window.examParticipants && typeof window.examParticipants.reload === 'function') {
                window.examParticipants.reload();
            }
            // Refresh search result supaya yang baru di-enroll hilang
            runSearch('single');
        } else {
            item.style.opacity = '';
            item.style.pointerEvents = '';
            alert(result.message || 'Gagal enroll.');
        }
    });

    /* ---------- Bulk: selection tracking ---------- */

    const updateBulkSelection = () => {
        const checked = bulkResults.querySelectorAll('.js-bulk-check:checked');
        const count = checked.length;
        bulkSelectedCount.textContent = count;
        bulkEnrollCount.textContent   = count;
        bulkEnrollBtn.disabled = (count === 0);
    };

    bulkResults.addEventListener('change', (e) => {
        if (e.target.classList.contains('js-bulk-check')) {
            updateBulkSelection();
        }
    });

    bulkSelectAllBtn.addEventListener('click', () => {
        const checks = bulkResults.querySelectorAll('.js-bulk-check');
        if (!checks.length) return;
        const allChecked = Array.from(checks).every(c => c.checked);
        checks.forEach(c => { c.checked = !allChecked; });
        updateBulkSelection();
    });

    /* ---------- Bulk enroll submit ---------- */

    bulkEnrollBtn.addEventListener('click', async () => {
        const checked = bulkResults.querySelectorAll('.js-bulk-check:checked');
        const publicIds = Array.from(checked).map(c => c.value);

        if (!publicIds.length) return;

        bulkEnrollBtn.disabled = true;
        bulkEnrollSpinner.classList.remove('d-none');

        const result = await postEnroll(publicIds);

        bulkEnrollSpinner.classList.add('d-none');

        if (result.success) {
            showOuterAlert(result.message || 'Enrolled.', 'success');
            modal.hide();
            if (window.examParticipants && typeof window.examParticipants.reload === 'function') {
                window.examParticipants.reload();
            }
        } else {
            bulkEnrollBtn.disabled = false;
            alert(result.message || 'Gagal enroll.');
        }
    });

    /* ---------- POST enroll ---------- */

    const postEnroll = async (publicIds) => {
        const params = new URLSearchParams();
        params.append(CSRF_FIELD_NAME, getCsrfHash());
        publicIds.forEach(pid => params.append('user_public_ids[]', pid));

        try {
            const res = await fetch(
                `/exam-sessions/${sessionPublicId}/participants/enroll`,
                {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept'          : 'application/json',
                        'Content-Type'    : 'application/x-www-form-urlencoded',
                        [CSRF_HEADER]     : getCsrfHash(),
                    },
                    body: params.toString(),
                }
            );

            let data = {};
            try { data = await res.json(); } catch (_) {}

            if (data.csrf && data.csrf.hash) {
                updateCsrfHash(data.csrf.hash);
            }

            return {
                success: res.ok && data.success,
                message: data.message,
            };
        } catch (err) {
            console.error('[enroll]', err);
            return { success: false, message: 'Tidak dapat terhubung ke server.' };
        }
    };

})();