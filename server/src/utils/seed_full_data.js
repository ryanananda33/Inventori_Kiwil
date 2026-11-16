import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedData() {
  const client = await pool.connect();
  try {
    console.log('🚀 Memulai pengisian data awal Warkop Kiwil...');

    // 1. Ambil ID User admin & kasir
    const usersRes = await client.query("SELECT id, username FROM users WHERE username IN ('admin', 'kasir1')");
    let adminId = usersRes.rows.find(u => u.username === 'admin')?.id;
    let kasirId = usersRes.rows.find(u => u.username === 'kasir1')?.id || adminId;

    if (!adminId) {
      console.log('User admin tidak ditemukan, membatalkan...');
      return;
    }

    // 2. Insert Suppliers jika belum ada
    console.log('📦 Menambahkan data Supplier...');
    const suppliersData = [
      ['PT Kopi Nusantara Mandiri', '081234567890', 'Komp. Industri Kopi No. 12, Bandung'],
      ['CV Berkah Susu Murni', '081298765432', 'Jl. Peternakan Raya No. 4, Lembang'],
      ['UD Sembako Pangan Sejahtera', '081377889900', 'Pasar Induk Kramat Jati Blok C/10, Jakarta'],
      ['Toko Packaging & Plastik Abadi', '082155667788', 'Jl. Percetakan Negara No. 88, Jakarta Pusat'],
      ['Distributor Sirup & Flavour Indo', '081900112233', 'Kawasan Pergudangan Pluit Blok F2, Jakarta Utara']
    ];

    const supplierIds = [];
    for (const s of suppliersData) {
      const existing = await client.query("SELECT id FROM suppliers WHERE nama_supplier = $1", [s[0]]);
      if (existing.rows.length > 0) {
        supplierIds.push(existing.rows[0].id);
      } else {
        const res = await client.query(`
          INSERT INTO suppliers (nama_supplier, kontak, alamat)
          VALUES ($1, $2, $3)
          RETURNING id;
        `, s);
        supplierIds.push(res.rows[0].id);
      }
    }

    // 3. Insert Items (Bahan Baku Warkop)
    console.log('☕ Menambahkan data Bahan Baku Warkop...');
    const itemsData = [
      // kode, nama, kategori, satuan, stok_saat_ini, stok_min, harga_beli, supplier_index
      ['KOP-001', 'Kopi Robusta Lampung 1kg', 'Kopi', 'pcs', 25, 5, 75000, 0],
      ['KOP-002', 'Kopi Arabika Gayo 1kg', 'Kopi', 'pcs', 6, 8, 125000, 0],  // Kritis (< min)
      ['KOP-003', 'Kopi Toraja Blend 500g', 'Kopi', 'pcs', 2, 5, 55000, 0],   // Kritis
      ['SSU-001', 'Susu Kental Manis Carnation', 'Susu', 'dus', 18, 5, 168000, 1],
      ['SSU-002', 'Susu UHT Diamond Plain 1L', 'Susu', 'dus', 5, 6, 210000, 1], // Rendah
      ['SSU-003', 'Susu Evaporasi F&N 380g', 'Susu', 'pcs', 24, 10, 18500, 1],
      ['MIE-001', 'Indomie Goreng Original (Karton)', 'Makanan', 'dus', 12, 4, 115000, 2],
      ['MIE-002', 'Indomie Kuah Ayam Bawang (Karton)', 'Makanan', 'dus', 7, 3, 112000, 2],
      ['MIE-003', 'Indomie Kuah Soto Mie (Karton)', 'Makanan', 'dus', 4, 3, 112000, 2],
      ['GLA-001', 'Gula Pasir Gulaku 1kg', 'Gula & Sirup', 'pcs', 35, 10, 17500, 2],
      ['GLA-002', 'Gula Aren Cair Organik 1L', 'Gula & Sirup', 'liter', 4, 5, 45000, 2], // Rendah
      ['SRP-001', 'Sirup Monin Vanilla 700ml', 'Gula & Sirup', 'pcs', 5, 2, 145000, 4],
      ['SRP-002', 'Sirup Monin Caramel 700ml', 'Gula & Sirup', 'pcs', 0, 2, 145000, 4], // Habis
      ['CUP-001', 'Cup Plastik 16oz + Tutup Seal', 'Kemasan', 'dus', 18, 5, 85000, 3],
      ['CUP-002', 'Cup Plastik 22oz Jumbo', 'Kemasan', 'dus', 10, 4, 98000, 3],
      ['SED-001', 'Sedotan Kopi Higienis (Pack)', 'Kemasan', 'pcs', 45, 10, 12000, 3],
      ['ESB-001', 'Es Batu Tube Kristal 10kg', 'Bahan Segar', 'pcs', 30, 10, 15000, null],
      ['TEH-001', 'Teh Celup Sariwangi Jumbo', 'Teh', 'dus', 16, 5, 32000, 2]
    ];

    const itemMap = {};
    for (const it of itemsData) {
      const suppId = it[7] !== null ? supplierIds[it[7]] : null;
      const res = await client.query(`
        INSERT INTO items (kode_barang, nama_barang, kategori, satuan, stok_saat_ini, stok_minimum, harga_beli, supplier_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (kode_barang) DO UPDATE 
        SET stok_saat_ini = EXCLUDED.stok_saat_ini,
            stok_minimum = EXCLUDED.stok_minimum,
            harga_beli = EXCLUDED.harga_beli,
            supplier_id = EXCLUDED.supplier_id
        RETURNING id, kode_barang;
      `, [it[0], it[1], it[2], it[3], it[4], it[5], it[6], suppId]);
      itemMap[it[0]] = res.rows[0].id;
    }

    // 4. Insert Riwayat Transaksi (7 hari terakhir agar grafik terisi)
    console.log('📊 Menambahkan data Riwayat Transaksi 7 hari terakhir...');
    
    // Hapus transaksi lama jika ada
    await client.query('DELETE FROM transactions');

    // Buat data transaksi contoh dengan kuantitas yang aman dari stok
    const sampleTx = [
      { kode: 'KOP-001', tipe: 'MASUK', qty: 10, ket: 'Restock mingguan Kopi Robusta', daysAgo: 6, user: adminId },
      { kode: 'KOP-001', tipe: 'KELUAR', qty: 2, ket: 'Pemakaian warkop shift pagi & sore', daysAgo: 5, user: kasirId },
      { kode: 'SSU-001', tipe: 'MASUK', qty: 5, ket: 'Penerimaan Susu Carnation', daysAgo: 5, user: adminId },
      { kode: 'MIE-001', tipe: 'MASUK', qty: 5, ket: 'Restock Indomie Goreng 5 karton', daysAgo: 4, user: adminId },
      { kode: 'MIE-001', tipe: 'KELUAR', qty: 1, ket: 'Masak mie pesanan pelanggan', daysAgo: 4, user: kasirId },
      { kode: 'CUP-001', tipe: 'MASUK', qty: 8, ket: 'Pengiriman cup 16oz', daysAgo: 3, user: adminId },
      { kode: 'CUP-001', tipe: 'KELUAR', qty: 2, ket: 'Pemakaian cup kopi dingin', daysAgo: 3, user: kasirId },
      { kode: 'GLA-001', tipe: 'MASUK', qty: 10, ket: 'Belanja gula pasir 10 pack', daysAgo: 2, user: adminId },
      { kode: 'GLA-001', tipe: 'KELUAR', qty: 2, ket: 'Isi ulang toples bar gula', daysAgo: 2, user: kasirId },
      { kode: 'KOP-002', tipe: 'KELUAR', qty: 1, ket: 'Kopi Arabika shift malam', daysAgo: 1, user: kasirId },
      { kode: 'ESB-001', tipe: 'MASUK', qty: 15, ket: 'Pengiriman es batu pagi', daysAgo: 1, user: kasirId },
      { kode: 'ESB-001', tipe: 'KELUAR', qty: 3, ket: 'Pemakaian es batu siang', daysAgo: 0, user: kasirId },
      { kode: 'SSU-002', tipe: 'KELUAR', qty: 1, ket: 'Pemakaian UHT latte', daysAgo: 0, user: kasirId },
      { kode: 'MIE-003', tipe: 'KELUAR', qty: 1, ket: 'Pesanan indomie soto', daysAgo: 0, user: kasirId }
    ];

    for (const t of sampleTx) {
      const itemId = itemMap[t.kode];
      if (!itemId) continue;

      await client.query(`
        INSERT INTO transactions (item_id, user_id, tipe_transaksi, jumlah, keterangan, tanggal_transaksi)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${t.daysAgo} days')
      `, [itemId, t.user, t.tipe, t.qty, t.ket]);
    }

    // 5. Insert Sample Audit Logs
    console.log('📝 Menambahkan data Audit Logs...');
    await client.query('DELETE FROM audit_logs');
    await client.query(`
      INSERT INTO audit_logs (user_id, aksi, detail, ip_address, created_at)
      VALUES 
        ($1, 'LOGIN_SUCCESS', '{"username": "admin"}', '127.0.0.1', NOW() - INTERVAL '6 days'),
        ($1, 'CREATE_SUPPLIER', '{"nama_supplier": "PT Kopi Nusantara Mandiri"}', '127.0.0.1', NOW() - INTERVAL '6 days'),
        ($1, 'CREATE_ITEM', '{"kode_barang": "KOP-001", "nama_barang": "Kopi Robusta Lampung 1kg"}', '127.0.0.1', NOW() - INTERVAL '6 days'),
        ($2, 'LOGIN_SUCCESS', '{"username": "kasir1"}', '127.0.0.1', NOW() - INTERVAL '1 days'),
        ($2, 'TRANSAKSI_KELUAR', '{"kode_barang": "KOP-002", "jumlah": 1}', '127.0.0.1', NOW() - INTERVAL '1 days'),
        ($1, 'LOGIN_SUCCESS', '{"username": "admin"}', '127.0.0.1', NOW())
    `, [adminId, kasirId]);

    console.log('✨ SEMUA DATA AWAL WARKOP KIWIL SUKSES TERISI LENGKAP!');

  } catch (err) {
    console.error('Error saat seeding data:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedData();
