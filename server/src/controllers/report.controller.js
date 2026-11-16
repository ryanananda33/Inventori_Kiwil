// =============================================================================
// controllers/report.controller.js — Laporan & Rekap Stok Opname
//
// GET /api/reports/summary — Rekap stok opname + riwayat transaksi
//                             berdasarkan rentang tanggal (admin only)
//
// Semua query menggunakan Parameterized Queries ($1, $2, …).
// =============================================================================

import pool from '../config/database.js';

// =============================================================================
// GET /api/reports/summary
//
// Response mencakup:
//   1. Ringkasan stok opname (semua item + status stok)
//   2. Rekapitulasi transaksi per item dalam rentang tanggal
//   3. Statistik agregat (total MASUK, total KELUAR, total nilai stok)
// =============================================================================
export async function getSummaryReport(req, res, next) {
  try {
    const { start_date, end_date } = req.query;

    // -------------------------------------------------------------------------
    // 1. Stok Opname — semua item + status stok (aman/rendah/habis)
    // -------------------------------------------------------------------------
    const stockResult = await pool.query(
      `SELECT
         i.id,
         i.kode_barang,
         i.nama_barang,
         i.kategori,
         i.satuan,
         i.stok_saat_ini,
         i.stok_minimum,
         i.harga_beli,
         ROUND((i.stok_saat_ini * i.harga_beli)::numeric, 2) AS nilai_stok,
         s.nama_supplier,
         CASE
           WHEN i.stok_saat_ini = 0            THEN 'HABIS'
           WHEN i.stok_saat_ini <= i.stok_minimum THEN 'RENDAH'
           ELSE 'AMAN'
         END AS status_stok,
         i.updated_at
       FROM items i
       LEFT JOIN suppliers s ON i.supplier_id = s.id
       ORDER BY i.nama_barang ASC`
    );

    // -------------------------------------------------------------------------
    // 2. Rekapitulasi Transaksi per item dalam rentang tanggal
    //    Parameterized — tanggal di-inject aman
    // -------------------------------------------------------------------------
    const txConditions = [];
    const txParams = [];
    let idx = 0;

    if (start_date) {
      idx++;
      txConditions.push(`t.tanggal_transaksi >= $${idx}`);
      txParams.push(start_date);
    }

    if (end_date) {
      idx++;
      txConditions.push(`t.tanggal_transaksi <= $${idx}::date + INTERVAL '1 day'`);
      txParams.push(end_date);
    }

    const txWhereClause =
      txConditions.length > 0 ? `WHERE ${txConditions.join(' AND ')}` : '';

    const txResult = await pool.query(
      `SELECT
         i.id            AS item_id,
         i.kode_barang,
         i.nama_barang,
         i.satuan,
         COALESCE(SUM(CASE WHEN t.tipe_transaksi = 'MASUK'  THEN t.jumlah ELSE 0 END), 0) AS total_masuk,
         COALESCE(SUM(CASE WHEN t.tipe_transaksi = 'KELUAR' THEN t.jumlah ELSE 0 END), 0) AS total_keluar,
         COUNT(t.id) AS jumlah_transaksi
       FROM items i
       LEFT JOIN transactions t ON i.id = t.item_id
         ${txWhereClause.replace('WHERE', 'AND')}
       GROUP BY i.id, i.kode_barang, i.nama_barang, i.satuan
       ORDER BY i.nama_barang ASC`,
      txParams
    );

    // -------------------------------------------------------------------------
    // 3. Statistik agregat keseluruhan
    // -------------------------------------------------------------------------
    const statsResult = await pool.query(
      `SELECT
         COUNT(DISTINCT i.id)                              AS total_item,
         COALESCE(SUM(i.stok_saat_ini * i.harga_beli), 0) AS total_nilai_stok,
         COUNT(CASE WHEN i.stok_saat_ini = 0 THEN 1 END)              AS item_habis,
         COUNT(CASE WHEN i.stok_saat_ini > 0
                     AND i.stok_saat_ini <= i.stok_minimum THEN 1 END) AS item_stok_rendah,
         COUNT(CASE WHEN i.stok_saat_ini > i.stok_minimum THEN 1 END) AS item_aman
       FROM items i`
    );

    // Statistik transaksi dalam rentang tanggal
    const txStatsResult = await pool.query(
      `SELECT
         COUNT(t.id)                                                       AS total_transaksi,
         COALESCE(SUM(CASE WHEN t.tipe_transaksi = 'MASUK'  THEN t.jumlah ELSE 0 END), 0) AS total_unit_masuk,
         COALESCE(SUM(CASE WHEN t.tipe_transaksi = 'KELUAR' THEN t.jumlah ELSE 0 END), 0) AS total_unit_keluar
       FROM transactions t
       ${txWhereClause}`,
      txParams
    );

    res.json({
      success: true,
      data: {
        periode: {
          start_date: start_date || null,
          end_date: end_date || null,
          generated_at: new Date().toISOString(),
        },
        statistik_stok: statsResult.rows[0],
        statistik_transaksi: txStatsResult.rows[0],
        stok_opname: stockResult.rows,
        rekap_transaksi: txResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

