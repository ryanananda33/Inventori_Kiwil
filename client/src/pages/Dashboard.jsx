// pages/Dashboard.jsx
// - Kartu metrik: Total Item, Stok Kritis, Transaksi Hari Ini, Nilai Stok
// - Grafik batang Recharts: pergerakan MASUK vs KELUAR 7 hari terakhir
// - Tabel item stok rendah/habis

import { useEffect, useState } from 'react';
import {
  Package, AlertTriangle, ArrowLeftRight, DollarSign,
  TrendingUp, TrendingDown, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api.js';
import StatCard from '../components/common/StatCard.jsx';
import BrandLogo from '../components/common/BrandLogo.jsx'
import { formatRupiah, formatTanggal, groupTransactionsByDate, getStockStatus } from '../utils/helpers.js';

const STATUS_BADGE = {
  habis:  <span className="badge-red">Habis</span>,
  kritis: <span className="badge-yellow">Kritis</span>,
  rendah: <span className="badge-yellow">Rendah</span>,
  aman:   <span className="badge-green">Aman</span>,
};

export default function Dashboard() {
  const [items, setItems]           = useState([]);
  const [transactions, setTx]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, txRes] = await Promise.all([
        api.get('/items'),
        api.get('/transactions?limit=200'),
      ]);
      setItems(itemsRes.data.data);
      setTx(txRes.data.data);
      setLastRefresh(new Date());
    } catch {
      // Error sudah dihandle oleh interceptor (401 redirect)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Hitung metrik
  const today = new Date().toISOString().split('T')[0];
  const txToday      = transactions.filter((t) => t.tanggal_transaksi?.startsWith(today));
  const lowStockItems = items.filter((i) => getStockStatus(i.stok_saat_ini, i.stok_minimum) !== 'aman');
  const nilaiStok    = items.reduce((sum, i) => sum + i.stok_saat_ini * parseFloat(i.harga_beli || 0), 0);
  const chartData    = groupTransactionsByDate(transactions, 7);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Terakhir diperbarui: {formatTanggal(lastRefresh.toISOString())}
          </p>
        </div>
        <button onClick={fetchData} className="btn-outline">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Item Bahan Baku"
          value={items.length}
          icon={Package}
          color="orange"
          sub={`${items.filter(i => i.stok_saat_ini > 0).length} item tersedia`}
        />
        <StatCard
          title="Stok Kritis / Menipis"
          value={lowStockItems.length}
          icon={AlertTriangle}
          color={lowStockItems.length > 0 ? 'red' : 'green'}
          sub="Perlu restock segera"
          badge={
            lowStockItems.length > 0 ? (
              <span className="badge-red">⚠ Perhatian dibutuhkan</span>
            ) : (
              <span className="badge-green">✓ Semua aman</span>
            )
          }
        />
        <StatCard
          title="Transaksi Hari Ini"
          value={txToday.length}
          icon={ArrowLeftRight}
          color="blue"
          sub={`${txToday.filter(t=>t.tipe_transaksi==='MASUK').length} masuk · ${txToday.filter(t=>t.tipe_transaksi==='KELUAR').length} keluar`}
        />
        <StatCard
          title="Nilai Total Stok"
          value={formatRupiah(nilaiStok)}
          icon={DollarSign}
          color="yellow"
          sub="Berdasarkan harga beli"
        />
      </div>

      {/* Grafik + Stok Kritis */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Bar Chart — 3/5 lebar */}
        <div className="xl:col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">
              Pergerakan Barang — 7 Hari Terakhir
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '10px', border: '1px solid #e2e8f0',
                  fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
              <Bar dataKey="masuk"  name="Barang Masuk"  fill="#f97316" radius={[4,4,0,0]} />
              <Bar dataKey="keluar" name="Barang Keluar" fill="#facc15" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stok Kritis — 2/5 lebar */}
        <div className="xl:col-span-2 card">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            ⚠ Item Stok Kritis
          </h2>
          {lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <span className="text-3xl mb-2">✅</span>
              <p className="text-sm text-gray-400">Semua stok dalam kondisi aman.</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
              {lowStockItems.map((item) => {
                const status = getStockStatus(item.stok_saat_ini, item.stok_minimum);
                return (
                  <div key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-orange-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.nama_barang}</p>
                      <p className="text-xs text-gray-400">{item.kode_barang}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
                      {STATUS_BADGE[status]}
                      <span className="text-xs font-semibold text-gray-600">
                        {item.stok_saat_ini} {item.satuan}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transaksi terbaru */}
      <div className="card">
        <h2 className="text-base font-semibold text-slate-800 mb-4">
          Transaksi Terbaru
        </h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Belum ada transaksi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Item</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Tipe</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Jumlah</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-slate-800">{tx.nama_barang}</p>
                      <p className="text-xs text-gray-400">{tx.kode_barang}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      {tx.tipe_transaksi === 'MASUK'
                        ? <span className="badge-green flex items-center gap-1 w-fit"><TrendingUp size={11}/>Masuk</span>
                        : <span className="badge-red flex items-center gap-1 w-fit"><TrendingDown size={11}/>Keluar</span>
                      }
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold">{tx.jumlah}</td>
                    <td className="py-2.5 px-3 text-gray-500">{tx.nama_user}</td>
                    <td className="py-2.5 px-3 text-gray-400 text-xs">{formatTanggal(tx.tanggal_transaksi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

