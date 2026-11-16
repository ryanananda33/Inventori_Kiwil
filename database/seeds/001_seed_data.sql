-- ============================================================================
-- SEED DATA — Data awal untuk development & testing
-- ============================================================================
-- PERINGATAN: Password di bawah adalah HASH bcrypt untuk testing.
--             Jangan gunakan password ini di production.
--             Hash di bawah = bcrypt('Password123!') — GANTI di production.
-- ============================================================================

-- Seed Suppliers
INSERT INTO suppliers (id, nama_supplier, kontak, alamat) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'PT Kopi Nusantara',   '081234567890', 'Jl. Kopi No. 1, Bandung'),
  ('a0000000-0000-0000-0000-000000000002', 'CV Susu Segar Jaya',  '081234567891', 'Jl. Susu No. 2, Jakarta'),
  ('a0000000-0000-0000-0000-000000000003', 'UD Mie Sejahtera',    '081234567892', 'Jl. Mie No. 3, Surabaya'),
  ('a0000000-0000-0000-0000-000000000004', 'Toko Gula Manis',     '081234567893', 'Jl. Gula No. 4, Semarang')
ON CONFLICT DO NOTHING;

-- Seed Items (bahan baku warkop)
INSERT INTO items (id, kode_barang, nama_barang, kategori, satuan, stok_saat_ini, stok_minimum, harga_beli, supplier_id) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'KPI-001', 'Kopi Robusta 1kg',    'Kopi',     'pcs',   50,  10, 85000.00,  'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'KPI-002', 'Kopi Arabika 1kg',    'Kopi',     'pcs',   30,  10, 120000.00, 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000003', 'SSU-001', 'Susu Kental Manis',   'Susu',     'dus',   20,   5, 150000.00, 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000004', 'SSU-002', 'Susu UHT 1 Liter',   'Susu',     'pcs',   40,  10, 18000.00,  'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000005', 'MIE-001', 'Mie Instan Goreng',   'Mie',      'dus',   15,   5, 95000.00,  'a0000000-0000-0000-0000-000000000003'),
  ('b0000000-0000-0000-0000-000000000006', 'GLA-001', 'Gula Pasir 1kg',      'Gula',     'pcs',   25,   5, 16000.00,  'a0000000-0000-0000-0000-000000000004'),
  ('b0000000-0000-0000-0000-000000000007', 'ESB-001', 'Es Batu Kristal 5kg', 'Es Batu',  'pcs',   100, 20, 12000.00,  NULL),
  ('b0000000-0000-0000-0000-000000000008', 'CUP-001', 'Cup Plastik 16oz',    'Cup',      'dus',   10,   3, 65000.00,  NULL)
ON CONFLICT (kode_barang) DO NOTHING;

-- ============================================================================
-- CATATAN:
-- User admin/kasir harus dibuat melalui endpoint registrasi di backend
-- yang menggunakan bcrypt/argon2 untuk hashing password.
-- Jangan INSERT user dengan plain text password di sini.
-- ============================================================================

