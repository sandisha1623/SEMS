/**
 * assets/js/pages/profil.js
 *
 * Halaman Profil Warga
 */

'use strict';

/* ════════════════════════════════════════════════════════
   Config
════════════════════════════════════════════════════════ */
const {
  api: API_ENDPOINT,
  user: USER
} = window.PROFIL_CONFIG;

/* ════════════════════════════════════════════════════════
   Cached DOM
════════════════════════════════════════════════════════ */
const DOM = {
  skelProfil       : document.getElementById('skelProfil'),
  profilContent    : document.getElementById('profilContent'),
  profilError      : document.getElementById('profilError'),
  profilErrorMsg   : document.getElementById('profilErrorMsg'),

  avatarInitial    : document.getElementById('avatarInitial'),
  profilBadges     : document.getElementById('profilBadges'),

  akunRoleBadge    : document.getElementById('akunRoleBadge'),
  akunStatus       : document.getElementById('akunStatus'),

  nikDisplay       : document.getElementById('nikDisplay'),
  btnToggleNik     : document.getElementById('btnToggleNik'),

  noKkDisplay      : document.getElementById('noKkDisplay'),
  btnToggleNoKk    : document.getElementById('btnToggleNoKk'),

  listAnggota      : document.getElementById('listAnggota'),
  emptyAnggota     : document.getElementById('emptyAnggota'),
  badgeAnggota     : document.getElementById('badgeAnggota'),

  pwdLama          : document.getElementById('pwdLama'),
  pwdBaru          : document.getElementById('pwdBaru'),
  pwdKonfirm       : document.getElementById('pwdKonfirm'),

  pwdAlert         : document.getElementById('pwdAlert'),
  pwdMatchMsg      : document.getElementById('pwdMatchMsg'),
  strengthLabel    : document.getElementById('strengthLabel'),

  btnSimpanPwd     : document.getElementById('btnSimpanPwd'),
  btnPwdText       : document.getElementById('btnPwdText'),
  btnPwdSpin       : document.getElementById('btnPwdSpin'),

  modalUbahPassword: document.getElementById('modalUbahPassword'),
};

/* ════════════════════════════════════════════════════════
   Badge Constants
════════════════════════════════════════════════════════ */
const ROLE_BADGE = {
  administrator : '<span class="badge bg-danger-subtle text-danger-emphasis rounded-2 p-2 fs-12">Administrator</span>',
  rw            : '<span class="badge bg-warning-subtle text-warning-emphasis rounded-2 p-2 fs-12">RW</span>',
  rt            : '<span class="badge bg-info-subtle text-info-emphasis rounded-2 p-2 fs-12">RT</span>',
  warga         : '<span class="badge bg-secondary-subtle text-secondary-emphasis rounded-2 p-2 fs-12">Warga</span>',
};

const STATUS_HIDUP_BADGE = {
  hidup     : '<span class="badge bg-success-subtle text-success-emphasis rounded-2 p-2 fs-12">Hidup</span>',
  meninggal : '<span class="badge bg-danger-subtle text-danger-emphasis rounded-2 p-2 fs-12">Meninggal</span>',
  pindah    : '<span class="badge bg-secondary-subtle text-secondary-emphasis rounded-2 p-2 fs-12">Pindah</span>',
};

const STATUS_DOMISILI_BADGE = {
  tetap     : '<span class="badge bg-success-subtle text-success-emphasis rounded-2 p-2 fs-12">Tetap</span>',
  sementara : '<span class="badge bg-warning-subtle text-warning-emphasis rounded-2 p-2 fs-12">Sementara</span>',
  pendatang : '<span class="badge bg-info-subtle text-info-emphasis rounded-2 p-2 fs-12">Pendatang</span>',
};

/* ════════════════════════════════════════════════════════
   Utils
════════════════════════════════════════════════════════ */
function ucFirst(str) {
  return str
    ? str.charAt(0).toUpperCase() + str.slice(1)
    : '—';
}

function humanize(str) {
  if (!str) return '—';

  return String(str)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function maskNum(v) {
  if (!v) return '—';

  const s = String(v);

  return s.length > 8
    ? s.slice(0, 4) + '•'.repeat(s.length - 8) + s.slice(-4)
    : s;
}

function formatTgl(iso) {
  if (!iso) return '—';

  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day   : '2-digit',
      month : 'long',
      year  : 'numeric',
    });
  } catch {
    return iso;
  }
}

function hitungUmur(iso) {
  if (!iso) return '';

  try {
    return Math.floor(
      (Date.now() - new Date(iso).getTime())
      / (365.25 * 24 * 3600 * 1000)
    ) + ' tahun';
  } catch {
    return '';
  }
}

function formatRtRw(rt, rw) {
  return `${rt ? 'RT ' + rt : '—'} / ${rw ? 'RW ' + rw : '—'}`;
}

function setText(id, value = '—') {
  const el = document.getElementById(id);

  if (el) {
    el.textContent = value ?? '—';
  }
}

function setHtml(id, html = '') {
  const el = document.getElementById(id);

  if (el) {
    el.innerHTML = html;
  }
}

function setLink(id, href, text) {
  const el = document.getElementById(id);

  if (!el) return;

  const a = document.createElement('a');

  a.href = href;
  a.textContent = text;

  el.innerHTML = '';
  el.appendChild(a);
}

function showError(msg) {
  DOM.skelProfil?.classList.add('d-none');
  DOM.profilError?.classList.remove('d-none');

  if (DOM.profilErrorMsg) {
    DOM.profilErrorMsg.textContent = msg;
  }
}

/* ════════════════════════════════════════════════════════
   Load Profil
════════════════════════════════════════════════════════ */
async function loadProfil() {
  try {
    const res = await Api.get('/warga/profil');

    if (!res.ok) {
      showError(res.data?.message ?? 'Gagal memuat data profil.');
      return;
    }

    renderProfil(res.data?.data ?? {});

    DOM.skelProfil?.classList.add('d-none');
    DOM.profilContent?.classList.remove('d-none');

  } catch (err) {
    console.error(err);
    showError('Terjadi kesalahan jaringan.');
  }
}

/* ════════════════════════════════════════════════════════
   Render Profil
════════════════════════════════════════════════════════ */
function renderProfil(w) {
  const kk = w.kartu_keluarga ?? {};

  /* ─────────────────────────────
     Avatar
  ───────────────────────────── */
  const initials = (w.nama_lengkap ?? '')
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  if (DOM.avatarInitial) {
    DOM.avatarInitial.textContent = initials;
  }

  /* ─────────────────────────────
     Hero
  ───────────────────────────── */
  setText('profilNama', w.nama_lengkap);
  setText('profilHubKK', humanize(w.status_keluarga));

  setHtml(
    'profilBadges',
    [
      STATUS_HIDUP_BADGE[w.status_hidup] ?? '',
      STATUS_DOMISILI_BADGE[w.status_domisili] ?? '',
    ].join('')
  );

  /* ─────────────────────────────
     Akun
  ───────────────────────────── */
  setText('akunUsername', USER.username);

  setHtml(
    'akunRoleBadge',
    ROLE_BADGE[USER.role] ?? USER.role
  );

  setHtml(
    'akunStatus',
    (w.is_active ?? 1)
      ? '<span class="badge bg-success-subtle text-success-emphasis rounded-2 p-2 fs-12">Aktif</span>'
      : '<span class="badge bg-danger-subtle text-danger-emphasis rounded-2 p-2 fs-12">Nonaktif</span>'
  );

  /* ─────────────────────────────
     NIK
  ───────────────────────────── */
  const nik = w.nik ?? '';

  if (DOM.nikDisplay) {
    DOM.nikDisplay.textContent = maskNum(nik);
  }

  if (DOM.btnToggleNik) {
    DOM.btnToggleNik.dataset.full   = nik;
    DOM.btnToggleNik.dataset.masked = maskNum(nik);
  }

  /* ─────────────────────────────
     Biodata
  ───────────────────────────── */
  setText('dNama', w.nama_lengkap);

  setText(
    'dTTL',
    `${w.tempat_lahir ?? '—'}, ${formatTgl(w.tanggal_lahir)}`
    + (w.tanggal_lahir
      ? ` (${hitungUmur(w.tanggal_lahir)})`
      : '')
  );

  setText('dJK', humanize(w.jenis_kelamin));
  setText('dAgama', humanize(w.agama));
  setText('dStatusKawin', humanize(w.status_perkawinan));
  setText('dPendidikan', (w.pendidikan ?? '—').toUpperCase());
  setText('dPekerjaan', humanize(w.pekerjaan));

  if (w.telp) {
    setLink('dTelp', `tel:${w.telp}`, w.telp);
  } else {
    setText('dTelp', '—');
  }

  /* ─────────────────────────────
     KK
  ───────────────────────────── */
  const noKk = kk.no_kk ?? '';

  if (DOM.noKkDisplay) {
    DOM.noKkDisplay.textContent = maskNum(noKk);
  }

  if (DOM.btnToggleNoKk) {
    DOM.btnToggleNoKk.dataset.full   = noKk;
    DOM.btnToggleNoKk.dataset.masked = maskNum(noKk);
  }

  setText('kkKepala', kk.kepala_keluarga);
  setText('dStatusKel', humanize(w.status_keluarga));
  setText('kkRtRw', formatRtRw(kk.rt_display, kk.rw_display));
  setText('kkAlamat', kk.alamat);

  renderAnggotaKeluarga(kk.anggota ?? []);

  /* ─────────────────────────────
     Alamat
  ───────────────────────────── */
  setText('aAlamatKK', kk.alamat);
  setText('aAlamatSekarang', kk.alamat_sekarang ?? kk.alamat);
  setText('aRtRw', formatRtRw(kk.rt_display, kk.rw_display));
  setText('aCluster', kk.cluster);

  setHtml(
    'aStatusDomisili',
    STATUS_DOMISILI_BADGE[w.status_domisili] ?? '—'
  );
}

/* ════════════════════════════════════════════════════════
   Render Anggota
════════════════════════════════════════════════════════ */
function renderAnggotaKeluarga(anggota = []) {
  if (!DOM.listAnggota) return;

  DOM.badgeAnggota.textContent = anggota.length;

  if (anggota.length === 0) {
    DOM.emptyAnggota.style.display = '';
    DOM.listAnggota.innerHTML = '';
    return;
  }

  DOM.emptyAnggota.style.display = 'none';

  const fragment = document.createDocumentFragment();

  anggota.forEach(a => {
    const initials = (a.nama_lengkap ?? '')
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase() || '?';

    const item = document.createElement('div');

    item.className = 'px-4 py-3 border-bottom d-flex align-items-center gap-3';

    item.innerHTML = `
      <div style="
        width:36px;
        height:36px;
        border-radius:50%;
        background:var(--bs-primary-bg-subtle);
        color:var(--bs-primary);
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:.75rem;
        font-weight:700;
        flex-shrink:0
      ">
        ${initials}
      </div>

      <div>
        <p class="mb-0 small fw-medium">
          ${a.nama_lengkap ?? '—'}
        </p>

        <p class="mb-0 text-muted" style="font-size:.72rem">
          ${humanize(a.status_keluarga)}
        </p>
      </div>
    `;

    fragment.appendChild(item);
  });

  DOM.listAnggota.innerHTML = '';
  DOM.listAnggota.appendChild(fragment);
}

/* ════════════════════════════════════════════════════════
   Toggle Sensitive Data
════════════════════════════════════════════════════════ */
function initToggle(btnId, displayId) {
  const btn = document.getElementById(btnId);
  const display = document.getElementById(displayId);

  if (!btn || !display) return;

  let visible = false;

  btn.addEventListener('click', () => {
    visible = !visible;

    display.textContent = visible
      ? btn.dataset.full
      : btn.dataset.masked;

    btn.innerHTML = visible
      ? '<i class="bx bx-hide small"></i>'
      : '<i class="bx bx-show small"></i>';
  });
}

initToggle('btnToggleNik', 'nikDisplay');
initToggle('btnToggleNoKk', 'noKkDisplay');

/* ════════════════════════════════════════════════════════
   Toggle Password Visibility
════════════════════════════════════════════════════════ */
document.querySelectorAll('.toggle-pwd').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);

    if (!input) return;

    const show = input.type === 'password';

    input.type = show ? 'text' : 'password';

    btn.innerHTML = show
      ? '<i class="bx bx-hide"></i>'
      : '<i class="bx bx-show"></i>';
  });
});

/* ════════════════════════════════════════════════════════
   Password Strength
════════════════════════════════════════════════════════ */
(function () {
  const bars = [1, 2, 3, 4].map(i => document.getElementById('sb' + i));

  const colors = [
    '',
    '#dc3545',
    '#fd7e14',
    '#0d6efd',
    '#198754',
  ];

  const labels = [
    '',
    'Sangat lemah',
    'Lemah',
    'Cukup kuat',
    'Kuat',
  ];

  function score(pwd) {
    let s = 0;

    if (pwd.length >= 8) s++;
    if (pwd.length >= 12) s++;

    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
    if (/\d/.test(pwd)) s++;

    if (/[^A-Za-z0-9]/.test(pwd)) {
      s = Math.min(4, s + 1);
    }

    return Math.min(4, s);
  }

  DOM.pwdBaru?.addEventListener('input', () => {
    const value = DOM.pwdBaru.value;

    const s = value ? score(value) : 0;

    bars.forEach((b, i) => {
      b.style.background = i < s
        ? colors[s]
        : 'var(--bs-border-color)';
    });

    DOM.strengthLabel.textContent = value
      ? labels[s]
      : '';

    DOM.strengthLabel.style.color = colors[s] || '';
  });
})();

/* ════════════════════════════════════════════════════════
   Password Match
════════════════════════════════════════════════════════ */
['pwdBaru', 'pwdKonfirm'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    const baru = DOM.pwdBaru.value;
    const konfirm = DOM.pwdKonfirm.value;

    if (!konfirm) {
      DOM.pwdMatchMsg.textContent = '';
      return;
    }

    const match = baru === konfirm;

    DOM.pwdMatchMsg.textContent = match
      ? '✓ Password cocok'
      : '✗ Password tidak cocok';

    DOM.pwdMatchMsg.style.color = match
      ? 'var(--bs-success)'
      : 'var(--bs-danger)';
  });
});

/* ════════════════════════════════════════════════════════
   Submit Password
════════════════════════════════════════════════════════ */
DOM.btnSimpanPwd?.addEventListener('click', async () => {

  const setAlert = (msg, type) => {
    DOM.pwdAlert.className = `alert alert-${type}`;
    DOM.pwdAlert.textContent = msg;
    DOM.pwdAlert.classList.remove('d-none');
  };

  DOM.pwdAlert.classList.add('d-none');

  const lama = DOM.pwdLama.value.trim();
  const baru = DOM.pwdBaru.value;
  const konfirm = DOM.pwdKonfirm.value;

  if (!lama) {
    return setAlert('Password lama wajib diisi.', 'warning');
  }

  if (baru.length < 8) {
    return setAlert('Password baru minimal 8 karakter.', 'warning');
  }

  if (baru !== konfirm) {
    return setAlert('Konfirmasi password tidak cocok.', 'warning');
  }

  DOM.btnPwdText.classList.add('d-none');
  DOM.btnPwdSpin.classList.remove('d-none');
  DOM.btnSimpanPwd.disabled = true;

  try {

    const res = await Api.post(API_ENDPOINT.changePassword, {
      password_lama       : lama,
      password_baru       : baru,
      password_konfirmasi : konfirm,
    });

    if (res.ok) {

      bootstrap.Modal
        .getInstance(DOM.modalUbahPassword)
        ?.hide();

      [DOM.pwdLama, DOM.pwdBaru, DOM.pwdKonfirm]
        .forEach(el => {
          el.value = '';
          el.type = 'password';
        });

      DOM.strengthLabel.textContent = '';
      DOM.pwdMatchMsg.textContent = '';

      [1, 2, 3, 4].forEach(i => {
        document.getElementById('sb' + i)
          .style.background = 'var(--bs-border-color)';
      });

      if (typeof Toast !== 'undefined') {
        Toast.success('Password berhasil diubah.');
      }

    } else {
      setAlert(
        res.data?.message ?? 'Gagal mengubah password.',
        'danger'
      );
    }

  } catch (err) {
    console.error(err);
    setAlert('Terjadi kesalahan jaringan.', 'danger');

  } finally {
    DOM.btnPwdText.classList.remove('d-none');
    DOM.btnPwdSpin.classList.add('d-none');
    DOM.btnSimpanPwd.disabled = false;
  }
});

/* ════════════════════════════════════════════════════════
   Modal Reset
════════════════════════════════════════════════════════ */
DOM.modalUbahPassword?.addEventListener('show.bs.modal', () => {
  DOM.pwdAlert.classList.add('d-none');
});

/* ════════════════════════════════════════════════════════
   Init
════════════════════════════════════════════════════════ */
loadProfil();