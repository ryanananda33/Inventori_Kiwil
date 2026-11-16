// =============================================================================
// controllers/auth.controller.js
//
// Endpoint:
//   POST /api/auth/login   — Login, set JWT di HTTP-Only Cookie
//   POST /api/auth/logout  — Hapus cookie token
//   GET  /api/auth/me      — Profil user yang sedang login
//
// Keamanan:
//   • Password di-hash dengan bcrypt (min 10 salt rounds)
//   • JWT disimpan di HTTP-Only Cookie (anti-XSS)
//   • Cookie flags: HttpOnly, Secure (prod), SameSite=Strict
//   • Generic error message saat login gagal (anti username enumeration)
//   • Semua query menggunakan Parameterized Queries (anti-SQLi)
// =============================================================================

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { logAudit } from '../middleware/auditLogger.js';
import { getClientIp } from '../utils/helpers.js';

// Konfigurasi cookie untuk JWT
const COOKIE_OPTIONS = {
  httpOnly: true, // JavaScript di browser TIDAK bisa baca cookie ini
  secure: process.env.NODE_ENV === 'production', // HTTPS-only di production
  sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'lax', // Lax di dev agar support cross-port localhost
  maxAge: 8 * 60 * 60 * 1000, // 8 jam (ms)
  path: '/',
};

const SALT_ROUNDS = 10; // Minimal 10 sesuai requirement

// =============================================================================
// POST /api/auth/register — Buat user baru (hanya admin yang bisa akses)
// =============================================================================
export async function register(req, res, next) {
  try {
    const { nama_lengkap, username, password, role } = req.body;

    // 1. Cek apakah username sudah ada (parameterized query)
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username sudah digunakan.',
      });
    }

    // 2. Hash password dengan bcrypt (min 10 rounds)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Insert user baru (parameterized query)
    const result = await pool.query(
      `INSERT INTO users (nama_lengkap, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nama_lengkap, username, role, created_at`,
      [nama_lengkap, username, passwordHash, role || 'kasir']
    );

    const newUser = result.rows[0];

    // 4. Audit log
    await logAudit(
      req.user.id, // Admin yang membuat
      'CREATE_USER',
      { target_user: newUser.username, role: newUser.role },
      getClientIp(req)
    );

    res.status(201).json({
      success: true,
      message: 'User berhasil dibuat.',
      data: newUser,
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// POST /api/auth/login
// =============================================================================
export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const clientIp = getClientIp(req);

    // 1. Cari user by username (parameterized query)
    const result = await pool.query(
      'SELECT id, nama_lengkap, username, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];

    // 2. Jika user tidak ditemukan — JANGAN beri tahu field mana yang salah
    //    (mencegah username enumeration attack)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.',
      });
    }

    // 3. Verifikasi password terhadap hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Log percobaan login gagal
      await logAudit(user.id, 'LOGIN_FAILED', { username }, clientIp);

      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.',
      });
    }

    // 4. Buat JWT token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '8h',
      algorithm: 'HS256',
    });

    // 5. Set token di HTTP-Only Cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    // 6. Audit log
    await logAudit(user.id, 'LOGIN_SUCCESS', { username }, clientIp);

    res.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        user: {
          id: user.id,
          nama_lengkap: user.nama_lengkap,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// POST /api/auth/logout — Hapus cookie token
// =============================================================================
export async function logout(req, res, next) {
  try {
    const clientIp = getClientIp(req);

    // Log jika user terautentikasi
    if (req.user) {
      await logAudit(req.user.id, 'LOGOUT', {}, clientIp);
    }

    // Hapus cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'lax',
      path: '/',
    });

    res.json({
      success: true,
      message: 'Logout berhasil.',
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// GET /api/auth/me — Profil user yang sedang login
// =============================================================================
export async function getMe(req, res, next) {
  try {
    // req.user.id sudah terverifikasi oleh middleware verifyToken
    const result = await pool.query(
      'SELECT id, nama_lengkap, username, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

