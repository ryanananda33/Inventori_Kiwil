// =============================================================================
// validators/auth.validator.js — Validasi & Sanitasi input Auth
//
// Menggunakan express-validator untuk:
//   • Anti-XSS  — escape() dan trim() otomatis
//   • Anti-SQLi — Input di-sanitasi sebelum sampai ke parameterized query
//   • Password policy — minimal 8 karakter, huruf + angka
// =============================================================================

import { body, validationResult } from 'express-validator';

/**
 * Middleware: Cek hasil validasi dan kembalikan 400 jika ada error.
 * Ditempatkan SETELAH chain validasi di route.
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validasi input gagal.',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
export const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username wajib diisi.')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username harus 3–50 karakter.')
    .isAlphanumeric()
    .withMessage('Username hanya boleh huruf dan angka.')
    .escape(),

  body('password')
    .notEmpty()
    .withMessage('Password wajib diisi.')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password harus 8–128 karakter.'),
];

// ---------------------------------------------------------------------------
// Register / Create User
// ---------------------------------------------------------------------------
export const validateRegister = [
  body('nama_lengkap')
    .trim()
    .notEmpty()
    .withMessage('Nama lengkap wajib diisi.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nama lengkap harus 2–100 karakter.')
    .escape(),

  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username wajib diisi.')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username harus 3–50 karakter.')
    .isAlphanumeric()
    .withMessage('Username hanya boleh huruf dan angka.')
    .escape(),

  body('password')
    .notEmpty()
    .withMessage('Password wajib diisi.')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password minimal 8 karakter.')
    .matches(/[a-zA-Z]/)
    .withMessage('Password harus mengandung minimal satu huruf.')
    .matches(/[0-9]/)
    .withMessage('Password harus mengandung minimal satu angka.'),

  body('role')
    .optional()
    .isIn(['admin', 'kasir'])
    .withMessage('Role harus "admin" atau "kasir".'),
];

