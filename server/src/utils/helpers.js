// =============================================================================
// utils/helpers.js — Pure helper functions (no side-effects)
// =============================================================================

/**
 * Ambil client IP address dari request (proxy-aware).
 * X-Forwarded-For di-split dan diambil IP pertama (client asli).
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || null;
}

/**
 * Hapus field sensitif dari object sebelum di-log ke audit_logs.
 */
export function sanitizeForAudit(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = { ...obj };
  const sensitiveKeys = [
    'password',
    'password_hash',
    'token',
    'secret',
    'authorization',
    'cookie',
  ];
  for (const key of sensitiveKeys) {
    if (clone[key] !== undefined) {
      clone[key] = '[REDACTED]';
    }
  }
  return clone;
}

