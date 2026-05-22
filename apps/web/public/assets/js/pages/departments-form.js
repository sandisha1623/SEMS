/**
 * SEMS — Department form (create & edit)
 */
(() => {
    'use strict';

    const form = document.getElementById('departmentForm');
    if (!form) return;

    const submitBtn = document.getElementById('submitBtn');
    const spinner   = document.getElementById('submitSpinner');
    const btnText   = submitBtn?.querySelector('.btn-text');
    const alertBox  = document.getElementById('alertBox');

    const CSRF_FIELD_NAME = 'csrf_test_name';
    const CSRF_HEADER     = 'X-CSRF-TOKEN';

    /* ---------- icon live preview ---------- */

    const iconInput   = document.getElementById('iconInput');
    const iconPreview = document.getElementById('iconPreview');

    if (iconInput && iconPreview) {
        iconInput.addEventListener('input', () => {
            const name = iconInput.value.trim() || 'domain';
            // Remove existing mdi-* class
            iconPreview.className = iconPreview.className
                .split(' ')
                .filter(c => !c.startsWith('mdi-'))
                .join(' ');
            iconPreview.classList.add(`mdi-${name}`);
        });
    }

    /* ---------- form helpers ---------- */

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

        Object.entries(errors).forEach(([field, message]) => {
            const input = form.querySelector(`[name="${field}"]`);
            if (! input) return;

            input.classList.add('is-invalid');

            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = message;
            input.parentElement.appendChild(feedback);
        });
    };

    const setLoading = (loading) => {
        submitBtn.disabled = loading;
        if (spinner) spinner.classList.toggle('d-none', !loading);
        if (btnText) btnText.textContent = loading ? 'Saving...' : 'Save';
    };

    /* ---------- submit ---------- */

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
                    window.location.href = data.redirect || '/departments';
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
            console.error('[department-form]', err);
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