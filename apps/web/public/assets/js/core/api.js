'use strict';

const Api = (function () {

    let csrfToken   = null;
    let isRefreshing = false;
    let refreshQueue = [];

    const BASE_URL = '/api/v1';

    // 🔥 CONFIG
    const TOAST_CONFIG = {
        autoError: true
    };

    // 🔥 TOAST HELPER
    function showErrorToast(data, fallback = 'Terjadi kesalahan') {
        if (typeof Toast === 'undefined') return;

        const msg =
            data?.message ||
            data?.error ||
            fallback;

        Toast.error(msg);
    }

    // ── CSRF ─────────────────────────────────────────
    async function fetchCsrf() {
        try {
            const res  = await fetch(BASE_URL + '/auth/csrf-token', {
                method:      'GET',
                credentials: 'include',
                headers:     { 'Accept': 'application/json' },
            });
            const data = await res.json();
            csrfToken  = data.csrf_token || null;
        } catch (e) {
            console.warn('[Api] CSRF fetch gagal:', e.message);
        }
    }

    // ── CORE REQUEST ─────────────────────────────────
    async function request(url, options = {}, retry = true) {

        const silent = options.silent || false;

        const headers = {
            'Content-Type': 'application/json',
            'Accept':       'application/json',
            ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
            ...(options.headers || {}),
        };

        const config = {
            credentials: 'include',
            ...options,
            headers,
        };

        let res, data;

        try {
            res  = await fetch(BASE_URL + url, config);
            data = await res.json().catch(() => ({}));
        } catch (err) {
            if (!silent && TOAST_CONFIG.autoError) {
                showErrorToast(null, 'Tidak dapat terhubung ke server');
            }
            throw err;
        }

        // ── CSRF expired ─────────────────────────────
        if ((res.status === 403 || res.status === 419) && retry) {
            await fetchCsrf();
            return request(url, options, false);
        }

        // ── 401 → REFRESH TOKEN ──────────────────────
        if (res.status === 401 && retry) {

            if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
                return { ok: false, status: 401, data };
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push({ resolve, reject, url, options });
                });
            }

            isRefreshing = true;

            try {
                const refreshRes = await fetch(BASE_URL + '/auth/refresh', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
                    },
                });

                if (refreshRes.ok) {
                    isRefreshing = false;

                    for (const q of refreshQueue) {
                        request(q.url, q.options, false)
                            .then(q.resolve)
                            .catch(q.reject);
                    }

                    refreshQueue = [];
                    return request(url, options, false);
                }

                isRefreshing = false;
                refreshQueue = [];
                handleSessionExpired();

                return { ok: false, status: 401, data };

            } catch (err) {
                isRefreshing = false;
                refreshQueue = [];
                handleSessionExpired();
                throw err;
            }
        }

        // ── RATE LIMIT / LOCK ────────────────────────
        if (res.status === 429 || res.status === 423) {
            return { 
                ok: false, 
                status: res.status, 
                data,
                retryAfter: data.retry_after || null
            };
        }

        // ── SERVER ERROR ─────────────────────────────
        if (res.status >= 500 && !silent && TOAST_CONFIG.autoError) {
            showErrorToast(data, 'Server sedang bermasalah. Coba lagi.');
        }

        // 🔥 GLOBAL ERROR HANDLER
        if (!res.ok && !silent && TOAST_CONFIG.autoError) {
            if (![401, 403, 419, 429, 423].includes(res.status)) {
                showErrorToast(data);
            }
        }

        return { ok: res.ok, status: res.status, data };
    }

    // ── SESSION EXPIRED ─────────────────────────────
    function handleSessionExpired() {
        showErrorToast(null, 'Sesi Anda telah habis. Silakan login kembali.');
        setTimeout(() => { window.location.href = '/login'; }, 1500);
    }

    // ── PUBLIC API ──────────────────────────────────
    function get(url, opt = {}) {
        return request(url, { method: 'GET', ...opt });
    }

    function post(url, body = {}, opt = {}) {
        return request(url, { method: 'POST', body: JSON.stringify(body), ...opt });
    }

    function put(url, body = {}, opt = {}) {
        return request(url, { method: 'PUT', body: JSON.stringify(body), ...opt });
    }

    function del(url, opt = {}) {
        return request(url, { method: 'DELETE', ...opt });
    }

    fetchCsrf();

    return { get, post, put, 'delete': del, refreshCsrf: fetchCsrf };

})();