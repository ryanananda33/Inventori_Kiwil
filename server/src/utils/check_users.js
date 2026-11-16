import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env langsung dari server/.env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('DATABASE_URL terbaca:', process.env.DATABASE_URL ? 'YA (Ada)' : 'TIDAK');

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Menghubungkan ke PostgreSQL Supabase...');
    const client = await pool.connect();
    console.log('✅ Berhasil terhubung ke Supabase!');
    client.release();

    // 1. Cek isi tabel users
    const currentUsers = await pool.query('SELECT id, nama_lengkap, username, role, password_hash FROM users');
    console.log(`\nUser yang ada di tabel 'users' saat ini: ${currentUsers.rows.length}`);
    for (const u of currentUsers.rows) {
      console.log(`- Username: "${u.username}", Role: "${u.role}"`);
      const isMatch = await bcrypt.compare('Admin123!', u.password_hash);
      console.log(`  Apakah password cocok dengan 'Admin123!'? => ${isMatch ? 'YA' : 'TIDAK'}`);
    }

    // 2. Generate bcrypt hash fresh
    console.log('\nMembuat hash baru...');
    const adminHash = await bcrypt.hash('Admin123!', 10);
    const kasirHash = await bcrypt.hash('Kasir123!', 10);

    // 3. Upsert user admin dan kasir1
    await pool.query(`
      INSERT INTO users (nama_lengkap, username, password_hash, role)
      VALUES 
        ('Administrator', 'admin', $1, 'admin'),
        ('Kasir Utama', 'kasir1', $2, 'kasir')
      ON CONFLICT (username) 
      DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `, [adminHash, kasirHash]);

    console.log('\n✅ SUKSES! User "admin" dan "kasir1" telah dibuat/diupdate di database.');
    console.log('Detail login:');
    console.log('1. Admin -> Username: admin | Password: Admin123!');
    console.log('2. Kasir -> Username: kasir1 | Password: Kasir123!');

  } catch (err) {
    console.error('❌ GAGAL:', err);
  } finally {
    await pool.end();
  }
}

run();
