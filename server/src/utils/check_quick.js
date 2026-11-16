import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const res = await pool.query('SELECT username, role, password_hash FROM users');
    console.log('--- USER DI DATABASE SAAT INI ---');
    for (const u of res.rows) {
      const matchAdmin = await bcrypt.compare('Admin123!', u.password_hash);
      const matchKasir = await bcrypt.compare('Kasir123!', u.password_hash);
      console.log(`User: ${u.username} | Role: ${u.role}`);
      console.log(`  Cocok Admin123!: ${matchAdmin}`);
      console.log(`  Cocok Kasir123!: ${matchKasir}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();

