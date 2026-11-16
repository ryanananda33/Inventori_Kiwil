// =============================================================================
// database/seeds/002_seed_users.js
//
// Script untuk membuat user awal (admin & kasir) dengan password yang
// sudah di-hash menggunakan bcrypt.
//
// Cara menjalankan (dari folder /server):
//   node ../database/seeds/002_seed_users.js
//
// PENTING: Jalankan hanya SEKALI saat setup awal.
//          Ganti password di bawah sebelum deploy ke production!
// =============================================================================

import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env dari folder /server
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../server/.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

const SALT_ROUNDS = 10;

// =============================================================================
// Daftar user awal — GANTI PASSWORD sebelum deploy production!
// =============================================================================
const INITIAL_USERS = [
  {
    nama_lengkap: 'Administrator',
    username:     'admin',
    password:     'Admin123!',   // ← Ganti setelah deploy
    role:         'admin',
  },
  {
    nama_lengkap: 'Kasir Utama',
    username:     'kasir1',
    password:     'Kasir123!',   // ← Ganti setelah deploy
    role:         'kasir',
  },
];

async function seedUsers() {
  console.log('\n🌱 Memulai proses seed user...\n');

  for (const user of INITIAL_USERS) {
    try {
      // Cek apakah username sudah ada
      const existing = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [user.username]
      );

      if (existing.rows.length > 0) {
        console.log(`⚠  User "${user.username}" sudah ada — dilewati.`);
        continue;
      }

      // Hash password
      console.log(`🔐 Hashing password untuk "${user.username}"...`);
      const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

      // Insert user
      const result = await pool.query(
        `INSERT INTO users (nama_lengkap, username, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, nama_lengkap, username, role`,
        [user.nama_lengkap, user.username, passwordHash, user.role]
      );

      const created = result.rows[0];
      console.log(`✅ User berhasil dibuat:`);
      console.log(`   ID       : ${created.id}`);
      console.log(`   Nama     : ${created.nama_lengkap}`);
      console.log(`   Username : ${created.username}`);
      console.log(`   Role     : ${created.role}`);
      console.log(`   Password : ${user.password}  ← Simpan & ganti segera!\n`);

    } catch (err) {
      console.error(`❌ Gagal membuat user "${user.username}":`, err.message);
    }
  }

  await pool.end();
  console.log('✅ Seed selesai!\n');
}

seedUsers().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

