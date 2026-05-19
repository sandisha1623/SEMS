(function () {

  const API = {
    status      : window.PROFIL_CONFIG.api.telegramStatus,
    generateLink: window.PROFIL_CONFIG.api.telegramGenerate,
    disconnect  : window.PROFIL_CONFIG.api.telegramDisconnect,
  };

  let elNotConnected = null;
  let elLinkWrapper  = null;
  let elConnected    = null;
  let pollingTimer   = null;

  // =========================================================
  // INIT — tunggu DOM ready
  // =========================================================
  function init() {
    elNotConnected = document.getElementById('tgNotConnected');
    elLinkWrapper  = document.getElementById('tgLinkWrapper');
    elConnected    = document.getElementById('tgConnected');

    document.getElementById('btnGenerateTgLink')
      ?.addEventListener('click', generateLink);
    document.getElementById('btnRefreshTgLink')
      ?.addEventListener('click', generateLink);
    document.getElementById('btnDisconnectTg')
      ?.addEventListener('click', disconnect);

    checkStatus();
  }

  // =========================================================
  // CEK STATUS
  // =========================================================
  async function checkStatus() {
    try {
      const res = await Api.get(API.status);
      if (!res.ok) return;

      const { is_connected } = res.data.data;
      setView(is_connected ? 'connected' : 'not_connected');

    } catch (err) {
      console.error('checkStatus error:', err);
    }
  }

  // =========================================================
  // GENERATE QR
  // =========================================================
  async function generateLink() {
    const btn = document.getElementById('btnGenerateTgLink');

    try {
      if (btn) btn.disabled = true;

      const res = await Api.post(API.generateLink, {});
      if (!res.ok) throw new Error(res.data?.message || 'Gagal generate QR');

      const { qr_url } = res.data.data; // ← hanya qr_url, tidak ada tgLink

      const qrEl = document.getElementById('tgQrCode');
      if (qrEl) qrEl.src = qr_url;

      setView('link');
      startPolling();

    } catch (err) {
      console.error('generateLink error:', err);
      Toast.error(err.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // =========================================================
  // POLLING
  // =========================================================
  function startPolling() {
    clearInterval(pollingTimer);
    pollingTimer = setInterval(async () => {
      try {
        const res = await Api.get(API.status);
        if (res.ok && res.data.data.is_connected) {
          clearInterval(pollingTimer);
          setView('connected');
          Toast.success('Telegram berhasil terhubung! 🎉');
        }
      } catch (err) {
        console.error('polling error:', err);
      }
    }, 3000);
  }

  // =========================================================
  // DISCONNECT
  // =========================================================
  async function disconnect() {
    if (!confirm('Putuskan koneksi Telegram?')) return;

    try {
      const res = await Api.delete(API.disconnect);
      if (!res.ok) throw new Error(res.data?.message || 'Gagal memutuskan');

      clearInterval(pollingTimer);
      setView('not_connected');
      Toast.success('Telegram berhasil diputuskan');

    } catch (err) {
      Toast.error(err.message);
    }
  }

  // =========================================================
  // SET VIEW
  // =========================================================
  function setView(state) {
    if (!elNotConnected || !elLinkWrapper || !elConnected) return;

    elNotConnected.classList.add('d-none');
    elLinkWrapper.classList.add('d-none');
    elConnected.classList.add('d-none');

    if (state === 'not_connected') elNotConnected.classList.remove('d-none');
    if (state === 'link')          elLinkWrapper.classList.remove('d-none');
    if (state === 'connected')     elConnected.classList.remove('d-none');
  }

  // =========================================================
  // START
  // =========================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init(); // DOM sudah ready (script dipasang di bawah body)
  }

})();