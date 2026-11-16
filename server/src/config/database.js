// =============================================================================
// config/database.js — PostgreSQL Connection Pool (library `pg`)
//
// Semua query WAJIB menggunakan Parameterized Queries ($1, $2, …).
// Jangan pernah string-concatenate user input ke dalam query SQL.
// =============================================================================

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('[FATAL] DATABASE_URL belum diset di environment variables.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB] New client connected to PostgreSQL.');
  }
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
  process.exit(-1);
});

// ---------------------------------------------------------------------------
// Helper: jalankan callback di dalam transaksi database (BEGIN…COMMIT/ROLLBACK)
// ---------------------------------------------------------------------------
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default pool;

