/**
 * SEMS — Exam Session form (create & edit)
 *
 * Features:
 * - Auto-generate code dari title + dept + starts_at
 * - Live preview "Selesai pada" dari starts_at + duration
 * - Form submit dengan CSRF refresh + validation errors inline
 */
(() => {
    'use strict';

    const form = document.getElementById('examSessionForm');
    if (!form) return;

    const submitBtn = document.getElementById('submitBtn');
    const spinner   = document.getElementById('submitSpinner');
    const btnText   = submitBtn?.querySelector('.btn-text');
    const alertBox  = document.getElementById('alertBox');

    const CSRF_FIELD_NAME = 'csrf_test_name';
    const CSRF_HEADER     = 'X-CSRF-TOKEN';

    const titleInput      = document.getElementById('examTitle');
    const departmentInput = document.getElementById('examDepartment');
    const startsAtInput   = document.getElementById('examStartsAt');
    const durationInput   = document.getElementById('examDuration');
    const codeInput       = document.getElementById('examCode');
    const codeEditToggle  = document.getElementById('toggleCodeEdit');
    const endsAtPreview   = document.getElementById('endsAtPreview');

    let codeWasManuallyEdited = codeInput.value.trim() !== '';

    /* ---------- Code auto-generator ---------- */

    const generateCode = () => {
        const title    = titleInput.value.trim();
        const startsAt = startsAtInput.value.trim();

        if (! title) return '';

        const words = title
            .toUpperCase()
            .replace(/[^A-Z0-9\s-]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0);

        let titlePrefix;
        if (words.length === 0) {
            titlePrefix = 'EXAM';
        } else if (words[0].length <= 4) {
            titlePrefix = words[0];
        } else {
            titlePrefix = words[0].substring(0, 4);
        }

        let deptPart = '';
        if (departmentInput.value) {
            const deptOption = departmentInput.options[departmentInput.selectedIndex];
            if (deptOption) {
                deptPart = deptOption.text
                    .toUpperCase()
                    .split(/\s+/)
                    .map(w => w.charAt(0))
                    .join('')
                    .substring(0, 4);
            }
        }

        let datePart = '';
        if (startsAt) {
            const d = new Date(startsAt);
            if (!isNaN(d.getTime())) {
                const yyyy = d.getFullYear();
                const mm   = String(d.getMonth() + 1).padStart(2, '0');
                datePart = `${yyyy}${mm}`;
            }
        }

        return [titlePrefix, deptPart, datePart].filter(Boolean).join('-');
    };

    const updateCodeIfAuto = () => {
        if (codeWasManuallyEdited) return;
        codeInput.value = generateCode();
    };

    /* ---------- Live "Selesai pada" preview ---------- */

    const formatDateTime = (date) => {
        if (!date || isNaN(date.getTime())) return null;
        return date.toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const updateEndsAtPreview = () => {
        if (!endsAtPreview) return;

        const startsAt = startsAtInput.value.trim();
        const duration = parseInt(durationInput.value, 10);

        if (!startsAt || !duration || duration <= 0) {
            endsAtPreview.textContent = '—';
            return;
        }

        const start = new Date(startsAt);
        if (isNaN(start.getTime())) {
            endsAtPreview.textContent = '—';
            return;
        }

        const end = new Date(start.getTime() + duration * 60 * 1000);
        endsAtPreview.textContent = formatDateTime(end) || '—';
    };

    /* ---------- Event listeners ---------- */

    [titleInput, departmentInput, startsAtInput].forEach(el => {
        el.addEventListener('input',  () => {
            updateCodeIfAuto();
            updateEndsAtPreview();
        });
        el.addEventListener('change', () => {
            updateCodeIfAuto();
            updateEndsAtPreview();
        });
    });

    durationInput.addEventListener('input',  updateEndsAtPreview);
    durationInput.addEventListener('change', updateEndsAtPreview);

    codeEditToggle?.addEventListener('click', () => {
        if (codeInput.readOnly) {
            codeInput.readOnly = false;
            codeInput.focus();
            codeEditToggle.innerHTML = '<i class="mdi mdi-lock-outline"></i> Lock';
            codeWasManuallyEdited = true;
        } else {
            codeInput.readOnly = true;
            codeEditToggle.innerHTML = '<i class="mdi mdi-pencil"></i> Edit';
            codeWasManuallyEdited = false;
            updateCodeIfAuto();
        }
    });

    // Initial state
    if (! codeInput.value.trim()) {
        updateCodeIfAuto();
    }
    updateEndsAtPreview();

    /* ---------- Form helpers ---------- */

    const getCsrfHash = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    };

    const updateCsrfHash = (hash) => {
        if (!hash) return;
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) meta.setAttribute('content', hash);

        const hidden = form.querySelector(`input[name="${CSRF_FIELD_NAME}"]`);
        if (hidden) hidden.value = hash;
    };

    const showAlert = (message, type = 'danger') => {
        if (!alertBox) return;
        alertBox.className = `alert alert-${type}`;
        alertBox.classList.remove('d-none');
        alertBox.textContent = message;
    };

    const hideAlert = () => {
        if (!alertBox) return;
        alertBox.classList.add('d-none');
        alertBox.textContent = '';
    };

    const clearFieldErrors = () => {
        form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    };

    const showFieldErrors = (errors) => {
        clearFieldErrors();

        let firstInvalid = null;

        Object.entries(errors).forEach(([field, message]) => {
            const input = form.querySelector(`[name="${field}"]`);
            if (! input) return;

            input.classList.add('is-invalid');

            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = message;
            input.parentElement.appendChild(feedback);

            if (!firstInvalid) firstInvalid = input;
        });

        const advancedFields = ['mode', 'status', 'description'];
        const hasAdvancedError = Object.keys(errors).some(f => advancedFields.includes(f));
        if (hasAdvancedError) {
            const advanced = document.getElementById('advancedSection');
            if (advanced && ! advanced.classList.contains('show')) {
                bootstrap.Collapse.getOrCreateInstance(advanced).show();
            }
        }

        firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const setLoading = (loading) => {
        submitBtn.disabled = loading;
        if (spinner) spinner.classList.toggle('d-none', !loading);
        if (btnText) btnText.textContent = loading
            ? 'Saving...'
            : (form.action.includes('/update') ? 'Update Session' : 'Initialize Session');
    };

    /* ---------- Submit ---------- */

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();
        clearFieldErrors();
        setLoading(true);

        try {
            const formData = new FormData(form);
            const params   = new URLSearchParams();

            for (const [key, value] of formData.entries()) {
                params.append(key, value);
            }

            const res = await fetch(form.action, {
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
                showAlert(data.message || 'Berhasil disimpan.', 'success');
                setTimeout(() => {
                    window.location.href = data.redirect || '/exam-sessions';
                }, 600);
                return;
            }

            if (res.status === 422 && data.errors) {
                showFieldErrors(data.errors);
                showAlert(data.message || 'Data tidak valid.', 'danger');
            } else {
                showAlert(data.message || 'Gagal menyimpan.', 'danger');
            }

        } catch (err) {
            console.error('[exam-session-form]', err);
            showAlert('Tidak dapat terhubung ke server.', 'danger');
        } finally {
            setLoading(false);
        }
    });

    form.querySelectorAll('input, select, textarea').forEach(el => {
        el.addEventListener('input', () => {
            el.classList.remove('is-invalid');
            const feedback = el.parentElement.querySelector('.invalid-feedback');
            if (feedback) feedback.remove();
        });
    });
})();