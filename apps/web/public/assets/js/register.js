/**
 * register.js — SiWarga
 * Konsep: 1 KK = 1 akun, hanya kepala keluarga yang boleh registrasi.
 */

'use strict';

(function () {

    const form     = document.getElementById('formRegister');
    const btn      = document.getElementById('btnRegister');
    const alertBox = document.getElementById('alertBox');
    const togglePw = document.getElementById('togglePw');
    const pwInput  = document.getElementById('password');

    // Submit
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        clearErrors();
        clearAlert();

        const no_kk             = val('no_kk');
        const nik               = val('nik');
        const username          = val('username');
        const password          = val('password');
        const password_confirm  = val('password_confirm');

        // Validasi client
        let ok = true;
        if (!/^\d{16}$/.test(no_kk))   { setErr('no_kk',    'Nomor KK harus 16 digit angka.');        ok = false; }
        if (!/^\d{16}$/.test(nik))      { setErr('nik',      'NIK harus 16 digit angka.');              ok = false; }
        if (!/^[a-z0-9._]{3,50}$/.test(username)) {
            setErr('username', 'Username hanya huruf kecil, angka, titik, underscore (3-50 karakter).'); ok = false;
        }
        if (password.length < 8)        { setErr('password', 'Password minimal 8 karakter.');           ok = false; }
        if (!password_confirm)          { setErr('password_confirm', 'Konfirmasi password wajib.');      ok = false; }
        else if (password !== password_confirm) { setErr('password_confirm', 'Password tidak cocok.');  ok = false; }
        if (!ok) return;

        setLoading(true);

        try {
            const { ok: success, status, data } = await Api.post('/auth/register', {
                no_kk, nik, username, password, password_confirm,
            });

            if (success) {
                form.classList.add('d-none');
                showAlert('success',
                    `<strong>Pendaftaran berhasil!</strong><br>` +
                    `Halo <strong>${escHtml(data.data?.nama ?? username)}</strong>, ` +
                    `akun Anda menunggu aktivasi dari pengurus RT.`
                );
                return;
            }

            if (status === 422) {
                const errs = data.messages || {};
                Object.entries(errs).forEach(([f, msgs]) => setErr(f, Array.isArray(msgs) ? msgs[0] : msgs));
                return;
            }

            if (status === 429) {
                showAlert('warning', data.message || 'Terlalu banyak percobaan. Coba lagi nanti.');
                return;
            }

            showAlert('danger', data.message || 'Terjadi kesalahan. Coba lagi.');

        } catch (err) {
            showAlert('danger', 'Tidak dapat terhubung ke server.');
        } finally {
            setLoading(false);
        }
    });

    // Hanya angka untuk NIK dan No. KK
    ['no_kk', 'nik'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, '').slice(0, 16);
        });
    });

    // Username huruf kecil
    const usernameEl = document.getElementById('username');
    if (usernameEl) {
        usernameEl.addEventListener('input', function () {
            this.value = this.value.toLowerCase().replace(/[^a-z0-9._]/g, '');
        });
    }

    // Toggle password
    if (togglePw && pwInput) {
        togglePw.addEventListener('click', function () {
            const show   = pwInput.type === 'password';
            pwInput.type = show ? 'text' : 'password';
            const icon   = togglePw.querySelector('i');
            if (icon) { icon.classList.toggle('bx-hide', !show); icon.classList.toggle('bx-show', show); }
        });
    }

    // Helpers
    function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

    function setErr(field, msg) {
        const el = document.querySelector(`[data-error="${field}"]`);
        const input = document.getElementById(field);
        if (el) el.textContent = msg;
        if (input) input.classList.add('is-invalid');
    }

    function clearErrors() {
        document.querySelectorAll('[data-error]').forEach(el => el.textContent = '');
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    }

    function showAlert(type, msg) {
        const icons = { success:'bx-check-circle', danger:'bx-x-circle', warning:'bx-error', info:'bx-info-circle' };
        alertBox.className = `alert alert-${type} d-flex align-items-start`;
        alertBox.innerHTML = `<i class="bx ${icons[type]||'bx-info-circle'} me-2 fs-5 mt-1 flex-shrink-0"></i><div>${msg}</div>`;
    }

    function clearAlert() { alertBox.className = 'd-none'; alertBox.innerHTML = ''; }

    function setLoading(on) {
        if (!btn) return;
        btn.disabled = on;
        btn.querySelector('.btn-text').classList.toggle('d-none', on);
        btn.querySelector('.btn-spinner').classList.toggle('d-none', !on);
    }

    function escHtml(s) {
        return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

})();
