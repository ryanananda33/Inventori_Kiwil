// pages/Transactions.jsx — Pencatatan Transaksi Stok (admin & kasir)
// - Form cepat Barang Masuk / Keluar
// - Riwayat transaksi dengan filter tipe & item

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Plus, Search, ChevronDown, Loader2,
} from 'lucide-react';
import api from '../services/api.js';
import { useItems } from '../hooks/useItems.js';
import Modal from '../components/common/Modal.jsx';
import { formatTanggal, getErrorMessage } from '../utils/helpers.js';
import toast from 'react-hot-toast';

const TIPE = { MASUK: 'MASUK', KELUAR: 'KELUAR' };

export default function Transactions() {
  const { items, fetchItems }   = useItems();
  const [transactions, setTx]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModal]   = useState(false);
  const [saving, setSaving]     = useState(false);

  const [filters, setFilters]   = useState({ tipe: '', item_id: '', search: '' });

  const [form, setForm] = useState({
    item_id: '', tipe_transaksi: 'MASUK', jumlah: '', keterangan: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const LIMIT = 20;

  const fetchTx = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: LIMIT });
      if (filters.tipe)    params.append('tipe', filters.tipe);
      if (filters.item_id) params.append('item_id', filters.item_id);
      const { data } = await api.get(`/transactions?${params}`);
      setTx(data.data);
      setTotal(data.total);
      setPage(pg);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTx(1); }, [fetchTx]);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === form.item_id),
    [items, form.item_id]
  );

  const validateForm = () => {
    const e = {};
    if (!form.item_id) e.item_id = 'Pilih item terlebih dahulu.';
    if (!form.jumlah || Number(form.jumlah) < 1) e.jumlah = 'Jumlah minimal 1.';
    if (form.tipe_transaksi === 'KELUAR' && selectedItem) {
      if (Number(form.jumlah) > selectedItem.stok_saat_ini) {
        e.jumlah = `Stok tidak cukup. Tersedia: ${selectedItem.stok_saat_ini} ${selectedItem.satuan}.`;
      }
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setSaving(true);
    try {
      await api.post('/transactions', {
        item_id: form.item_id,
        tipe_transaksi: form.tipe_transaksi,
        jumlah: Number(form.jumlah),
        keterangan: form.keterangan || undefined,
      });
      toast.success(`Transaksi ${form.tipe_transaksi} berhasil dicatat! 🎉`);
      setModal(false);
      setForm({ item_id: '', tipe_transaksi: 'MASUK', jumlah: '', keterangan: '' });
      setFormErrors({});
      fetchItems();   // Refresh stok
      fetchTx(1);
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      if (msg.toLowerCase().includes('stok')) {
        setFormErrors((p) => ({ ...p, jumlah: msg }));
      }
    } finally {
      setSaving(false);
    }
  };

  const fld = (name) => ({
    value: form[name],
    onChange: (e) => {
      setForm((p) => ({ ...p, [name]: e.target.value }));
      setFormErrors((p) => ({ ...p, [name]: '' }));
    },
  });

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pencatatan Transaksi</h1>
          <p className="text-sm text-gray-400">{total} total transaksi tercatat</p>
        </div>
        <button onClick={() => { setForm({ item_id:'', tipe_transaksi:'MASUK', jumlah:'', keterangan:'' }); setFormErrors({}); setModal(true); }}
          className="btn-primary">
          <Plus size={16} /> Catat Transaksi
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card bg-green-50 border-0 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500 text-white">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs text-green-600 font-medium">Barang Masuk</p>
            <p className="text-xl font-bold text-green-700">
              {transactions.filter((t) => t.tipe_transaksi === 'MASUK').reduce((s,t)=>s+t.jumlah,0)}
            </p>
            <p className="text-xs text-green-500">unit (halaman ini)</p>
          </div>
        </div>
        <div className="card bg-red-50 border-0 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-500 text-white">
            <TrendingDown size={20} />
          </div>
          <div>
            <p className="text-xs text-red-600 font-medium">Barang Keluar</p>
            <p className="text-xl font-bold text-red-700">
              {transactions.filter((t) => t.tipe_transaksi === 'KELUAR').reduce((s,t)=>s+t.jumlah,0)}
            </p>
            <p className="text-xs text-red-500">unit (halaman ini)</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card py-3 px-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <select value={filters.tipe}
              onChange={(e) => setFilters((p) => ({ ...p, tipe: e.target.value }))}
              className="input-field w-44 appearance-none">
              <option value="">Semua Tipe</option>
              <option value="MASUK">Barang Masuk</option>
              <option value="KELUAR">Barang Keluar</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filters.item_id}
              onChange={(e) => setFilters((p) => ({ ...p, item_id: e.target.value }))}
              className="input-field w-56 appearance-none">
              <option value="">Semua Item</option>
              {items.map((it) => <option key={it.id} value={it.id}>{it.nama_barang}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tabel Riwayat */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <p className="text-sm">Tidak ada transaksi.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-gray-100">
                  <tr>
                    {['Item', 'Tipe', 'Jumlah', 'Keterangan', 'Dicatat Oleh', 'Waktu'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{tx.nama_barang}</p>
                        <p className="text-xs text-gray-400">{tx.kode_barang}</p>
                      </td>
                      <td className="py-3 px-4">
                        {tx.tipe_transaksi === 'MASUK'
                          ? <span className="badge-green flex items-center gap-1 w-fit"><TrendingUp size={11}/>Masuk</span>
                          : <span className="badge-red flex items-center gap-1 w-fit"><TrendingDown size={11}/>Keluar</span>
                        }
                      </td>
                      <td className="py-3 px-4 font-semibold">{tx.jumlah}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs max-w-xs truncate">{tx.keterangan || '-'}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{tx.nama_user}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">{formatTanggal(tx.tanggal_transaksi)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Halaman {page} dari {totalPages} ({total} transaksi)
                </p>
                <div className="flex gap-2">
                  <button onClick={() => fetchTx(page - 1)} disabled={page <= 1} className="btn-outline text-xs py-1.5 px-3 disabled:opacity-40">
                    ← Sebelumnya
                  </button>
                  <button onClick={() => fetchTx(page + 1)} disabled={page >= totalPages} className="btn-outline text-xs py-1.5 px-3 disabled:opacity-40">
                    Berikutnya →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Form Transaksi */}
      <Modal open={modalOpen} onClose={() => setModal(false)} title="Catat Transaksi Baru" size="md">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Tipe Toggle */}
          <div>
            <label className="form-label">Tipe Transaksi *</label>
            <div className="grid grid-cols-2 gap-2">
              {[TIPE.MASUK, TIPE.KELUAR].map((t) => (
                <button key={t} type="button"
                  onClick={() => setForm((p) => ({ ...p, tipe_transaksi: t }))}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 font-medium text-sm transition-all
                    ${form.tipe_transaksi === t
                      ? t === 'MASUK'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                  {t === 'MASUK' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                  Barang {t === 'MASUK' ? 'Masuk' : 'Keluar'}
                </button>
              ))}
            </div>
          </div>

          {/* Item */}
          <div>
            <label className="form-label">Item / Bahan Baku *</label>
            <select {...fld('item_id')} className={`input-field ${formErrors.item_id?'border-red-400':''}`}>
              <option value="">— Pilih Item —</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.nama_barang} (Stok: {it.stok_saat_ini} {it.satuan})
                </option>
              ))}
            </select>
            {formErrors.item_id && <p className="text-xs text-red-500 mt-1">{formErrors.item_id}</p>}
            {/* Info stok saat item dipilih */}
            {selectedItem && (
              <div className={`mt-2 px-3 py-2 rounded-lg text-xs flex items-center gap-2
                ${selectedItem.stok_saat_ini <= selectedItem.stok_minimum
                  ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-gray-500'}`}>
                <span>Stok saat ini:</span>
                <strong>{selectedItem.stok_saat_ini} {selectedItem.satuan}</strong>
                {selectedItem.stok_saat_ini <= selectedItem.stok_minimum && (
                  <span className="badge-yellow ml-auto">Stok Rendah</span>
                )}
              </div>
            )}
          </div>

          {/* Jumlah */}
          <div>
            <label className="form-label">Jumlah *</label>
            <input type="number" min="1" {...fld('jumlah')}
              className={`input-field ${formErrors.jumlah?'border-red-400':''}`}
              placeholder="cth. 10" />
            {formErrors.jumlah && <p className="text-xs text-red-500 mt-1">{formErrors.jumlah}</p>}
          </div>

          {/* Keterangan */}
          <div>
            <label className="form-label">Keterangan <span className="text-gray-400">(opsional)</span></label>
            <input {...fld('keterangan')} className="input-field"
              placeholder="cth. Restock mingguan, Pemakaian pagi…" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModal(false)} className="btn-outline" disabled={saving}>Batal</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? <><Loader2 size={15} className="animate-spin"/> Mencatat…</>
                : <><Plus size={15}/> Catat Transaksi</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

