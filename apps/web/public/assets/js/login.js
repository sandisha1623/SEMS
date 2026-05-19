'use strict';

(function () {

    const form = document.getElementById('loginForm');
    const button = document.getElementById('loginBtn');
    const spinner = document.getElementById('loginSpinner');
    const alertBox = document.getElementById('alertBox');
    const btnText = document.querySelector('.btn-text');

    if (!form || !button || !spinner || !alertBox || !btnText) {
        console.error('Login form: required elements missing');
        return;
    }

    function showAlert(message, type = 'danger') {
        alertBox.className = `alert alert-${type}`;
        alertBox.innerText = message;
        alertBox.classList.remove('d-none');
    }

    function setLoading(state) {
        button.disabled = state;
        spinner.classList.toggle('d-none', !state);
        btnText.innerText = state
            ? 'Signing in...'
            : 'Login';
    }

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        alertBox.classList.add('d-none');

        setLoading(true);

        try {

            const response = await fetch('/login', {
                method: 'POST',
                body: new FormData(form),
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();

            if (! response.ok) {

                showAlert(
                    result.message || 'Login failed'
                );

                setLoading(false);

                return;
            }

            showAlert(
                'Login success, redirecting...',
                'success'
            );

            setTimeout(() => {
                window.location.href = result.redirect;
            }, 600);

        } catch (error) {

            console.error(error);

            showAlert(
                'Network error'
            );

            setLoading(false);
        }
    });

})();