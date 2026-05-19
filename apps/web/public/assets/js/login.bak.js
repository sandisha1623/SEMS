'use strict';

(function () {

    const form     = document.getElementById('formAuthentication');
    const btn      = document.getElementById('btnLogin');
    const togglePw = document.getElementById('togglePw');
    const pwInput  = document.getElementById('password');

    const lockBox  = document.getElementById('lockBox');
    const lockText = document.getElementById('lockText');

    if (!form) return;

    let lockTimer = null;

    // ── INIT: CHECK LOCK DARI SERVER ──────────────────────────────
    (async function checkLockOnLoad() {
        try {
            const res = await Api.get('/auth/lock-status');

            console.log('LOCK STATUS:', res);

            if (res.ok && res.data.locked) {
                showLock(res.data.retry_after);
            }

        } catch (e) {
            console.warn('lock check gagal');
        }
    })();

    // ── VALIDATION RULES ──────────────────────────────────────────
    const rules = {
        username: [
            { type: 'required', message: 'Username wajib diisi' },
            { type: 'min', value: 3, message: 'Minimal 3 karakter' }
        ],
        password: [
            { type: 'required', message: 'Password wajib diisi' },
            { type: 'min', value: 6, message: 'Minimal 6 karakter' }
        ]
    };

    if (typeof Validator !== 'undefined' && Validator.bindRealtime) {
        Validator.bindRealtime(form);
    }

    // ── SUBMIT ────────────────────────────────────────────────────
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (typeof Validator !== 'undefined' && Validator.validate) {
            if (!Validator.validate(rules, form)) {
                Toast?.error('Periksa kembali form');
                return;
            }
        }

        setLoading(true);

        try {
            const username = form.username.value.trim();
            const password = form.password.value;

            const res = await Api.post('/auth/login', { username, password });

            console.log('LOGIN RESPONSE:', res);

            const { ok, status, data, retryAfter } = res;

            // ── SUCCESS ────────────────────────────────────────────
            if (ok) {
                Toast?.success(data.message || 'Login berhasil');

                setTimeout(() => {
                    const map = {
                        administrator: '/dashboard',
                        rw: '/dashboard',
                        rt: '/dashboard',
                        warga: '/profil'
                    };
                    window.location.href = map[data.data?.role] || '/dashboard';
                }, 800);

                return;
            }

            // ── LOCK / RATE LIMIT ─────────────────────────────────
            if (status === 429 || status === 423) {
                console.log('LOCK TRIGGERED:', data);

                const ttl = retryAfter || data?.retry_after || 60;

                showLock(ttl);
                return;
            }

            // ── INVALID LOGIN ─────────────────────────────────────
            if (status === 401) {
                Validator?.showError('password', data.message || 'Username atau password salah.');

                if (data.attempts_remaining !== undefined) {
                    showAttemptInfo(data.attempts_remaining, data.max_attempts || 5);
                }

                return;
            }

            // ── VALIDATION SERVER ─────────────────────────────────
            if (status === 422) {
                const errs = data.messages || {};

                if (errs.username) Validator?.showError('username', flatten(errs.username));
                if (errs.password) Validator?.showError('password', flatten(errs.password));

                return;
            }

            // ── OTHER ERROR ───────────────────────────────────────
            if (data?.message) {
                Toast?.error(data.message);
            }

        } catch (err) {
            console.error('[login] error:', err);
            Toast?.error('Terjadi kesalahan koneksi');
        } finally {
            setLoading(false);
        }
    });

    // ── LOCK UI ───────────────────────────────────────────────────
    function showLock(seconds) {

        if (!lockBox || !lockText) {
            console.error('lockBox / lockText tidak ditemukan');
            return;
        }

        form.style.display = 'none';
        lockBox.classList.remove('d-none');

        startCountdown(seconds, () => {
            form.style.display = '';
            lockBox.classList.add('d-none');
        });
    }

    // ── COUNTDOWN ─────────────────────────────────────────────────
    function startCountdown(seconds, onDone) {

        if (lockTimer) clearInterval(lockTimer);

        let remaining = seconds;

        function tick() {
            if (remaining <= 0) {
                clearInterval(lockTimer);
                onDone && onDone();
                return;
            }

            if (lockText) {
                lockText.textContent = 'Coba lagi dalam ' + remaining + ' detik';
            }

            remaining--;
        }

        tick();
        lockTimer = setInterval(tick, 1000);
    }

    // ── ATTEMPT UI ────────────────────────────────────────────────
    function showAttemptInfo(remaining, maxAttempts) {
        const bar  = document.getElementById('attemptBar');
        const txt  = document.getElementById('attemptText');
        const dots = document.getElementById('attemptDots');

        if (!bar) return;

        const used = maxAttempts - remaining;

        if (txt) txt.textContent = `Percobaan ke-${used} dari ${maxAttempts}`;

        if (dots) {
            dots.innerHTML = '';
            for (let i = 0; i < maxAttempts; i++) {
                const d = document.createElement('span');
                d.className = 'dot' + (i < used ? ' dot--used' : '');
                dots.appendChild(d);
            }
        }

        bar.hidden = false;
    }

    // ── LOADING ───────────────────────────────────────────────────
    function setLoading(on) {
        if (!btn) return;

        btn.disabled = on;
        btn.classList.toggle('loading', on);

        const txt = btn.querySelector('.btn-text');
        const sp  = btn.querySelector('.btn-spinner');

        if (txt) txt.textContent = on ? 'Memverifikasi...' : 'Masuk';
        if (sp)  sp.hidden       = !on;
    }

    // ── TOGGLE PASSWORD ───────────────────────────────────────────
    if (togglePw && pwInput) {
        togglePw.addEventListener('click', function () {
            const show = pwInput.type === 'password';

            pwInput.type = show ? 'text' : 'password';

            const icon = togglePw.querySelector('i');
            if (icon) {
                icon.classList.toggle('bx-hide', !show);
                icon.classList.toggle('bx-show', show);
            }
        });
    }

    // ── UTIL ──────────────────────────────────────────────────────
    function flatten(val) {
        if (!val) return '';
        if (typeof val === 'string') return val;
        if (Array.isArray(val)) return val[0] || '';
        if (typeof val === 'object') return Object.values(val)[0] || '';
        return '';
    }

})();