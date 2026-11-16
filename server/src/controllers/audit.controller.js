// =============================================================================
// controllers/audit.controller.js — Melihat Audit Logs (admin only)
//
// Audit log adalah fitur keamanan utama (non-repudiation & forensik).
// Semua query menggunakan Parameterized Queries ($1, $2, …).
// =============================================================================

import pool from '../config/database.js';

// =============================================================================
// GET /api/audit-logs — Daftar audit log dengan filter & pagination
// =============================================================================
export async function getAuditLogs(req, res, next) {
  try {
    const {
      user_id,
      aksi,
      start_date,
      end_date,
      page = 1,
      limit = 50,
    } = req.query;

    const conditions = [];
    const params = [];
    let idx = 0;

    if (user_id) {
      idx++;
      conditions.push(`a.user_id = $${idx}`);
      params.push(user_id);
    }

    if (aksi) {
      idx++;
      conditions.push(`a.aksi = $${idx}`);
      params.push(aksi);
    }

    if (start_date) {
      idx++;
      conditions.push(`a.created_at >= $${idx}`);
      params.push(start_date);
    }

    if (end_date) {
      idx++;
      conditions.push(`a.created_at <= $${idx}::date + INTERVAL '1 day'`);
      params.push(end_date);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Hitung total rows untuk pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM audit_logs a ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    idx++;
    params.push(limitNum);
    idx++;
    params.push(offset);

    const result = await pool.query(
      `SELECT a.id, a.user_id, a.aksi, a.detail, a.ip_address, a.created_at,
              u.nama_lengkap, u.username
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${idx - 1} OFFSET $${idx}`,
      params
    );

    res.json({
      success: true,
      count: result.rows.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

