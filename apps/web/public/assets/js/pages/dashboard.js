'use strict';

let notifCount = 0;

let ws = null;


// ─────────────────────────────
// INIT TOKEN
// ─────────────────────────────
async function initToken()
{
    let token = localStorage.getItem(
        'access_token'
    );

    console.log('TOKEN:', token);

    if (! token) {

        const response = await fetch(
            '/auth/token'
        );

        const result = await response.json();

        console.log(result);

        token = result.token;

        localStorage.setItem(
            'access_token',
            token
        );
    }

    console.log('TOKEN AFTER:', token);

    connectWebSocket(token);
}


// ─────────────────────────────
// CONNECT WEBSOCKET
// ─────────────────────────────
function connectWebSocket(token)
{
    ws = new WebSocket(
        `wss://realtime.sems.test/ws?token=${token}`
    );

    ws.onopen = () => {

        console.log('WS CONNECTED');
    };

    ws.onmessage = (event) => {

        console.log('RAW EVENT:', event.data);

        // 🔥 heartbeat plain text
        if (event.data === 'pong') {
            return;
        }

        const data = JSON.parse(event.data);

        console.log(
            'REALTIME EVENT:',
            data
        );

        // 🔥 notification
        if (data.type === 'notification') {

            notifCount++;

            document.getElementById(
                'notif-count'
            ).innerText = notifCount;

            showToast(
                data.title,
                data.message
            );
        }
    };

    ws.onclose = () => {

        console.log('WS CLOSED');
    };

    ws.onerror = (error) => {

        console.error(error);
    };


    // ─────────────────────────────
    // HEARTBEAT
    // ─────────────────────────────
    setInterval(() => {

        if (ws.readyState === WebSocket.OPEN) {

            ws.send('ping');
        }

    }, 10000);
}


// ─────────────────────────────
// TOAST
// ─────────────────────────────
function showToast(title, message)
{
    alert(`${title}\n${message}`);
}


// ─────────────────────────────
// START
// ─────────────────────────────
initToken();