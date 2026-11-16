// =============================================================================
// controllers/item.controller.js — CRUD Bahan Baku (Items)
//
// RBAC:
//   • admin  → full CRUD (create, read, update, delete)
//   • kasir  → hanya read (GET list & detail), TIDAK bisa create/update/delete
//
// Semua query menggunakan Parameterized Queries ($1, $2, …).
// =============================================================================

import pool from '../config/database.js';

// =============================================================================
// GET /api/items — Daftar semua item (admin & kasir)
// =============================================================================
export async function getAllItems(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT i.id, i.kode_barang, i.nama_barang, i.kategori, i.satuan,
              i.stok_saat_ini, i.stok_minimum, i.harga_beli,
              i.supplier_id, i.updated_at,
              s.nama_supplier
       FROM items i
       LEFT JOIN suppliers s ON i.supplier_id = s.id
       ORDER BY i.nama_barang ASC`
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
// GET /api/items/low-stock — Item dengan stok di bawah minimum (admin & kasir)
// =============================================================================
export async function getLowStockItems(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT i.id, i.kode_barang, i.nama_barang, i.kategori, i.satuan,
              i.stok_saat_ini, i.stok_minimum, i.harga_beli,
              s.nama_supplier
       FROM items i
       LEFT JOIN suppliers s ON i.supplier_id = s.id
       WHERE i.stok_saat_ini <= i.stok_minimum
       ORDER BY (i.stok_saat_ini - i.stok_minimum) ASC`
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
// GET /api/items/:id — Detail satu item (admin & kasir)
// =============================================================================
export async function getItemById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT i.*, s.nama_supplier
       FROM items i
       LEFT JOIN suppliers s ON i.supplier_id = s.id
       WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan.',
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// =============================================================================
// POST /api/items — Tambah item baru (admin only)
// =============================================================================
export async function createItem(req, res, next) {
  try {
    const {
      kode_barang,
      nama_barang,
      kategori,
      satuan,
      stok_saat_ini,
      stok_minimum,
      harga_beli,
      supplier_id,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO items
         (kode_barang, nama_barang, kategori, satuan, stok_saat_ini, stok_minimum, harga_beli, supplier_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        kode_barang,
        nama_barang,
        kategori || null,
        satuan,
        stok_saat_ini ?? 0,
        stok_minimum ?? 0,
        harga_beli,
        supplier_id || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Item berhasil ditambahkan.',
      data: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Kode barang sudah digunakan.',
      });
    }
    next(err);
  }
}

// =============================================================================
// PUT /api/items/:id — Update item (admin only)
// =============================================================================
export async function updateItem(req, res, next) {
  try {
    const { id } = req.params;
    const {
      kode_barang,
      nama_barang,
      kategori,
      satuan,
      stok_minimum,
      harga_beli,
      supplier_id,
    } = req.body;

    // Cek apakah item ada
    const check = await pool.query('SELECT id FROM items WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan.',
      });
    }

    const result = await pool.query(
      `UPDATE items
       SET kode_barang  = COALESCE($1, kode_barang),
           nama_barang  = COALESCE($2, nama_barang),
           kategori     = COALESCE($3, kategori),
           satuan       = COALESCE($4, satuan),
           stok_minimum = COALESCE($5, stok_minimum),
           harga_beli   = COALESCE($6, harga_beli),
           supplier_id  = $7,
           updated_at   = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        kode_barang,
        nama_barang,
        kategori,
        satuan,
        stok_minimum,
        harga_beli,
        supplier_id || null,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'Item berhasil diperbarui.',
      data: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Kode barang sudah digunakan oleh item lain.',
      });
    }
    next(err);
  }
}

// =============================================================================
// DELETE /api/items/:id — Hapus item (admin only)
// =============================================================================
export async function deleteItem(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM items WHERE id = $1 RETURNING id, kode_barang, nama_barang',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      message: `Item "${result.rows[0].nama_barang}" (${result.rows[0].kode_barang}) berhasil dihapus.`,
    });
  } catch (err) {
    // FK constraint — item masih punya transaksi
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Item tidak bisa dihapus karena masih memiliki riwayat transaksi.',
      });
    }
    next(err);
  }
}

