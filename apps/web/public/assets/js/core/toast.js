'use strict';

const Toast = (function () {

    function createContainer() {
        let container = document.getElementById('toast-container');

        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        return container;
    }

    function show(message, type = 'info', duration = 3000) {
        const container = createContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message || 'Terjadi kesalahan';

        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // 🔥 HANDLE RESPONSE API
    function fromResponse(res, successMsg = 'Berhasil', errorMsg = 'Terjadi kesalahan') {
        if (!res) {
            show(errorMsg, 'error');
            return;
        }

        const message =
            res.data?.message ||
            res.message ||
            errorMsg;

        if (res.ok) {
            show(message || successMsg, 'success');
        } else {
            show(message || errorMsg, 'error');
        }
    }

    return {
        success: msg => show(msg, 'success'),
        error: msg => show(msg, 'error'),
        warning: msg => show(msg, 'warning'),
        info: msg => show(msg, 'info'),

        // 🔥 reusable
        fromResponse
    };

})();