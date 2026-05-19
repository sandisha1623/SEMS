'use strict';

/**
 * Helper handle response dari Api wrapper
 */
function handle(res) {
  if (!res.ok) {
    throw new Error(res.data?.message || 'Request gagal');
  }

  const payload = res.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  return payload;
}

// ─────────────────────────────────────────
// MASTER IURAN
// ─────────────────────────────────────────

export async function getMasterIuran(API) {
  return handle(await Api.get(API.masterIuran));
}

export async function createMasterIuran(API, payload) {
  return handle(await Api.post(API.masterIuran, payload));
}

// ─────────────────────────────────────────
// PEMBAYARAN
// ─────────────────────────────────────────

export async function bayarIuran(API, payload) {
  return handle(await Api.post(API.bayar, payload));
}

export async function inputManual(API, payload) {
  
  return handle(await Api.post(API.inputManual, payload));
}

export async function hapusBayar(API, uuid) {
  return handle(await Api.delete(`${API.hapusBayar}/${uuid}`));
}

// ─────────────────────────────────────────
// REKAP
// ─────────────────────────────────────────

export async function getRekap(API, params = '') {
  return handle(await Api.get(`${API.rekapMatriks}?${params}`));
}

// ─────────────────────────────────────────
// KK LIST
// ─────────────────────────────────────────

export async function getKKList(API) {
  return handle(await Api.get(API.kkList));
}