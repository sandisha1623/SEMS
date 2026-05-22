/**
 * SEMS — Login Form Handler
 *
 * - Submits via fetch (AJAX), shows spinner & alerts
 * - Token disimpan oleh server di httpOnly cookie (sems_access_token)
 *   → tidak pernah disentuh JS, tidak pakai localStorage / sessionStorage
 * - Refresh CSRF hash setiap response (karena Config\Security::$regenerate = true)
 * - Body dikirim sebagai application/x-www-form-urlencoded supaya PHP
 *   $_POST otomatis terisi (FormData/multipart kadang bermasalah)
 */
(() => {
    'use strict';

    const form     = document.getElementById('loginForm');
    const alertBox = document.getElementById('alertBox');
    const loginBtn = document.getElementById('loginBtn');
    const spinner  = document.getElementById('loginSpinner');
    const btnText  = loginBtn.querySelector('.btn-text');

    const CSRF_FIELD_NAME = 'csrf_test_name';
    const CSRF_HEADER     = 'X-CSRF-TOKEN';

    /* ----------------------------------------------------------
     | Helpers
     * --------------------------------------------------------*/

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
        alertBox.className = `alert alert-${type}`;
        alertBox.classList.remove('d-none');
        alertBox.textContent = message;
    };

    const hideAlert = () => {
        alertBox.classList.add('d-none');
        alertBox.textContent = '';
    };

    const setLoading = (loading) => {
        loginBtn.disabled = loading;
        form.querySelectorAll('input').forEach(i => i.disabled = loading);

        if (loading) {
            spinner.classList.remove('d-none');
            btnText.textContent = 'Signing in...';
        } else {
            spinner.classList.add('d-none');
            btnText.textContent = 'Login';
        }
    };

    /* ----------------------------------------------------------
     | Toggle password visibility
     * --------------------------------------------------------*/

    const togglePw = document.getElementById('togglePw');
    const passwordInput = document.getElementById('password');

    if (togglePw && passwordInput) {
        togglePw.addEventListener('click', () => {
            const icon = togglePw.querySelector('.mdi');

            const isPassword = passwordInput.type === 'password';

            passwordInput.type = isPassword ? 'text' : 'password';

            // Ganti icon
            icon.classList.toggle('mdi-eye-outline', !isPassword);
            icon.classList.toggle('mdi-eye-off-outline', isPassword);

            // Fokus kembali ke input tanpa select text
            passwordInput.focus({ preventScroll: true });
        });
    }

    /* ----------------------------------------------------------
     | Submit handler
     * --------------------------------------------------------*/

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();

        const username = form.username.value.trim();
        const password = form.password.value;

        if (!username || !password) {
            showAlert('Username dan password wajib diisi.');
            return;
        }

        setLoading(true);

        try {
            // Body sebagai application/x-www-form-urlencoded
            const params = new URLSearchParams();
            params.append('username', username);
            params.append('password', password);
            params.append(CSRF_FIELD_NAME, getCsrfHash());

            const response = await fetch(form.action || window.location.pathname, {
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
            try { data = await response.json(); } catch (_) { /* non-JSON */ }

            if (data.csrf && data.csrf.hash) {
                updateCsrfHash(data.csrf.hash);
            }

            if (response.ok && data.success) {
                showAlert(data.message || 'Login berhasil. Mengalihkan...', 'success');

                setTimeout(() => {
                    window.location.href = data.redirect || '/dashboard';
                }, 400);
                return;
            }

            showAlert(data.message || 'Login gagal. Silakan coba lagi.');
            form.password.value = '';
            form.password.focus();

        } catch (err) {
            console.error('[login]', err);
            showAlert('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
        } finally {
            setLoading(false);
        }
    });

    /* ----------------------------------------------------------
     | UX kecil-kecilan
     * --------------------------------------------------------*/

    ['username', 'password'].forEach((name) => {
        const el = form.elements[name];
        if (el) el.addEventListener('input', hideAlert);
    });

    form.password.addEventListener('keyup', (e) => {
        if (e.getModifierState && e.getModifierState('CapsLock')) {
            showAlert('Caps Lock sedang aktif.', 'warning');
        } else if (alertBox.classList.contains('alert-warning')) {
            hideAlert();
        }
    });
})();