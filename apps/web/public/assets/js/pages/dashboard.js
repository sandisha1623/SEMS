/**
 * SEMS Dashboard — WebSocket client
 *
 * Flow auth:
 *   1. JS panggil GET /auth/ws-token (kirim cookie session otomatis)
 *   2. CI4 balas { token, ws_url }
 *   3. Buka ws://<url>?token=<jwt> ke FastAPI
 *   4. FastAPI verify pakai shared JWT secret + cek blacklist
 *
 * Cookie sems_access_token tetap httpOnly — JS tidak menyentuhnya.
 */
(() => {
    'use strict';

    const TOKEN_ENDPOINT  = '/auth/ws-token';
    const PING_INTERVAL   = 20_000;   // 20s
    const RECONNECT_BASE  = 1_000;    // 1s, exponential backoff
    const RECONNECT_MAX   = 30_000;   // cap 30s

    const $count = document.getElementById('notif-count');
    const $list  = document.getElementById('notif-list');

    let socket          = null;
    let pingTimer       = null;
    let reconnectDelay  = RECONNECT_BASE;
    let manualClose     = false;
    let unread          = 0;

    /* ──────────────────────────────────────────
     | Token fetcher
     * ────────────────────────────────────────*/

    const fetchWsToken = async () => {
        const res = await fetch(TOKEN_ENDPOINT, {
            method      : 'GET',
            credentials : 'same-origin',
            headers     : { 'Accept': 'application/json' },
        });

        if (res.status === 401) {
            // Session habis → redirect ke login
            window.location.href = '/login';
            throw new Error('session_expired');
        }

        if (!res.ok) {
            throw new Error('ws_token_failed_' + res.status);
        }

        const data = await res.json();

        if (!data.success || !data.token || !data.ws_url) {
            throw new Error('ws_token_invalid_response');
        }

        return data;
    };

    /* ──────────────────────────────────────────
     | UI helpers
     * ────────────────────────────────────────*/

    const renderNotification = (msg) => {
        unread++;
        $count.textContent = String(unread);

        const item = document.createElement('div');
        item.className = 'border rounded p-2 mb-2 small';
        item.innerHTML = `
            <div class="fw-medium">${escapeHtml(msg.title || 'Notification')}</div>
            <div class="text-muted">${escapeHtml(msg.message || '')}</div>
            <div class="text-muted small mt-1">${escapeHtml(msg.time || new Date().toLocaleTimeString())}</div>
        `;
        $list.prepend(item);
    };

    const escapeHtml = (s) => String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    /* ──────────────────────────────────────────
     | Heartbeat
     * ────────────────────────────────────────*/

    const startHeartbeat = () => {
        stopHeartbeat();
        pingTimer = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send('ping');
            }
        }, PING_INTERVAL);
    };

    const stopHeartbeat = () => {
        if (pingTimer) {
            clearInterval(pingTimer);
            pingTimer = null;
        }
    };

    /* ──────────────────────────────────────────
     | Connect / reconnect
     * ────────────────────────────────────────*/

    const connect = async () => {
        if (manualClose) return;

        try {
            const { token, ws_url } = await fetchWsToken();
            const url = `${ws_url}?token=${encodeURIComponent(token)}`;

            console.log('[ws] connecting...');
            socket = new WebSocket(url);

            socket.addEventListener('open', () => {
                console.log('[ws] connected');
                reconnectDelay = RECONNECT_BASE;
                startHeartbeat();
            });

            socket.addEventListener('message', (e) => {
                if (e.data === 'pong') return;

                try {
                    const payload = JSON.parse(e.data);
                    if (payload.type === 'notification') {
                        renderNotification(payload);
                    }
                    // type lain bisa di-handle di sini (detection, alert, dll)
                } catch (_) {
                    console.warn('[ws] non-JSON message:', e.data);
                }
            });

            socket.addEventListener('close', (e) => {
                stopHeartbeat();
                console.log('[ws] closed', e.code, e.reason);

                // 1008 = auth gagal (token expired/revoked). Redirect ke login.
                if (e.code === 1008) {
                    window.location.href = '/login';
                    return;
                }

                if (!manualClose) {
                    scheduleReconnect();
                }
            });

            socket.addEventListener('error', (err) => {
                console.error('[ws] error', err);
                // 'close' akan dipanggil setelahnya, biar reconnect dihandle di sana
            });

        } catch (err) {
            if (err.message === 'session_expired') return;
            console.error('[ws] connect failed:', err);
            scheduleReconnect();
        }
    };

    const scheduleReconnect = () => {
        const delay = reconnectDelay;
        reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX);
        console.log(`[ws] reconnect in ${delay}ms`);
        setTimeout(connect, delay);
    };

    /* ──────────────────────────────────────────
     | Lifecycle
     * ────────────────────────────────────────*/

    window.addEventListener('beforeunload', () => {
        manualClose = true;
        if (socket) socket.close();
    });

    // Tutup koneksi saat tab di-hide (hemat resource).
    // Re-open saat tab visible lagi.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopHeartbeat();
        } else if (socket && socket.readyState === WebSocket.OPEN) {
            startHeartbeat();
        } else {
            connect();
        }
    });

    connect();
})();