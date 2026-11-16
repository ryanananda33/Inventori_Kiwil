// =============================================================================
// middleware/auth.js — JWT Verification & Role-Based Access Control (RBAC)
//
// Token JWT dibaca dari HTTP-Only Cookie (bukan Authorization header)
// untuk mencegah serangan XSS mengakses token.
// =============================================================================

import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// 1. verifyToken — Verifikasi JWT dari cookie `token`
// ---------------------------------------------------------------------------
export function verifyToken(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Silakan login terlebih dahulu.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id, username, role, iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
    // Hapus cookie yang invalid/expired
    res.clearCookie('token');

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesi telah berakhir. Silakan login kembali.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token tidak valid.',
    });
  }
}

// ---------------------------------------------------------------------------
// 2. authorizeRole — Otorisasi berdasarkan role (RBAC)
//
//    Penggunaan: authorizeRole(['admin'])
//               authorizeRole(['admin', 'kasir'])
// ---------------------------------------------------------------------------
export function authorizeRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Tidak terautentikasi.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — Anda tidak memiliki izin untuk mengakses resource ini.',
      });
    }

    next();
  };
}

