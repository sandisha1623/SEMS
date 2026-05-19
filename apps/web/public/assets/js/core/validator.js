'use strict';

const Validator = (function () {

    function showError(field, message) {
        const input = document.querySelector(`[name="${field}"]`);
        const error = document.querySelector(`[data-error="${field}"]`);

        if (input) input.classList.add('field--error');
        if (error) error.textContent = message;
    }

    function clearError(field) {
        const input = document.querySelector(`[name="${field}"]`);
        const error = document.querySelector(`[data-error="${field}"]`);

        if (input) input.classList.remove('field--error');
        if (error) error.textContent = '';
    }

    function clearAll(form) {
        const fields = form.querySelectorAll('[name]');
        fields.forEach(f => clearError(f.name));
    }

    function validate(rules, form) {
        let valid = true;

        clearAll(form);

        for (const field in rules) {
            const input = form[field];
            if (!input) continue;

            const value = input.value.trim();
            const fieldRules = rules[field];

            for (const rule of fieldRules) {
                if (rule.type === 'required' && !value) {
                    showError(field, rule.message);
                    valid = false;
                    break;
                }

                if (rule.type === 'min' && value.length < rule.value) {
                    showError(field, rule.message);
                    valid = false;
                    break;
                }
            }
        }

        return valid;
    }

    function bindRealtime(form) {
        form.querySelectorAll('[name]').forEach(input => {
            input.addEventListener('input', () => clearError(input.name));
        });
    }

    return {
        validate,
        showError,
        clearError,
        bindRealtime
    };

})();