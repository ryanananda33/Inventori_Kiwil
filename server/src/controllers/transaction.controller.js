// =============================================================================
// controllers/transaction.controller.js — Barang Masuk & Keluar
//
// RBAC:
//   • admin & kasir → create transaction (MASUK/KELUAR) dan melihat daftar
//
// Insert ke tabel transactions akan memicu trigger PostgreSQL
// fn_update_stok_on_transaction() yang:
//   - MASUK  → stok_saat_ini += jumlah
//   - KELUAR → stok_saat_ini -= jumlah (ditolak jika stok < jumlah)
//
// Semua query menggunakan Parameterized Queries ($1, $2, …).
// =============================================================================

import pool from '../config/database.js';
import { logAudit } from '../middleware/auditLogger.js';
import { getClientIp } from '../utils/helpers.js';

// =============================================================================
// GET /api/transactions — Riwayat transaksi (filter & pagination)
// =============================================================================
export async function getAllTransactions(req, res, next) {
  try {
    const {
      tipe,
      item_id,
      start_date,
      end_date,
      page = 1,
      limit = 50,
    } = req.query;

    // Dynamic WHERE builder — parameterized
    const conditions = [];
    const params = [];
    let idx = 0;

    if (tipe) {
      idx++;
      conditions.push(`t.tipe_transaksi = $${idx}`);
      params.push(tipe);
    }

    if (item_id) {
      idx++;
      conditions.push(`t.item_id = $${idx}`);
      params.push(item_id);
    }

    if (start_date) {
      idx++;
      conditions.push(`t.tanggal_transaksi >= $${idx}`);
      params.push(start_date);
    }

    if (end_date) {
      idx++;
      conditions.push(`t.tanggal_transaksi <= $${idx}::date + INTERVAL '1 day'`);
      params.push(end_date);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total untuk pagination info
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM transactions t ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Paginated data
    const offset = (page - 1) * limit;
    idx++;
    params.push(limit);
    idx++;
    params.push(offset);

    const result = await pool.query(
      `SELECT t.id, t.item_id, t.user_id, t.tipe_transaksi, t.jumlah,
              t.keterangan, t.tanggal_transaksi,
              i.kode_barang, i.nama_barang,
              u.nama_lengkap AS nama_user
       FROM transactions t
       JOIN items i ON t.item_id = i.id
       JOIN users u ON t.user_id = u.id
       ${whereClause}
       ORDER BY t.tanggal_transaksi DESC
       LIMIT $${idx - 1} OFFSET $${idx}`,
      params
    );

    res.json({
      success: true,
      count: result.rows.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// GET /api/transactions/:id — Detail transaksi
// =============================================================================
export async function getTransactionById(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT t.*, i.kode_barang, i.nama_barang, u.nama_lengkap AS nama_user
       FROM transactions t
       JOIN items i ON t.item_id = i.id
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan.',
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// POST /api/transactions — Catat transaksi baru (admin & kasir)
//
// Trigger database menangani:
//   1. Row-level lock (SELECT … FOR UPDATE) — anti race condition
//   2. Update stok otomatis
//   3. Validasi stok cukup untuk KELUAR
// =============================================================================
export async function createTransaction(req, res, next) {
  try {
    const { item_id, tipe_transaksi, jumlah, keterangan } = req.body;
    const user_id = req.user.id;

    // INSERT — trigger fn_update_stok_on_transaction() akan berjalan otomatis
    const result = await pool.query(
      `INSERT INTO transactions (item_id, user_id, tipe_transaksi, jumlah, keterangan)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [item_id, user_id, tipe_transaksi, jumlah, keterangan || null]
    );

    // Ambil stok terbaru (sudah di-update oleh trigger)
    const itemResult = await pool.query(
      'SELECT kode_barang, nama_barang, stok_saat_ini FROM items WHERE id = $1',
      [item_id]
    );

    // Audit log
    await logAudit(
      user_id,
      `TRANSAKSI_${tipe_transaksi}`,
      {
        item_id,
        kode_barang: itemResult.rows[0]?.kode_barang,
        nama_barang: itemResult.rows[0]?.nama_barang,
        jumlah,
        stok_setelah: itemResult.rows[0]?.stok_saat_ini,
        keterangan,
      },
      getClientIp(req)
    );

    res.status(201).json({
      success: true,
      message: `Transaksi ${tipe_transaksi} berhasil dicatat.`,
      data: {
        transaction: result.rows[0],
        stok_terkini: itemResult.rows[0]?.stok_saat_ini,
      },
    });
  } catch (err) {
    // Tangkap error dari trigger database (stok tidak cukup)
    if (err.message && err.message.includes('[STOK_ERROR]')) {
      return res.status(400).json({
        success: false,
        message: err.message.replace(/.*\[STOK_ERROR\]\s*/, ''),
      });
    }
    next(err);
  }
}

