// =============================================================================
// controllers/user.controller.js — Manajemen User (admin only)
//
// RBAC: Hanya admin yang bisa mengakses endpoint ini.
// Anti-IDOR: Admin tidak bisa menghapus akun dirinya sendiri.
// Semua query menggunakan Parameterized Queries ($1, $2, …).
// =============================================================================

import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { logAudit } from '../middleware/auditLogger.js';
import { getClientIp } from '../utils/helpers.js';

const SALT_ROUNDS = 10;

// =============================================================================
// GET /api/users — Daftar semua user (admin only)
// =============================================================================
export async function getAllUsers(req, res, next) {
  try {
    // JANGAN SELECT password_hash — tidak perlu dikirim ke client
    const result = await pool.query(
      `SELECT id, nama_lengkap, username, role, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// GET /api/users/:id — Detail satu user (admin only)
// Anti-IDOR: hanya admin yang dapat akses, sudah dijaga di route-level
// =============================================================================
export async function getUserById(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, nama_lengkap, username, role, created_at
       FROM users
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// PUT /api/users/:id/role — Ubah role user (admin only)
// =============================================================================
export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Anti-IDOR: admin tidak bisa menurunkan role dirinya sendiri
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Anda tidak bisa mengubah role akun sendiri.',
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET role = $1
       WHERE id = $2
       RETURNING id, nama_lengkap, username, role`,
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    await logAudit(
      req.user.id,
      'UPDATE_USER_ROLE',
      { target_id: id, new_role: role },
      getClientIp(req)
    );

    res.json({
      success: true,
      message: 'Role user berhasil diperbarui.',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// PUT /api/users/:id/password — Reset password user (admin only)
// =============================================================================
export async function resetUserPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2
       RETURNING id, username`,
      [passwordHash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    await logAudit(
      req.user.id,
      'RESET_USER_PASSWORD',
      { target_id: id, target_username: result.rows[0].username },
      getClientIp(req)
    );

    res.json({
      success: true,
      message: `Password user "${result.rows[0].username}" berhasil direset.`,
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// DELETE /api/users/:id — Hapus user (admin only)
// Anti-IDOR: admin tidak bisa menghapus dirinya sendiri
// =============================================================================
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Anda tidak bisa menghapus akun sendiri.',
      });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, username, role',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    await logAudit(
      req.user.id,
      'DELETE_USER',
      { target_id: id, target_username: result.rows[0].username },
      getClientIp(req)
    );

    res.json({
      success: true,
      message: `User "${result.rows[0].username}" berhasil dihapus.`,
    });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'User tidak bisa dihapus karena masih memiliki riwayat transaksi.',
      });
    }
    next(err);
  }
}

