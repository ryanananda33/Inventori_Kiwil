-- ============================================================================
-- APLIKASI SISTEM INVENTORI WARKOP KIWIL
-- Database Schema (DDL) — PostgreSQL / Supabase
-- ============================================================================
-- PERINGATAN: Jangan simpan credential atau password asli di dalam file ini.
--             Gunakan environment variables untuk konfigurasi sensitif.
-- ============================================================================

-- 0. Ekstensi yang dibutuhkan
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid(), crypt(), gen_salt()

-- 1. Custom ENUM types
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE user_role          AS ENUM ('admin', 'kasir');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipe_transaksi_enum AS ENUM ('MASUK', 'KELUAR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Tabel: users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_lengkap  VARCHAR(100) NOT NULL,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,          -- bcrypt / argon2 hash, BUKAN plain text
  role          user_role    NOT NULL DEFAULT 'kasir',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN users.password_hash IS
  'Simpan hasil hash bcrypt/argon2. Jangan pernah simpan password plain text.';

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_role     ON users (role);

-- 3. Tabel: suppliers
-- ============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_supplier  VARCHAR(100) NOT NULL,
  kontak         VARCHAR(50),
  alamat         TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_nama ON suppliers (nama_supplier);

-- 4. Tabel: items (bahan baku warkop)
-- ============================================================================
CREATE TABLE IF NOT EXISTS items (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode_barang    VARCHAR(30)   NOT NULL UNIQUE,
  nama_barang    VARCHAR(100)  NOT NULL,
  kategori       VARCHAR(50),
  satuan         VARCHAR(20)   NOT NULL CHECK (satuan IN ('pcs', 'gram', 'liter', 'dus')),
  stok_saat_ini  INTEGER       NOT NULL DEFAULT 0 CHECK (stok_saat_ini >= 0),
  stok_minimum   INTEGER       NOT NULL DEFAULT 0 CHECK (stok_minimum >= 0),
  harga_beli     NUMERIC(12,2) NOT NULL CHECK (harga_beli >= 0),
  supplier_id    UUID          REFERENCES suppliers(id) ON DELETE SET NULL,
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN items.stok_saat_ini IS
  'Stok aktual di gudang. Diperbarui otomatis oleh trigger transaksi.';

CREATE INDEX IF NOT EXISTS idx_items_kode     ON items (kode_barang);
CREATE INDEX IF NOT EXISTS idx_items_kategori ON items (kategori);
CREATE INDEX IF NOT EXISTS idx_items_supplier ON items (supplier_id);

-- 5. Tabel: transactions (barang masuk & keluar)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id                 UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id            UUID                 NOT NULL REFERENCES items(id)  ON DELETE RESTRICT,
  user_id            UUID                 NOT NULL REFERENCES users(id)  ON DELETE RESTRICT,
  tipe_transaksi     tipe_transaksi_enum  NOT NULL,
  jumlah             INTEGER              NOT NULL CHECK (jumlah > 0),
  keterangan         TEXT,
  tanggal_transaksi  TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_item       ON transactions (item_id);
CREATE INDEX IF NOT EXISTS idx_tx_user       ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_tx_tipe       ON transactions (tipe_transaksi);
CREATE INDEX IF NOT EXISTS idx_tx_tanggal    ON transactions (tanggal_transaksi DESC);

-- 6. Tabel: audit_logs (jejak audit — nilai tambah keamanan)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  aksi        VARCHAR(100) NOT NULL,
  detail      JSONB,                          -- detail fleksibel dalam format JSON
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user      ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_aksi      ON audit_logs (aksi);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON audit_logs (created_at DESC);

-- ============================================================================
-- 7. FUNCTION & TRIGGER: Otomatis update stok saat INSERT ke transactions
-- ============================================================================
--
-- Logika:
--   • MASUK  → stok_saat_ini += jumlah
--   • KELUAR → stok_saat_ini -= jumlah
--       ↳ DITOLAK (RAISE EXCEPTION) jika stok_saat_ini < jumlah
--
-- Keamanan:
--   • Menggunakan SELECT ... FOR UPDATE untuk row-level locking
--     sehingga aman terhadap concurrent transactions (race condition).
--   • Validasi dilakukan di level database sebagai pertahanan berlapis
--     (defense in depth), selain validasi di application layer.
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_update_stok_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER                       -- berjalan dengan privilege owner, bukan caller
AS $$
DECLARE
  v_stok_sekarang INTEGER;
  v_nama_barang   VARCHAR;
BEGIN
  -- Ambil stok saat ini dengan row lock untuk mencegah race condition
  SELECT stok_saat_ini, nama_barang
    INTO v_stok_sekarang, v_nama_barang
    FROM items
   WHERE id = NEW.item_id
     FOR UPDATE;                       -- row-level lock

  -- Pastikan item ada
  IF NOT FOUND THEN
    RAISE EXCEPTION '[SECURITY] Item dengan id=% tidak ditemukan.', NEW.item_id;
  END IF;

  -- Proses berdasarkan tipe transaksi
  IF NEW.tipe_transaksi = 'MASUK' THEN
    -- Barang masuk: tambah stok
    UPDATE items
       SET stok_saat_ini = stok_saat_ini + NEW.jumlah,
           updated_at    = NOW()
     WHERE id = NEW.item_id;

  ELSIF NEW.tipe_transaksi = 'KELUAR' THEN
    -- Barang keluar: validasi stok mencukupi
    IF v_stok_sekarang < NEW.jumlah THEN
      RAISE EXCEPTION
        '[STOK_ERROR] Stok "%" tidak mencukupi. Tersedia: %, diminta: %.',
        v_nama_barang, v_stok_sekarang, NEW.jumlah;
    END IF;

    -- Kurangi stok
    UPDATE items
       SET stok_saat_ini = stok_saat_ini - NEW.jumlah,
           updated_at    = NOW()
     WHERE id = NEW.item_id;

  ELSE
    RAISE EXCEPTION '[SECURITY] Tipe transaksi tidak valid: %', NEW.tipe_transaksi;
  END IF;

  RETURN NEW;
END;
$$;

-- Buat trigger yang dijalankan SEBELUM INSERT agar bisa menolak transaksi
DROP TRIGGER IF EXISTS trg_update_stok ON transactions;
CREATE TRIGGER trg_update_stok
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_stok_on_transaction();

-- ============================================================================
-- 8. FUNCTION & TRIGGER: Auto-update updated_at pada tabel items
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_items_updated_at ON items;
CREATE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) — Opsional, direkomendasikan untuk Supabase
-- ============================================================================
-- Aktifkan RLS pada semua tabel (Supabase mengharuskan ini)

ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs   ENABLE ROW LEVEL SECURITY;

-- Policy dasar: service_role bisa akses semua (backend menggunakan service_role key)
-- Policy lebih granular bisa ditambahkan sesuai kebutuhan

CREATE POLICY "service_role_full_access" ON users        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON suppliers    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON items        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON audit_logs   FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- SELESAI — Schema siap digunakan
-- ============================================================================

