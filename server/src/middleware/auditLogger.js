// =============================================================================
// middleware/auditLogger.js — Mencatat aksi ke tabel audit_logs
//
// Setiap aksi penting (login, CRUD, transaksi) dicatat untuk:
//   • Forensik & investigasi insiden keamanan
//   • Compliance & non-repudiation
//   • Monitoring aktivitas mencurigakan
// =============================================================================

import pool from '../config/database.js';
import { getClientIp, sanitizeForAudit } from '../utils/helpers.js';

/**
 * Tulis satu record ke audit_logs.
 * Parameterized query — aman dari SQL injection.
 *
 * @param {string|null} userId  UUID user (null jika belum login)
 * @param {string}      aksi   Nama aksi (LOGIN_SUCCESS, CREATE_ITEM, …)
 * @param {object}      detail Informasi tambahan (disimpan sebagai JSONB)
 * @param {string|null} ip     IP address klien
 */
export async function logAudit(userId, aksi, detail = {}, ip = null) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, aksi, detail, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [userId, aksi, JSON.stringify(sanitizeForAudit(detail)), ip]
    );
  } catch (err) {
    // Audit log TIDAK BOLEH menggagalkan request utama.
    // Kegagalan hanya di-log ke console.
    console.error('[AUDIT_ERROR]', err.message);
  }
}

/**
 * Express middleware factory — otomatis log aksi setelah response selesai.
 *
 * Penggunaan di route: auditMiddleware('CREATE_ITEM')
 */
export function auditMiddleware(aksi) {
  return (req, res, next) => {
    res.on('finish', () => {
      // Hanya catat jika user terautentikasi DAN request berhasil (2xx)
      if (req.user && res.statusCode >= 200 && res.statusCode < 400) {
        logAudit(
          req.user.id,
          aksi,
          {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            body: sanitizeForAudit(req.body),
          },
          getClientIp(req)
        );
      }
    });
    next();
  };
}

