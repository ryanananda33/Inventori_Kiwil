// =============================================================================
// controllers/supplier.controller.js — CRUD Suppliers (admin only untuk CUD)
//
// Semua query menggunakan Parameterized Queries ($1, $2, …).
// =============================================================================

import pool from '../config/database.js';

// GET /api/suppliers
export async function getAllSuppliers(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM suppliers ORDER BY nama_supplier ASC'
    );
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/suppliers/:id
export async function getSupplierById(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM suppliers WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier tidak ditemukan.',
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// POST /api/suppliers (admin only)
export async function createSupplier(req, res, next) {
  try {
    const { nama_supplier, kontak, alamat } = req.body;

    const result = await pool.query(
      `INSERT INTO suppliers (nama_supplier, kontak, alamat)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nama_supplier, kontak || null, alamat || null]
    );

    res.status(201).json({
      success: true,
      message: 'Supplier berhasil ditambahkan.',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/suppliers/:id (admin only)
export async function updateSupplier(req, res, next) {
  try {
    const { nama_supplier, kontak, alamat } = req.body;

    const result = await pool.query(
      `UPDATE suppliers
       SET nama_supplier = COALESCE($1, nama_supplier),
           kontak        = COALESCE($2, kontak),
           alamat        = COALESCE($3, alamat)
       WHERE id = $4
       RETURNING *`,
      [nama_supplier, kontak, alamat, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      message: 'Supplier berhasil diperbarui.',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/suppliers/:id (admin only)
export async function deleteSupplier(req, res, next) {
  try {
    const result = await pool.query(
      'DELETE FROM suppliers WHERE id = $1 RETURNING id, nama_supplier',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      message: `Supplier "${result.rows[0].nama_supplier}" berhasil dihapus.`,
    });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Supplier tidak bisa dihapus karena masih terhubung dengan item.',
      });
    }
    next(err);
  }
}

