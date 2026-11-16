// =============================================================================
// routes/auth.routes.js
//
// POST /api/auth/login    — Rate-limited (anti brute-force)
// POST /api/auth/logout   — Hapus HTTP-Only Cookie
// GET  /api/auth/me       — Profil user aktif
// POST /api/auth/register — Hanya admin yang bisa (tambah user baru)
// =============================================================================

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { login, logout, getMe, register } from '../controllers/auth.controller.js';
import { verifyToken, authorizeRole } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditLogger.js';
import {
  validateLogin,
  validateRegister,
  handleValidationErrors,
} from '../validators/auth.validator.js';

const router = Router();

// ---------------------------------------------------------------------------
// Rate Limiter KHUSUS endpoint login
// Di production: Maks 5 percobaan gagal per 15 menit per IP (anti brute-force)
// Di development: Lebih longgar agar tidak memblokir testing
// ---------------------------------------------------------------------------
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      'Terlalu banyak percobaan login gagal. Silakan coba lagi dalam 15 menit.',
  },
});

// POST /api/auth/login
router.post(
  '/login',
  loginRateLimiter,
  validateLogin,
  handleValidationErrors,
  login
);

// POST /api/auth/logout
router.post('/logout', verifyToken, auditMiddleware('LOGOUT'), logout);

// GET /api/auth/me
router.get('/me', verifyToken, getMe);

// POST /api/auth/register — admin only
router.post(
  '/register',
  verifyToken,
  authorizeRole(['admin']),
  validateRegister,
  handleValidationErrors,
  auditMiddleware('CREATE_USER'),
  register
);

export default router;
