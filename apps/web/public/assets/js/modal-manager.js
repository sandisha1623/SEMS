'use strict';

/**
 * ModalManager — engine modal reusable
 *
 * Satu modal Bootstrap 5 untuk semua form.
 * Load sekali, konten berubah sesuai kebutuhan.
 *
 * API:
 *   ModalManager.open(config)       — buka modal dengan config
 *   ModalManager.close()            — tutup modal + reset
 *   ModalManager.setLoading(bool)   — toggle loading state tombol save
 *   ModalManager.setError(msg)      — tampilkan error di atas footer
 *   ModalManager.clearError()       — sembunyikan error
 *
 * Config object:
 *   title       {string}   — judul modal
 *   content     {string}   — HTML yang dimasukkan ke modal-body
 *   size        {string}   — 'sm'|'md'|'lg'|'xl' (default: 'lg')
 *   saveLabel   {string}   — label tombol save (default: 'Simpan')
 *   saveClass   {string}   — class tombol save (default: 'btn-primary')
 *   onSave      {Function} — async fn dipanggil saat tombol save diklik
 *                            return true → modal ditutup otomatis
 *                            return false → modal tetap terbuka
 *   onClose     {Function} — fn dipanggil saat modal ditutup
 *   hideSave    {bool}     — true = sembunyikan tombol save (readonly modal)
 */
const ModalManager = (() => {

    // ── Elemen DOM ────────────────────────────────────────────────
    const elModal    = document.getElementById('modalReusable');
    const elDialog   = document.getElementById('modalReusableDialog');
    const elTitle    = document.getElementById('modalReusableTitle');
    const elBody     = document.getElementById('modalReusableBody');
    const elBtnClose = document.getElementById('modalReusableBtnClose');
    const elBtnCnl   = document.getElementById('modalReusableBtnCancel');
    const elBtnSave  = document.getElementById('modalReusableBtnSave');
    const elSpinner  = document.getElementById('modalReusableSpinner');
    const elSaveLbl  = document.getElementById('modalReusableSaveLabel');
    const elErrWrap  = document.getElementById('modalReusableErrorWrap');
    const elErrText  = document.getElementById('modalReusableErrorText');

    if (!elModal) {
        console.warn('[ModalManager] #modalReusable tidak ditemukan. Pastikan modal_reusable.php sudah di-include.');
    }

    // Bootstrap instance
    const bsModal = new bootstrap.Modal(elModal, {
        backdrop : 'static',
        keyboard : false,
    });

    // State
    let   currentConfig = null;
    let   isLoading     = false;

    // ── Ukuran dialog ─────────────────────────────────────────────
    const SIZE_CLASS = {
        sm: 'modal-sm',
        md: '',
        lg: 'modal-lg',
        xl: 'modal-xl',
    };

    // Helpers
    function blurActiveElement() {
        if (
            document.activeElement &&
            document.activeElement instanceof HTMLElement
        ) {
            document.activeElement.blur();
        }
    }

    function resetModal() {

        // Cleanup bootstrap components
        window.App?.disposeComponents?.(elModal);

        currentConfig = null;

        // Clear body
        elBody.innerHTML = '';

        // Reset error
        clearError();

        // Reset loading
        setLoading(false);

        // Restore button
        elBtnSave.style.display = '';

        // Accessibility
        document.body.focus();
    }

    function initDynamicComponents() {
        // Tooltip / popover / feather / etc
        window.App?.initComponents?.(elModal);

        // Feather icons fallback
        if (window.feather) {
            feather.replace();
        }
    }

    // ── Init event listener (sekali saja) ─────────────────────────
    elBtnClose?.addEventListener('click', () => close());
    elBtnCnl?.addEventListener('click',   () => close());

    elBtnSave?.addEventListener('click', async () => {

        if (isLoading) return;

        if (typeof currentConfig?.onSave !== 'function') {
            close();
            return;
        }

        clearError();
        setLoading(true);

        try {

            const result = await currentConfig.onSave();

            // Auto close only if explicit true
            if (result === true) {
                close();
            }

        } catch (err) {

            console.error(err);

            setError(
                err?.message ||
                'Terjadi kesalahan. Silakan coba lagi.'
            );

        } finally {

            setLoading(false);
        }
    });

    // Before hidden
    elModal.addEventListener('hide.bs.modal', () => {

        // Prevent accessibility warning
        blurActiveElement();

        // Cleanup bootstrap instances
        window.App?.disposeComponents?.(elModal);
    });

    // After hidden
    elModal.addEventListener('hidden.bs.modal', () => {

        currentConfig?.onClose?.();

        resetModal();
    });

    // ── Public API ────────────────────────────────────────────────

    function open(config = {}) {

        currentConfig = config;

        // Title
        elTitle.innerHTML = config.title || 'Modal';

        // Body
        elBody.innerHTML = config.content || '';

        // Dialog size
        const size = config.size || 'lg';

        elDialog.className =
            'modal-dialog modal-dialog-scrollable ' +
            (SIZE_CLASS[size] ?? SIZE_CLASS.lg);

        // Save button
        const saveLabel = config.saveLabel || 'Simpan';
        const saveClass = config.saveClass || 'btn-primary';

        elSaveLbl.innerHTML = saveLabel;

        elBtnSave.className = `btn ${saveClass}`;

        elBtnSave.style.display =
            config.hideSave ? 'none' : '';

        clearError();
        setLoading(false);

        // Show modal
        bsModal.show();

        // Init dynamic components
        initDynamicComponents();

        // Notify
        elModal.dispatchEvent(
            new CustomEvent('modal:opened', {
                detail: config
            })
        );
    }

    function close() {

        // Dispose tooltip/popover first
        window.App?.disposeComponents?.(elModal);

        // Remove focus first
        blurActiveElement();

        // Hide modal
        bsModal.hide();
    }

    function setLoading(on = true) {

        isLoading = on;

        elBtnSave.disabled  = on;
        elBtnClose.disabled = on;
        elBtnCnl.disabled   = on;

        elSpinner.classList.toggle('d-none', !on);

        if (on) {
            elSaveLbl.innerHTML = 'Menyimpan...';
        } else {
            elSaveLbl.innerHTML =
                currentConfig?.saveLabel || 'Simpan';
        }
    }

    function setError(message = '') {

        if (!message) {
            clearError();
            return;
        }

        elErrText.innerHTML = message;

        elErrWrap.classList.remove('d-none');
    }

    function clearError() {
        elErrText.innerHTML = '';
        elErrWrap.classList.add('d-none');
    }

    // Accessibility improvement
    document.body.setAttribute('tabindex', '-1');

    return { open, close, setLoading, setError, clearError };

})();